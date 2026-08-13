import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Form(Base):
    """Form model — represents a single form/survey."""

    __tablename__ = "forms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, default="Untitled Form")
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="draft")  # draft | published
    share_id = Column(String(12), unique=True, nullable=True)  # short ID for public URL
    theme_settings = Column(JSON, nullable=True, default=dict)  # {colors, fonts, bg}
    welcome_screen_title = Column(String(255), nullable=True)
    welcome_screen_description = Column(Text, nullable=True)
    welcome_screen_enabled = Column(String(5), nullable=False, default="true")
    thankyou_screen_title = Column(String(255), nullable=True, default="Thank you!")
    thankyou_screen_description = Column(Text, nullable=True, default="Your response has been recorded.")
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    questions = relationship("Question", back_populates="form", cascade="all, delete-orphan", order_by="Question.order_index")
    responses = relationship("Response", back_populates="form", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Form(id={self.id}, title='{self.title}', status='{self.status}')>"
