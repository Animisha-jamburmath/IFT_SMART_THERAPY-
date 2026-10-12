"""
U-Net inference - supports .ima (DICOM), .png, .jpg.
"""
import torch
import numpy as np
from PIL import Image
import torchvision.transforms as transforms
from pathlib import Path
import sys

sys.path.append(str(Path(__file__).parent))
from model_architecture import UNet
from dicom_loader import load_dicom_image

# ─── Class Mapping ────────────────────────────────────────────
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

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_image(image_path: str):
    """Load .ima (DICOM) or regular image formats."""
    path = Path(image_path)

    if path.suffix.lower() == ".ima":
        # DICOM file
        img_array = load_dicom_image(str(path))
        image = Image.fromarray(img_array, mode="L")
    else:
        # Regular image
        image = Image.open(str(path)).convert("L")

    return image


def load_unet_model(model_path: str):
    """Load trained U-Net model."""
    model = UNet(in_channels=1, num_classes=6)
    state_dict = torch.load(model_path, map_location=DEVICE)
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()
    return model


def preprocess_image(image_path: str, target_size=(256, 256)):
    """Load and preprocess MRI image (.ima or standard)."""
    image = load_image(image_path)
    original_size = image.size

    transform = transforms.Compose([
        transforms.Resize(target_size),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5], std=[0.5]),
    ])

    tensor = transform(image).unsqueeze(0)
    return tensor, original_size, image


def predict(model, image_tensor):
    """Run inference."""
    with torch.no_grad():
        image_tensor = image_tensor.to(DEVICE)
        logits = model(image_tensor)
        probs = torch.softmax(logits, dim=1)
        mask = torch.argmax(probs, dim=1)
    return mask.squeeze(0).cpu().numpy(), probs.squeeze(0).cpu().numpy()


def create_color_mask(mask, original_size):
    """Convert class mask to RGB image."""
    h, w = mask.shape
    rgb = np.zeros((h, w, 3), dtype=np.uint8)
    for class_id, color in CLASS_COLORS.items():
        rgb[mask == class_id] = color
    img = Image.fromarray(rgb)
    return img.resize(original_size, Image.NEAREST)


def create_overlay(original_image, mask, alpha=0.5):
    """Overlay segmentation mask on original MRI."""
    h, w = mask.shape
    rgb = np.zeros((h, w, 3), dtype=np.uint8)
    for class_id, color in CLASS_COLORS.items():
        if class_id == 0:
            continue
        rgb[mask == class_id] = color
    overlay_img = Image.fromarray(rgb).resize(original_image.size, Image.NEAREST)
    blended = Image.blend(original_image.convert("RGB"), overlay_img, alpha=alpha)
    return blended


def get_class_distribution(mask):
    total = mask.size
    distribution = {}
    for class_id, name in CLASS_NAMES.items():
        count = int(np.sum(mask == class_id))
        pct = round((count / total) * 100, 2)
        distribution[name] = {"pixels": count, "percentage": pct}
    return distribution


def get_clinical_severity(mask):
    total = mask.size
    disc_pct = (np.sum(mask == 2) / total) * 100
    canal_pct = (np.sum(mask == 3) / total) * 100
    nerve_pct = (np.sum(mask == 4) / total) * 100

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

    return severity, finding


def get_therapy_recommendation(severity):
    mapping = {
        "High":   {"frequency": 8000, "intensity": 45, "duration": 900},
        "Medium": {"frequency": 6000, "intensity": 40, "duration": 900},
        "Low":    {"frequency": 4000, "intensity": 35, "duration": 600},
        "Normal": {"frequency": 4000, "intensity": 25, "duration": 600},
    }
    return mapping.get(severity, {"frequency": 4000, "intensity": 35, "duration": 600})


# ─── Standalone Test ──────────────────────────────────────────
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image.ima OR image.png>")
        sys.exit(1)

    MODEL_PATH = "ml/medical_imaging/models/best_model.pth"
    image_path = sys.argv[1]

    print(f"🔄 Loading model from {MODEL_PATH}")
    model = load_unet_model(MODEL_PATH)
    print("✅ Model loaded")

    print(f"\n🖼️  Loading image: {image_path}")
    tensor, original_size, original_image = preprocess_image(image_path)
    print(f"✅ Image loaded: {original_size[0]}x{original_size[1]}")

    print("\n🧠 Running inference...")
    mask, probs = predict(model, tensor)

    print(f"\n📊 Class Distribution:")
    dist = get_class_distribution(mask)
    for name, data in dist.items():
        print(f"   {name:25} {data['percentage']:6.2f}%")

    severity, finding = get_clinical_severity(mask)
    print(f"\n🏥 Severity: {severity}")
    print(f"📋 Finding: {finding}")

    therapy = get_therapy_recommendation(severity)
    print(f"\n💊 Recommended Therapy:")
    print(f"   Frequency: {therapy['frequency']} Hz")
    print(f"   Intensity: {therapy['intensity']}%")
    print(f"   Duration: {therapy['duration']} sec")

    # Save outputs
    out_dir = Path("ml/medical_imaging/export")
    out_dir.mkdir(exist_ok=True)

    color_mask = create_color_mask(mask, original_size)
    color_mask.save(out_dir / "mask.png")

    overlay = create_overlay(original_image, mask)
    overlay.save(out_dir / "overlay.png")

    original_image.save(out_dir / "original.png")

    print(f"\n✅ Saved:")
    print(f"   {out_dir}/original.png")
    print(f"   {out_dir}/mask.png")
    print(f"   {out_dir}/overlay.png")