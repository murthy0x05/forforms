import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Response(Base):
    """Response model — represents a single form submission."""

    __tablename__ = "responses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    form_id = Column(String(36), ForeignKey("forms.id", ondelete="CASCADE"), nullable=False)
    submitted_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    metadata_ = Column("metadata", JSON, nullable=True, default=dict)  # browser info, IP, etc.

    # Relationships
    form = relationship("Form", back_populates="responses")
    answers = relationship("Answer", back_populates="response", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Response(id={self.id}, form_id={self.form_id})>"
