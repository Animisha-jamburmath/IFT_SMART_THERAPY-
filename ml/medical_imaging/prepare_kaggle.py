# ml/medical_imaging/prepare_kaggle.py
import sys
import zipfile
import shutil
import random
from pathlib import Path

if len(sys.argv) < 2:
    print("Usage: python prepare_kaggle.py <path_to_zip>")
    sys.exit(1)

ZIP_PATH = sys.argv[1]
BASE_DIR = Path("ml/medical_imaging/datasets")
EXTRACT_DIR = BASE_DIR / "extracted"
TRAIN_DIR = BASE_DIR / "train"
VAL_DIR = BASE_DIR / "val"

# Clean existing and create fresh directories
for d in [EXTRACT_DIR, TRAIN_DIR, VAL_DIR]:
    if d.exists():
        shutil.rmtree(d)
    d.mkdir(parents=True, exist_ok=True)

# Extract
print(f"📦 Extracting {ZIP_PATH}...")
with zipfile.ZipFile(ZIP_PATH, 'r') as z:
    z.extractall(EXTRACT_DIR)
print(f"✅ Extracted to {EXTRACT_DIR}")

# Find the class folders (e.g., "Herniated Disc", "No Stenosis")
print("\n🔍 Finding class folders...")
IMAGE_EXTS = {'.png', '.jpg', '.jpeg'}
class_folders = []

# Search specifically for subdirectories that contain images
for folder in EXTRACT_DIR.rglob("*"):
    if folder.is_dir():
        images = [f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTS]
        if len(images) > 50: # A class should have many images
            class_folders.append((folder, len(images)))

if not class_folders:
    print("❌ No image folders found. Check the zip structure.")
    sys.exit(1)

print(f"\n📊 Found {len(class_folders)} classes:")
for folder, count in class_folders:
    print(f"   {folder.name:40} → {count} images")

# Split into train/val (80/20)
print("\n📂 Splitting into train/val...")
random.seed(42)
for folder, count in class_folders:
    # Sanitize class name for folder creation
    class_name = folder.name.replace(" ", "_").lower()
    
    images = sorted([f for f in folder.iterdir() if f.is_file() and f.suffix.lower() in IMAGE_EXTS])
    random.shuffle(images)
    
    n_train = int(len(images) * 0.8)
    for img in images[:n_train]:
        (TRAIN_DIR / class_name).mkdir(exist_ok=True)
        shutil.copy(img, TRAIN_DIR / class_name / img.name)
    for img in images[n_train:]:
        (VAL_DIR / class_name).mkdir(exist_ok=True)
        shutil.copy(img, VAL_DIR / class_name / img.name)
    
    print(f"   {class_name:40} → {len(images[:n_train])} train / {len(images[n_train:])} val")

print(f"\n✅ Dataset ready! Train: {TRAIN_DIR} | Val: {VAL_DIR}")