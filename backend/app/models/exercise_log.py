from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ExerciseLog(Base):
    __tablename__ = "exercise_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    activity_type: Mapped[str] = mapped_column(String, nullable=False)
    duration_min: Mapped[int] = mapped_column(Integer, nullable=False)
    kcal_burned: Mapped[int] = mapped_column(Integer, nullable=False)
    met_value: Mapped[float | None] = mapped_column(Float)
