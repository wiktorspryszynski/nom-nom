from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    days_count: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class MealPlanItem(Base):
    __tablename__ = "meal_plan_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    meal_plan_id: Mapped[int] = mapped_column(Integer, ForeignKey("meal_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    meal_name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    kcal: Mapped[int | None] = mapped_column(Integer)
    protein: Mapped[float | None] = mapped_column(Float)
    fat: Mapped[float | None] = mapped_column(Float)
    carbs: Mapped[float | None] = mapped_column(Float)
    recipe_text: Mapped[str | None] = mapped_column(Text)


class EatenPlanItem(Base):
    __tablename__ = "eaten_plan_items"
    __table_args__ = (UniqueConstraint("plan_item_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_item_id: Mapped[int] = mapped_column(Integer, ForeignKey("meal_plan_items.id", ondelete="CASCADE"), nullable=False)
    food_log_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("food_logs.id", ondelete="SET NULL"))
    eaten_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
