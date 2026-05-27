from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


class BodyMeasurement(Base):
    """EAV-style table for flexible body metrics.

    metric_type values: 'weight_kg', 'body_fat_percent', 'water_percent',
                        'muscle_mass_percent', 'water_glasses'
    """
    __tablename__ = "body_measurements"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    measured_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    metric_type = Column(String, nullable=False, index=True)
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False, default="")
