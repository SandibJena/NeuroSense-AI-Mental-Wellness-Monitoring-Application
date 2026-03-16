"""Device management API routes."""
import re
from datetime import datetime
from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.db.database import get_db
from app.models.connected_device import ConnectedDevice
from app.models.user import User
from app.routers.auth import get_current_user


class DeviceConnect(BaseModel):
    """Schema for connecting a device."""
    device_type: str = Field(..., min_length=2, max_length=50, description="Generic device category, e.g. smartwatch, ring, chest_strap")
    device_name: str = Field(None, max_length=100)
    manufacturer: str = Field(None, max_length=100)
    provider: str = Field(None, max_length=100, description="Platform/provider used for syncing data")
    integration_type: str = Field("manual", max_length=30, description="manual, oauth, bluetooth, sdk, api")
    metadata: dict[str, Any] = Field(default_factory=dict)
    oauth_token: str = Field(None, max_length=500)


class DeviceResponse(BaseModel):
    """Schema for device response."""
    id: str
    device_type: str
    device_name: str | None = None
    is_connected: bool = True
    last_synced_at: datetime | None = None
    connected_at: datetime

    class Config:
        from_attributes = True


class DeviceCapabilityResponse(BaseModel):
    """Capability profile for a connected device."""
    device_id: str
    device_type: str
    device_name: str = None
    provider: str = None
    integration_type: str
    available_signals: List[str]
    stress_inputs: List[str]
    confidence_weight: float


class CapabilityProfileResponse(BaseModel):
    """Merged capability profile across all connected devices."""
    connected_devices: List[DeviceCapabilityResponse]
    combined_available_signals: List[str]
    combined_stress_inputs: List[str]
    readiness_score: float
    recommendation: str


SUPPORTED_DEVICES = [
    {"type": "smartwatch", "name": "Apple Watch", "icon": "⌚", "provider": "Apple HealthKit"},
    {"type": "smartwatch", "name": "Samsung Galaxy Watch", "icon": "⌚", "provider": "Samsung Health"},
    {"type": "smartwatch", "name": "Google Pixel Watch", "icon": "⌚", "provider": "Google Health Connect"},
    {"type": "smartwatch", "name": "Fitbit Sense/Versa", "icon": "📱", "provider": "Fitbit API"},
    {"type": "smartwatch", "name": "Garmin Watch", "icon": "🏃", "provider": "Garmin Connect"},
    {"type": "ring", "name": "Oura Ring", "icon": "💍", "provider": "Oura API"},
    {"type": "ring", "name": "Ultrahuman Ring", "icon": "💍", "provider": "Ultrahuman API"},
    {"type": "band", "name": "Whoop", "icon": "📶", "provider": "Whoop API"},
    {"type": "band", "name": "Xiaomi Smart Band", "icon": "📶", "provider": "Xiaomi/Mi Fitness"},
    {"type": "chest_strap", "name": "Polar H10", "icon": "❤️", "provider": "Bluetooth / Polar Flow"},
    {"type": "chest_strap", "name": "Garmin HRM-Pro", "icon": "❤️", "provider": "Bluetooth / Garmin"},
    {"type": "patch", "name": "BioPatch/BioSensor", "icon": "🩹", "provider": "SDK/API"},
    {"type": "other", "name": "Any Other Device", "icon": "🔗", "provider": "Custom Integration"},
]


DEVICE_CAPABILITY_PROFILES = {
    "smartwatch": {
        "signals": ["heart_rate", "hrv", "sleep_duration", "activity_level", "steps", "calories_burned", "spo2"],
        "stress_inputs": ["heart_rate", "hrv", "sleep_duration"],
    },
    "ring": {
        "signals": ["heart_rate", "hrv", "sleep_duration", "sleep_quality", "skin_temperature", "spo2"],
        "stress_inputs": ["heart_rate", "hrv", "sleep_duration"],
    },
    "band": {
        "signals": ["heart_rate", "sleep_duration", "activity_level", "steps", "calories_burned"],
        "stress_inputs": ["heart_rate", "sleep_duration"],
    },
    "chest_strap": {
        "signals": ["heart_rate", "hrv", "breathing_rate"],
        "stress_inputs": ["heart_rate", "hrv", "breathing_rate"],
    },
    "patch": {
        "signals": ["heart_rate", "hrv", "breathing_rate", "skin_temperature"],
        "stress_inputs": ["heart_rate", "hrv", "breathing_rate"],
    },
    "other": {
        "signals": ["heart_rate"],
        "stress_inputs": ["heart_rate"],
    },
}


def _slugify_device_type(device_type: str) -> str:
    """Normalize device type to a stable slug for storage and lookups."""
    normalized = re.sub(r"[^a-z0-9]+", "_", device_type.strip().lower())
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    return normalized[:50] or "other"


def _build_device_name(data: DeviceConnect) -> str:
    """Create a readable device name when one is not provided."""
    if data.device_name:
        return data.device_name
    if data.manufacturer and data.device_type:
        return f"{data.manufacturer} {data.device_type.title()}"
    if data.manufacturer:
        return data.manufacturer
    return data.device_type.replace("_", " ").title()


def _resolve_provider(device: ConnectedDevice) -> str:
    """Infer provider from the starter catalog or fallback to custom integration."""
    by_name = next((d for d in SUPPORTED_DEVICES if d["name"].lower() == (device.device_name or "").lower()), None)
    if by_name:
        return by_name["provider"]
    by_type = next((d for d in SUPPORTED_DEVICES if d["type"] == device.device_type), None)
    if by_type:
        return by_type["provider"]
    return "Custom Integration"


def _resolve_capabilities(device_type: str) -> dict[str, List[str]]:
    """Return capability profile for a normalized device type."""
    return DEVICE_CAPABILITY_PROFILES.get(device_type, DEVICE_CAPABILITY_PROFILES["other"])


router = APIRouter(prefix="/devices", tags=["Device Management"])


@router.get("/supported")
async def get_supported_devices():
    """Get a starter catalog plus universal custom integration guidance."""
    return {
        "mode": "universal",
        "message": "You can connect any stress-monitoring wearable or sensor by using a generic device type.",
        "catalog": SUPPORTED_DEVICES,
        "required_fields": ["device_type"],
        "optional_fields": [
            "device_name",
            "manufacturer",
            "provider",
            "integration_type",
            "metadata",
            "oauth_token",
        ],
    }


@router.post("/connect", response_model=DeviceResponse, status_code=201)
async def connect_device(
    data: DeviceConnect,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Connect a wearable device."""
    normalized_type = _slugify_device_type(data.device_type)
    resolved_name = _build_device_name(data)
    
    # Check if already connected
    result = await db.execute(
        select(ConnectedDevice)
        .where(ConnectedDevice.user_id == current_user.id)
        .where(ConnectedDevice.device_type == normalized_type)
        .where(ConnectedDevice.device_name == resolved_name)
        .where(ConnectedDevice.is_connected == True)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="This device is already connected")
    
    device = ConnectedDevice(
        user_id=current_user.id,
        device_type=normalized_type,
        device_name=resolved_name,
        oauth_token=data.oauth_token,
    )
    db.add(device)
    
    # Update user wearable status
    current_user.wearable_connected = True
    await db.flush()
    
    return DeviceResponse.model_validate(device)


@router.get("/", response_model=List[DeviceResponse])
async def list_devices(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all connected devices."""
    result = await db.execute(
        select(ConnectedDevice)
        .where(ConnectedDevice.user_id == current_user.id)
        .order_by(ConnectedDevice.connected_at.desc())
    )
    devices = result.scalars().all()
    return [DeviceResponse.model_validate(d) for d in devices]


@router.get("/capabilities", response_model=CapabilityProfileResponse)
async def get_device_capabilities(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return connected-device capability profile for adaptive stress analytics."""
    result = await db.execute(
        select(ConnectedDevice)
        .where(ConnectedDevice.user_id == current_user.id)
        .where(ConnectedDevice.is_connected == True)
        .order_by(ConnectedDevice.connected_at.desc())
    )
    devices = result.scalars().all()

    profiles: List[DeviceCapabilityResponse] = []
    combined_signals: set[str] = set()
    combined_inputs: set[str] = set()

    for device in devices:
        cap = _resolve_capabilities(device.device_type)
        signals = cap["signals"]
        stress_inputs = cap["stress_inputs"]
        combined_signals.update(signals)
        combined_inputs.update(stress_inputs)

        confidence_weight = round(min(1.0, len(stress_inputs) / 4), 2)
        integration_type = "oauth" if device.oauth_token else "manual"
        profiles.append(
            DeviceCapabilityResponse(
                device_id=device.id,
                device_type=device.device_type,
                device_name=device.device_name,
                provider=_resolve_provider(device),
                integration_type=integration_type,
                available_signals=signals,
                stress_inputs=stress_inputs,
                confidence_weight=confidence_weight,
            )
        )

    readiness_score = round(min(100.0, (len(combined_inputs) / 4) * 100), 1)
    if readiness_score >= 100:
        recommendation = "Excellent coverage: all core stress inputs are available."
    elif readiness_score >= 75:
        recommendation = "Good coverage: analytics are reliable, but adding breathing data can improve confidence."
    elif readiness_score >= 50:
        recommendation = "Moderate coverage: consider adding an HRV-capable or sleep-capable device."
    elif readiness_score > 0:
        recommendation = "Limited coverage: add more sensors for better stress and burnout analysis."
    else:
        recommendation = "No connected devices. Connect at least one device to enable adaptive analytics."

    return CapabilityProfileResponse(
        connected_devices=profiles,
        combined_available_signals=sorted(combined_signals),
        combined_stress_inputs=sorted(combined_inputs),
        readiness_score=readiness_score,
        recommendation=recommendation,
    )


@router.post("/{device_id}/sync", response_model=DeviceResponse)
async def sync_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger device sync."""
    result = await db.execute(
        select(ConnectedDevice)
        .where(ConnectedDevice.id == device_id)
        .where(ConnectedDevice.user_id == current_user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # In a real implementation, this would trigger the wearable API sync
    device.last_synced_at = datetime.utcnow()
    await db.flush()
    
    return DeviceResponse.model_validate(device)


@router.delete("/{device_id}", status_code=204)
async def disconnect_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect a wearable device."""
    result = await db.execute(
        select(ConnectedDevice)
        .where(ConnectedDevice.id == device_id)
        .where(ConnectedDevice.user_id == current_user.id)
    )
    device = result.scalar_one_or_none()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    
    device.is_connected = False
    
    # Check if any devices still connected
    result = await db.execute(
        select(ConnectedDevice)
        .where(ConnectedDevice.user_id == current_user.id)
        .where(ConnectedDevice.is_connected == True)
        .where(ConnectedDevice.id != device_id)
    )
    remaining = result.scalar_one_or_none()
    if not remaining:
        current_user.wearable_connected = False
    
    await db.flush()
