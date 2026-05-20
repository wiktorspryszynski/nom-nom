from pydantic import BaseModel


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    birth_date: str | None = None
    sex: str
    height_cm: float
    weight_kg: float
    target_weight_kg: float
    tdee_kcal: int
    calorie_target: int
    goal_type: str
    target_date_preset: str
    language: str = 'pl'
