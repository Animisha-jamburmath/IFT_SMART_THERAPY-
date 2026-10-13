from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import os, uuid, shutil
from database.database import get_db
from database.models import ImagingStudy, Patient, User
from api.auth import oauth2_scheme
from services.auth_service import decode_token
from services.ai_service import analyze_image

router = APIRouter(prefix="/segmentation", tags=["Segmentation"])
UPLOAD_DIR = "./storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/analyze")
async def analyze(patient_id: int = Form(1), modality: str = Form("MRI"),
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
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = analyze_image(filepath, modality)
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
        "study_id": study.id, "success": True,
        "modality": result.get("modality", modality),
        "predicted_class": result.get("predicted_class", "unknown"),
        "findings": result.get("findings", ""),
        "confidence": result.get("confidence", 0.0),
        "abnormalities": result.get("abnormalities", []),
        "recommendation": result.get("recommendation", ""),
        "top3_predictions": result.get("top3_predictions", []),
        "therapy_recommendation": result.get("therapy_recommendation", {}),
    }