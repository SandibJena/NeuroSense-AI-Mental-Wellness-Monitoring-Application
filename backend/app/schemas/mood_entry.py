"""Pydantic schemas for MoodEntry model."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

from app.models.mood_entry import MoodLevel


class MoodCreate(BaseModel):
    """Schema for creating a mood entry."""
    mood: MoodLevel
    notes: Optional[str] = Field(None, max_length=500)


class MoodResponse(BaseModel):
    """Schema for mood entry response."""
    id: str
    user_id: str
    mood: MoodLevel
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MoodTimeline(BaseModel):
    """Mood trend data."""
    entries: List[MoodResponse]
    mood_distribution: dict  # e.g. {"HAPPY": 5, "CALM": 3, ...}
    dominant_mood: MoodLevel
