import json
from datetime import date

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.meal_plan import MealPlan, MealPlanItem
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()

_GENERATE_PROMPT = """\
You are a meal planner. Generate a {days}-day meal plan for one person.
User profile: goal={goal_type}, calorie_target={calorie_target} kcal/day, protein_target={protein_target}g/day.
Dietary notes: {preferences}

Return ONLY a raw JSON array (no markdown, no code fences). Each element:
{{
  "day": <1-based integer>,
  "meal_name": "<meal type in Polish: Śniadanie|Drugie śniadanie|Obiad|Kolacja>",
  "description": "<one Polish sentence>",
  "kcal": <integer>,
  "protein": <float>,
  "fat": <float>,
  "carbs": <float>
}}

Produce {meals_per_day} meals per day × {days} days = {total} items total.
Calories per day should sum close to {calorie_target} kcal.
"""


class GenerateRequest(BaseModel):
    days: int = 7
    meals_per_day: int = 3
    preferences: str = ""
    start_date: date | None = None


@router.get("/plans")
def list_plans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plans = (
        db.query(MealPlan)
        .filter(MealPlan.user_id == current_user.id)
        .order_by(MealPlan.created_at.desc())
        .limit(10)
        .all()
    )
    result = []
    for plan in plans:
        items = db.query(MealPlanItem).filter(MealPlanItem.meal_plan_id == plan.id).all()
        result.append({
            "id": plan.id,
            "start_date": plan.start_date.isoformat(),
            "days_count": plan.days_count,
            "created_at": plan.created_at.isoformat(),
            "items": [
                {
                    "id": i.id,
                    "day_number": i.day_number,
                    "meal_name": i.meal_name,
                    "description": i.description,
                    "kcal": i.kcal,
                    "protein": i.protein,
                    "fat": i.fat,
                    "carbs": i.carbs,
                }
                for i in items
            ],
        })
    return result


@router.post("/generate")
def generate_plan(
    body: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="AI_UNAVAILABLE")

    prompt = _GENERATE_PROMPT.format(
        days=body.days,
        meals_per_day=body.meals_per_day,
        total=body.days * body.meals_per_day,
        goal_type=current_user.goal_type or "maintain",
        calorie_target=current_user.calorie_target or 2000,
        protein_target=current_user.protein_target or 120,
        preferences=body.preferences or "none",
    )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
    except anthropic.APIStatusError as e:
        if e.status_code == 402:
            raise HTTPException(status_code=503, detail="AI_UNAVAILABLE")
        raise

    try:
        items_data = json.loads(message.content[0].text)
    except (json.JSONDecodeError, IndexError):
        raise HTTPException(status_code=422, detail="AI response could not be parsed")

    if not isinstance(items_data, list):
        raise HTTPException(status_code=422, detail="Unexpected AI response format")

    start = body.start_date or date.today()
    plan = MealPlan(
        user_id=current_user.id,
        start_date=start,
        days_count=body.days,
    )
    db.add(plan)
    db.flush()  # get plan.id without full commit

    for item in items_data:
        db.add(MealPlanItem(
            meal_plan_id=plan.id,
            day_number=item.get("day", 1),
            meal_name=item.get("meal_name", ""),
            description=item.get("description"),
            kcal=item.get("kcal"),
            protein=item.get("protein"),
            fat=item.get("fat"),
            carbs=item.get("carbs"),
        ))

    db.commit()
    db.refresh(plan)

    all_items = db.query(MealPlanItem).filter(MealPlanItem.meal_plan_id == plan.id).all()
    return {
        "id": plan.id,
        "start_date": plan.start_date.isoformat(),
        "days_count": plan.days_count,
        "items": [
            {
                "id": i.id,
                "day_number": i.day_number,
                "meal_name": i.meal_name,
                "description": i.description,
                "kcal": i.kcal,
                "protein": i.protein,
                "fat": i.fat,
                "carbs": i.carbs,
            }
            for i in all_items
        ],
    }
