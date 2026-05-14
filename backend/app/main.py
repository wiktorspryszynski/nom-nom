from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import auth, meal_planner, tracker, measurements


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
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
app.include_router(meal_planner.router, prefix="/api/meal-planner", tags=["meal-planner"])
app.include_router(tracker.router, prefix="/api/tracker", tags=["tracker"])
app.include_router(measurements.router, prefix="/api/measurements", tags=["measurements"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
