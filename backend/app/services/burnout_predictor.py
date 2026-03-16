"""Burnout risk prediction engine.

Analyzes 7-day rolling window of physiological metrics to predict burnout.
Key indicators:
- HRV declining trend over multiple days
- Accumulated sleep debt
- Dropping activity levels
"""
from typing import List, Dict, Optional, Tuple
import statistics


def _compute_trend_slope(values: List[float]) -> float:
    """Compute simple linear trend slope (positive = improving, negative = declining)."""
    if len(values) < 2:
        return 0.0
    n = len(values)
    x_mean = (n - 1) / 2
    y_mean = statistics.mean(values)
    numerator = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    if denominator == 0:
        return 0.0
    return numerator / denominator


def _compute_sleep_debt(sleep_durations: List[float], target: float = 7.5) -> float:
    """Compute cumulative sleep debt relative to target hours."""
    total_debt = sum(max(0, target - s) for s in sleep_durations)
    return total_debt


def predict_burnout_risk(
    hrv_history: List[float],
    sleep_history: List[float],
    activity_history: List[int],
    stress_history: List[int],
) -> Tuple[float, Dict[str, float], List[str]]:
    """
    Predict burnout risk from 7-day rolling data.
    
    Args:
        hrv_history: List of daily average HRV values (most recent last)
        sleep_history: List of daily sleep hours
        activity_history: List of daily activity levels (0-100)
        stress_history: List of daily stress scores (0-100)
    
    Returns:
        (burnout_risk, contributing_factors, warnings)
        - burnout_risk: 0.0 to 1.0 probability
        - contributing_factors: dict of factor name → impact score
        - warnings: list of warning messages
    """
    factors = {}
    warnings = []
    risk_score = 0.0
    
    # 1. HRV trend analysis (weight: 35%)
    if hrv_history and len(hrv_history) >= 3:
        hrv_slope = _compute_trend_slope(hrv_history)
        if hrv_slope < -2:
            hrv_risk = min(1.0, abs(hrv_slope) / 10)
            factors["hrv_decline"] = round(hrv_risk, 2)
            risk_score += hrv_risk * 0.35
            warnings.append(f"HRV has been declining over the past {len(hrv_history)} days.")
        else:
            factors["hrv_decline"] = 0.0
    
    # 2. Sleep debt analysis (weight: 30%)
    if sleep_history and len(sleep_history) >= 3:
        sleep_debt = _compute_sleep_debt(sleep_history)
        avg_sleep = statistics.mean(sleep_history)
        sleep_risk = min(1.0, sleep_debt / 15)  # 15 hours debt = max risk
        if avg_sleep < 6:
            sleep_risk = min(1.0, sleep_risk + 0.3)
        factors["sleep_debt"] = round(sleep_risk, 2)
        risk_score += sleep_risk * 0.30
        if sleep_debt > 7:
            warnings.append(f"Significant sleep debt accumulated: {sleep_debt:.1f} hours this week.")
    
    # 3. Activity level drop (weight: 20%)
    if activity_history and len(activity_history) >= 3:
        activity_slope = _compute_trend_slope([float(a) for a in activity_history])
        avg_activity = statistics.mean(activity_history)
        activity_risk = 0.0
        if activity_slope < -3:
            activity_risk = min(1.0, abs(activity_slope) / 15)
        if avg_activity < 30:
            activity_risk = min(1.0, activity_risk + 0.3)
        factors["activity_drop"] = round(activity_risk, 2)
        risk_score += activity_risk * 0.20
        if activity_risk > 0.5:
            warnings.append("Physical activity has been declining. Movement helps combat burnout.")
    
    # 4. Sustained high stress (weight: 15%)
    if stress_history and len(stress_history) >= 3:
        avg_stress = statistics.mean(stress_history)
        high_stress_days = sum(1 for s in stress_history if s > 70)
        stress_risk = 0.0
        if avg_stress > 60:
            stress_risk = min(1.0, (avg_stress - 50) / 40)
        if high_stress_days >= 4:
            stress_risk = min(1.0, stress_risk + 0.3)
        factors["chronic_stress"] = round(stress_risk, 2)
        risk_score += stress_risk * 0.15
        if high_stress_days >= 5:
            warnings.append(f"Stress has been consistently high ({high_stress_days}/{len(stress_history)} days above threshold).")
    
    if not warnings and risk_score < 0.3:
        warnings.append("No significant burnout indicators detected. Keep it up!")
    
    return round(min(1.0, risk_score), 3), factors, warnings
