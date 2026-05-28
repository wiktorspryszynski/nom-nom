from sqlalchemy import Column, Enum as SAEnum, Float, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.enums import AccountType, GoalType, Language, RegisteredVia, Sex

_enum_kw = dict(native_enum=False, create_constraint=False)


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
    goal_type = Column(SAEnum(GoalType, **_enum_kw), nullable=True)
    protein_target = Column(Integer, nullable=True)
    sex = Column(SAEnum(Sex, **_enum_kw), nullable=True)
    height_cm = Column(Float, nullable=True)
    weight_kg = Column(Float, nullable=True)
    birth_date = Column(String, nullable=True)
    language = Column(SAEnum(Language, **_enum_kw), nullable=True, default=Language.pl)
    account_type = Column(SAEnum(AccountType, **_enum_kw), nullable=False, default=AccountType.demo, server_default=AccountType.demo)
    # Persistent lifetime AI call counter for demo accounts (never resets)
    demo_ai_calls_used = Column(Integer, nullable=False, default=0, server_default="0")
    registered_via = Column(SAEnum(RegisteredVia, **_enum_kw), nullable=True)
