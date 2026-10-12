"""
Auto-find .pth file and inspect it.
Run: python ml/medical_imaging/inspect_model.py
"""
import torch
import os
from pathlib import Path

print("=" * 70)
print("🔍 U-Net Architecture Inspector (Auto-Find)")
print("=" * 70)

# Search for .pth files in the project
print("\n🔎 Searching for .pth files in the project...")
project_root = Path(".").resolve()
pth_files = list(project_root.rglob("*.pth"))

if not pth_files:
    print("\n❌ NO .pth files found in the project!")
    print("\n📋 What to do:")
    print("   1. Check if you downloaded the model from Google Drive")
    print("   2. Copy best_model.pth to: ml/medical_imaging/models/")
    print("   3. Re-run this script")
    exit(1)

print(f"\n✅ Found {len(pth_files)} .pth file(s):\n")
for i, f in enumerate(pth_files):
    size_mb = f.stat().st_size / 1024 / 1024
    print(f"   {i+1}. {f.relative_to(project_root)}  ({size_mb:.2f} MB)")

# Use the first one (or let user specify)
MODEL_PATH = pth_files[0]
print(f"\n📂 Using: {MODEL_PATH.relative_to(project_root)}")

# Load state dict
try:
    state_dict = torch.load(str(MODEL_PATH), map_location="cpu")
except Exception as e:
    print(f"\n❌ Failed to load: {e}")
    exit(1)

print(f"\n✅ Loaded successfully")
print(f"📊 Total layers: {len(state_dict)}")
print(f"💾 File size: {MODEL_PATH.stat().st_size / 1024 / 1024:.2f} MB")

# Print all layers
print("\n" + "=" * 70)
print("📋 ALL LAYERS")
print("=" * 70)

for i, (key, value) in enumerate(state_dict.items()):
    shape_str = tuple(value.shape) if hasattr(value, 'shape') else "scalar"
    print(f"{i+1:3}. {key:55} {shape_str}")

# Architecture Analysis
print("\n" + "=" * 70)
print("🔎 ARCHITECTURE ANALYSIS")
print("=" * 70)

keys = list(state_dict.keys())
keys_lower = [k.lower() for k in keys]

# Count layer types
conv_layers = [k for k in keys if "conv" in k.lower() and "weight" in k.lower()]
bn_layers = [k for k in keys if "bn" in k.lower() or "batchnorm" in k.lower()]

print(f"\n📊 Layer counts:")
print(f"   Convolutional: {len(conv_layers)}")
print(f"   BatchNorm:     {len(bn_layers)}")

if conv_layers:
    first_conv = conv_layers[0]
    last_conv = conv_layers[-1]
    print(f"\n📥 First conv: {first_conv}")
    print(f"   Shape: {tuple(state_dict[first_conv].shape)}")
    print(f"📤 Last conv: {last_conv}")
    print(f"   Shape: {tuple(state_dict[last_conv].shape)}")

print("\n" + "=" * 70)
print("📤 SEND THIS OUTPUT BACK")
print("=" * 70)