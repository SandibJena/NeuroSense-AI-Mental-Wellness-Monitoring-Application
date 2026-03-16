"""Pydantic schemas for HealthData model."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class HealthDataCreate(BaseModel):
    """Schema for submitting health data."""
    heart_rate: Optional[int] = Field(None, ge=40, le=200, description="Heart rate (40-200 bpm)")
    hrv: Optional[float] = Field(None, ge=10, le=200, description="Heart rate variability (10-200 ms)")
    sleep_duration: Optional[float] = Field(None, ge=0, le=16, description="Sleep duration (0-16 hours)")
    sleep_quality: Optional[float] = Field(None, ge=0, le=100, description="Sleep quality (0-100)")
    breathing_rate: Optional[float] = Field(None, ge=4, le=40, description="Breathing rate (breaths/min)")
    activity_level: Optional[int] = Field(None, ge=0, le=100, description="Activity level (0-100)")
    steps: Optional[int] = Field(None, ge=0)
    calories_burned: Optional[float] = Field(None, ge=0)
    spo2: Optional[float] = Field(None, ge=70, le=100, description="Blood oxygen %")
    skin_temperature: Optional[float] = Field(None, ge=30, le=42, description="Skin temp (Celsius)")
    source_device: Optional[str] = Field(None, max_length=50)
    timestamp: Optional[datetime] = None


class HealthDataResponse(BaseModel):
    """Schema for health data response."""
    id: str
    user_id: str
    heart_rate: Optional[int] = None
    hrv: Optional[float] = None
    sleep_duration: Optional[float] = None
    sleep_quality: Optional[float] = None
    breathing_rate: Optional[float] = None
    activity_level: Optional[int] = None
    steps: Optional[int] = None
    calories_burned: Optional[float] = None
    spo2: Optional[float] = None
    skin_temperature: Optional[float] = None
    source_device: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class HealthDataBatch(BaseModel):
    """Schema for batch health data submission."""
    records: List[HealthDataCreate]


class HealthSummary(BaseModel):
    """Daily health summary."""
    date: str
    avg_heart_rate: Optional[float] = None
    avg_hrv: Optional[float] = None
    total_sleep: Optional[float] = None
    avg_sleep_quality: Optional[float] = None
    total_steps: Optional[int] = None
    avg_activity_level: Optional[float] = None
