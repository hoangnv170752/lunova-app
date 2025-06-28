from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime
import os
import httpx
from urllib.parse import urljoin

from models import get_db, ProductImage, Product

router = APIRouter(
    prefix="/product-images",
    tags=["product-images"],
)

# Supabase storage configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
STORAGE_BUCKET = "images"

# Pydantic models for request/response
class ProductImageBase(BaseModel):
    product_id: UUID
    alt_text: Optional[str] = None
    is_primary: bool = False
    display_order: int = 0

class ProductImageCreate(ProductImageBase):
    image_url: str  # This will be the path in Supabase storage

class ProductImageUpdate(BaseModel):
    alt_text: Optional[str] = None
    is_primary: Optional[bool] = None
    display_order: Optional[int] = None

class ProductImageResponse(ProductImageBase):
    id: UUID
    image_url: str
    created_at: datetime

    class Config:
        orm_mode = True

# Helper function to get Supabase storage URL
def get_storage_url(path: str) -> str:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{path}"

# Routes
@router.post("/", response_model=ProductImageResponse)
async def create_product_image(
    product_image: ProductImageCreate, 
    db: Session = Depends(get_db)
):
    # First, verify that the product exists
    product = db.query(Product).filter(Product.id == product_image.product_id).first()
    if not product:
        raise HTTPException(
            status_code=404, 
            detail=f"Product with id {product_image.product_id} not found. Cannot create image for non-existent product."
        )
    
    # Create database entry
    db_product_image = ProductImage(
        product_id=product_image.product_id,
        image_url=product_image.image_url,
        alt_text=product_image.alt_text,
        is_primary=product_image.is_primary,
        display_order=product_image.display_order
    )
    
    db.add(db_product_image)
    db.commit()
    db.refresh(db_product_image)
    return db_product_image

@router.get("/", response_model=List[ProductImageResponse])
def get_product_images(
    product_id: Optional[UUID] = None,
    is_primary: Optional[bool] = None,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(ProductImage)
    
    # Apply filters
    if product_id:
        query = query.filter(ProductImage.product_id == product_id)
    if is_primary is not None:
        query = query.filter(ProductImage.is_primary == is_primary)
    
    # Order by display_order
    query = query.order_by(ProductImage.display_order)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{image_id}", response_model=ProductImageResponse)
def get_product_image(image_id: UUID, db: Session = Depends(get_db)):
    product_image = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if product_image is None:
        raise HTTPException(status_code=404, detail="Product image not found")
    return product_image

@router.put("/{image_id}", response_model=ProductImageResponse)
def update_product_image(
    image_id: UUID, 
    product_image: ProductImageUpdate, 
    db: Session = Depends(get_db)
):
    db_product_image = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if db_product_image is None:
        raise HTTPException(status_code=404, detail="Product image not found")
    
    update_data = product_image.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product_image, key, value)
    
    db.commit()
    db.refresh(db_product_image)
    return db_product_image

@router.delete("/{image_id}", response_model=dict)
async def delete_product_image(
    image_id: UUID, 
    db: Session = Depends(get_db)
):
    db_product_image = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if db_product_image is None:
        raise HTTPException(status_code=404, detail="Product image not found")
    
    # Get the image path from the URL
    image_path = db_product_image.image_url.split("/")[-1] if "/" in db_product_image.image_url else db_product_image.image_url
    
    # Try to delete from Supabase storage
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "apikey": SUPABASE_KEY
                }
                delete_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{image_path}"
                response = await client.delete(delete_url, headers=headers)
                if response.status_code not in (200, 404):  # 404 means already deleted
                    print(f"Failed to delete image from storage: {response.text}")
        except Exception as e:
            print(f"Error deleting image from storage: {str(e)}")
    
    # Delete from database
    db.delete(db_product_image)
    db.commit()
    return {"message": "Product image deleted successfully"}

@router.get("/product/{product_id}", response_model=List[ProductImageResponse])
def get_images_by_product(product_id: UUID, db: Session = Depends(get_db)):
    images = db.query(ProductImage).filter(ProductImage.product_id == product_id).order_by(ProductImage.display_order).all()
    return images

@router.get("/primary/{product_id}", response_model=Optional[ProductImageResponse])
def get_primary_image(product_id: UUID, db: Session = Depends(get_db)):
    primary_image = db.query(ProductImage).filter(
        ProductImage.product_id == product_id,
        ProductImage.is_primary == True
    ).first()
    
    if not primary_image:
        # If no primary image is set, return the first image
        primary_image = db.query(ProductImage).filter(
            ProductImage.product_id == product_id
        ).order_by(ProductImage.display_order).first()
        
    return primary_image
