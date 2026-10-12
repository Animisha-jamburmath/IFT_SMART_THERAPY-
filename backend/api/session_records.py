from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from database.database import get_db
from database.models import SessionRecord, Patient, User
from api.auth import oauth2_scheme
from services.auth_service import decode_token

router = APIRouter(prefix="/session-records", tags=["Session Records"])


class SessionRecordCreate(BaseModel):
    patient_id: Optional[int] = None
    frequency_hz: int
    intensity_pct: int
    duration_sec: int
    elapsed_sec: int
    disease: Optional[str] = None
    avg_ch1_ma: Optional[float] = None
    avg_ch2_ma: Optional[float] = None
    peak_ch1_ma: Optional[float] = None
    peak_ch2_ma: Optional[float] = None
    pain_before: Optional[int] = None
    pain_after: Optional[int] = None
    improvement: Optional[int] = None
    outcome: Optional[str] = None
    completed_normally: bool = True
    ai_decisions: Optional[List[int]] = None


class SessionRecordResponse(BaseModel):
    id: int
    patient_id: Optional[int]
    patient_name: Optional[str]
    frequency_hz: int
    intensity_pct: int
    duration_sec: int
    elapsed_sec: int
    disease: Optional[str]
    avg_ch1_ma: Optional[float]
    avg_ch2_ma: Optional[float]
    peak_ch1_ma: Optional[float]
    peak_ch2_ma: Optional[float]
    pain_before: Optional[int]
    pain_after: Optional[int]
    improvement: Optional[int]
    outcome: Optional[str]
    completed_normally: bool
    ai_decisions: List[int]
    ai_decision_count: int
    ended_at: str
    created_at: str


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user = db.query(User).filter(User.username == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def fmt(dt):
    return dt.isoformat() if dt else None


@router.post("/", response_model=SessionRecordResponse, status_code=status.HTTP_201_CREATED)
def create_session_record(data: SessionRecordCreate, db: Session = Depends(get_db),
                          current_user: User = Depends(get_current_user)):
    patient = None
    if data.patient_id:
        patient = db.query(Patient).filter(Patient.id == data.patient_id).first()

    r = SessionRecord(
        patient_id=data.patient_id,
        frequency_hz=data.frequency_hz,
        intensity_pct=data.intensity_pct,
        duration_sec=data.duration_sec,
        elapsed_sec=data.elapsed_sec,
        disease=data.disease,
        avg_ch1_ma=data.avg_ch1_ma,
        avg_ch2_ma=data.avg_ch2_ma,
        peak_ch1_ma=data.peak_ch1_ma,
        peak_ch2_ma=data.peak_ch2_ma,
        pain_before=data.pain_before,
        pain_after=data.pain_after,
        improvement=data.improvement,
        outcome=data.outcome,
        completed_normally=data.completed_normally,
        ai_decisions=data.ai_decisions or [],
        ai_decision_count=len(data.ai_decisions or []),
        started_at=datetime.utcnow(),
        ended_at=datetime.utcnow(),
    )
    db.add(r)
    db.commit()
    db.refresh(r)

    return SessionRecordResponse(
        id=r.id, patient_id=r.patient_id, patient_name=patient.name if patient else None,
        frequency_hz=r.frequency_hz, intensity_pct=r.intensity_pct,
        duration_sec=r.duration_sec, elapsed_sec=r.elapsed_sec, disease=r.disease,
        avg_ch1_ma=r.avg_ch1_ma, avg_ch2_ma=r.avg_ch2_ma,
        peak_ch1_ma=r.peak_ch1_ma, peak_ch2_ma=r.peak_ch2_ma,
        pain_before=r.pain_before, pain_after=r.pain_after, improvement=r.improvement,
        outcome=r.outcome, completed_normally=r.completed_normally,
        ai_decisions=r.ai_decisions or [], ai_decision_count=r.ai_decision_count,
        ended_at=fmt(r.ended_at), created_at=fmt(r.created_at),
    )


@router.get("/", response_model=List[SessionRecordResponse])
def list_session_records(patient_id: Optional[int] = None, skip: int = 0, limit: int = 100,
                         db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(SessionRecord)
    if patient_id:
        query = query.filter(SessionRecord.patient_id == patient_id)
    records = query.order_by(SessionRecord.ended_at.desc()).offset(skip).limit(limit).all()

    result = []
    for r in records:
        p = db.query(Patient).filter(Patient.id == r.patient_id).first()
        result.append(SessionRecordResponse(
            id=r.id, patient_id=r.patient_id, patient_name=p.name if p else None,
            frequency_hz=r.frequency_hz, intensity_pct=r.intensity_pct,
            duration_sec=r.duration_sec, elapsed_sec=r.elapsed_sec, disease=r.disease,
            avg_ch1_ma=r.avg_ch1_ma, avg_ch2_ma=r.avg_ch2_ma,
            peak_ch1_ma=r.peak_ch1_ma, peak_ch2_ma=r.peak_ch2_ma,
            pain_before=r.pain_before, pain_after=r.pain_after, improvement=r.improvement,
            outcome=r.outcome, completed_normally=r.completed_normally,
            ai_decisions=r.ai_decisions or [], ai_decision_count=r.ai_decision_count,
            ended_at=fmt(r.ended_at), created_at=fmt(r.created_at),
        ))
    return result