"""Recovery score computation engine.

Estimates body's recovery from stress using sleep quality and HRV patterns.
Score ranges from 0 (poor recovery) to 100 (excellent recovery).
"""
from typing import Optional, Tuple, Dict


def compute_recovery_score(
    hrv: Optional[float] = None,
    sleep_duration: Optional[float] = None,
    sleep_quality: Optional[float] = None,
    resting_hr: Optional[int] = None,
    previous_stress_score: Optional[int] = None,
) -> Tuple[int, Dict[str, float]]:
    """
    Compute recovery score from physiological signals.
    
    Recovery indicators:
    - High HRV → good parasympathetic recovery (weight: 35%)
    - Good sleep quality + duration → body restoration (weight: 35%)
    - Low resting HR → cardiovascular recovery (weight: 15%)
    - Previous stress level → recovery context (weight: 15%)
    
    Returns:
        (recovery_score, contributing_factors)
    """
    factors = {}
    total_weight = 0.0
    weighted_score = 0.0
    
    # HRV recovery component
    if hrv is not None:
        if hrv >= 70:
            hrv_recovery = 85 + min(15, (hrv - 70) * 0.5)
        elif hrv >= 50:
            hrv_recovery = 55 + (hrv - 50) * 1.5
        elif hrv >= 30:
            hrv_recovery = 25 + (hrv - 30) * 1.5
        else:
            hrv_recovery = max(5, hrv)
        
        factors["hrv"] = round(hrv_recovery, 1)
        weighted_score += hrv_recovery * 0.35
        total_weight += 0.35
    
    # Sleep recovery component
    sleep_score = 0.0
    if sleep_duration is not None:
        if 7 <= sleep_duration <= 9:
            duration_score = 90
        elif 6 <= sleep_duration < 7:
            duration_score = 65
        elif sleep_duration < 6:
            duration_score = max(10, sleep_duration * 10)
        else:
            duration_score = 75  # Oversleeping
        sleep_score = duration_score
    
    if sleep_quality is not None:
        sleep_score = (sleep_score + sleep_quality) / 2 if sleep_score > 0 else sleep_quality
    
    if sleep_score > 0:
        factors["sleep"] = round(sleep_score, 1)
        weighted_score += sleep_score * 0.35
        total_weight += 0.35
    
    # Resting HR recovery component
    if resting_hr is not None:
        if resting_hr <= 60:
            hr_recovery = 90
        elif resting_hr <= 70:
            hr_recovery = 75
        elif resting_hr <= 80:
            hr_recovery = 55
        else:
            hr_recovery = max(10, 100 - resting_hr)
        
        factors["resting_hr"] = round(hr_recovery, 1)
        weighted_score += hr_recovery * 0.15
        total_weight += 0.15
    
    # Previous stress context
    if previous_stress_score is not None:
        # If previous stress was high and current signals are good → strong recovery
        stress_context = max(0, 100 - previous_stress_score)
        factors["stress_context"] = round(stress_context, 1)
        weighted_score += stress_context * 0.15
        total_weight += 0.15
    
    if total_weight > 0:
        score = weighted_score / total_weight
    else:
        score = 50  # No data → neutral
    
    return int(round(min(100, max(0, score)))), factors
