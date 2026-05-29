from datetime import datetime

from sqlalchemy import DateTime, Enum as SAEnum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.enums import FoodSourceType

_enum_kw = dict(native_enum=False, create_constraint=False)


class FoodLog(Base):
    __tablename__ = "food_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    description: Mapped[str] = mapped_column(String, nullable=False)
    kcal: Mapped[int] = mapped_column(Integer, nullable=False)
    protein: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    fat: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    carbs: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    source_type: Mapped[FoodSourceType] = mapped_column(SAEnum(FoodSourceType, **_enum_kw), nullable=False, default=FoodSourceType.manual)
    ai_confidence: Mapped[float | None] = mapped_column(Float)
