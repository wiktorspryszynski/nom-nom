from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.body_measurement import BodyMeasurement
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()

# Maps metric_type → default unit string
_UNITS: dict[str, str] = {
    "weight_kg": "kg",
    "body_fat_percent": "%",
    "water_percent": "%",
    "muscle_mass_percent": "%",
}


class MeasurementRequest(BaseModel):
    """Dict of metric_type → value pairs.  e.g. {"weight_kg": 75.2, "body_fat_percent": 18.5}"""
    metrics: dict[str, float]
    measured_at: datetime | None = None


@router.get("/")
def get_measurements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all body measurements for the current user, grouped by metric_type."""
    rows = (
        db.query(BodyMeasurement)
        .filter(BodyMeasurement.user_id == current_user.id)
        .order_by(BodyMeasurement.measured_at.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "metric_type": r.metric_type,
            "value": r.value,
            "unit": r.unit,
            "measured_at": r.measured_at.isoformat(),
        }
        for r in rows
    ]


@router.post("/", status_code=201)
def add_measurement(
    body: MeasurementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save one or more body metrics at a given timestamp."""
    if not body.metrics:
        raise HTTPException(status_code=422, detail="No metrics provided")

    measured_at = body.measured_at or datetime.now(timezone.utc).replace(tzinfo=None)
    created = []
    for metric_type, value in body.metrics.items():
        unit = _UNITS.get(metric_type, "")
        row = BodyMeasurement(
            user_id=current_user.id,
            metric_type=metric_type,
            value=value,
            unit=unit,
            measured_at=measured_at,
        )
        db.add(row)
        created.append(metric_type)

    # Also update weight on the User row for quick access
    if "weight_kg" in body.metrics:
        current_user.weight_kg = body.metrics["weight_kg"]

    db.commit()
    return {"ok": True, "saved": created}
