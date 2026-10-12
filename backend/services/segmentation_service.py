"""
U-Net segmentation service for FastAPI backend.
"""
import os
import sys
import base64
import logging
from io import BytesIO
from pathlib import Path

import numpy as np
import torch
from PIL import Image

logger = logging.getLogger(__name__)

# ─── Add ML folder to path ────────────────────────────────────
ML_PATH = Path(__file__).parent.parent.parent / "ml" / "medical_imaging"
sys.path.insert(0, str(ML_PATH / "inference"))

# ─── Lazy imports (only when torch installed) ────────────────
_model = None
DEVICE = None

CLASS_NAMES = {
    0: "Background",
    1: "Vertebra",
    2: "Intervertebral Disc",
    3: "Spinal Canal",
    4: "Nerve Root",
    5: "Other Tissue",
}

CLASS_COLORS = {
    0: (0, 0, 0),
    1: (255, 0, 0),
    2: (0, 255, 0),
    3: (0, 0, 255),
    4: (255, 255, 0),
    5: (255, 0, 255),
}


def get_model():
    """Lazy-load the U-Net model."""
    global _model, DEVICE
    if _model is not None:
        return _model

    try:
        from model_architecture import UNet

        DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model_path = str(ML_PATH / "models" / "best_model.pth")

        if not os.path.exists(model_path):
            logger.error(f"❌ Model not found: {model_path}")
            return None

        model = UNet(in_channels=1, num_classes=6)
        state_dict = torch.load(model_path, map_location=DEVICE)
        model.load_state_dict(state_dict)
        model.to(DEVICE)
        model.eval()

        _model = model
        logger.info(f"✅ U-Net loaded on {DEVICE}")
        return model

    except ImportError:
        logger.warning("PyTorch not installed")
        return None
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None


def segment_mri(image_path: str) -> dict:
    """
    Run U-Net segmentation on MRI image.
    Returns base64 images + clinical metrics.
    """
    model = get_model()
    if model is None:
        return {"error": "Model not available"}

    try:
        import torchvision.transforms as transforms

        # ─── Load image ───────────────────────────────────────
        image = Image.open(image_path).convert("L")
        original_size = image.size

        transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.5], std=[0.5]),
        ])
        tensor = transform(image).unsqueeze(0).to(DEVICE)

        # ─── Inference ────────────────────────────────────────
        with torch.no_grad():
            logits = model(tensor)
            probs = torch.softmax(logits, dim=1)
            mask = torch.argmax(probs, dim=1).squeeze(0).cpu().numpy()
            confidence = probs.max(dim=1)[0].mean().item()

        # ─── Color mask ───────────────────────────────────────
        h, w = mask.shape
        rgb = np.zeros((h, w, 3), dtype=np.uint8)
        for cid, color in CLASS_COLORS.items():
            rgb[mask == cid] = color

        mask_img = Image.fromarray(rgb).resize(original_size, Image.NEAREST)
        buf = BytesIO()
        mask_img.save(buf, format="PNG")
        mask_b64 = base64.b64encode(buf.getvalue()).decode()

        # ─── Overlay ──────────────────────────────────────────
        overlay_rgb = np.zeros((h, w, 3), dtype=np.uint8)
        for cid, color in CLASS_COLORS.items():
            if cid == 0:
                continue
            overlay_rgb[mask == cid] = color

        overlay_img = Image.fromarray(overlay_rgb).resize(original_size, Image.NEAREST)
        blended = Image.blend(image.convert("RGB"), overlay_img, alpha=0.5)
        buf2 = BytesIO()
        blended.save(buf2, format="PNG")
        overlay_b64 = base64.b64encode(buf2.getvalue()).decode()

        # ─── Class distribution ───────────────────────────────
        total_px = mask.size
        distribution = {}
        for cid, name in CLASS_NAMES.items():
            count = int(np.sum(mask == cid))
            distribution[name] = {
                "pixels": count,
                "percentage": round(count / total_px * 100, 2),
            }

        # ─── Clinical severity ────────────────────────────────
        disc_pct = distribution["Intervertebral Disc"]["percentage"]
        canal_pct = distribution["Spinal Canal"]["percentage"]
        nerve_pct = distribution["Nerve Root"]["percentage"]

        if canal_pct < 3 or nerve_pct > 8:
            severity = "High"
            finding = "Spinal canal narrowing or nerve compression detected"
        elif disc_pct > 15 or canal_pct < 5:
            severity = "Medium"
            finding = "Disc abnormalities or mild canal compromise"
        elif disc_pct > 8:
            severity = "Low"
            finding = "Mild disc changes observed"
        else:
            severity = "Normal"
            finding = "No significant abnormality detected"

        # ─── Therapy recommendation ───────────────────────────
        therapy_map = {
            "High":   {"frequency": 8000, "intensity": 45, "duration": 900},
            "Medium": {"frequency": 6000, "intensity": 40, "duration": 900},
            "Low":    {"frequency": 4000, "intensity": 35, "duration": 600},
            "Normal": {"frequency": 4000, "intensity": 25, "duration": 600},
        }
        therapy = therapy_map[severity]

        return {
            "success": True,
            "mask_base64": mask_b64,
            "overlay_base64": overlay_b64,
            "confidence": round(confidence * 100, 2),
            "severity": severity,
            "findings": finding,
            "class_distribution": distribution,
            "metrics": {
                "disc_pct": disc_pct,
                "canal_pct": canal_pct,
                "nerve_pct": nerve_pct,
            },
            "therapy_recommendation": therapy,
        }

    except Exception as e:
        logger.error(f"Segmentation failed: {e}", exc_info=True)
        return {"error": str(e)}