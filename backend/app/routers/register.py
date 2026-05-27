from collections import defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.enums import RegisteredVia
from app.models.user import User
from app.routers.auth import create_access_token
from app.schemas.register import RegisterRequest

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Authoritative protein targets; frontend uses the same constants for display only.
_PROTEIN_MULTIPLIERS = {'lose': 2.0, 'maintain': 1.6, 'build': 2.2}

# ---------------------------------------------------------------------------
# IP-based rate limit: max 3 signups per IP per hour (in-process)
# ---------------------------------------------------------------------------
_SIGNUP_LIMIT = 3
_SIGNUP_WINDOW = timedelta(hours=1)
_signup_attempts: dict[str, list[datetime]] = defaultdict(list)


def _check_signup_rate(request: Request) -> None:
    ip = request.client.host if request.client else "unknown"
    now = datetime.utcnow()
    cutoff = now - _SIGNUP_WINDOW
    recent = [t for t in _signup_attempts[ip] if t > cutoff]
    if len(recent) >= _SIGNUP_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="TOO_MANY_SIGNUPS",
        )
    recent.append(now)
    _signup_attempts[ip] = recent


@router.get("/check-email")
def check_email(email: str, db: Session = Depends(get_db)):
    """Return whether an email address is already registered. No auth required."""
    taken = db.query(User).filter(User.email == email).first() is not None
    return {"available": not taken}


@router.post("", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    _check_signup_rate(request)

    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    # If github_id is provided, verify it isn't already linked to another account
    if body.github_id and db.query(User).filter(User.github_id == body.github_id).first():
        raise HTTPException(status_code=409, detail="GitHub account already registered")

    multiplier = _PROTEIN_MULTIPLIERS.get(body.goal_type, 1.6)
    protein_target = round(body.weight_kg * multiplier)

    via_github = bool(body.github_id)

    user = User(
        name=body.name,
        email=body.email,
        hashed_password=pwd_context.hash(body.password) if body.password else None,
        github_id=body.github_id,
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
        account_type="demo",
        registered_via=RegisteredVia.github if via_github else RegisteredVia.email,
    )
    db.add(user)
    db.commit()

    # GitHub users have no password — return a JWT immediately so the frontend
    # can call loginWithToken() without needing a password-based login.
    if via_github:
        token = create_access_token({"sub": user.email})
        return {"ok": True, "access_token": token, "token_type": "bearer"}

    return {"ok": True}
