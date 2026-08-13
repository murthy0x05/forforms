import uuid
import string
import random
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.schemas.form_schema import FormCreate, FormUpdate


class FormController:
    """Business logic for form operations."""

    @staticmethod
    def _generate_share_id(length: int = 8) -> str:
        """Generate a short random share ID."""
        chars = string.ascii_lowercase + string.digits
        return "".join(random.choices(chars, k=length))

    @staticmethod
    def list_forms(db: Session) -> List[dict]:
        """Get all forms with response and question counts."""
        forms = db.query(Form).order_by(Form.updated_at.desc()).all()
        result = []
        for form in forms:
            response_count = db.query(func.count(Response.id)).filter(Response.form_id == form.id).scalar()
            question_count = db.query(func.count(Question.id)).filter(Question.form_id == form.id).scalar()
            result.append({
                "id": form.id,
                "title": form.title,
                "description": form.description,
                "status": form.status,
                "share_id": form.share_id,
                "created_at": form.created_at,
                "updated_at": form.updated_at,
                "response_count": response_count,
                "question_count": question_count,
            })
        return result

    @staticmethod
    def get_form(db: Session, form_id: str) -> dict:
        """Get a single form with all questions and response count."""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        response_count = db.query(func.count(Response.id)).filter(Response.form_id == form.id).scalar()

        return {
            "id": form.id,
            "title": form.title,
            "description": form.description,
            "status": form.status,
            "share_id": form.share_id,
            "theme_settings": form.theme_settings,
            "welcome_screen_title": form.welcome_screen_title,
            "welcome_screen_description": form.welcome_screen_description,
            "welcome_screen_enabled": form.welcome_screen_enabled,
            "thankyou_screen_title": form.thankyou_screen_title,
            "thankyou_screen_description": form.thankyou_screen_description,
            "created_at": form.created_at,
            "updated_at": form.updated_at,
            "questions": sorted(form.questions, key=lambda q: q.order_index),
            "response_count": response_count,
        }

    @staticmethod
    def create_form(db: Session, data: FormCreate) -> Form:
        """Create a new form."""
        form = Form(
            id=str(uuid.uuid4()),
            title=data.title,
            description=data.description,
        )
        db.add(form)
        db.commit()
        db.refresh(form)
        return form

    @staticmethod
    def update_form(db: Session, form_id: str, data: FormUpdate) -> Form:
        """Update an existing form."""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(form, key, value)

        form.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(form)
        return form

    @staticmethod
    def delete_form(db: Session, form_id: str) -> None:
        """Delete a form and all related data."""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        db.delete(form)
        db.commit()

    @staticmethod
    def duplicate_form(db: Session, form_id: str) -> Form:
        """Duplicate a form with all its questions."""
        original = db.query(Form).filter(Form.id == form_id).first()
        if not original:
            raise HTTPException(status_code=404, detail="Form not found")

        new_form = Form(
            id=str(uuid.uuid4()),
            title=f"{original.title} (Copy)",
            description=original.description,
            status="draft",
            theme_settings=original.theme_settings,
            welcome_screen_title=original.welcome_screen_title,
            welcome_screen_description=original.welcome_screen_description,
            welcome_screen_enabled=original.welcome_screen_enabled,
            thankyou_screen_title=original.thankyou_screen_title,
            thankyou_screen_description=original.thankyou_screen_description,
        )
        db.add(new_form)
        db.flush()

        # Duplicate questions
        for q in original.questions:
            new_q = Question(
                id=str(uuid.uuid4()),
                form_id=new_form.id,
                type=q.type,
                title=q.title,
                description=q.description,
                order_index=q.order_index,
                is_required=q.is_required,
                properties=q.properties,
            )
            db.add(new_q)

        db.commit()
        db.refresh(new_form)
        return new_form

    @staticmethod
    def publish_form(db: Session, form_id: str) -> dict:
        """Publish a form, generating a share ID if needed."""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        # Check if form has questions
        question_count = db.query(func.count(Question.id)).filter(Question.form_id == form.id).scalar()
        if question_count == 0:
            raise HTTPException(status_code=400, detail="Cannot publish a form with no questions")

        if not form.share_id:
            # Generate unique share ID
            while True:
                share_id = FormController._generate_share_id()
                existing = db.query(Form).filter(Form.share_id == share_id).first()
                if not existing:
                    break
            form.share_id = share_id

        form.status = "published"
        form.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(form)

        return {
            "id": form.id,
            "status": form.status,
            "share_id": form.share_id,
            "share_url": f"/f/{form.share_id}",
        }

    @staticmethod
    def unpublish_form(db: Session, form_id: str) -> Form:
        """Unpublish a form."""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        form.status = "draft"
        form.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(form)
        return form

    @staticmethod
    def get_public_form(db: Session, share_id: str) -> dict:
        """Get a published form by share ID (for respondents)."""
        form = db.query(Form).filter(Form.share_id == share_id, Form.status == "published").first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found or not published")

        return {
            "id": form.id,
            "title": form.title,
            "description": form.description,
            "theme_settings": form.theme_settings,
            "welcome_screen_title": form.welcome_screen_title,
            "welcome_screen_description": form.welcome_screen_description,
            "welcome_screen_enabled": form.welcome_screen_enabled,
            "thankyou_screen_title": form.thankyou_screen_title,
            "thankyou_screen_description": form.thankyou_screen_description,
            "questions": sorted(form.questions, key=lambda q: q.order_index),
        }
