from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/")
def get_measurements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return []


@router.post("/")
def add_measurement(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"message": "not implemented"}
