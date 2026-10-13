from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.database import get_db
from database.models import PainLog, Patient, User
from api.auth import oauth2_scheme
from services.auth_service import decode_token

router = APIRouter(prefix="/pain", tags=["Pain"])


class PainLogCreate(BaseModel):
    patient_id: int
    session_id: int = None
    pain_before: int = None
    pain_after: int = None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/")
def log_pain(data: PainLogCreate, db: Session = Depends(get_db),
             current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    log = PainLog(
        patient_id=data.patient_id, session_id=data.session_id,
        pain_before=data.pain_before, pain_after=data.pain_after,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


@router.get("/{patient_id}")
def get_pain_logs(patient_id: int, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    logs = db.query(PainLog).filter(PainLog.patient_id == patient_id).order_by(PainLog.recorded_at.desc()).all()
    return logs


@router.delete("/{pain_log_id}")
def delete_pain_log(pain_log_id: int, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    log = db.query(PainLog).filter(PainLog.id == pain_log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Pain log not found")
    db.delete(log)
    db.commit()
    return {"message": "Deleted"}