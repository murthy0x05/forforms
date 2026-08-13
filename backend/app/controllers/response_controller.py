import uuid
import csv
import io
import re
from datetime import datetime, timezone
from typing import List
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException

from app.models.form import Form
from app.models.question import Question
from app.models.response import Response
from app.models.answer import Answer
from app.schemas.response_schema import SubmissionCreate


class ResponseController:
    """Business logic for response/submission operations."""

    @staticmethod
    def submit_response(db: Session, share_id: str, data: SubmissionCreate) -> Response:
        """Submit a response to a published form."""
        form = db.query(Form).filter(Form.share_id == share_id, Form.status == "published").first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found or not published")

        # Validate required questions
        questions = {q.id: q for q in form.questions}
        answer_map = {a.question_id: a.value for a in data.answers}

        for q_id, question in questions.items():
            if question.is_required:
                value = answer_map.get(q_id, "")
                if not value or str(value).strip() == "":
                    raise HTTPException(
                        status_code=400,
                        detail=f"Question '{question.title}' is required"
                    )

        # Validate answer formats
        for answer_data in data.answers:
            if answer_data.question_id not in questions:
                continue  # Skip answers for unknown questions

            question = questions[answer_data.question_id]
            value = answer_data.value

            if value and question.type == "email":
                if not re.match(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$', value):
                    raise HTTPException(status_code=400, detail="Invalid email format")

            if value and question.type == "number":
                try:
                    float(value)
                except ValueError:
                    raise HTTPException(status_code=400, detail=f"'{question.title}' must be a number")

        # Create response
        response = Response(
            id=str(uuid.uuid4()),
            form_id=form.id,
            submitted_at=datetime.now(timezone.utc),
            metadata_=data.metadata or {},
        )
        db.add(response)
        db.flush()

        # Create answers
        for answer_data in data.answers:
            if answer_data.question_id in questions:
                answer = Answer(
                    id=str(uuid.uuid4()),
                    response_id=response.id,
                    question_id=answer_data.question_id,
                    value=answer_data.value,
                )
                db.add(answer)

        db.commit()
        db.refresh(response)
        return response

    @staticmethod
    def list_responses(db: Session, form_id: str) -> dict:
        """List all responses for a form."""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        responses = db.query(Response).filter(
            Response.form_id == form_id
        ).order_by(Response.submitted_at.desc()).all()

        return {
            "form_id": form.id,
            "form_title": form.title,
            "total": len(responses),
            "responses": responses,
        }

    @staticmethod
    def get_response(db: Session, form_id: str, response_id: str) -> dict:
        """Get a single response with full answer details."""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        response = db.query(Response).filter(
            Response.id == response_id, Response.form_id == form_id
        ).first()
        if not response:
            raise HTTPException(status_code=404, detail="Response not found")

        # Build answers with question info
        answers_with_info = []
        for answer in response.answers:
            question = db.query(Question).filter(Question.id == answer.question_id).first()
            answers_with_info.append({
                "id": answer.id,
                "question_id": answer.question_id,
                "question_title": question.title if question else "Deleted Question",
                "question_type": question.type if question else "unknown",
                "value": answer.value,
            })

        return {
            "id": response.id,
            "form_id": form.id,
            "form_title": form.title,
            "submitted_at": response.submitted_at,
            "answers": answers_with_info,
        }

    @staticmethod
    def delete_response(db: Session, form_id: str, response_id: str) -> None:
        """Delete a single response."""
        response = db.query(Response).filter(
            Response.id == response_id, Response.form_id == form_id
        ).first()
        if not response:
            raise HTTPException(status_code=404, detail="Response not found")

        db.delete(response)
        db.commit()

    @staticmethod
    def get_summary(db: Session, form_id: str) -> dict:
        """Get summary statistics for all questions in a form."""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        total_responses = db.query(func.count(Response.id)).filter(Response.form_id == form_id).scalar()
        questions = db.query(Question).filter(
            Question.form_id == form_id
        ).order_by(Question.order_index).all()

        question_summaries = []
        for question in questions:
            answers = db.query(Answer).filter(Answer.question_id == question.id).all()
            values = [a.value for a in answers if a.value is not None and a.value.strip() != ""]

            summary = ResponseController._compute_summary(question.type, values, question.properties)

            question_summaries.append({
                "question_id": question.id,
                "question_title": question.title,
                "question_type": question.type,
                "total_answers": len(values),
                "summary": summary,
            })

        return {
            "form_id": form.id,
            "form_title": form.title,
            "total_responses": total_responses,
            "questions": question_summaries,
        }

    @staticmethod
    def _compute_summary(question_type: str, values: List[str], properties: dict) -> dict:
        """Compute type-specific summary statistics."""
        if not values:
            return {"empty": True}

        if question_type in ("multiple_choice", "dropdown", "yes_no"):
            counter = Counter(values)
            return {
                "counts": dict(counter.most_common()),
                "total": len(values),
            }

        if question_type == "rating":
            numeric = [float(v) for v in values if v.replace(".", "").isdigit()]
            if numeric:
                return {
                    "average": round(sum(numeric) / len(numeric), 2),
                    "min": min(numeric),
                    "max": max(numeric),
                    "distribution": dict(Counter(str(int(n)) for n in numeric)),
                    "total": len(numeric),
                }
            return {"empty": True}

        if question_type == "number":
            numeric = []
            for v in values:
                try:
                    numeric.append(float(v))
                except ValueError:
                    pass
            if numeric:
                return {
                    "average": round(sum(numeric) / len(numeric), 2),
                    "min": min(numeric),
                    "max": max(numeric),
                    "sum": sum(numeric),
                    "total": len(numeric),
                }
            return {"empty": True}

        # Text types (short_text, long_text, email)
        return {
            "total": len(values),
            "sample_answers": values[:5],  # first 5 answers as preview
            "avg_length": round(sum(len(v) for v in values) / len(values), 1) if values else 0,
        }

    @staticmethod
    def export_csv(db: Session, form_id: str) -> str:
        """Export all responses as CSV string."""
        form = db.query(Form).filter(Form.id == form_id).first()
        if not form:
            raise HTTPException(status_code=404, detail="Form not found")

        questions = db.query(Question).filter(
            Question.form_id == form_id
        ).order_by(Question.order_index).all()

        responses = db.query(Response).filter(
            Response.form_id == form_id
        ).order_by(Response.submitted_at).all()

        output = io.StringIO()
        writer = csv.writer(output)

        # Header row
        header = ["Submission ID", "Submitted At"] + [q.title for q in questions]
        writer.writerow(header)

        # Data rows
        for response in responses:
            answer_map = {a.question_id: a.value for a in response.answers}
            row = [response.id, str(response.submitted_at)]
            for q in questions:
                row.append(answer_map.get(q.id, ""))
            writer.writerow(row)

        return output.getvalue()
