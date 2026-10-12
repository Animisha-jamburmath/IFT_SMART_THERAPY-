"""
WebSocket Manager — relays messages between ESP32 and web/mobile clients.
"""
import json
import logging
import asyncio
from typing import List, Dict, Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WSManager:
    def __init__(self):
        self.devices: List[WebSocket] = []
        self.clients: List[WebSocket] = []
        self.lock = asyncio.Lock()

    async def connect_device(self, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.devices.append(ws)
        logger.info(f"🔌 ESP32 connected (total devices: {len(self.devices)})")

    async def connect_client(self, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.clients.append(ws)
        logger.info(f"🖥️ Client connected (total clients: {len(self.clients)})")

    def disconnect_device(self, ws: WebSocket):
        if ws in self.devices:
            self.devices.remove(ws)
        logger.info(f"🔌 ESP32 disconnected (remaining: {len(self.devices)})")

    def disconnect_client(self, ws: WebSocket):
        if ws in self.clients:
            self.clients.remove(ws)
        logger.info(f"🖥️ Client disconnected (remaining: {len(self.clients)})")

    async def broadcast_to_clients(self, message: Dict[str, Any]):
        payload = json.dumps(message)
        dead = []
        for ws in self.clients:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_client(ws)

    async def send_to_devices(self, message: Dict[str, Any]):
        payload = json.dumps(message)
        dead = []
        for ws in self.devices:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_device(ws)

    def device_count(self):
        return len(self.devices)

    def client_count(self):
        return len(self.clients)


ws_manager = WSManager()