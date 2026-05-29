import base64
import json
from collections import defaultdict
from datetime import date, datetime, timezone
from typing import Any

import anthropic
import httpx
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.food_log import FoodLog
from app.models.exercise_log import ExerciseLog
from app.models.body_measurement import BodyMeasurement
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TextLogRequest(BaseModel):
    text: str


class SaveLogRequest(BaseModel):
    description: str
    kcal: int
    protein: float = 0.0
    fat: float = 0.0
    carbs: float = 0.0
    source_type: str = "manual"
    ai_confidence: float | None = None
    # If set, treated as exercise entry
    activity_type: str | None = None
    duration_min: int | None = None
    kcal_burned: int | None = None


# ---------------------------------------------------------------------------
# Prompts (static — perfect candidates for prompt caching)
# ---------------------------------------------------------------------------

_VISION_PROMPT = (
    "Analyze this food photo. Return ONLY a raw JSON object (no markdown, no code fences) with:\n"
    '{"name":"short Polish name (max 4 words)","description":"one Polish sentence describing the dish",'
    '"kcal":integer,"protein":float,"fat":float,"carbs":float,"confidence":float 0-1}\n\n'
    "Estimate a realistic single serving. If this is not a food photo return:\n"
    '{"error":"Nie rozpoznano jedzenia na zdjęciu"}'
)

_ALLOWED_MEDIA_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}


def _build_text_system(language: str) -> list[Any]:
    """Build a cached text-parsing system prompt for the given language."""
    lang_note = "Polish" if language == "pl" else "English"
    prompt = (
        f"You are a nutrition assistant. The user's language is {lang_note}.\n"
        "Analyze the food or exercise description and return ONLY a raw JSON object "
        "(no markdown, no code fences) with these exact keys:\n"
        '{"name":"short name in user\'s language (max 5 words)",'
        '"description":"one sentence in user\'s language",'
        '"kcal":integer,"protein":float,"fat":float,"carbs":float,'
        '"confidence":float 0-1,"is_exercise":boolean}\n\n'
        "Estimate for a single typical serving unless an explicit quantity is stated. "
        "For Polish inputs use Central-European portion sizes.\n\n"
        "Examples:\n"
        'bułka z pastą jajeczną -> {"name":"bułka z pastą jajeczną","kcal":310,"protein":12,"fat":14,"carbs":32,"confidence":0.85,"is_exercise":false}\n'
        '2 jajka sadzone -> {"name":"2 jajka sadzone","kcal":180,"protein":12,"fat":14,"carbs":1,"confidence":0.95,"is_exercise":false}\n'
        'schabowy z ziemniakami -> {"name":"schabowy z ziemniakami","kcal":720,"protein":42,"fat":32,"carbs":58,"confidence":0.8,"is_exercise":false}\n'
        '30 min bieganie -> {"name":"bieganie 30 min","kcal":280,"protein":0,"fat":0,"carbs":0,"confidence":0.9,"is_exercise":true}\n\n'
        "For exercise: set protein/fat/carbs to 0, kcal = calories burned (positive number).\n"
        'If unparseable: {"error":"Nie rozpoznano posiłku ani aktywności"}'
    )
    return [{"type": "text", "text": prompt, "cache_control": {"type": "ephemeral"}}]


# ---------------------------------------------------------------------------
# AI call quota guards
# ---------------------------------------------------------------------------

_daily_ai_calls: dict[tuple[int, date], int] = defaultdict(int)


def _check_and_increment_ai_quota(user_id: int) -> None:
    """Raise 429 if a full user has exceeded their daily AI call quota."""
    key = (user_id, date.today())
    _daily_ai_calls[key] += 1
    if _daily_ai_calls[key] > settings.ai_calls_per_user_per_day:
        raise HTTPException(status_code=429, detail="AI_QUOTA_EXCEEDED")


def _check_demo_quota(user: User, db: Session) -> None:
    """Raise 429 if a demo user has used their lifetime AI call allowance."""
    if user.account_type != "demo":
        return
    if user.demo_ai_calls_used >= settings.demo_ai_call_limit:
        raise HTTPException(status_code=429, detail="DEMO_QUOTA_EXCEEDED")
    user.demo_ai_calls_used = user.demo_ai_calls_used + 1
    db.commit()


def _check_ai_quota(user: User, db: Session) -> None:
    """Unified quota check: demo users use the persistent lifetime cap;
    full users use the in-memory daily cap."""
    if user.account_type == "demo":
        _check_demo_quota(user, db)
    else:
        _check_and_increment_ai_quota(user.id)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _today_start_utc() -> datetime:
    today = date.today()
    return datetime(today.year, today.month, today.day, tzinfo=timezone.utc).replace(tzinfo=None)


def _call_claude_haiku(entry_text: str, language: str = "pl") -> dict:
    """Call Claude Haiku with a language-aware cached system prompt."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    system = _build_text_system(language)
    try:
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=system,
            messages=[{"role": "user", "content": entry_text}],
        )
    except anthropic.APIStatusError as e:
        if e.status_code == 402:
            raise HTTPException(status_code=503, detail="AI_UNAVAILABLE")
        raise
    try:
        block = message.content[0]
        return json.loads(block.text)  # type: ignore[union-attr]
    except (json.JSONDecodeError, IndexError, AttributeError):
        raise HTTPException(status_code=422, detail="Nie udało się przetworzyć odpowiedzi AI")


def _call_claude_sonnet_vision(b64: str, media_type: str) -> dict:
    """Call Claude Sonnet Vision with cached text prompt. Raises HTTPException 503 if credits exhausted."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    vision_messages: list[Any] = [{
        "role": "user",
        "content": [
            {"type": "text", "text": _VISION_PROMPT, "cache_control": {"type": "ephemeral"}},
            {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
        ],
    }]
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=vision_messages,
        )
    except anthropic.APIStatusError as e:
        if e.status_code == 402:
            raise HTTPException(status_code=503, detail="AI_UNAVAILABLE")
        raise
    try:
        block = message.content[0]
        return json.loads(block.text)  # type: ignore[union-attr]
    except (json.JSONDecodeError, IndexError, AttributeError):
        raise HTTPException(status_code=422, detail="Nie udało się przetworzyć odpowiedzi AI")


async def _try_usda_first(text: str) -> dict | None:
    """Return nutrition dict if USDA finds a confident match for a short query, else None."""
    if not settings.usda_api_key:
        return None
    # Only attempt for short queries (≤4 words) — likely raw/simple foods
    words = text.strip().split()
    if len(words) > 4:
        return None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(
                "https://api.nal.usda.gov/fdc/v1/foods/search",
                params={
                    "query": text,
                    "api_key": settings.usda_api_key,
                    "pageSize": 1,
                    "dataType": "Survey (FNDDS),SR Legacy",
                },
            )
        if r.status_code != 200:
            return None
        foods = r.json().get("foods", [])
        if not foods:
            return None
        top = foods[0]
        # Confidence check: at least one query word appears in the result name
        description = top.get("description", "").lower()
        if not any(w.lower() in description for w in words):
            return None
        nutrients = {n["nutrientName"]: n["value"] for n in top.get("foodNutrients", [])}
        return {
            "name": top["description"][:40],
            "description": f"Dane z bazy USDA ({top['description'][:30]})",
            "kcal": int(nutrients.get("Energy", 0)),
            "protein": round(nutrients.get("Protein", 0), 1),
            "fat": round(nutrients.get("Total lipid (fat)", 0), 1),
            "carbs": round(nutrients.get("Carbohydrate, by difference", 0), 1),
            "confidence": 0.85,
            "is_exercise": False,
            "source": "usda",
        }
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/daily")
def get_daily(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate stats for today."""
    start = _today_start_utc()

    food_logs = (
        db.query(FoodLog)
        .filter(FoodLog.user_id == current_user.id, FoodLog.logged_at >= start)
        .order_by(FoodLog.logged_at.desc())
        .all()
    )
    exercise_logs = (
        db.query(ExerciseLog)
        .filter(ExerciseLog.user_id == current_user.id, ExerciseLog.logged_at >= start)
        .order_by(ExerciseLog.logged_at.desc())
        .all()
    )

    # Water glasses for today
    water_row = (
        db.query(BodyMeasurement)
        .filter(
            BodyMeasurement.user_id == current_user.id,
            BodyMeasurement.metric_type == "water_glasses",
            BodyMeasurement.measured_at >= start,
        )
        .order_by(BodyMeasurement.measured_at.desc())
        .first()
    )

    kcal_consumed = sum(f.kcal for f in food_logs)
    kcal_burned = sum(e.kcal_burned for e in exercise_logs)

    macros = {
        "protein": {"eaten": round(sum(f.protein for f in food_logs), 1), "goal": current_user.protein_target or 120},
        "fat": {"eaten": round(sum(f.fat for f in food_logs), 1), "goal": round((current_user.calorie_target or 2000) * 0.30 / 9)},
        "carbs": {"eaten": round(sum(f.carbs for f in food_logs), 1), "goal": round((current_user.calorie_target or 2000) * 0.45 / 4)},
    }

    entries = []
    for f in food_logs:
        entries.append({
            "id": f.id,
            "type": "food",
            "name": f.description,
            "time": f.logged_at.strftime("%H:%M"),
            "kcal": f.kcal,
            "protein": f.protein,
            "fat": f.fat,
            "carbs": f.carbs,
            "source_type": f.source_type,
        })
    for e in exercise_logs:
        entries.append({
            "id": e.id,
            "type": "exercise",
            "name": e.activity_type,
            "time": e.logged_at.strftime("%H:%M"),
            "kcal": -e.kcal_burned,
            "duration_min": e.duration_min,
        })

    # Sort entries by time descending
    entries.sort(key=lambda x: x["time"], reverse=True)

    return {
        "kcal_consumed": kcal_consumed,
        "kcal_burned": kcal_burned,
        "kcal_goal": current_user.calorie_target or 2000,
        "macros": macros,
        "water_glasses": int(water_row.value) if water_row else 0,
        "water_goal": 8,
        "entries": entries,
    }


@router.get("/logs")
def get_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, le=200),
):
    """Recent food + exercise log entries for this user."""
    food = (
        db.query(FoodLog)
        .filter(FoodLog.user_id == current_user.id)
        .order_by(FoodLog.logged_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": f.id,
            "type": "food",
            "description": f.description,
            "kcal": f.kcal,
            "protein": f.protein,
            "fat": f.fat,
            "carbs": f.carbs,
            "logged_at": f.logged_at.isoformat(),
            "source_type": f.source_type,
        }
        for f in food
    ]


@router.post("/log")
def save_log(
    body: SaveLogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save a confirmed food or exercise entry."""
    if body.activity_type:
        entry = ExerciseLog(
            user_id=current_user.id,
            activity_type=body.activity_type,
            duration_min=body.duration_min or 0,
            kcal_burned=body.kcal_burned or body.kcal,
        )
    else:
        entry = FoodLog(
            user_id=current_user.id,
            description=body.description,
            kcal=body.kcal,
            protein=body.protein,
            fat=body.fat,
            carbs=body.carbs,
            source_type=body.source_type,
            ai_confidence=body.ai_confidence,
        )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id, "ok": True}


@router.put("/log/{entry_id}")
def update_log(
    entry_id: int,
    body: SaveLogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing food log entry."""
    entry = db.query(FoodLog).filter(FoodLog.id == entry_id, FoodLog.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    entry.description = body.description
    entry.kcal = body.kcal
    entry.protein = body.protein
    entry.fat = body.fat
    entry.carbs = body.carbs
    db.commit()
    return {"ok": True}


@router.delete("/log/{entry_id}")
def delete_log(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a food log entry."""
    entry = db.query(FoodLog).filter(FoodLog.id == entry_id, FoodLog.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}


@router.delete("/exercise/{entry_id}")
def delete_exercise(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an exercise log entry."""
    entry = db.query(ExerciseLog).filter(ExerciseLog.id == entry_id, ExerciseLog.user_id == current_user.id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}


@router.post("/water")
def log_water(
    body: dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save today's water glass count (overwrites if exists today)."""
    glasses = body.get("glasses", 0)
    start = _today_start_utc()
    existing = (
        db.query(BodyMeasurement)
        .filter(
            BodyMeasurement.user_id == current_user.id,
            BodyMeasurement.metric_type == "water_glasses",
            BodyMeasurement.measured_at >= start,
        )
        .first()
    )
    if existing:
        existing.value = glasses
    else:
        db.add(BodyMeasurement(
            user_id=current_user.id,
            metric_type="water_glasses",
            value=glasses,
            unit="glasses",
        ))
    db.commit()
    return {"ok": True, "glasses": glasses}


@router.post("/log/text")
async def log_text(
    body: TextLogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parse a text description via USDA (fast path) or AI (fallback) and return nutrition data.
    Does NOT persist — the client must call POST /log to save after confirmation.
    """
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="AI_UNAVAILABLE")

    # Fast path: try USDA first for short, simple queries (no AI cost)
    usda_result = await _try_usda_first(body.text)
    if usda_result:
        return usda_result

    # AI path: quota guard + Haiku call
    _check_ai_quota(current_user, db)
    result = _call_claude_haiku(body.text, language=current_user.language or "pl")

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    if result.get("confidence", 1.0) < 0.45:
        raise HTTPException(status_code=422, detail="Nie mogę rozpoznać posiłku. Podaj więcej szczegółów.")

    return result


@router.post("/log/photo")
async def log_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Analyze a food photo via Claude Vision and return nutrition data.
    Does NOT persist — the client must call POST /log to save after confirmation.
    """
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="AI_UNAVAILABLE")

    _check_ai_quota(current_user, db)

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Plik jest za duży (max 5 MB)")

    media_type = file.content_type or "image/jpeg"
    if media_type not in _ALLOWED_MEDIA_TYPES:
        media_type = "image/jpeg"

    b64 = base64.standard_b64encode(contents).decode()
    result = _call_claude_sonnet_vision(b64, media_type)

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    return result


@router.get("/search")
async def search_food(
    q: str = Query(..., min_length=2),
    current_user: User = Depends(get_current_user),
):
    """USDA FoodData Central text search — used as AI fallback."""
    if not settings.usda_api_key:
        raise HTTPException(status_code=503, detail="USDA_UNAVAILABLE")

    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    params = {
        "query": q,
        "api_key": settings.usda_api_key,
        "pageSize": 5,
        "dataType": "Survey (FNDDS),SR Legacy",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="USDA search failed")
        data = resp.json()

    results = []
    for food in data.get("foods", [])[:5]:
        nutrients = {n["nutrientName"]: n["value"] for n in food.get("foodNutrients", [])}
        results.append({
            "fdcId": food.get("fdcId"),
            "name": food.get("description", ""),
            "kcal": int(nutrients.get("Energy", 0)),
            "protein": round(nutrients.get("Protein", 0.0), 1),
            "fat": round(nutrients.get("Total lipid (fat)", 0.0), 1),
            "carbs": round(nutrients.get("Carbohydrate, by difference", 0.0), 1),
        })
    return results
