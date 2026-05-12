from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, meal_planner, tracker, measurements

app = FastAPI(title="NomNom API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
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
