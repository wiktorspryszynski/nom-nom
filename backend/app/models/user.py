from sqlalchemy import Enum as SAEnum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.enums import AccountType, GoalType, Language, RegisteredVia, Sex

_enum_kw = dict(native_enum=False, create_constraint=False)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    hashed_password: Mapped[str | None] = mapped_column(String)
    github_id: Mapped[str | None] = mapped_column(String, unique=True)
    tdee_kcal: Mapped[int | None] = mapped_column(Integer)
    calorie_target: Mapped[int | None] = mapped_column(Integer)
    weight_target: Mapped[float | None] = mapped_column(Float)
    goal_type: Mapped[GoalType | None] = mapped_column(SAEnum(GoalType, **_enum_kw))
    protein_target: Mapped[int | None] = mapped_column(Integer)
    sex: Mapped[Sex | None] = mapped_column(SAEnum(Sex, **_enum_kw))
    height_cm: Mapped[float | None] = mapped_column(Float)
    weight_kg: Mapped[float | None] = mapped_column(Float)
    birth_date: Mapped[str | None] = mapped_column(String)
    language: Mapped[Language | None] = mapped_column(SAEnum(Language, **_enum_kw), default=Language.pl)
    account_type: Mapped[AccountType] = mapped_column(
        SAEnum(AccountType, **_enum_kw), nullable=False, default=AccountType.demo, server_default=AccountType.demo
    )
    demo_ai_calls_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    registered_via: Mapped[RegisteredVia | None] = mapped_column(SAEnum(RegisteredVia, **_enum_kw))
