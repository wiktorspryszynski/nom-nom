from fastapi import APIRouter, Depends, HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.register import RegisterRequest

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_PROTEIN_MULTIPLIERS = {'lose': 2.0, 'maintain': 1.6, 'build': 2.2}


@router.post("", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    multiplier = _PROTEIN_MULTIPLIERS.get(body.goal_type, 1.6)
    protein_target = round(body.weight_kg * multiplier)

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=pwd_context.hash(body.password),
        tdee_kcal=body.tdee_kcal,
        calorie_target=body.calorie_target,
        weight_target=body.target_weight_kg,
        goal_type=body.goal_type,
        protein_target=protein_target,
        sex=body.sex,
        height_cm=body.height_cm,
        weight_kg=body.weight_kg,
        birth_date=body.birth_date,
        language=body.language,
    )
    db.add(user)
    db.commit()
    return {"ok": True}
