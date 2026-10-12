"""
Test the trained classifier on a single image.
Run: python ml/medical_imaging/test_classifier.py <image_path>
"""
import sys
import json
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

if len(sys.argv) < 2:
    print("Usage: python test_classifier.py <image_path>")
    sys.exit(1)

# Load class labels
with open("ml/medical_imaging/models/class_labels.json") as f:
    labels = {int(k): v for k, v in json.load(f).items()}

print(f"\n📊 Classes: {list(labels.values())}\n")

# Load model
model = models.resnet50(weights=None)
model.fc = nn.Linear(model.fc.in_features, len(labels))
model.load_state_dict(torch.load(
    "ml/medical_imaging/models/classifier_model.pth",
    map_location="cpu"
))
model.eval()

# Preprocess image
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

image = Image.open(sys.argv[1]).convert("RGB")
tensor = transform(image).unsqueeze(0)

# Predict
with torch.no_grad():
    outputs = model(tensor)
    probs = torch.softmax(outputs, dim=1)
    conf, pred = torch.max(probs, 1)

print(f"🎯 Prediction: {labels[pred.item()]}")
print(f"📊 Confidence: {conf.item() * 100:.2f}%\n")
print("All probabilities:")
for i, p in enumerate(probs[0]):
    bar = "█" * int(p.item() * 50)
    print(f"   {labels[i]:30} {p.item()*100:6.2f}%  {bar}")