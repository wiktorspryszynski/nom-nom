from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


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
    # 'text' | 'photo' | 'manual' | 'usda'
    source_type = Column(String, nullable=False, default="manual")
    ai_confidence = Column(Float, nullable=True)
