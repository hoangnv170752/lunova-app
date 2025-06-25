from sqlalchemy import Column, String, Numeric, Integer, Boolean, ForeignKey, DateTime, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from .database import Base

class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    sale_price = Column(Numeric(10, 2))
    category = Column(String, nullable=False)
    subcategory = Column(String)
    material = Column(String)
    weight = Column(Numeric(10, 2))
    dimensions = Column(String)
    stock_quantity = Column(Integer, nullable=False, default=0)
    is_featured = Column(Boolean, default=False)
    is_new = Column(Boolean, default=True)
    is_on_sale = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    shop_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    product_metadata = Column("metadata", JSON, default={})