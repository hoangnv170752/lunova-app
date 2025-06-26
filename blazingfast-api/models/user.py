from sqlalchemy import Column, String, DateTime, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String)
    avatar_url = Column(String)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    role = Column(String, default="user")
    preferences = Column(JSON)
