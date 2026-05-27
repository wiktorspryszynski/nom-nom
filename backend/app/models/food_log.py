from datetime import datetime

from sqlalchemy import Column, DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String

from app.database import Base
from app.enums import FoodSourceType

_enum_kw = dict(native_enum=False, create_constraint=False)


class FoodLog(Base):
    __tablename__ = "food_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    logged_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    description = Column(String, nullable=False)
    kcal = Column(Integer, nullable=False)
    protein = Column(Float, nullable=False, default=0.0)
    fat = Column(Float, nullable=False, default=0.0)
    carbs = Column(Float, nullable=False, default=0.0)
    source_type = Column(SAEnum(FoodSourceType, **_enum_kw), nullable=False, default=FoodSourceType.manual)
    ai_confidence = Column(Float, nullable=True)
