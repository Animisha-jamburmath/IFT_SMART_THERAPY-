import os
import json
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

_THIS_FILE = Path(__file__).resolve()
_BACKEND_DIR = _THIS_FILE.parent.parent
_PROJECT_ROOT = _BACKEND_DIR.parent
_ML_DIR = _PROJECT_ROOT / "ml" / "medical_imaging"

MODEL_PATH = _ML_DIR / "models" / "classifier_model.pth"
LABELS_PATH = _ML_DIR / "models" / "class_labels.json"

DEVICE = "cpu"

THERAPY_MAP = {
    "herniated_disc": {"frequency": 4000, "intensity": 35, "duration": 900, "disease": "Herniated Disc"},
    "thecal_sac_compression": {"frequency": 6000, "intensity": 40, "duration": 900, "disease": "Thecal Sac Compression"},
    "no_stenosis": {"frequency": 4000, "intensity": 25, "duration": 600, "disease": "No Stenosis - Maintenance"},
}

_model = None
_labels = None
_load_attempted = False


def _load_model():
    global _model, _labels, _load_attempted
    if _model is not None:
        return _model
    if _load_attempted:
        return None
    _load_attempted = True

    if not MODEL_PATH.exists() or not LABELS_PATH.exists():
        logger.error(f"Model or labels not found")
        return None

    try:
        import torch
        import torch.nn as nn
        from torchvision import models

        with open(LABELS_PATH) as f:
            _labels = {int(k): v for k, v in json.load(f).items()}

        model = models.resnet50(weights=None)
        model.fc = nn.Linear(model.fc.in_features, len(_labels))
        model.load_state_dict(torch.load(str(MODEL_PATH), map_location=DEVICE))
        model.to(DEVICE)
        model.eval()
        _model = model
        logger.info(f"✅ Classifier loaded: {list(_labels.values())}")
        return _model
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None


def analyze_image(image_path: str, modality: str = "MRI") -> dict:
    model = _load_model()

    if model is None:
        return {
            "modality": modality,
            "findings": "AI model not loaded.",
            "confidence": 0.0,
            "predicted_class": "unknown",
            "abnormalities": [],
            "recommendation": "Model unavailable",
            "top3_predictions": [],
            "therapy_recommendation": {"frequency": 4000, "intensity": 35, "duration": 600, "disease": "General"},
        }

    try:
        import torch
        from torchvision import transforms
        from PIL import Image

        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

        image = Image.open(image_path).convert("RGB")
        tensor = transform(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.softmax(outputs, dim=1)
            conf, pred = torch.max(probs, 1)

        predicted_class = _labels[pred.item()]
        confidence = conf.item()

        k = min(3, len(_labels))
        top_probs, top_idx = torch.topk(probs, k, dim=1)
        top3 = [{"class": _labels[i.item()], "confidence": round(p.item() * 100, 2)}
                for p, i in zip(top_probs[0], top_idx[0])]

        therapy = THERAPY_MAP.get(predicted_class, {
            "frequency": 4000, "intensity": 35, "duration": 600,
            "disease": predicted_class.replace("_", " ").title(),
        })

        class_readable = predicted_class.replace("_", " ").title()
        abnormalities = [class_readable] if "no_stenosis" not in predicted_class else []

        return {
            "modality": modality,
            "predicted_class": predicted_class,
            "confidence": round(confidence * 100, 2),
            "findings": f"AI detected: {class_readable}",
            "top3_predictions": top3,
            "abnormalities": abnormalities,
            "recommendation": f"IFT: {therapy['frequency']} Hz @ {therapy['intensity']}%",
            "therapy_recommendation": therapy,
        }
    except Exception as e:
        logger.error(f"Inference failed: {e}")
        return {"error": str(e)}


def run_imaging_analysis(file_path: str, modality: str = "MRI") -> dict:
    return analyze_image(file_path, modality)


def get_chat_response(user_message: str, language: str = "en"):
    return "Please use /api/ai/chat endpoint."