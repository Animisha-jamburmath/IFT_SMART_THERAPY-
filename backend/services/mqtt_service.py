import json
import logging
import paho.mqtt.client as mqtt
from config.settings import settings

logger = logging.getLogger(__name__)


class MQTTService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        self._initialized = True
        self.client = None
        self.connected = False
        self.subscriptions = {}

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("MQTT connected")
            self.connected = True
            for topic in ["ift/telemetry", "ift/status", "ift/ai_decision", "ift/session_record"]:
                client.subscribe(topic)
        else:
            logger.error(f"MQTT connection failed: {rc}")

    def on_message(self, client, userdata, msg):
        topic = msg.topic
        payload = msg.payload.decode()
        if topic in self.subscriptions:
            for cb in self.subscriptions[topic]:
                try:
                    cb(topic, payload)
                except Exception as e:
                    logger.error(f"Callback error: {e}")

    def start(self):
        if self.client is not None:
            return
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        if settings.MQTT_USERNAME:
            self.client.username_pw_set(settings.MQTT_USERNAME, settings.MQTT_PASSWORD)
        try:
            self.client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, keepalive=60)
            self.client.loop_start()
        except Exception as e:
            logger.error(f"MQTT connection failed: {e}")
            self.client = None
            self.connected = False

    def stop(self):
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            self.client = None
            self.connected = False

    def subscribe(self, topic: str, callback):
        if topic not in self.subscriptions:
            self.subscriptions[topic] = []
        self.subscriptions[topic].append(callback)
        if self.client and self.connected:
            self.client.subscribe(topic)

    def publish(self, topic: str, payload: dict):
        if not self.connected:
            logger.warning("MQTT not connected")
            return
        self.client.publish(topic, json.dumps(payload))


mqtt_service = MQTTService()