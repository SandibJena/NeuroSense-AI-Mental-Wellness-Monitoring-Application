"""Mood entry API routes."""
from datetime import datetime, timedelta
from typing import List
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.mood_entry import MoodEntry, MoodLevel
from app.models.user import User
from app.schemas.mood_entry import MoodCreate, MoodResponse, MoodTimeline
from app.routers.auth import get_current_user

router = APIRouter(prefix="/mood", tags=["Mood Entries"])


@router.post("/", response_model=MoodResponse, status_code=201)
async def create_mood_entry(
    data: MoodCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record a new mood entry."""
    entry = MoodEntry(
        user_id=current_user.id,
        mood=data.mood,
        notes=data.notes,
    )
    db.add(entry)
    await db.flush()
    return MoodResponse.model_validate(entry)


@router.get("/", response_model=List[MoodResponse])
async def get_mood_entries(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(50, ge=1, le=200),
):
    """Get mood entries for the current user."""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(MoodEntry)
        .where(MoodEntry.user_id == current_user.id)
        .where(MoodEntry.created_at >= since)
        .order_by(MoodEntry.created_at.desc())
        .limit(limit)
    )
    entries = result.scalars().all()
    return [MoodResponse.model_validate(e) for e in entries]


@router.get("/timeline", response_model=MoodTimeline)
async def get_mood_timeline(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
):
    """Get mood timeline with distribution analysis."""
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(MoodEntry)
        .where(MoodEntry.user_id == current_user.id)
        .where(MoodEntry.created_at >= since)
        .order_by(MoodEntry.created_at.asc())
    )
    entries = result.scalars().all()
    
    mood_counts = Counter(e.mood.value for e in entries)
    distribution = {mood.value: mood_counts.get(mood.value, 0) for mood in MoodLevel}
    
    dominant = max(distribution, key=distribution.get) if distribution else MoodLevel.NEUTRAL.value
    
    return MoodTimeline(
        entries=[MoodResponse.model_validate(e) for e in entries],
        mood_distribution=distribution,
        dominant_mood=MoodLevel(dominant),
    )


@router.delete("/{entry_id}", status_code=204)
async def delete_mood_entry(
    entry_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a mood entry."""
    result = await db.execute(
        select(MoodEntry)
        .where(MoodEntry.id == entry_id)
        .where(MoodEntry.user_id == current_user.id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(status_code=404, detail="Mood entry not found")
    await db.delete(entry)
