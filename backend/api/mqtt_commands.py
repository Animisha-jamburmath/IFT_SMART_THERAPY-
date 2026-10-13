from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from services.mqtt_service import mqtt_service
from api.auth import oauth2_scheme
from database.database import get_db
from sqlalchemy.orm import Session
from database.models import User
from services.auth_service import decode_token

router = APIRouter(prefix="/mqtt", tags=["MQTT"])


class MQTTCommand(BaseModel):
    frequency_hz: int = None
    intensity_pct: int = None
    session_sec: int = None
    disease: str = None


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    username = payload.get("sub")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/send_params")
def send_params(command: MQTTCommand, current_user: User = Depends(get_current_user)):
    payload = {}
    if command.frequency_hz is not None:
        payload["frequency"] = command.frequency_hz
    if command.intensity_pct is not None:
        payload["intensity"] = command.intensity_pct
    if command.session_sec is not None:
        payload["session"] = command.session_sec
    if command.disease is not None:
        payload["disease"] = command.disease
    if not payload:
        raise HTTPException(status_code=400, detail="No parameters provided")
    mqtt_service.publish("ift/therapy_params", payload)
    return {"status": "published", "payload": payload}


@router.post("/control")
def send_control(control: dict, current_user: User = Depends(get_current_user)):
    if "stop" in control:
        return {"status": "ignored", "message": "Use physical E-STOP"}
    mqtt_service.publish("ift/control", control)
    return {"status": "published", "payload": control}