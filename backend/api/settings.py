from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from database.database import get_db
from database.models import DeviceSettings, User
from api.auth import oauth2_scheme
from services.auth_service import decode_token

router = APIRouter(prefix="/settings", tags=["Settings"])


class SettingsUpdate(BaseModel):
    mqtt_broker: str = ""
    mqtt_port: int = 1883
    mqtt_username: str = ""
    mqtt_password: str = ""
    wifi_ssid: str = ""
    wifi_password: str = ""


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    user = db.query(User).filter(User.username == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_or_create(db: Session) -> DeviceSettings:
    s = db.query(DeviceSettings).first()
    if not s:
        s = DeviceSettings()
        db.add(s)
        db.commit()
        db.refresh(s)
    return s


@router.get("/")
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s = get_or_create(db)
    return {
        "mqtt_broker": s.mqtt_broker,
        "mqtt_port": s.mqtt_port,
        "mqtt_username": s.mqtt_username,
        "mqtt_password": s.mqtt_password,
        "wifi_ssid": s.wifi_ssid,
        "wifi_password": s.wifi_password,
        "updated_at": s.updated_at.isoformat() if s.updated_at else None,
    }


@router.put("/")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    s = get_or_create(db)
    s.mqtt_broker = data.mqtt_broker
    s.mqtt_port = data.mqtt_port
    s.mqtt_username = data.mqtt_username
    s.mqtt_password = data.mqtt_password
    s.wifi_ssid = data.wifi_ssid
    s.wifi_password = data.wifi_password
    s.updated_at = datetime.utcnow()
    db.commit()
    return {"status": "updated"}


@router.post("/test_mqtt")
def test_mqtt(data: dict, current_user: User = Depends(get_current_user)):
    # Test is now for WebSocket - always returns success
    return {"success": True, "message": "WebSocket is used for device communication"}