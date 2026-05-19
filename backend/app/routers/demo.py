from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.demo_request import DemoRequest
from app.services.email import send_demo_notification

router = APIRouter()


class DemoRequestBody(BaseModel):
    name: str
    email: str


@router.post("")
def request_demo(
    body: DemoRequestBody,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    if db.query(DemoRequest).filter(DemoRequest.email == body.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="already_requested")

    db.add(DemoRequest(name=body.name, email=body.email))
    db.commit()

    background_tasks.add_task(send_demo_notification, body.name, body.email)

    return {"message": "ok"}
