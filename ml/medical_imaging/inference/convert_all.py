"""
Batch convert all .ima files to .png.
Run: python ml/medical_imaging/convert_all.py
"""
from pathlib import Path
from dicom_loader import ima_to_png
import sys

sys.path.append("ml/medical_imaging/inference")

input_dir = Path("ml/medical_imaging/datasets/raw")
output_dir = Path("ml/medical_imaging/datasets/converted")
output_dir.mkdir(parents=True, exist_ok=True)

ima_files = list(input_dir.glob("**/*.ima"))
print(f"Found {len(ima_files)} .ima files")

for i, ima in enumerate(ima_files, 1):
    output_path = output_dir / f"{ima.stem}.png"
    try:
        ima_to_png(str(ima), str(output_path))
        print(f"✅ [{i}/{len(ima_files)}] {ima.name} → {output_path.name}")
    except Exception as e:
        print(f"❌ [{i}/{len(ima_files)}] {ima.name}: {e}")

print(f"\n✅ Converted {len(ima_files)} files to {output_dir}")