from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime
import os
import httpx
from urllib.parse import urljoin

from models import get_db, ProductTryonImage

router = APIRouter(
    prefix="/product-tryon-images",
    tags=["product-tryon-images"],
)

# Supabase storage configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
STORAGE_BUCKET = "images"

# Pydantic models for request/response
class ProductTryonImageBase(BaseModel):
    product_id: UUID
    user_id: UUID
    is_favorite: bool = False
    metadata: Dict = Field(default_factory=dict)

class ProductTryonImageCreate(ProductTryonImageBase):
    image_url: str  # This will be the path in Supabase storage
    thumbnail_url: Optional[str] = None

class ProductTryonImageUpdate(BaseModel):
    is_favorite: Optional[bool] = None
    metadata: Optional[Dict] = None

class ProductTryonImageResponse(ProductTryonImageBase):
    id: UUID
    image_url: str
    thumbnail_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

# Helper function to get Supabase storage URL
def get_storage_url(path: str) -> str:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase configuration missing")
    
    return f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{path}"

# Routes
@router.post("/", response_model=ProductTryonImageResponse)
async def create_product_tryon_image(
    product_tryon_image: ProductTryonImageCreate, 
    db: Session = Depends(get_db)
):
    # Create database entry
    db_product_tryon_image = ProductTryonImage(
        product_id=product_tryon_image.product_id,
        user_id=product_tryon_image.user_id,
        image_url=product_tryon_image.image_url,
        thumbnail_url=product_tryon_image.thumbnail_url,
        is_favorite=product_tryon_image.is_favorite,
        tryon_metadata=product_tryon_image.metadata
    )
    
    db.add(db_product_tryon_image)
    db.commit()
    db.refresh(db_product_tryon_image)
    return db_product_tryon_image

@router.get("/", response_model=List[ProductTryonImageResponse])
def get_product_tryon_images(
    product_id: Optional[UUID] = None,
    user_id: Optional[UUID] = None,
    is_favorite: Optional[bool] = None,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(ProductTryonImage)
    
    # Apply filters
    if product_id:
        query = query.filter(ProductTryonImage.product_id == product_id)
    if user_id:
        query = query.filter(ProductTryonImage.user_id == user_id)
    if is_favorite is not None:
        query = query.filter(ProductTryonImage.is_favorite == is_favorite)
    
    # Order by created_at (newest first)
    query = query.order_by(ProductTryonImage.created_at.desc())
    
    return query.offset(skip).limit(limit).all()

@router.get("/{image_id}", response_model=ProductTryonImageResponse)
def get_product_tryon_image(image_id: UUID, db: Session = Depends(get_db)):
    product_tryon_image = db.query(ProductTryonImage).filter(ProductTryonImage.id == image_id).first()
    if product_tryon_image is None:
        raise HTTPException(status_code=404, detail="Product try-on image not found")
    return product_tryon_image

@router.put("/{image_id}", response_model=ProductTryonImageResponse)
def update_product_tryon_image(
    image_id: UUID, 
    product_tryon_image: ProductTryonImageUpdate, 
    db: Session = Depends(get_db)
):
    db_product_tryon_image = db.query(ProductTryonImage).filter(ProductTryonImage.id == image_id).first()
    if db_product_tryon_image is None:
        raise HTTPException(status_code=404, detail="Product try-on image not found")
    
    update_data = product_tryon_image.dict(exclude_unset=True)
    
    # Handle metadata separately to avoid overwriting the entire object
    if 'metadata' in update_data:
        if db_product_tryon_image.tryon_metadata is None:
            db_product_tryon_image.tryon_metadata = update_data['metadata']
        else:
            # Update existing metadata
            db_product_tryon_image.tryon_metadata.update(update_data['metadata'])
        del update_data['metadata']
    
    # Update other fields
    for key, value in update_data.items():
        setattr(db_product_tryon_image, key, value)
    
    db.commit()
    db.refresh(db_product_tryon_image)
    return db_product_tryon_image

@router.delete("/{image_id}", response_model=dict)
async def delete_product_tryon_image(
    image_id: UUID, 
    db: Session = Depends(get_db)
):
    db_product_tryon_image = db.query(ProductTryonImage).filter(ProductTryonImage.id == image_id).first()
    if db_product_tryon_image is None:
        raise HTTPException(status_code=404, detail="Product try-on image not found")
    
    # Get the image paths from the URLs
    image_path = db_product_tryon_image.image_url.split("/")[-1] if "/" in db_product_tryon_image.image_url else db_product_tryon_image.image_url
    
    # Try to delete from Supabase storage
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "apikey": SUPABASE_KEY
                }
                # Delete main image
                delete_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{image_path}"
                response = await client.delete(delete_url, headers=headers)
                if response.status_code not in (200, 404):  # 404 means already deleted
                    print(f"Failed to delete image from storage: {response.text}")
                
                # Delete thumbnail if it exists
                if db_product_tryon_image.thumbnail_url:
                    thumbnail_path = db_product_tryon_image.thumbnail_url.split("/")[-1] if "/" in db_product_tryon_image.thumbnail_url else db_product_tryon_image.thumbnail_url
                    delete_thumbnail_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{thumbnail_path}"
                    thumbnail_response = await client.delete(delete_thumbnail_url, headers=headers)
                    if thumbnail_response.status_code not in (200, 404):
                        print(f"Failed to delete thumbnail from storage: {thumbnail_response.text}")
        except Exception as e:
            print(f"Error deleting image from storage: {str(e)}")
    
    # Delete from database
    db.delete(db_product_tryon_image)
    db.commit()
    return {"message": "Product try-on image deleted successfully"}

@router.get("/user/{user_id}", response_model=List[ProductTryonImageResponse])
def get_tryon_images_by_user(
    user_id: UUID, 
    product_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ProductTryonImage).filter(ProductTryonImage.user_id == user_id)
    
    if product_id:
        query = query.filter(ProductTryonImage.product_id == product_id)
    
    return query.order_by(ProductTryonImage.created_at.desc()).all()

@router.get("/product/{product_id}", response_model=List[ProductTryonImageResponse])
def get_tryon_images_by_product(
    product_id: UUID,
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ProductTryonImage).filter(ProductTryonImage.product_id == product_id)
    
    if user_id:
        query = query.filter(ProductTryonImage.user_id == user_id)
    
    return query.order_by(ProductTryonImage.created_at.desc()).all()

@router.get("/favorites/{user_id}", response_model=List[ProductTryonImageResponse])
def get_favorite_tryon_images(user_id: UUID, db: Session = Depends(get_db)):
    return db.query(ProductTryonImage).filter(
        ProductTryonImage.user_id == user_id,
        ProductTryonImage.is_favorite == True
    ).order_by(ProductTryonImage.created_at.desc()).all()

@router.put("/{image_id}/toggle-favorite", response_model=ProductTryonImageResponse)
def toggle_favorite_status(image_id: UUID, db: Session = Depends(get_db)):
    db_product_tryon_image = db.query(ProductTryonImage).filter(ProductTryonImage.id == image_id).first()
    if db_product_tryon_image is None:
        raise HTTPException(status_code=404, detail="Product try-on image not found")
    
    # Toggle favorite status
    db_product_tryon_image.is_favorite = not db_product_tryon_image.is_favorite
    
    db.commit()
    db.refresh(db_product_tryon_image)
    return db_product_tryon_image
