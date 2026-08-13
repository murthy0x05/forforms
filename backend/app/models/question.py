import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Question(Base):
    """Question model — represents a single question within a form."""

    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    form_id = Column(String(36), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(30), nullable=False)  # short_text, long_text, multiple_choice, dropdown, email, number, yes_no, rating
    title = Column(Text, nullable=False, default="")
    description = Column(Text, nullable=True)  # help text
    order_index = Column(Integer, nullable=False, default=0)
    is_required = Column(Boolean, nullable=False, default=False)
    properties = Column(JSON, nullable=True, default=dict)  # type-specific config: choices[], max_rating, placeholder, etc.
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    form = relationship("Form", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Question(id={self.id}, type='{self.type}', title='{self.title[:30]}')>"
