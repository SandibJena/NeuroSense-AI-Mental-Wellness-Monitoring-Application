"""Seed script to populate the database with demo data for development."""
import asyncio
import random
from datetime import datetime, timedelta

from app.db.database import async_session, init_db
from app.models.user import User
from app.models.health_data import HealthData
from app.models.stress_analysis import StressAnalysis
from app.models.mood_entry import MoodEntry, MoodLevel
from app.models.connected_device import ConnectedDevice
from app.services.auth_service import hash_password
from app.services.stress_engine import compute_stress_score, generate_recommendations
from app.services.recovery_scorer import compute_recovery_score
from app.services.burnout_predictor import predict_burnout_risk


async def seed():
    """Populate database with demo data."""
    await init_db()
    
    async with async_session() as db:
        # Create demo user
        user = User(
            email="demo@neurosense.app",
            password_hash=hash_password("demo1234"),
            display_name="Alex Demo",
            wearable_connected=True,
            timezone="Asia/Kolkata",
        )
        db.add(user)
        await db.flush()
        print(f"✅ Created demo user: {user.email} (password: demo1234)")
        
        # Connect a device
        device = ConnectedDevice(
            user_id=user.id,
            device_type="apple_watch",
            device_name="Apple Watch Series 9",
            is_connected=True,
            last_synced_at=datetime.utcnow(),
        )
        db.add(device)
        
        # Generate 14 days of health data
        now = datetime.utcnow()
        health_records = []
        stress_records = []
        
        for day_offset in range(14, 0, -1):
            ts = now - timedelta(days=day_offset)
            
            # Simulate varying physiological data
            hrv = random.uniform(35, 85)
            hr = random.randint(58, 95)
            sleep = random.uniform(4.5, 9.0)
            sleep_q = random.uniform(40, 95)
            breath = random.uniform(12, 22)
            activity = random.randint(20, 90)
            steps = random.randint(3000, 15000)
            
            record = HealthData(
                user_id=user.id,
                heart_rate=hr,
                hrv=round(hrv, 1),
                sleep_duration=round(sleep, 1),
                sleep_quality=round(sleep_q, 1),
                breathing_rate=round(breath, 1),
                activity_level=activity,
                steps=steps,
                calories_burned=round(random.uniform(150, 600), 1),
                spo2=round(random.uniform(95, 99), 1),
                source_device="apple_watch",
                timestamp=ts,
            )
            db.add(record)
            health_records.append(record)
            
            # Generate stress analysis for each day
            stress_score, confidence, factors = compute_stress_score(
                hrv=hrv, sleep_duration=sleep, heart_rate=hr, breathing_rate=breath
            )
            recovery, _ = compute_recovery_score(
                hrv=hrv, sleep_duration=sleep, sleep_quality=sleep_q, resting_hr=hr
            )
            
            analysis = StressAnalysis(
                user_id=user.id,
                stress_score=stress_score,
                burnout_risk=round(random.uniform(0.05, 0.65), 3),
                recovery_score=recovery,
                confidence=confidence,
                contributing_factors=factors,
                recommendations=generate_recommendations(stress_score, factors),
                generated_at=ts,
            )
            db.add(analysis)
            stress_records.append(analysis)
        
        print(f"✅ Generated {len(health_records)} health data records (14 days)")
        print(f"✅ Generated {len(stress_records)} stress analyses (14 days)")
        
        # Generate mood entries
        moods = list(MoodLevel)
        mood_notes = [
            "Feeling great today after a good workout!",
            "A bit tired but managing well.",
            "Work deadlines are stressful.",
            "Had a relaxing evening with family.",
            "Couldn't sleep well, feeling groggy.",
            "Meditation session helped a lot.",
            "Feeling anxious about the presentation.",
            None,
            "Good day overall, productive at work.",
            "Feeling low energy, need more rest.",
        ]
        
        for day_offset in range(10, 0, -1):
            ts = now - timedelta(days=day_offset, hours=random.randint(8, 20))
            entry = MoodEntry(
                user_id=user.id,
                mood=random.choice(moods),
                notes=random.choice(mood_notes),
                created_at=ts,
            )
            db.add(entry)
        
        print("✅ Generated 10 mood entries")
        
        await db.commit()
        print("\n🎉 Database seeded successfully!")
        print(f"   Login: demo@neurosense.app / demo1234")


if __name__ == "__main__":
    asyncio.run(seed())
