from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import json
from config.settings import settings
from database.database import engine, Base, SessionLocal
from api import (
    auth, patients, sessions, imaging, reports,
    ai_assistant, pain, settings as settings_api,
    session_records, segmentation,
)
from services.auth_service import get_password_hash
from database.models import User
from ws_manager import ws_manager

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# ─── Routers ──────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(patients.router, prefix="/api")
app.include_router(sessions.router, prefix="/api")
app.include_router(imaging.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(ai_assistant.router, prefix="/api")
app.include_router(pain.router, prefix="/api")
app.include_router(settings_api.router, prefix="/api")
app.include_router(session_records.router, prefix="/api")
app.include_router(segmentation.router, prefix="/api")

# ─── Static files ─────────────────────────────────────────────
os.makedirs("storage/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="storage/uploads"), name="uploads")
@app.get("/health")
async def health():
    return {"status": "ok"}

# ─── WebSocket endpoints ──────────────────────────────────────
@app.websocket("/ws/device")
async def device_websocket(websocket: WebSocket):
    """ESP32 connects here."""
    await ws_manager.connect_device(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                await ws_manager.broadcast_to_clients(message)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect_device(websocket)
    except Exception as e:
        print(f"Device WS error: {e}")
        ws_manager.disconnect_device(websocket)


@app.websocket("/ws/client")
async def client_websocket(websocket: WebSocket):
    """Web/mobile client connects here."""
    await ws_manager.connect_client(websocket)
    try:
        await websocket.send_text(json.dumps({
            "type": "connection_status",
            "device_connected": ws_manager.device_count() > 0,
            "device_count": ws_manager.device_count(),
        }))
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                await ws_manager.send_to_devices(message)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect_client(websocket)
    except Exception as e:
        print(f"Client WS error: {e}")
        ws_manager.disconnect_client(websocket)


@app.get("/ws/status")
def ws_status():
    return {
        "devices_connected": ws_manager.device_count(),
        "clients_connected": ws_manager.client_count(),
    }


# ─── Startup ──────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "admin").first()
        if not existing:
            db.add(User(
                username="admin",
                email="admin@hospital.com",
                hashed_password=get_password_hash("admin123"),
                full_name="Administrator",
                role="admin",
            ))
            db.commit()
            print("✅ Default user created: admin / admin123")
    finally:
        db.close()
    print("✅ WebSocket endpoints ready")


@app.get("/")
def root():
    return {"message": "IFT Therapy API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}