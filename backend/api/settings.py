from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import paho.mqtt.client as mqtt
from database.database import get_db
from database.models import DeviceSettings, User
from api.auth import oauth2_scheme
from services.auth_service import decode_token

router = APIRouter(prefix="/settings", tags=["Settings"])

class SettingsUpdate(BaseModel):
    mqtt_broker: str
    mqtt_port: int
    mqtt_username: str
    mqtt_password: str
    wifi_ssid: str
    wifi_password: str

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    username = payload.get("sub")
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def get_or_create_settings(db: Session) -> DeviceSettings:
    settings = db.query(DeviceSettings).first()
    if not settings:
        settings = DeviceSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.get("/")
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    settings = get_or_create_settings(db)
    return {
        "mqtt_broker": settings.mqtt_broker,
        "mqtt_port": settings.mqtt_port,
        "mqtt_username": settings.mqtt_username,
        "mqtt_password": settings.mqtt_password,
        "wifi_ssid": settings.wifi_ssid,
        "wifi_password": settings.wifi_password,
        "updated_at": settings.updated_at.isoformat() if settings.updated_at else None
    }

@router.put("/")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    settings = get_or_create_settings(db)
    settings.mqtt_broker = data.mqtt_broker
    settings.mqtt_port = data.mqtt_port
    settings.mqtt_username = data.mqtt_username
    settings.mqtt_password = data.mqtt_password
    settings.wifi_ssid = data.wifi_ssid
    settings.wifi_password = data.wifi_password
    settings.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(settings)
    return {"status": "updated"}

@router.post("/test_mqtt")
def test_mqtt_connection(data: dict, current_user: User = Depends(get_current_user)):
    broker = data.get("mqtt_broker")
    port = data.get("mqtt_port", 1883)
    username = data.get("mqtt_username", "")
    password = data.get("mqtt_password", "")
    try:
        client = mqtt.Client()
        if username:
            client.username_pw_set(username, password)
        client.connect(broker, port, timeout=5)
        client.disconnect()
        return {"success": True, "message": "Connection successful"}
    except Exception as e:
        return {"success": False, "message": str(e)}