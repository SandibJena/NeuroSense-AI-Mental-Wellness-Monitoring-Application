"""Stress analysis API routes."""
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.health_data import HealthData
from app.models.stress_analysis import StressAnalysis
from app.models.user import User
from app.schemas.stress_analysis import StressAnalysisResponse, StressTrend, WellnessDashboard
from app.services.stress_engine import compute_stress_score, generate_recommendations
from app.services.burnout_predictor import predict_burnout_risk
from app.services.recovery_scorer import compute_recovery_score
from app.routers.auth import get_current_user

router = APIRouter(prefix="/stress", tags=["Stress Analysis"])


@router.post("/analyze", response_model=StressAnalysisResponse)
async def run_stress_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Run stress analysis using latest health data."""
    # Get the most recent health data
    result = await db.execute(
        select(HealthData)
        .where(HealthData.user_id == current_user.id)
        .order_by(HealthData.timestamp.desc())
        .limit(1)
    )
    latest = result.scalar_one_or_none()
    
    # Compute stress score
    if latest:
        stress_score, confidence, factors = compute_stress_score(
            hrv=latest.hrv,
            sleep_duration=latest.sleep_duration,
            heart_rate=latest.heart_rate,
            breathing_rate=latest.breathing_rate,
        )
    else:
        stress_score, confidence, factors = 50, 0.0, {}
    
    # Get 7-day history for burnout prediction
    since_7d = datetime.utcnow() - timedelta(days=7)
    result = await db.execute(
        select(HealthData)
        .where(HealthData.user_id == current_user.id)
        .where(HealthData.timestamp >= since_7d)
        .order_by(HealthData.timestamp.asc())
    )
    history = result.scalars().all()
    
    # Extract daily averages for burnout prediction
    hrv_hist = [r.hrv for r in history if r.hrv]
    sleep_hist = [r.sleep_duration for r in history if r.sleep_duration]
    activity_hist = [r.activity_level for r in history if r.activity_level]
    
    # Get previous stress scores
    prev_result = await db.execute(
        select(StressAnalysis)
        .where(StressAnalysis.user_id == current_user.id)
        .where(StressAnalysis.generated_at >= since_7d)
        .order_by(StressAnalysis.generated_at.asc())
    )
    prev_analyses = prev_result.scalars().all()
    stress_hist = [a.stress_score for a in prev_analyses]
    
    # Burnout prediction
    burnout_risk = 0.0
    if hrv_hist and sleep_hist:
        burnout_risk, _, _ = predict_burnout_risk(
            hrv_hist, sleep_hist, activity_hist or [50], stress_hist or [50]
        )
    
    # Recovery score
    recovery_score = 50
    if latest:
        prev_stress = prev_analyses[-1].stress_score if prev_analyses else None
        recovery_score, _ = compute_recovery_score(
            hrv=latest.hrv,
            sleep_duration=latest.sleep_duration,
            sleep_quality=latest.sleep_quality,
            resting_hr=latest.heart_rate,
            previous_stress_score=prev_stress,
        )
    
    # Generate recommendations
    recommendations = generate_recommendations(stress_score, factors)
    
    # Save analysis
    analysis = StressAnalysis(
        user_id=current_user.id,
        stress_score=stress_score,
        burnout_risk=burnout_risk,
        recovery_score=recovery_score,
        confidence=confidence,
        contributing_factors=factors,
        recommendations=recommendations,
    )
    db.add(analysis)
    await db.flush()
    
    return StressAnalysisResponse.model_validate(analysis)


@router.get("/latest", response_model=StressAnalysisResponse)
async def get_latest_analysis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the most recent stress analysis."""
    result = await db.execute(
        select(StressAnalysis)
        .where(StressAnalysis.user_id == current_user.id)
        .order_by(StressAnalysis.generated_at.desc())
        .limit(1)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        # Run a new analysis if none exists
        return await run_stress_analysis(current_user=current_user, db=db)
    return StressAnalysisResponse.model_validate(analysis)


@router.get("/trend", response_model=List[StressTrend])
async def get_stress_trend(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days: int = Query(7, ge=1, le=90),
):
    """Get stress trend over time."""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(StressAnalysis)
        .where(StressAnalysis.user_id == current_user.id)
        .where(StressAnalysis.generated_at >= since)
        .order_by(StressAnalysis.generated_at.asc())
    )
    analyses = result.scalars().all()
    return [
        StressTrend(
            date=a.generated_at.strftime("%Y-%m-%d"),
            stress_score=a.stress_score,
            burnout_risk=a.burnout_risk,
            recovery_score=a.recovery_score,
        )
        for a in analyses
    ]


@router.get("/dashboard", response_model=WellnessDashboard)
async def get_wellness_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get combined wellness dashboard data."""
    # Latest analysis
    result = await db.execute(
        select(StressAnalysis)
        .where(StressAnalysis.user_id == current_user.id)
        .order_by(StressAnalysis.generated_at.desc())
        .limit(1)
    )
    latest = result.scalar_one_or_none()
    
    # 7-day trend
    since_7d = datetime.utcnow() - timedelta(days=7)
    result = await db.execute(
        select(StressAnalysis)
        .where(StressAnalysis.user_id == current_user.id)
        .where(StressAnalysis.generated_at >= since_7d)
        .order_by(StressAnalysis.generated_at.asc())
    )
    week_analyses = result.scalars().all()
    
    trend = [
        StressTrend(
            date=a.generated_at.strftime("%Y-%m-%d"),
            stress_score=a.stress_score,
            burnout_risk=a.burnout_risk,
            recovery_score=a.recovery_score,
        )
        for a in week_analyses
    ]
    
    avg_stress = None
    avg_recovery = None
    burnout_dir = "stable"
    
    if week_analyses:
        avg_stress = round(sum(a.stress_score for a in week_analyses) / len(week_analyses), 1)
        avg_recovery = round(sum(a.recovery_score for a in week_analyses) / len(week_analyses), 1)
        
        if len(week_analyses) >= 3:
            recent = [a.burnout_risk for a in week_analyses[-3:]]
            early = [a.burnout_risk for a in week_analyses[:3]]
            avg_recent = sum(recent) / len(recent)
            avg_early = sum(early) / len(early)
            if avg_recent > avg_early + 0.1:
                burnout_dir = "declining"
            elif avg_recent < avg_early - 0.1:
                burnout_dir = "improving"
    
    return WellnessDashboard(
        current_stress=StressAnalysisResponse.model_validate(latest) if latest else None,
        stress_trend=trend,
        avg_stress_7d=avg_stress,
        avg_recovery_7d=avg_recovery,
        burnout_trend=burnout_dir,
    )
