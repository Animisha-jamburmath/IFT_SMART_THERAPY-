from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database.database import get_db
from database.models import Patient, User
from api.auth import oauth2_scheme
from services.auth_service import decode_token

router = APIRouter(prefix="/patients", tags=["Patients"])


class PatientCreate(BaseModel):
    name: str
    age: int = 0
    gender: str = "Male"
    disease: str
    contact: str
    email: str = ""


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    disease: Optional[str] = None
    contact: Optional[str] = None
    email: Optional[str] = None


class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    disease: str
    contact: str
    email: str
    created_by: int
    created_at: str
    updated_at: str


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user = db.query(User).filter(User.username == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def fmt(dt):
    return dt.isoformat() if dt else None


@router.get("/", response_model=List[PatientResponse])
def list_patients(skip: int = 0, limit: int = 100, search: str = "",
                  db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Patient)
    if search:
        s = f"%{search}%"
        query = query.filter((Patient.name.ilike(s)) | (Patient.disease.ilike(s)) | (Patient.contact.ilike(s)))
    patients = query.offset(skip).limit(limit).all()
    return [PatientResponse(
        id=p.id, name=p.name, age=p.age or 0, gender=p.gender, disease=p.disease,
        contact=p.contact, email=p.email or "", created_by=p.created_by,
        created_at=fmt(p.created_at), updated_at=fmt(p.updated_at),
    ) for p in patients]


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(data: PatientCreate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    p = Patient(**data.dict(), created_by=current_user.id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return PatientResponse(id=p.id, name=p.name, age=p.age or 0, gender=p.gender,
                           disease=p.disease, contact=p.contact, email=p.email or "",
                           created_by=p.created_by, created_at=fmt(p.created_at),
                           updated_at=fmt(p.updated_at))


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db),
                current_user: User = Depends(get_current_user)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientResponse(id=p.id, name=p.name, age=p.age or 0, gender=p.gender,
                           disease=p.disease, contact=p.contact, email=p.email or "",
                           created_by=p.created_by, created_at=fmt(p.created_at),
                           updated_at=fmt(p.updated_at))


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(patient_id: int, data: PatientUpdate,
                   db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    for k, v in data.dict(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return PatientResponse(id=p.id, name=p.name, age=p.age or 0, gender=p.gender,
                           disease=p.disease, contact=p.contact, email=p.email or "",
                           created_by=p.created_by, created_at=fmt(p.created_at),
                           updated_at=fmt(p.updated_at))


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: int, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    p = db.query(Patient).filter(Patient.id == patient_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(p)
    db.commit()