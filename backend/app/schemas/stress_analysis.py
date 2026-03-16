"""Pydantic schemas for StressAnalysis model."""
from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field


class StressAnalysisResponse(BaseModel):
    """Schema for stress analysis response."""
    id: str
    user_id: str
    stress_score: int = Field(..., ge=0, le=100)
    burnout_risk: float = Field(..., ge=0, le=1)
    recovery_score: int = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=1)
    contributing_factors: Optional[Dict[str, float]] = None
    recommendations: Optional[List[str]] = None
    generated_at: datetime

    class Config:
        from_attributes = True


class StressTrend(BaseModel):
    """Stress trend over time."""
    date: str
    stress_score: int
    burnout_risk: float
    recovery_score: int


class WellnessDashboard(BaseModel):
    """Combined wellness dashboard data."""
    current_stress: Optional[StressAnalysisResponse] = None
    stress_trend: List[StressTrend] = []
    avg_stress_7d: Optional[float] = None
    avg_recovery_7d: Optional[float] = None
    burnout_trend: str = "stable"  # "declining", "stable", "improving"
