"""Health data API routes."""
from datetime import datetime, timedelta
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.health_data import HealthData
from app.models.user import User
from app.schemas.health_data import (
    HealthDataCreate,
    HealthDataResponse,
    HealthDataBatch,
    HealthSummary,
)
from app.routers.auth import get_current_user

router = APIRouter(prefix="/health", tags=["Health Data"])


@router.post("/data", response_model=HealthDataResponse, status_code=201)
async def submit_health_data(
    data: HealthDataCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit a single health data record."""
    record = HealthData(
        user_id=current_user.id,
        heart_rate=data.heart_rate,
        hrv=data.hrv,
        sleep_duration=data.sleep_duration,
        sleep_quality=data.sleep_quality,
        breathing_rate=data.breathing_rate,
        activity_level=data.activity_level,
        steps=data.steps,
        calories_burned=data.calories_burned,
        spo2=data.spo2,
        skin_temperature=data.skin_temperature,
        source_device=data.source_device,
        timestamp=data.timestamp or datetime.utcnow(),
    )
    db.add(record)
    await db.flush()
    return HealthDataResponse.model_validate(record)


@router.post("/data/batch", response_model=List[HealthDataResponse], status_code=201)
async def submit_health_data_batch(
    batch: HealthDataBatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit multiple health data records at once."""
    records = []
    for data in batch.records:
        record = HealthData(
            user_id=current_user.id,
            heart_rate=data.heart_rate,
            hrv=data.hrv,
            sleep_duration=data.sleep_duration,
            sleep_quality=data.sleep_quality,
            breathing_rate=data.breathing_rate,
            activity_level=data.activity_level,
            steps=data.steps,
            calories_burned=data.calories_burned,
            spo2=data.spo2,
            skin_temperature=data.skin_temperature,
            source_device=data.source_device,
            timestamp=data.timestamp or datetime.utcnow(),
        )
        db.add(record)
        records.append(record)
    await db.flush()
    return [HealthDataResponse.model_validate(r) for r in records]


@router.get("/data", response_model=List[HealthDataResponse])
async def get_health_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days: int = Query(7, ge=1, le=365),
    limit: int = Query(100, ge=1, le=1000),
):
    """Get health data for the current user."""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(HealthData)
        .where(HealthData.user_id == current_user.id)
        .where(HealthData.timestamp >= since)
        .order_by(HealthData.timestamp.desc())
        .limit(limit)
    )
    records = result.scalars().all()
    return [HealthDataResponse.model_validate(r) for r in records]


@router.get("/summary", response_model=List[HealthSummary])
async def get_health_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days: int = Query(7, ge=1, le=90),
):
    """Get daily health summaries for the specified period."""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(HealthData)
        .where(HealthData.user_id == current_user.id)
        .where(HealthData.timestamp >= since)
        .order_by(HealthData.timestamp.asc())
    )
    records = result.scalars().all()
    
    # Group by date
    daily_data = {}
    for r in records:
        date_key = r.timestamp.strftime("%Y-%m-%d")
        if date_key not in daily_data:
            daily_data[date_key] = []
        daily_data[date_key].append(r)
    
    summaries = []
    for date_key, day_records in sorted(daily_data.items()):
        hr_values = [r.heart_rate for r in day_records if r.heart_rate]
        hrv_values = [r.hrv for r in day_records if r.hrv]
        sleep_values = [r.sleep_duration for r in day_records if r.sleep_duration]
        quality_values = [r.sleep_quality for r in day_records if r.sleep_quality]
        step_values = [r.steps for r in day_records if r.steps]
        activity_values = [r.activity_level for r in day_records if r.activity_level]
        
        summaries.append(HealthSummary(
            date=date_key,
            avg_heart_rate=round(sum(hr_values) / len(hr_values), 1) if hr_values else None,
            avg_hrv=round(sum(hrv_values) / len(hrv_values), 1) if hrv_values else None,
            total_sleep=round(sum(sleep_values), 1) if sleep_values else None,
            avg_sleep_quality=round(sum(quality_values) / len(quality_values), 1) if quality_values else None,
            total_steps=sum(step_values) if step_values else None,
            avg_activity_level=round(sum(activity_values) / len(activity_values), 1) if activity_values else None,
        ))
    
    return summaries
