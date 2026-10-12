"""
Loader for .ima DICOM files (Siemens format).
"""
import numpy as np
import pydicom
from PIL import Image
from pathlib import Path


def load_dicom_image(ima_path: str) -> np.ndarray:
    """
    Load a single .ima file and return as numpy array.
    Handles windowing and normalization.
    """
    ds = pydicom.dcmread(ima_path)

    # Get pixel data
    pixel_array = ds.pixel_array.astype(np.float32)

    # Apply DICOM windowing if available
    if hasattr(ds, 'WindowCenter') and hasattr(ds, 'WindowWidth'):
        wc = float(ds.WindowCenter) if not isinstance(ds.WindowCenter, pydicom.multival.MultiValue) else float(ds.WindowCenter[0])
        ww = float(ds.WindowWidth) if not isinstance(ds.WindowWidth, pydicom.multival.MultiValue) else float(ds.WindowWidth[0])
        lower = wc - ww / 2
        upper = wc + ww / 2
        pixel_array = np.clip(pixel_array, lower, upper)
        pixel_array = (pixel_array - lower) / (upper - lower) * 255.0
    else:
        # Fallback: normalize by min/max
        pmin, pmax = pixel_array.min(), pixel_array.max()
        if pmax > pmin:
            pixel_array = (pixel_array - pmin) / (pmax - pmin) * 255.0

    return pixel_array.astype(np.uint8)


def ima_to_png(ima_path: str, output_path: str = None) -> str:
    """
    Convert .ima to .png for viewing or model input.
    """
    img_array = load_dicom_image(ima_path)
    img = Image.fromarray(img_array, mode="L")

    if output_path is None:
        output_path = Path(ima_path).with_suffix(".png")

    img.save(output_path)
    return str(output_path)


def load_dicom_series(folder_path: str) -> np.ndarray:
    """
    Load all .ima files in a folder as a 3D volume.
    Returns shape: (num_slices, H, W)
    """
    folder = Path(folder_path)
    ima_files = sorted(folder.glob("*.ima"))

    if not ima_files:
        raise FileNotFoundError(f"No .ima files in {folder}")

    slices = []
    for ima_file in ima_files:
        img = load_dicom_image(str(ima_file))
        slices.append(img)

    return np.stack(slices, axis=0)


# ─── Standalone Test ──────────────────────────────────────────
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python dicom_loader.py <path_to.ima_file>")
        sys.exit(1)

    ima_path = sys.argv[1]
    print(f"🔄 Loading: {ima_path}")

    try:
        img = load_dicom_image(ima_path)
        print(f"✅ Loaded: shape={img.shape}, dtype={img.dtype}")
        print(f"   Min: {img.min()}, Max: {img.max()}, Mean: {img.mean():.1f}")

        # Save as PNG for viewing
        png_path = ima_to_png(ima_path)
        print(f"✅ Converted to: {png_path}")

        # Show DICOM metadata
        ds = pydicom.dcmread(ima_path)
        print(f"\n📋 DICOM Metadata:")
        print(f"   Modality: {ds.get('Modality', 'N/A')}")
        print(f"   Body Part: {ds.get('BodyPartExamined', 'N/A')}")
        print(f"   Size: {ds.get('Rows', '?')}x{ds.get('Columns', '?')}")
        print(f"   Manufacturer: {ds.get('Manufacturer', 'N/A')}")

    except Exception as e:
        print(f"❌ Failed: {e}")