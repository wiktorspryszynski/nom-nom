from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    import app.models  # noqa: F401 — registers all models with Base
    Base.metadata.create_all(bind=engine)
    # Apply schema migrations for columns added after initial create_all.
    from app.migrations import run_migrations
    session = SessionLocal()
    try:
        run_migrations(session)
    except Exception as exc:  # never block startup due to a migration error
        import logging
        logging.getLogger(__name__).error("Migration failed (non-fatal): %s", exc)
        session.rollback()
    finally:
        session.close()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
