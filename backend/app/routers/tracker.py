from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/logs")
def get_logs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return []


@router.post("/log/text")
def log_text(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # TODO: Claude Haiku → structured data → Nutrition API
    return {"message": "not implemented"}


@router.post("/log/photo")
def log_photo(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # TODO: Claude Sonnet Vision → description → Nutrition API
    return {"message": "not implemented"}
