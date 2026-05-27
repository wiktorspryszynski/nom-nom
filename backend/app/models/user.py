from sqlalchemy import Column, Float, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=True)   # nullable: GitHub OAuth users have no password
    github_id = Column(String, nullable=True, unique=True)
    tdee_kcal = Column(Integer, nullable=True)
    calorie_target = Column(Integer, nullable=True)
    weight_target = Column(Float, nullable=True)
    goal_type = Column(String, nullable=True)
    protein_target = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    birth_date = Column(String, nullable=True)
    language = Column(String, nullable=True, default='pl')
    # "demo" = newly registered / trial account; "full" = upgraded/trusted account
    account_type = Column(String, nullable=False, default="demo", server_default="demo")
    # Persistent lifetime AI call counter for demo accounts (never resets)
    demo_ai_calls_used = Column(Integer, nullable=False, default=0, server_default="0")
