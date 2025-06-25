from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import datetime
import json

from models import get_db, Product

router = APIRouter(
    prefix="/products",
    tags=["products"],
)

# Pydantic models for request/response
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    sale_price: Optional[Decimal] = None
    category: str
    subcategory: Optional[str] = None
    material: Optional[str] = None
    weight: Optional[Decimal] = None
    dimensions: Optional[str] = None
    stock_quantity: int = 0
    is_featured: bool = False
    is_new: bool = True
    is_on_sale: bool = False
    product_metadata: dict = Field(default_factory=dict)

class ProductCreate(ProductBase):
    shop_id: UUID

class ProductUpdate(ProductBase):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    category: Optional[str] = None
    stock_quantity: Optional[int] = None

class ProductResponse(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    shop_id: UUID

    class Config:
        orm_mode = True

# Routes
@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    db_product = Product(
        **product.dict()
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/", response_model=List[ProductResponse])
def get_products(
    skip: int = 0, 
    limit: int = 100,
    category: Optional[str] = None,
    is_featured: Optional[bool] = None,
    is_new: Optional[bool] = None,
    is_on_sale: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    shop_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    
    # Apply filters
    if category:
        query = query.filter(Product.category == category)
    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)
    if is_new is not None:
        query = query.filter(Product.is_new == is_new)
    if is_on_sale is not None:
        query = query.filter(Product.is_on_sale == is_on_sale)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if shop_id:
        query = query.filter(Product.shop_id == shop_id)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: UUID, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: UUID, product: ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    
    db_product.updated_at = datetime.now()
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}", response_model=dict)
def delete_product(product_id: UUID, db: Session = Depends(get_db)):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if db_product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}

@router.get("/category/{category}", response_model=List[ProductResponse])
def get_products_by_category(category: str, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.category == category).all()
    return products

@router.get("/shop/{shop_id}", response_model=List[ProductResponse])
def get_products_by_shop(shop_id: UUID, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.shop_id == shop_id).all()
    return products