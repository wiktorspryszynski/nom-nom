from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text

from app.database import Base


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    days_count = Column(Integer, nullable=False, default=7)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class MealPlanItem(Base):
    __tablename__ = "meal_plan_items"

    id = Column(Integer, primary_key=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id"), nullable=False, index=True)
    day_number = Column(Integer, nullable=False)  # 1-based
    meal_name = Column(String, nullable=False)     # e.g. 'Śniadanie', 'Obiad'
    description = Column(Text, nullable=True)
    kcal = Column(Integer, nullable=True)
    protein = Column(Float, nullable=True)
    fat = Column(Float, nullable=True)
    carbs = Column(Float, nullable=True)
    recipe_text = Column(Text, nullable=True)
