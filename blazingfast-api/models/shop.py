from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from .database import Base

class Shop(Base):
    __tablename__ = "shops"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True))  # Using Supabase user UUID without FK constraint
    name = Column(String, nullable=False)
    description = Column(Text)
    logo_url = Column(String)
    banner_url = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    address = Column(JSON)  # Storing address as JSON
    business_hours = Column(JSON)  # Storing business hours as JSON
    social_media = Column(JSON)  # Storing social media links as JSON
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
