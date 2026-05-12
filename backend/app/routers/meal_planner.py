from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/plans")
def list_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return []


@router.post("/generate")
def generate_plan(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # TODO: call Claude Sonnet to generate meal proposals
    return {"message": "not implemented"}
