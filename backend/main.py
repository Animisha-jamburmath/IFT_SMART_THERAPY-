from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from config.settings import settings
from database.database import engine, Base, SessionLocal
from api import (
    auth, patients, sessions, imaging, reports,
    mqtt_commands, ai_assistant, pain, settings as settings_api,
    session_records, segmentation,
)
from services.mqtt_service import mqtt_service
from services.auth_service import get_password_hash
from database.models import User

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(imaging.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(mqtt_commands.router, prefix="/api")
app.include_router(ai_assistant.router, prefix="/api")
app.include_router(pain.router, prefix="/api")
app.include_router(settings_api.router, prefix="/api")
app.include_router(session_records.router, prefix="/api")
app.include_router(segmentation.router, prefix="/api")

os.makedirs("storage/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="storage/uploads"), name="uploads")


@app.on_event("startup")
def startup():
    db = SessionLocal()
    existing = db.query(User).filter(User.username == "admin").first()
    if not existing:
        db.add(User(
            username="admin",
            email="admin@hospital.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Administrator",
            role="admin",
        ))
        db.commit()
        print("✅ Default user created: admin / admin123")
    db.close()
    mqtt_service.start()


@app.on_event("shutdown")
def shutdown():
    mqtt_service.stop()


@app.get("/")
def root():
    return {"message": "IFT Therapy API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}