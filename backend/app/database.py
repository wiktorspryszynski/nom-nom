from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    """Run pending Alembic migrations at startup."""
    import os
    from alembic import command
    from alembic.config import Config

    # Resolve alembic.ini relative to this file so it works both inside Docker
    # (/app/alembic.ini) and when running the backend directly from backend/.
    ini_path = os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
    alembic_cfg = Config(os.path.normpath(ini_path))
    command.upgrade(alembic_cfg, "head")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
