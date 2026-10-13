from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database.database import get_db
from database.models import Report, Patient, User
from api.auth import oauth2_scheme
from services.auth_service import decode_token

router = APIRouter(prefix="/reports", tags=["Reports"])


class ReportCreate(BaseModel):
    patient_id: int
    session_id: int = None
    title: str
    content: str


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/")
def create_report(data: ReportCreate, db: Session = Depends(get_db),
                  current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == data.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    report = Report(patient_id=data.patient_id, session_id=data.session_id,
                    title=data.title, content=data.content, generated_by=current_user.id)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/{patient_id}")
def list_reports(patient_id: int, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    return db.query(Report).filter(Report.patient_id == patient_id).all()