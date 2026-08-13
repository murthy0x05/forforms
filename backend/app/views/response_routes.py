from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from app.database import get_db
from app.controllers.response_controller import ResponseController
from app.schemas.response_schema import (
    ResponseListResponse, ResponseDetailResponse, FormSummaryResponse
)

router = APIRouter(prefix="/api/forms/{form_id}/responses", tags=["Responses"])


@router.get("", response_model=ResponseListResponse)
def list_responses(form_id: str, db: Session = Depends(get_db)):
    """List all responses for a form."""
    return ResponseController.list_responses(db, form_id)


@router.get("/summary", response_model=FormSummaryResponse)
def get_summary(form_id: str, db: Session = Depends(get_db)):
    """Get summary statistics for all questions in a form."""
    return ResponseController.get_summary(db, form_id)


@router.get("/export")
def export_csv(form_id: str, db: Session = Depends(get_db)):
    """Export all responses as a CSV file."""
    csv_content = ResponseController.export_csv(db, form_id)
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=responses_{form_id}.csv"}
    )


@router.get("/{response_id}", response_model=ResponseDetailResponse)
def get_response(form_id: str, response_id: str, db: Session = Depends(get_db)):
    """Get a single response with full answer details."""
    return ResponseController.get_response(db, form_id, response_id)


@router.delete("/{response_id}")
def delete_response(form_id: str, response_id: str, db: Session = Depends(get_db)):
    """Delete a single response."""
    ResponseController.delete_response(db, form_id, response_id)
    return {"message": "Response deleted successfully"}
