import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    APP_NAME: str = "IFT Therapy API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./ift_therapy.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    MQTT_BROKER: str = os.getenv("MQTT_BROKER", "broker.emqx.io")
    MQTT_PORT: int = int(os.getenv("MQTT_PORT", "1883"))
    MQTT_USERNAME: str = os.getenv("MQTT_USERNAME", "")
    MQTT_PASSWORD: str = os.getenv("MQTT_PASSWORD", "")

    MODEL_DEVICE: str = "cpu"


settings = Settings()