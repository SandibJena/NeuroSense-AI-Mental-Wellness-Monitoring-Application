"""Health data model for wearable signals."""
import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class HealthData(Base):
    """Physiological data from wearable devices."""
    
    __tablename__ = "health_data"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    heart_rate: Mapped[int] = mapped_column(Integer, nullable=True)  # 40-200 bpm
    hrv: Mapped[float] = mapped_column(Float, nullable=True)  # 10-200 ms
    sleep_duration: Mapped[float] = mapped_column(Float, nullable=True)  # 0-16 hours
    sleep_quality: Mapped[float] = mapped_column(Float, nullable=True)  # 0-100
    breathing_rate: Mapped[float] = mapped_column(Float, nullable=True)  # breaths/min
    activity_level: Mapped[int] = mapped_column(Integer, nullable=True)  # 0-100
    steps: Mapped[int] = mapped_column(Integer, nullable=True)
    calories_burned: Mapped[float] = mapped_column(Float, nullable=True)
    spo2: Mapped[float] = mapped_column(Float, nullable=True)  # Blood oxygen %
    skin_temperature: Mapped[float] = mapped_column(Float, nullable=True)
    source_device: Mapped[str] = mapped_column(String(50), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True
    )

    # Relationships
    user = relationship("User", back_populates="health_data")
