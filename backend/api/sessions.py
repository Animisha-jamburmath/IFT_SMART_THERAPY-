from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database.database import get_db
from database.models import Session as SessionModel, Patient, User
from api.auth import oauth2_scheme
from services.auth_service import decode_token

router = APIRouter(prefix="/sessions", tags=["Sessions"])


class SessionCreate(BaseModel):
    patient_id: int
    frequency_hz: int
    intensity_pct: int
    duration_sec: int
    disease: Optional[str] = None


class SessionResponse(BaseModel):
    id: int
    patient_id: int
    patient_name: Optional[str] = None
    created_by: int
    frequency_hz: int
    intensity_pct: int
    duration_sec: int
    elapsed_sec: int
    disease: Optional[str]
    status: str
    started_at: str
    created_at: str


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def fmt(dt):
    return dt.isoformat() if dt else None


@router.get("/", response_model=List[SessionResponse])
def list_sessions(skip: int = 0, limit: int = 100,
                  patient_id: Optional[int] = None,
                  db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    query = db.query(SessionModel)
    if patient_id:
        query = query.filter(SessionModel.patient_id == patient_id)
    sessions = query.offset(skip).limit(limit).all()
    result = []
    for s in sessions:
        patient = db.query(Patient).filter(Patient.id == s.patient_id).first()
        result.append(SessionResponse(
            id=s.id, patient_id=s.patient_id,
            patient_name=patient.name if patient else None,
            created_by=s.created_by, frequency_hz=s.frequency_hz,
            intensity_pct=s.intensity_pct, duration_sec=s.duration_sec,
            elapsed_sec=s.elapsed_sec, disease=s.disease,
            status=s.status, started_at=fmt(s.started_at),
            created_at=fmt(s.created_at),
        ))
    return result


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(data: SessionCreate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    s = SessionModel(
        patient_id=data.patient_id, created_by=current_user.id,
        frequency_hz=data.frequency_hz, intensity_pct=data.intensity_pct,
        duration_sec=data.duration_sec, disease=data.disease,
        status="completed", ai_decisions=[], started_at=datetime.utcnow(),
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return SessionResponse(
        id=s.id, patient_id=s.patient_id, patient_name=patient.name,
        created_by=s.created_by, frequency_hz=s.frequency_hz,
        intensity_pct=s.intensity_pct, duration_sec=s.duration_sec,
        elapsed_sec=s.elapsed_sec, disease=s.disease, status=s.status,
        started_at=fmt(s.started_at), created_at=fmt(s.created_at),
    )