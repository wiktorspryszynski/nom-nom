from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, get_db
from app.routers import auth, meal_planner, tracker, measurements, demo, register, github_auth, library


def _seed_demo_user():
    """Ensure a demo account exists on every startup."""
    from app.models.user import User
    from app.routers.auth import get_password_hash

    db = next(get_db())
    try:
        if not db.query(User).filter(User.email == "demo@nomnom.app").first():
            db.add(User(
                name="Demo User",
                email="demo@nomnom.app",
                hashed_password=get_password_hash("demo1234"),
                calorie_target=2000,
                tdee_kcal=2400,
                goal_type="lose",
                protein_target=150,
                height_cm=175.0,
                weight_kg=75.0,
                sex="M",
                language="en",
                account_type="demo",
            ))
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        _seed_demo_user()
    except Exception as e:
        import logging
        logging.getLogger("nomnom").warning(f"Demo user seed skipped: {e}")
    yield


app = FastAPI(title="NomNom API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(register.router, prefix="/api/register", tags=["register"])
app.include_router(meal_planner.router, prefix="/api/meal-planner", tags=["meal-planner"])
app.include_router(tracker.router, prefix="/api/tracker", tags=["tracker"])
app.include_router(measurements.router, prefix="/api/measurements", tags=["measurements"])
app.include_router(demo.router, prefix="/api/demo-request", tags=["demo"])
app.include_router(github_auth.router, prefix="/api/auth/github", tags=["auth"])
app.include_router(library.router, prefix="/api/library", tags=["library"])


@app.get("/api/health")
def health():
    return {"status": "ok", "ai_available": settings.ai_available}
