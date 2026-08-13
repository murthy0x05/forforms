from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.controllers.form_controller import FormController
from app.schemas.form_schema import (
    FormCreate, FormUpdate, FormResponse, FormListResponse, FormPublishResponse
)

router = APIRouter(prefix="/api/forms", tags=["Forms"])


@router.get("", response_model=List[FormListResponse])
def list_forms(db: Session = Depends(get_db)):
    """List all forms with response and question counts."""
    return FormController.list_forms(db)


@router.post("", response_model=FormResponse)
def create_form(data: FormCreate, db: Session = Depends(get_db)):
    """Create a new form."""
    form = FormController.create_form(db, data)
    return FormController.get_form(db, form.id)


@router.get("/{form_id}", response_model=FormResponse)
def get_form(form_id: str, db: Session = Depends(get_db)):
    """Get a single form with all questions."""
    return FormController.get_form(db, form_id)


@router.put("/{form_id}", response_model=FormResponse)
def update_form(form_id: str, data: FormUpdate, db: Session = Depends(get_db)):
    """Update an existing form."""
    FormController.update_form(db, form_id, data)
    return FormController.get_form(db, form_id)


@router.delete("/{form_id}")
def delete_form(form_id: str, db: Session = Depends(get_db)):
    """Delete a form."""
    FormController.delete_form(db, form_id)
    return {"message": "Form deleted successfully"}


@router.post("/{form_id}/duplicate", response_model=FormResponse)
def duplicate_form(form_id: str, db: Session = Depends(get_db)):
    """Duplicate a form with all its questions."""
    new_form = FormController.duplicate_form(db, form_id)
    return FormController.get_form(db, new_form.id)


@router.post("/{form_id}/publish", response_model=FormPublishResponse)
def publish_form(form_id: str, db: Session = Depends(get_db)):
    """Publish a form and generate a share link."""
    return FormController.publish_form(db, form_id)


@router.post("/{form_id}/unpublish", response_model=FormResponse)
def unpublish_form(form_id: str, db: Session = Depends(get_db)):
    """Unpublish a form."""
    FormController.unpublish_form(db, form_id)
    return FormController.get_form(db, form_id)
