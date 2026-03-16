"""Mood entry model."""
import uuid
import enum
from datetime import datetime

from sqlalchemy import String, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class MoodLevel(str, enum.Enum):
    """Mood level enumeration."""
    HAPPY = "HAPPY"
    CALM = "CALM"
    NEUTRAL = "NEUTRAL"
    STRESSED = "STRESSED"
    SAD = "SAD"


class MoodEntry(Base):
    """User-reported mood journal entry."""
    
    __tablename__ = "mood_entries"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    mood: Mapped[MoodLevel] = mapped_column(
        Enum(MoodLevel), nullable=False
    )
    notes: Mapped[str] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True
    )

    # Relationships
    user = relationship("User", back_populates="mood_entries")
