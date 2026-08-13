from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.controllers.form_controller import FormController
from app.controllers.response_controller import ResponseController
from app.schemas.response_schema import SubmissionCreate, SubmissionResponse
from app.schemas.form_schema import FormResponse

router = APIRouter(prefix="/api/public", tags=["Public"])


@router.get("/forms/{share_id}")
def get_public_form(share_id: str, db: Session = Depends(get_db)):
    """Get a published form for respondent filling (no auth required)."""
    return FormController.get_public_form(db, share_id)


@router.post("/forms/{share_id}/responses", response_model=SubmissionResponse)
def submit_response(share_id: str, data: SubmissionCreate, db: Session = Depends(get_db)):
    """Submit a response to a published form (no auth required)."""
    return ResponseController.submit_response(db, share_id, data)
