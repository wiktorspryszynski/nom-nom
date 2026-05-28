from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    logged_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    activity_type = Column(String, nullable=False)
    duration_min = Column(Integer, nullable=False)
    kcal_burned = Column(Integer, nullable=False)
    met_value = Column(Float, nullable=True)
