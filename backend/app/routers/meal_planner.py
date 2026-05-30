import json
from datetime import date
from typing import Any

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.meal_plan import MealPlan, MealPlanItem
from app.models.user import User
from app.routers.auth import get_current_user
from app.routers.tracker import _check_ai_quota

router = APIRouter()

# ---------------------------------------------------------------------------
# Static system prompt — cached on first call, 10% cost on subsequent hits
# ---------------------------------------------------------------------------

_PLAN_SYSTEM_PROMPT = """\
You are a professional meal planner. Generate a structured weekly meal plan.

Return ONLY a raw JSON array (no markdown, no code fences, no explanation). Each element:
{
  "day": <1-based integer>,
  "meal_name": "<meal type in Polish: Śniadanie|Drugie śniadanie|Obiad|Kolacja>",
  "description": "<one Polish sentence describing the dish>",
  "kcal": <integer>,
  "protein": <float grams>,
  "fat": <float grams>,
  "carbs": <float grams>
}

Rules:
- Calories per day must sum close to the user's calorie target.
- Protein per day must sum close to the user's protein target.
- Vary cuisine styles across days.
- Keep descriptions concrete (name the dish, e.g. "Owsianka z bananem i miodem").
- Do not add any text outside the JSON array.
"""

# Typed as list[Any] so Pylance accepts cache_control (not in TextBlockParam TypedDict)
_PLAN_SYSTEM: list[Any] = [{"type": "text", "text": _PLAN_SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}]


class AddItemRequest(BaseModel):
    day_number: int
    meal_name: str
    description: str | None = None
    kcal: int | None = None
    protein: float | None = None
    fat: float | None = None
    carbs: float | None = None


class GenerateRequest(BaseModel):
    days: int = 7
    meals_per_day: int = 3
    preferences: str = ""
    start_date: date | None = None


class CreatePlanRequest(BaseModel):
    start_date: date | None = None
    days_count: int = 7


@router.post("/plans")
def create_plan(
    body: CreatePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start = body.start_date or date.today()
    plan = MealPlan(
        user_id=current_user.id,
        start_date=start,
        days_count=body.days_count,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {
        "id": plan.id,
        "start_date": plan.start_date.isoformat(),
        "days_count": plan.days_count,
        "created_at": plan.created_at.isoformat(),
        "items": [],
    }


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


def _serialize_item(i: MealPlanItem) -> dict:
    return {
        "id": i.id,
        "day_number": i.day_number,
        "meal_name": i.meal_name,
        "description": i.description,
        "kcal": i.kcal,
        "protein": i.protein,
        "fat": i.fat,
        "carbs": i.carbs,
    }


@router.delete("/items/{item_id}")
def delete_plan_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = (
        db.query(MealPlanItem)
        .join(MealPlan, MealPlanItem.meal_plan_id == MealPlan.id)
        .filter(MealPlanItem.id == item_id, MealPlan.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}


@router.post("/plans/{plan_id}/items")
def add_plan_item(
    plan_id: int,
    body: AddItemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(MealPlan).filter(MealPlan.id == plan_id, MealPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    item = MealPlanItem(
        meal_plan_id=plan_id,
        day_number=body.day_number,
        meal_name=body.meal_name,
        description=body.description,
        kcal=body.kcal,
        protein=body.protein,
        fat=body.fat,
        carbs=body.carbs,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize_item(item)


@router.post("/generate")
def generate_plan(
    body: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="AI_UNAVAILABLE")

    _check_ai_quota(current_user, db)

    # Dynamic part — only user-specific values go here (not cached)
    user_message = (
        f"Goal: {current_user.goal_type or 'maintain'}. "
        f"Calories: {current_user.calorie_target or 2000} kcal/day. "
        f"Protein: {current_user.protein_target or 120}g/day. "
        f"Days: {body.days}. "
        f"Meals per day: {body.meals_per_day}. "
        f"Total items: {body.days * body.meals_per_day}. "
        f"Dietary preferences: {body.preferences or 'none'}. "
        "Generate the meal plan now."
    )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=_PLAN_SYSTEM,
            messages=[{"role": "user", "content": user_message}],
        )
    except anthropic.APIStatusError as e:
        if e.status_code == 402:
            raise HTTPException(status_code=503, detail="AI_UNAVAILABLE")
        raise

    try:
        block = message.content[0]
        items_data = json.loads(block.text)  # type: ignore[union-attr]
    except (json.JSONDecodeError, IndexError, AttributeError):
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
