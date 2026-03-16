"""Connected device model for wearable tracking."""
import uuid
from datetime import datetime

from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class ConnectedDevice(Base):
    """Wearable device connection record."""
    
    __tablename__ = "connected_devices"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    device_type: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., "apple_watch", "fitbit"
    device_name: Mapped[str] = mapped_column(String(100), nullable=True)
    is_connected: Mapped[bool] = mapped_column(Boolean, default=True)
    last_synced_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    oauth_token: Mapped[str] = mapped_column(String(500), nullable=True)
    connected_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )

    # Relationships
    user = relationship("User", back_populates="devices")
