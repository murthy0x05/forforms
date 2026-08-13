from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.controllers.question_controller import QuestionController
from app.schemas.question_schema import QuestionCreate, QuestionUpdate, QuestionResponse, QuestionReorder

router = APIRouter(prefix="/api/forms/{form_id}/questions", tags=["Questions"])


@router.post("", response_model=QuestionResponse)
def add_question(form_id: str, data: QuestionCreate, db: Session = Depends(get_db)):
    """Add a new question to a form."""
    return QuestionController.add_question(db, form_id, data)


@router.put("/{question_id}", response_model=QuestionResponse)
def update_question(form_id: str, question_id: str, data: QuestionUpdate, db: Session = Depends(get_db)):
    """Update an existing question."""
    return QuestionController.update_question(db, form_id, question_id, data)


@router.delete("/{question_id}")
def delete_question(form_id: str, question_id: str, db: Session = Depends(get_db)):
    """Delete a question."""
    QuestionController.delete_question(db, form_id, question_id)
    return {"message": "Question deleted successfully"}


@router.put("/reorder", response_model=List[QuestionResponse])
def reorder_questions(form_id: str, data: QuestionReorder, db: Session = Depends(get_db)):
    """Bulk reorder questions."""
    return QuestionController.reorder_questions(db, form_id, data)
