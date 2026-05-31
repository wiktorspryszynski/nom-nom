from datetime import date
from pydantic import BaseModel, EmailStr, field_validator, model_validator


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    # password is required for email signup, omitted for GitHub signup
    password: str | None = None
    # github_id is set when registering via GitHub OAuth
    github_id: str | None = None
    birth_date: str | None = None

    @field_validator('birth_date')
    @classmethod
    def validate_birth_date(cls, v: str | None) -> str | None:
        if v is None:
            return v
        try:
            parsed = date.fromisoformat(v)
        except ValueError:
            raise ValueError('birth_date must be a valid ISO date (YYYY-MM-DD)')
        today = date.today()
        if parsed >= today:
            raise ValueError('birth_date must be in the past')
        if parsed.year < today.year - 120:
            raise ValueError('birth_date is too far in the past')
        return v
    sex: str
    height_cm: float
    weight_kg: float
    target_weight_kg: float
    tdee_kcal: int
    calorie_target: int
    goal_type: str
    # target_date_preset is a frontend-only UI field used to compute calorie_target;
    # it is not persisted — the derived calorie_target is stored instead.
    language: str = 'pl'

    @model_validator(mode='after')
    def password_or_github_required(self) -> 'RegisterRequest':
        if not self.github_id and not self.password:
            raise ValueError('password is required when not registering via GitHub')
        return self
