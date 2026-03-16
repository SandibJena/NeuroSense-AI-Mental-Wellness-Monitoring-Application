"""Application configuration settings."""
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App configuration loaded from environment variables."""
    
    APP_NAME: str = "NeuroSense API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./neurosense.db"
    
    # JWT Auth
    SECRET_KEY: str = "neurosense-dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Redis (optional for dev)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Stress Alert Defaults
    STRESS_ALERT_THRESHOLD: int = 70
    DEFAULT_SYNC_FREQUENCY_MINUTES: int = 30
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
