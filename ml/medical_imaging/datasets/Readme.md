
# 🏥 Lumbar Spinal MRI Dataset

A comprehensive, preprocessed dataset of **13,686 lumbar spine MRI images** for multi-class stenosis classification using deep learning. Ready for immediate training and evaluation.

## 🎯 Overview

This dataset provides **production-ready MRI images** of the lumbar spine, specifically curated for training deep learning models to detect and classify lumbar spinal stenosis. All images have been preprocessed and standardized to accelerate your research and model development.

### Key Features
✅ **13,686 preprocessed images** ready for training  
✅ **3-class classification**: Herniated Disc, Thecal Sac Compression, No Stenosis  
✅ **Standardized resolution**: 400×400×1 (grayscale)  
✅ **Quality preprocessing**: Optimized for CNN training  
✅ **Medical relevance**: Real-world clinical imaging data

---

## 📊 Dataset Details

| Attribute | Description |
|-----------|-------------|
| **Total Images** | 13,686 |
| **Image Resolution** | 400×400x1 pixels |
| **Color Space** | Grayscale (1 channel) |
| **File Format** | Standard image format (JPG) |
| **Classes** | 3 (Herniated Disc, Thecal Sac, No Stenosis) |
| **Source** | [Data Mendeley](https://data.mendeley.com) |

### Class Distribution

- **Herniated Disc**: Lumbar disc herniation causing nerve compression
- **Thecal Sac Compression**: Narrowing affecting the thecal sac space
- **No Stenosis**: Normal lumbar spine without stenosis

---

## 🏥 Medical Background

### What is Lumbar Spinal Stenosis?

Lumbar spinal stenosis is a medical condition characterized by **narrowing of the spinal canal** in the lower back (lumbar region, vertebrae L1-L5). This narrowing compresses the spinal cord and nerve roots, leading to:

- Chronic lower back pain
- Leg pain and numbness
- Weakness in the legs
- Difficulty walking or standing

### Clinical Significance

Early diagnosis and accurate classification of lumbar spinal stenosis are crucial for:

✨ **Improved Patient Outcomes**: Timely intervention prevents irreversible nerve damage  
✨ **Treatment Planning**: Accurate classification guides surgical vs. conservative treatment  
✨ **Prognosis**: Early detection significantly increases long-term survival rates  
✨ **Quality of Life**: Proper diagnosis enables targeted pain management

---

## 🚀 Applications

This dataset is ideal for:

### 🤖 Deep Learning Research
- Multi-task classification models
- CNN-based medical image analysis
- Transfer learning experiments
- Automated stenosis detection systems

### 🔬 Medical AI Development
- Clinical decision support tools
- Medical image segmentation
- Feature extraction and analysis

### 📚 Educational Use
- Machine learning coursework
- Medical imaging tutorials
- Healthcare AI demonstrations
- Research methodology training

---

## 📁 File Structure

```
lumbar-spinal-mri-dataset/
│
├── train/
│   ├── herniated_disc/
│   ├── thecal_sac/
│   └── no_stenosis/
│
├── test/
│   ├── herniated_disc/
│   ├── thecal_sac/
│   └── no_stenosis/
│
└── README.md
```

---

## 🛠️ Getting Started

### Quick Start with Python

```python
import numpy as np
import pandas as pd
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import matplotlib.pyplot as plt

# Load the dataset
train_datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2
)

train_generator = train_datagen.flow_from_directory(
    'train/',
    target_size=(400, 400),
    batch_size=32,
    class_mode='categorical',
    color_mode='grayscale',
    subset='training'
)

validation_generator = train_datagen.flow_from_directory(
    'train/',
    target_size=(400, 400),
    batch_size=32,
    class_mode='categorical',
    color_mode='grayscale',
    subset='validation'
)

print(f"Classes: {train_generator.class_indices}")
print(f"Total training images: {train_generator.samples}")
```

### Sample CNN Model

```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout

model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(400, 400, 1)),
    MaxPooling2D(2, 2),
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),
    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),
    Flatten(),
    Dense(512, activation='relu'),
    Dropout(0.5),
    Dense(3, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train the model
history = model.fit(
    train_generator,
    validation_data=validation_generator,
    epochs=50
)
```

---

## 🔍 Preprocessing Details

All images in this dataset have undergone the following preprocessing steps:

1. **Standardized Resizing**: All images resized to 400×400 pixels
2. **Grayscale Conversion**: Single-channel representation for consistency
3. **Quality Enhancement**: Optimized for CNN input requirements
4. **Normalization**: Ready for pixel value scaling (0-255 range)

---

## 💡 Methodology

This dataset supports **multi-task learning** approaches where a single Convolutional Neural Network (CNN) can:

1. **Detect** the presence of stenosis
2. **Localize** the affected spinal region
3. **Classify** the stenosis type

This unified approach offers:
- ⚡ Improved computational efficiency
- 🎯 Maintained diagnostic accuracy
- 🚀 Faster inference times
- 📊 Standardized evaluation pipeline

---

## 📖 Citation

If you use this dataset in your research, please cite:

```bibtex
@misc{abdullah_khan_2025,
	title={Lumbar Spinal MRI Dataset},
	url={https://www.kaggle.com/dsv/14332076},
	DOI={10.34740/KAGGLE/DSV/14332076},
	publisher={Kaggle},
	author={Abdullah Khan},
	year={2025}
}
```

**Original Data Source**: [Data Mendeley](https://data.mendeley.com/datasets/k57fr854j2/2)

---

## 📝 License

This dataset is released under the **CC0: Public Domain** license. You are free to use, modify, and distribute this dataset for any purpose without restriction.

---

## 🤝 Contributing

Found an issue or have suggestions? Feel free to:
- Open an issue on the dataset discussion page
- Share your models and results
- Provide feedback for improvements

---

## 📬 Contact

For questions, collaborations, or feedback, please reach out through the Kaggle discussion forum.

---

## ⭐ Acknowledgments

- Original data sourced from [Data Mendeley](https://data.mendeley.com/datasets/k57fr854j2/2)
- Preprocessed and curated for the machine learning community
- Special thanks to all medical imaging researchers advancing this field

---

**Happy Training! 🚀**