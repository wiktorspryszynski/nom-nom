import base64
import json

import anthropic
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


class TextLogRequest(BaseModel):
    text: str

_VISION_PROMPT = (
    "Analyze this food photo. Return ONLY a raw JSON object (no markdown, no code fences) with:\n"
    '{"name":"short Polish name (max 4 words)","description":"one Polish sentence describing the dish",'
    '"kcal":integer,"protein":float,"fat":float,"carbs":float,"confidence":float 0-1}\n\n'
    "Estimate a realistic single serving. If this is not a food photo return:\n"
    '{"error":"Nie rozpoznano jedzenia na zdjęciu"}'
)

_ALLOWED_MEDIA_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}

_DEMO_RESULT = {
    "name": "Przykładowy posiłek",
    "description": "To są przykładowe dane — ustaw ANTHROPIC_API_KEY aby używać analizy zdjęć.",
    "kcal": 420,
    "protein": 18.0,
    "fat": 12.5,
    "carbs": 58.0,
    "confidence": 0.0,
}


@router.get("/logs")
def get_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return []


_TEXT_PROMPT = (
    "Analyze this food or exercise description. Return ONLY a raw JSON object (no markdown, no code fences) with:\n"
    '{"name":"short Polish name (max 4 words)","description":"one Polish sentence",'
    '"kcal":integer,"protein":float,"fat":float,"carbs":float,"confidence":float 0-1}\n\n'
    "For exercise entries set protein/fat/carbs to 0 and kcal to calories burned (negative is fine for the display).\n"
    "If you cannot parse this as food or exercise return:\n"
    '{"error":"Nie rozpoznano posiłku ani aktywności"}'
)

_DEMO_TEXT_RESULT = {
    "name": "Przykładowy posiłek",
    "description": "To są przykładowe dane — ustaw ANTHROPIC_API_KEY aby używać analizy tekstu.",
    "kcal": 350,
    "protein": 15.0,
    "fat": 10.0,
    "carbs": 45.0,
    "confidence": 0.0,
}


@router.post("/log/text")
def log_text(
    body: TextLogRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.anthropic_api_key:
        return _DEMO_TEXT_RESULT

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        messages=[{"role": "user", "content": f"{_TEXT_PROMPT}\n\nEntry: {body.text}"}],
    )

    try:
        result = json.loads(message.content[0].text)
    except (json.JSONDecodeError, IndexError):
        raise HTTPException(status_code=422, detail="Nie udało się przetworzyć odpowiedzi AI")

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    return result


@router.post("/log/photo")
async def log_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.anthropic_api_key:
        return _DEMO_RESULT

    contents = await file.read()
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Plik jest za duży (max 20 MB)")

    media_type = file.content_type or "image/jpeg"
    if media_type not in _ALLOWED_MEDIA_TYPES:
        media_type = "image/jpeg"

    b64 = base64.standard_b64encode(contents).decode()

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
                {"type": "text", "text": _VISION_PROMPT},
            ],
        }],
    )

    try:
        result = json.loads(message.content[0].text)
    except (json.JSONDecodeError, IndexError):
        raise HTTPException(status_code=422, detail="Nie udało się przetworzyć odpowiedzi AI")

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    return result
