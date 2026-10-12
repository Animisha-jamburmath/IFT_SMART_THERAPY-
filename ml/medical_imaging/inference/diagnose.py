"""
Diagnostic: run model on many images, show what it predicts.
Usage: python ml/medical_imaging/diagnose.py <folder_with_ima_files>
"""
import sys
from pathlib import Path
import numpy as np
import torch
from PIL import Image
import torchvision.transforms as transforms

sys.path.insert(0, "ml/medical_imaging/inference")
from model_architecture import UNet
from dicom_loader import load_dicom_image

DEVICE = torch.device("cpu")

# Load model
print("🔄 Loading model...")
model = UNet(in_channels=1, num_classes=6)
model.load_state_dict(torch.load(
    "ml/medical_imaging/models/best_model.pth",
    map_location=DEVICE
))
model.eval()
print("✅ Model loaded\n")

transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5]),
])

# Get all .ima files
folder = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("ml/medical_imaging/datasets")
ima_files = list(folder.rglob("*.ima"))[:20]  # first 20

if not ima_files:
    print(f"❌ No .ima files found in {folder}")
    sys.exit(1)

print(f"🔍 Testing {len(ima_files)} images...\n")
print(f"{'Filename':<40} | {'Class Predictions (0/1/2/3/4/5 %)':<60}")
print("-" * 105)

total_class_pixels = np.zeros(6, dtype=np.int64)

for ima in ima_files:
    try:
        img_array = load_dicom_image(str(ima))
        image = Image.fromarray(img_array, mode="L")
        tensor = transform(image).unsqueeze(0)

        with torch.no_grad():
            logits = model(tensor)
            mask = torch.argmax(logits, dim=1).squeeze().numpy()

        # Count pixels per class
        class_counts = np.zeros(6, dtype=np.int64)
        for c in range(6):
            class_counts[c] = np.sum(mask == c)

        total_class_pixels += class_counts
        total_px = mask.size
        pcts = [f"{class_counts[i]/total_px*100:5.1f}" for i in range(6)]

        print(f"{ima.name:<40} | {'  '.join(pcts)}")

    except Exception as e:
        print(f"{ima.name:<40} | ERROR: {e}")

print("\n" + "=" * 105)
print("📊 AGGREGATE DISTRIBUTION ACROSS ALL IMAGES:")
total_px = total_class_pixels.sum()
for c in range(6):
    pct = total_class_pixels[c] / total_px * 100
    bar = "█" * int(pct / 2)
    print(f"   Class {c}: {pct:6.2f}%  {bar}")

print("\n💡 If one class dominates > 90%, model is undertrained.")
print("💡 If all classes appear roughly equally, classes are just misnamed.")