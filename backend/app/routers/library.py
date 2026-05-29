from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.saved_item import SavedItem
from app.models.user import User
from app.routers.auth import get_current_user

router = APIRouter()


class SavedItemCreate(BaseModel):
    name: str
    item_type: str  # 'food' | 'exercise'
    kcal: int | None = None
    protein: float | None = None
    fat: float | None = None
    carbs: float | None = None
    duration_min: int | None = None


def _serialize(item: SavedItem) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "item_type": item.item_type,
        "kcal": item.kcal,
        "protein": item.protein,
        "fat": item.fat,
        "carbs": item.carbs,
        "duration_min": item.duration_min,
    }


@router.get("/")
def list_saved_items(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items = (
        db.query(SavedItem)
        .filter(SavedItem.user_id == current_user.id)
        .order_by(SavedItem.created_at.desc())
        .all()
    )
    return [_serialize(i) for i in items]


@router.post("/")
def create_saved_item(
    body: SavedItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = SavedItem(
        user_id=current_user.id,
        name=body.name,
        item_type=body.item_type,
        kcal=body.kcal,
        protein=body.protein,
        fat=body.fat,
        carbs=body.carbs,
        duration_min=body.duration_min,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _serialize(item)


@router.delete("/{item_id}")
def delete_saved_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(SavedItem).filter(
        SavedItem.id == item_id, SavedItem.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
