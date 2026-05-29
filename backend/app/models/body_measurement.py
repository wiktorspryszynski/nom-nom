from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.enums import MetricType

_enum_kw = dict(native_enum=False, create_constraint=False)


class BodyMeasurement(Base):
    """EAV-style table for flexible body metrics.

    metric_type values defined in MetricType enum:
      weight_kg, body_fat_percent, water_percent, muscle_mass_percent, water_glasses
    """
    __tablename__ = "body_measurements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    measured_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    metric_type: Mapped[MetricType] = mapped_column(SAEnum(MetricType, **_enum_kw), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False, default="")
