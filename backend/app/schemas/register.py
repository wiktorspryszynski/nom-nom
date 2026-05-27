from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    invite_code: str
    name: str
    email: EmailStr
    password: str
    birth_date: str | None = None
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
