from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.body_measurement import BodyMeasurement
from app.models.exercise_log import ExerciseLog
from app.models.food_log import FoodLog
from app.models.meal_plan import MealPlan, MealPlanItem
from app.models.saved_item import SavedItem
from app.models.user import User
from app.schemas.auth import Token

DEMO_EMAIL = "demo@nomnom.app"

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def get_password_hash(plain: str) -> str:
    return pwd_context.hash(plain)


def create_access_token(data: dict[str, Any]) -> str:
    expire = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({**data, "exp": expire}, settings.secret_key, algorithm=settings.algorithm)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        sub: str | None = payload.get("sub")
        if sub is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = db.query(User).filter(User.email == sub).first()
    if user is None:
        raise credentials_exc
    return user


@router.post("/token", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form.username).first()
    # GitHub-only users have no password — block password login for them
    if not user or user.hashed_password is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    if not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect credentials")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return _serialize_profile(current_user)


@router.put("/me")
def update_me(
    body: dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = {
        "name", "tdee_kcal", "calorie_target", "weight_target",
        "goal_type", "protein_target", "height_cm", "weight_kg",
        "birth_date", "language",
    }
    for key, value in body.items():
        if key in allowed:
            setattr(current_user, key, value)
    db.commit()
    return {"ok": True}


def _serialize_profile(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "tdee_kcal": user.tdee_kcal,
        "calorie_target": user.calorie_target,
        "weight_target": user.weight_target,
        "goal_type": user.goal_type,
        "protein_target": user.protein_target,
        "sex": user.sex,
        "height_cm": user.height_cm,
        "weight_kg": user.weight_kg,
        "birth_date": user.birth_date,
        "language": user.language,
        "account_type": user.account_type,
        "demo_ai_calls_used": user.demo_ai_calls_used,
    }


@router.get("/export")
def export_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Export all user data as JSON (GDPR data portability)."""
    food_logs = (
        db.query(FoodLog)
        .filter(FoodLog.user_id == current_user.id)
        .order_by(FoodLog.logged_at.desc())
        .all()
    )
    exercise_logs = (
        db.query(ExerciseLog)
        .filter(ExerciseLog.user_id == current_user.id)
        .order_by(ExerciseLog.logged_at.desc())
        .all()
    )
    measurements = (
        db.query(BodyMeasurement)
        .filter(BodyMeasurement.user_id == current_user.id)
        .order_by(BodyMeasurement.measured_at.desc())
        .all()
    )
    plans = db.query(MealPlan).filter(MealPlan.user_id == current_user.id).all()
    plan_ids = [p.id for p in plans]
    plan_items = (
        db.query(MealPlanItem)
        .filter(MealPlanItem.meal_plan_id.in_(plan_ids))
        .all()
        if plan_ids
        else []
    )
    items_by_plan: dict[int, list[dict[str, Any]]] = {}
    for item in plan_items:
        items_by_plan.setdefault(item.meal_plan_id, []).append({
            "day_number": item.day_number,
            "meal_name": item.meal_name,
            "description": item.description,
            "kcal": item.kcal,
            "protein": item.protein,
            "fat": item.fat,
            "carbs": item.carbs,
        })
    saved_items = db.query(SavedItem).filter(SavedItem.user_id == current_user.id).all()

    return {
        "exported_at": datetime.now(timezone.utc).replace(tzinfo=None).isoformat(),
        "profile": _serialize_profile(current_user),
        "food_logs": [
            {
                "description": f.description,
                "kcal": f.kcal,
                "protein": f.protein,
                "fat": f.fat,
                "carbs": f.carbs,
                "logged_at": f.logged_at.isoformat(),
                "source_type": f.source_type,
                "ai_confidence": f.ai_confidence,
            }
            for f in food_logs
        ],
        "exercise_logs": [
            {
                "activity_type": e.activity_type,
                "duration_min": e.duration_min,
                "kcal_burned": e.kcal_burned,
                "logged_at": e.logged_at.isoformat(),
            }
            for e in exercise_logs
        ],
        "measurements": [
            {
                "metric_type": m.metric_type,
                "value": m.value,
                "unit": m.unit,
                "measured_at": m.measured_at.isoformat(),
            }
            for m in measurements
        ],
        "meal_plans": [
            {
                "start_date": p.start_date.isoformat(),
                "days_count": p.days_count,
                "created_at": p.created_at.isoformat(),
                "items": items_by_plan.get(p.id, []),
            }
            for p in plans
        ],
        "saved_items": [
            {
                "name": s.name,
                "item_type": s.item_type,
                "kcal": s.kcal,
                "protein": s.protein,
                "fat": s.fat,
                "carbs": s.carbs,
                "duration_min": s.duration_min,
            }
            for s in saved_items
        ],
    }


@router.delete("/me")
def delete_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permanently delete the account and all associated data."""
    if current_user.email == DEMO_EMAIL:
        raise HTTPException(status_code=403, detail="DEMO_ACCOUNT_PROTECTED")
    db.delete(current_user)
    db.commit()
    return {"ok": True}
