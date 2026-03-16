"""Stress analysis model."""
import uuid
from datetime import datetime

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class StressAnalysis(Base):
    """ML-generated stress, burnout, and recovery analysis."""
    
    __tablename__ = "stress_analyses"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    stress_score: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-100
    burnout_risk: Mapped[float] = mapped_column(Float, nullable=False)  # 0-1
    recovery_score: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-100
    confidence: Mapped[float] = mapped_column(Float, default=0.8)  # 0-1
    contributing_factors: Mapped[dict] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[list] = mapped_column(JSON, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, index=True
    )

    # Relationships
    user = relationship("User", back_populates="stress_analyses")
