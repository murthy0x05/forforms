import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.question import Question
from app.models.form import Form
from app.schemas.question_schema import QuestionCreate, QuestionUpdate, QuestionReorder, VALID_QUESTION_TYPES


class QuestionController:
    """Business logic for question operations."""

    @staticmethod
    def add_question(db: Session, form_id: str, data: QuestionCreate) -> Question:
        """Add a new question to a form."""
        # Validate form exists
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        # Validate question type
        if data.type not in VALID_QUESTION_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid question type. Must be one of: {', '.join(VALID_QUESTION_TYPES)}"
            )

        # Auto-assign order_index if not provided
        if data.order_index is None:
            max_order = db.query(func.max(Question.order_index)).filter(Question.form_id == form_id).scalar()
            order_index = (max_order or -1) + 1
        else:
            order_index = data.order_index

        # Set default properties based on type
        properties = data.properties or QuestionController._default_properties(data.type)

        question = Question(
            id=str(uuid.uuid4()),
            form_id=form_id,
            type=data.type,
            title=data.title,
            description=data.description,
            order_index=order_index,
            is_required=data.is_required,
            properties=properties,
        )
        db.add(question)

        # Update form timestamp
        form.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(question)
        return question

    @staticmethod
    def update_question(db: Session, form_id: str, question_id: str, data: QuestionUpdate) -> Question:
        """Update an existing question."""
        question = db.query(Question).filter(
            Question.id == question_id, Question.form_id == form_id
        ).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        # Validate type if changing
        if data.type and data.type not in VALID_QUESTION_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid question type. Must be one of: {', '.join(VALID_QUESTION_TYPES)}"
            )

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(question, key, value)

        question.updated_at = datetime.now(timezone.utc)

        # Update form timestamp
        form = db.query(Form).filter(Form.id == form_id).first()
        if form:
            form.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(question)
        return question

    @staticmethod
    def delete_question(db: Session, form_id: str, question_id: str) -> None:
        """Delete a question from a form."""
        question = db.query(Question).filter(
            Question.id == question_id, Question.form_id == form_id
        ).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")

        db.delete(question)

        # Update form timestamp
        form = db.query(Form).filter(Form.id == form_id).first()
        if form:
            form.updated_at = datetime.now(timezone.utc)

        db.commit()

    @staticmethod
    def reorder_questions(db: Session, form_id: str, data: QuestionReorder) -> List[Question]:
        """Bulk reorder questions in a form."""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        for item in data.questions:
            question = db.query(Question).filter(
                Question.id == item.id, Question.form_id == form_id
            ).first()
            if question:
                question.order_index = item.order_index

        form.updated_at = datetime.now(timezone.utc)
        db.commit()

        # Return updated questions
        questions = db.query(Question).filter(
            Question.form_id == form_id
        ).order_by(Question.order_index).all()
        return questions

    @staticmethod
    def _default_properties(question_type: str) -> dict:
        """Get default properties for a question type."""
        defaults = {
            "short_text": {"placeholder": "Type your answer here..."},
            "long_text": {"placeholder": "Type your answer here...", "max_length": 1000},
            "multiple_choice": {"choices": ["Option 1", "Option 2", "Option 3"], "allow_multiple": False},
            "dropdown": {"choices": ["Option 1", "Option 2", "Option 3"]},
            "email": {"placeholder": "name@example.com"},
            "number": {"placeholder": "0", "min_value": None, "max_value": None},
            "yes_no": {},
            "rating": {"max_rating": 5, "shape": "star"},
        }
        return defaults.get(question_type, {})
