from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime


class FormCreate(BaseModel):
    """Schema for creating a new form."""
    title: str = Field(default="Untitled Form", max_length=255)
    description: Optional[str] = None


class FormUpdate(BaseModel):
    """Schema for updating an existing form."""
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = None
    theme_settings: Optional[dict] = None
    welcome_screen_title: Optional[str] = None
    welcome_screen_description: Optional[str] = None
    welcome_screen_enabled: Optional[str] = None
    thankyou_screen_title: Optional[str] = None
    thankyou_screen_description: Optional[str] = None


class QuestionInForm(BaseModel):
    """Embedded question in form response."""
    id: str
    type: str
    title: str
    description: Optional[str] = None
    order_index: int
    is_required: bool
    properties: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FormResponse(BaseModel):
    """Full form response with questions."""
    id: str
    title: str
    description: Optional[str] = None
    status: str
    share_id: Optional[str] = None
    theme_settings: Optional[dict] = None
    welcome_screen_title: Optional[str] = None
    welcome_screen_description: Optional[str] = None
    welcome_screen_enabled: Optional[str] = None
    thankyou_screen_title: Optional[str] = None
    thankyou_screen_description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionInForm] = []
    response_count: int = 0

    model_config = {"from_attributes": True}


class FormListResponse(BaseModel):
    """Form in list view (without full questions)."""
    id: str
    title: str
    description: Optional[str] = None
    status: str
    share_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    response_count: int = 0
    question_count: int = 0

    model_config = {"from_attributes": True}


class FormPublishResponse(BaseModel):
    """Response after publishing a form."""
    id: str
    status: str
    share_id: str
    share_url: str
