from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default="clinician")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patients = relationship("Patient", back_populates="created_by_user")
    sessions = relationship("Session", back_populates="created_by_user")


class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    disease = Column(String)
    contact = Column(String)
    email = Column(String)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by_user = relationship("User", back_populates="patients")
    sessions = relationship("Session", back_populates="patient")
    pain_logs = relationship("PainLog", back_populates="patient")
    session_records = relationship("SessionRecord", backref="patient")


class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    patient = relationship("Patient", back_populates="sessions")
    created_by = Column(Integer, ForeignKey("users.id"))
    created_by_user = relationship("User", back_populates="sessions")
    frequency_hz = Column(Integer, nullable=False)
    intensity_pct = Column(Integer, nullable=False)
    duration_sec = Column(Integer, nullable=False)
    elapsed_sec = Column(Integer, default=0)
    disease = Column(String, nullable=True)
    avg_current_ma = Column(Float, nullable=True)
    peak_current_ma = Column(Float, nullable=True)
    pain_before = Column(Integer, nullable=True)
    pain_after = Column(Integer, nullable=True)
    improvement = Column(Integer, nullable=True)
    outcome = Column(String, nullable=True)
    ai_decisions = Column(JSON, default=list)
    ai_decision_count = Column(Integer, default=0)
    status = Column(String, nullable=False, default="completed")
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_normally = Column(Boolean, default=True)

    pain_logs = relationship("PainLog", back_populates="session")


class SessionRecord(Base):
    __tablename__ = "session_records"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    frequency_hz = Column(Integer, nullable=False)
    intensity_pct = Column(Integer, nullable=False)
    duration_sec = Column(Integer, nullable=False)
    elapsed_sec = Column(Integer, nullable=False)
    disease = Column(String, nullable=True)
    avg_ch1_ma = Column(Float, nullable=True)
    avg_ch2_ma = Column(Float, nullable=True)
    peak_ch1_ma = Column(Float, nullable=True)
    peak_ch2_ma = Column(Float, nullable=True)
    pain_before = Column(Integer, nullable=True)
    pain_after = Column(Integer, nullable=True)
    improvement = Column(Integer, nullable=True)
    outcome = Column(String, nullable=True)
    completed_normally = Column(Boolean, default=True)
    ai_decisions = Column(JSON, default=list)
    ai_decision_count = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class ImagingStudy(Base):
    __tablename__ = "imaging_studies"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    patient = relationship("Patient", backref="imaging_studies")
    modality = Column(String)
    body_region = Column(String)
    file_path = Column(String)
    file_name = Column(String)
    file_size = Column(Integer)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    ai_findings = Column(JSON, default=dict)
    ai_confidence = Column(Float)
    ai_analysis_date = Column(DateTime, nullable=True)
    clinical_indication = Column(Text)
    findings = Column(Text)
    impression = Column(Text)
    recommendation = Column(Text)


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    patient = relationship("Patient", backref="reports")
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    session = relationship("Session", backref="reports")
    title = Column(String)
    content = Column(Text)
    file_path = Column(String)
    generated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    session = relationship("Session", backref="telemetry_logs")
    frequency_hz = Column(Integer)
    intensity_pct = Column(Integer)
    ch1_current_ma = Column(Float)
    session_remain = Column(Integer)
    session_total = Column(Integer)
    ai_decision = Column(String)
    estop = Column(Boolean)
    fault = Column(Boolean)
    fault_reason = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)


class PainLog(Base):
    __tablename__ = "pain_logs"
    __table_args__ = {'extend_existing': True}
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    patient = relationship("Patient", back_populates="pain_logs")
    session_id = Column(Integer, ForeignKey("sessions.id"), nullable=True)
    session = relationship("Session", back_populates="pain_logs")
    pain_before = Column(Integer, nullable=True)
    pain_after = Column(Integer, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow)


class DeviceSettings(Base):
    __tablename__ = "device_settings"
    id = Column(Integer, primary_key=True, index=True)
    mqtt_broker = Column(String, default="broker.emqx.io")
    mqtt_port = Column(Integer, default=1883)
    mqtt_username = Column(String, default="")
    mqtt_password = Column(String, default="")
    wifi_ssid = Column(String, default="animishajamburmath")
    wifi_password = Column(String, default="animisha")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)