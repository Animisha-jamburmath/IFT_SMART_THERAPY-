import os
import uuid
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database.database import get_db
from database.models import ImagingStudy, Patient, User
from api.auth import oauth2_scheme
from services.auth_service import decode_token
from services.ai_service import analyze_image as ai_analyze

router = APIRouter(prefix="/imaging", tags=["Imaging"])
UPLOAD_DIR = "./storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/upload")
async def upload_image(patient_id: int = Form(...), modality: str = Form("MRI"),
                       body_region: str = Form(""), clinical_indication: str = Form(""),
                       file: UploadFile = File(...), db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    ext = os.path.splitext(file.filename)[1]
    unique_id = str(uuid.uuid4())
    file_name = f"{unique_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    study = ImagingStudy(
        patient_id=patient_id, modality=modality, body_region=body_region,
        file_path=file_path, file_name=file.filename,
        file_size=os.path.getsize(file_path), uploaded_by=current_user.id,
        clinical_indication=clinical_indication, uploaded_at=datetime.utcnow(),
    )
    db.add(study)
    db.commit()
    db.refresh(study)
    return {"id": study.id, "message": "Upload successful"}


@router.post("/analyze")
async def analyze_image_endpoint(patient_id: int = Form(1), modality: str = Form("MRI"),
                                  file: UploadFile = File(...), db: Session = Depends(get_db),
                                  current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        patient = Patient(name="Default Patient", age=0, gender="Other",
                          disease="General", contact="0000000000", created_by=current_user.id)
        db.add(patient)
        db.commit()
        db.refresh(patient)
        patient_id = patient.id

    ext = os.path.splitext(file.filename)[1] or ".png"
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = ai_analyze(filepath, modality)
    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    study = ImagingStudy(
        patient_id=patient_id, modality=modality, body_region="Lumbar Spine",
        file_path=filepath, file_name=file.filename,
        file_size=os.path.getsize(filepath), uploaded_by=current_user.id,
        ai_findings=result, ai_confidence=result.get("confidence", 0.0),
        ai_analysis_date=datetime.utcnow(), findings=result.get("findings"),
        uploaded_at=datetime.utcnow(),
    )
    db.add(study)
    db.commit()
    db.refresh(study)

    return {
        "study_id": study.id, "patient_id": patient_id,
        "modality": result.get("modality", modality),
        "predicted_class": result.get("predicted_class", "unknown"),
        "findings": result.get("findings", "Analysis complete"),
        "confidence": result.get("confidence", 0.0),
        "abnormalities": result.get("abnormalities", []),
        "recommendation": result.get("recommendation", ""),
        "top3_predictions": result.get("top3_predictions", []),
        "therapy_recommendation": result.get("therapy_recommendation", {
            "frequency": 4000, "intensity": 35, "duration": 600, "disease": "General"
        }),
    }


@router.get("/{patient_id}")
def list_patient_images(patient_id: int, db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):
    return db.query(ImagingStudy).filter(ImagingStudy.patient_id == patient_id).all()