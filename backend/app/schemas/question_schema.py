from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


VALID_QUESTION_TYPES = [
    "short_text", "long_text", "multiple_choice", "dropdown",
    "email", "number", "yes_no", "rating"
]


class QuestionCreate(BaseModel):
    """Schema for creating a new question."""
    type: str = Field(..., description="Question type")
    title: str = Field(default="", description="Question title")
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_required: bool = False
    properties: Optional[dict] = None  # {choices: [], max_rating: 5, placeholder: ""}


class QuestionUpdate(BaseModel):
    """Schema for updating an existing question."""
    type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_required: Optional[bool] = None
    properties: Optional[dict] = None


class QuestionResponse(BaseModel):
    """Question response schema."""
    id: str
    form_id: str
    type: str
    title: str
    description: Optional[str] = None
    order_index: int
    is_required: bool
    properties: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QuestionReorderItem(BaseModel):
    """Single item in reorder request."""
    id: str
    order_index: int


class QuestionReorder(BaseModel):
    """Schema for bulk reordering questions."""
    questions: List[QuestionReorderItem]
