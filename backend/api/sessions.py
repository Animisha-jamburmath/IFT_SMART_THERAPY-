from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database.database import get_db
from database.models import Session, Patient, User
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
    avg_current_ma: Optional[float]
    peak_current_ma: Optional[float]
    pain_before: Optional[int]
    pain_after: Optional[int]
    improvement: Optional[int]
    outcome: Optional[str]
    status: str
    started_at: str
    created_at: str


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user = db.query(User).filter(User.username == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def fmt(dt):
    return dt.isoformat() if dt else None


@router.get("/", response_model=List[SessionResponse])
def list_sessions(skip: int = 0, limit: int = 100, patient_id: Optional[int] = None,
                  db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Session)
    if patient_id:
        query = query.filter(Session.patient_id == patient_id)
    sessions = query.offset(skip).limit(limit).all()
    result = []
    for s in sessions:
        p = db.query(Patient).filter(Patient.id == s.patient_id).first()
        result.append(SessionResponse(
            id=s.id, patient_id=s.patient_id, patient_name=p.name if p else None,
            created_by=s.created_by, frequency_hz=s.frequency_hz, intensity_pct=s.intensity_pct,
            duration_sec=s.duration_sec, elapsed_sec=s.elapsed_sec, disease=s.disease,
            avg_current_ma=s.avg_current_ma, peak_current_ma=s.peak_current_ma,
            pain_before=s.pain_before, pain_after=s.pain_after, improvement=s.improvement,
            outcome=s.outcome, status=s.status,
            started_at=fmt(s.started_at), created_at=fmt(s.created_at),
        ))
    return result


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(data: SessionCreate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    p = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    s = Session(**data.dict(), created_by=current_user.id, status="completed",
                ai_decisions=[], started_at=datetime.utcnow())
    db.add(s)
    db.commit()
    db.refresh(s)
    return SessionResponse(
        id=s.id, patient_id=s.patient_id, patient_name=p.name, created_by=s.created_by,
        frequency_hz=s.frequency_hz, intensity_pct=s.intensity_pct, duration_sec=s.duration_sec,
        elapsed_sec=s.elapsed_sec, disease=s.disease, avg_current_ma=s.avg_current_ma,
        peak_current_ma=s.peak_current_ma, pain_before=s.pain_before, pain_after=s.pain_after,
        improvement=s.improvement, outcome=s.outcome, status=s.status,
        started_at=fmt(s.started_at), created_at=fmt(s.created_at),
    )