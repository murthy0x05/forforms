from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class AnswerCreate(BaseModel):
    """Single answer in a submission."""
    question_id: str
    value: Optional[str] = None


class SubmissionCreate(BaseModel):
    """Schema for submitting a form response."""
    answers: List[AnswerCreate]
    metadata: Optional[dict] = None


class AnswerResponse(BaseModel):
    """Answer in a response."""
    id: str
    question_id: str
    value: Optional[str] = None

    model_config = {"from_attributes": True}


class SubmissionResponse(BaseModel):
    """Response after submitting a form."""
    id: str
    form_id: str
    submitted_at: datetime
    answers: List[AnswerResponse] = []

    model_config = {"from_attributes": True}


class ResponseListItem(BaseModel):
    """Single response in list view."""
    id: str
    submitted_at: datetime
    answers: List[AnswerResponse] = []

    model_config = {"from_attributes": True}


class ResponseListResponse(BaseModel):
    """List of responses for a form."""
    form_id: str
    form_title: str
    total: int
    responses: List[ResponseListItem]


class ResponseDetailResponse(BaseModel):
    """Full detail of a single response."""
    id: str
    form_id: str
    form_title: str
    submitted_at: datetime
    answers: List[Dict[str, Any]]  # includes question info


class QuestionSummary(BaseModel):
    """Summary stats for a single question."""
    question_id: str
    question_title: str
    question_type: str
    total_answers: int
    summary: Dict[str, Any]  # type-specific summary data


class FormSummaryResponse(BaseModel):
    """Summary stats for all questions in a form."""
    form_id: str
    form_title: str
    total_responses: int
    questions: List[QuestionSummary]
