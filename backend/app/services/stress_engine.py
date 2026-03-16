"""Stress score computation engine.

Calculates stress score (0-100) from physiological signals using a weighted algorithm.
Weights: HRV (40%), Sleep (25%), Heart Rate (20%), Breathing Rate (15%)
"""
from typing import Optional, Dict, List, Tuple


# Baseline ranges for healthy adults
HEALTHY_HRV_RANGE = (40, 100)        # ms
HEALTHY_HR_RANGE = (60, 80)           # bpm (resting)
HEALTHY_SLEEP_RANGE = (7, 9)          # hours
HEALTHY_BREATHING_RANGE = (12, 18)    # breaths/min

# Weights for stress calculation
WEIGHTS = {
    "hrv": 0.40,
    "sleep": 0.25,
    "heart_rate": 0.20,
    "breathing_rate": 0.15,
}


def _normalize_hrv_stress(hrv: float) -> float:
    """Convert HRV to stress component (0-100). Low HRV = high stress."""
    if hrv >= 80:
        return max(0, 100 - hrv)  # Very low stress
    elif hrv >= 50:
        return 100 - hrv  # Moderate range
    elif hrv >= 30:
        return 70 + (50 - hrv) * 0.5  # Elevated stress
    else:
        return min(100, 90 + (30 - hrv))  # High stress


def _normalize_sleep_stress(sleep_hours: float) -> float:
    """Convert sleep duration to stress component. Short sleep = high stress."""
    if 7 <= sleep_hours <= 9:
        return 10  # Optimal range
    elif 6 <= sleep_hours < 7:
        return 35
    elif 5 <= sleep_hours < 6:
        return 55
    elif sleep_hours < 5:
        return 80 + min(20, (5 - sleep_hours) * 10)
    elif sleep_hours > 9:
        return 25  # Oversleeping (mild stress indicator)
    return 50


def _normalize_hr_stress(heart_rate: int) -> float:
    """Convert resting heart rate to stress component. Elevated HR = stress."""
    if heart_rate <= 65:
        return 10  # Very calm
    elif heart_rate <= 75:
        return 25
    elif heart_rate <= 85:
        return 45
    elif heart_rate <= 95:
        return 65
    else:
        return min(100, 70 + (heart_rate - 95))


def _normalize_breathing_stress(breathing_rate: float) -> float:
    """Convert breathing rate to stress component. Rapid = stress."""
    if 12 <= breathing_rate <= 18:
        return 15  # Normal range
    elif breathing_rate < 12:
        return 20  # Slow (usually relaxed)
    elif breathing_rate <= 22:
        return 40 + (breathing_rate - 18) * 5
    else:
        return min(100, 60 + (breathing_rate - 22) * 5)


def compute_stress_score(
    hrv: Optional[float] = None,
    sleep_duration: Optional[float] = None,
    heart_rate: Optional[int] = None,
    breathing_rate: Optional[float] = None,
) -> Tuple[int, float, Dict[str, float]]:
    """
    Compute overall stress score from physiological inputs.
    
    Returns:
        (stress_score, confidence, contributing_factors)
        - stress_score: 0-100 integer
        - confidence: 0-1 float based on data completeness
        - contributing_factors: dict mapping signal name to its stress contribution
    """
    factors = {}
    available_weight = 0.0
    weighted_score = 0.0
    
    if hrv is not None:
        hrv_stress = _normalize_hrv_stress(hrv)
        factors["hrv"] = round(hrv_stress, 1)
        weighted_score += hrv_stress * WEIGHTS["hrv"]
        available_weight += WEIGHTS["hrv"]
    
    if sleep_duration is not None:
        sleep_stress = _normalize_sleep_stress(sleep_duration)
        factors["sleep"] = round(sleep_stress, 1)
        weighted_score += sleep_stress * WEIGHTS["sleep"]
        available_weight += WEIGHTS["sleep"]
    
    if heart_rate is not None:
        hr_stress = _normalize_hr_stress(heart_rate)
        factors["heart_rate"] = round(hr_stress, 1)
        weighted_score += hr_stress * WEIGHTS["heart_rate"]
        available_weight += WEIGHTS["heart_rate"]
    
    if breathing_rate is not None:
        br_stress = _normalize_breathing_stress(breathing_rate)
        factors["breathing_rate"] = round(br_stress, 1)
        weighted_score += br_stress * WEIGHTS["breathing_rate"]
        available_weight += WEIGHTS["breathing_rate"]
    
    # Normalize by available weight
    if available_weight > 0:
        score = weighted_score / available_weight
    else:
        score = 50  # No data → neutral
    
    confidence = available_weight  # 0-1 based on data completeness
    
    return int(round(score)), round(confidence, 2), factors


def generate_recommendations(stress_score: int, factors: Dict[str, float]) -> List[str]:
    """Generate personalized recommendations based on stress analysis."""
    recommendations = []
    
    if stress_score >= 70:
        recommendations.append("Your stress level is elevated. Consider taking a break and practicing deep breathing.")
    
    if factors.get("hrv", 0) >= 60:
        recommendations.append("Your HRV is low, indicating physiological stress. Try meditation or yoga.")
    
    if factors.get("sleep", 0) >= 50:
        recommendations.append("Your sleep was insufficient. Aim for 7-9 hours tonight.")
    
    if factors.get("heart_rate", 0) >= 50:
        recommendations.append("Your resting heart rate is elevated. Consider light exercise or relaxation.")
    
    if factors.get("breathing_rate", 0) >= 40:
        recommendations.append("Your breathing rate is elevated. Try box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s.")
    
    if stress_score < 30:
        recommendations.append("Great job! Your stress levels are low. Keep up your healthy routine.")
    
    if not recommendations:
        recommendations.append("Your stress levels are moderate. Stay mindful of your body's signals.")
    
    return recommendations
