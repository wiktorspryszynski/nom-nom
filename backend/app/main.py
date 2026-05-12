from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, meal_planner, tracker, measurements

app = FastAPI(title="NomNom API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(meal_planner.router, prefix="/meal-planner", tags=["meal-planner"])
app.include_router(tracker.router, prefix="/tracker", tags=["tracker"])
app.include_router(measurements.router, prefix="/measurements", tags=["measurements"])


@app.get("/health")
def health():
    return {"status": "ok"}
