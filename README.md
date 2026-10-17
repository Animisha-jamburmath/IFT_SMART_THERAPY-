# IFT Smart Therapy Machine

An academic IoT prototype for **Interferential Therapy (IFT)** designed to bridge hardware, cloud communication, and artificial intelligence. The system combines an ESP32-S3 therapy device, a real-time web dashboard, and AI-driven clinical recommendations.

## 🚀 Features
- **Hardware Control:** Dual-channel IFT output (100 Hz – 40 kHz) with 100 Hz beat frequency, hardware isolation, and overcurrent safety cutoffs.
- **Real-time MQTT:** Bi-directional communication between the ESP32 and the web app via EMQX cloud broker.
- **AI Image Analysis:** Lumbar spine MRI/X-ray classification (ResNet50) to generate specific IFT therapy parameters.
- **AI Therapy Coach:** Chatbot powered by Groq (Llama 3.1) with a built-in IFT medical knowledge base.
- **Patient & Session Management:** Log patient details, track therapy sessions, record pain scores, and monitor telemetry.
- **Multilingual:** Full UI support for English and Kannada (ಕನ್ನಡ).

## 🛠️ Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, i18next
- **Backend:** FastAPI (Python), SQLite, SQLAlchemy
- **Machine Learning:** PyTorch (ResNet50), Groq API
- **Embedded:** ESP32-S3 (Arduino C++), ILI9341 TFT
- **Communication:** MQTT (WebSocket for web, TCP for ESP32)

## 📁 Project Structure
- `backend/` - FastAPI server, database models, and ML inference routes.
- `frontend/` - React web dashboard, MQTT client, and UI components.
- `ml/` - PyTorch training scripts, exported models, and class labels.
- `embedded/` - ESP32-S3 firmware source code.

## ⚡ Quick Start (Local Development)

**1. Start the Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
2. Start the Frontend:

bash
cd frontend
npm install
npm run dev
3. Access the App:

Frontend: http://localhost:3000

API Docs: http://localhost:8000/docs

Demo Login: admin / admin123

⚠️ Disclaimer
This project is an academic prototype developed for educational purposes at the EEE Department, JNNCE Shimoga. It is not a certified clinical medical device. Do not use for actual patient therapy without proper medical validation, electrical safety testing, and regulatory approval.
