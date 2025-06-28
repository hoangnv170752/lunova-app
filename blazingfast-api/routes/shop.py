from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
from pydantic import BaseModel, Field
from datetime import datetime
from models import Shop, get_db

router = APIRouter(
    prefix="/shops",
    tags=["shops"],
    responses={404: {"description": "Not found"}},
)

# Pydantic models for request/response
class SocialMediaModel(BaseModel):
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    website: Optional[str] = None

    class Config:
        from_attributes = True

class AddressModel(BaseModel):
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    
    class Config:
        from_attributes = True

class BusinessHoursModel(BaseModel):
    monday: Optional[str] = None
    tuesday: Optional[str] = None
    wednesday: Optional[str] = None
    thursday: Optional[str] = None
    friday: Optional[str] = None
    saturday: Optional[str] = None
    sunday: Optional[str] = None
    
    class Config:
        from_attributes = True

class ShopBase(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    social_media: Optional[Dict[str, Any]] = None

class ShopCreate(ShopBase):
    owner_id: uuid.UUID

class ShopUpdate(ShopBase):
    pass

class ShopResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    business_hours: Optional[Dict[str, Any]] = None
    social_media: Optional[Dict[str, Any]] = None
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    owner_id: uuid.UUID

    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm(cls, db_shop):
        # Create a dict with all the shop data
        shop_dict = {
            "id": db_shop.id,
            "name": db_shop.name,
            "description": db_shop.description,
            "logo_url": db_shop.logo_url,
            "banner_url": db_shop.banner_url,
            "contact_email": db_shop.contact_email,
            "contact_phone": db_shop.contact_phone,
            "business_hours": db_shop.business_hours,
            "social_media": db_shop.social_media,
            "is_verified": db_shop.is_verified,
            "created_at": db_shop.created_at,
            "updated_at": db_shop.updated_at,
            "owner_id": db_shop.owner_id
        }
        
        # Extract address fields if they exist
        address = db_shop.address or {}
        shop_dict["address"] = address.get("street", "")
        shop_dict["city"] = address.get("city", "")
        shop_dict["state"] = address.get("state", "")
        shop_dict["country"] = address.get("country", "")
        shop_dict["postal_code"] = address.get("postal_code", "")
        
        return cls(**shop_dict)

# CRUD operations
@router.post("/", response_model=ShopResponse, status_code=status.HTTP_201_CREATED)
def create_shop(shop: ShopCreate, db: Session = Depends(get_db)):
    """Create a new shop"""
    # Convert the shop data to a dictionary
    shop_data = shop.model_dump()
    
    # Create address JSON object from separate fields
    address_data = {
        "street": shop_data.pop("address", ""),
        "city": shop_data.pop("city", ""),
        "state": shop_data.pop("state", ""),
        "country": shop_data.pop("country", ""),
        "postal_code": shop_data.pop("postal_code", "")
    }
    
    # Add the address JSON to the shop data
    shop_data["address"] = address_data
    
    # Handle empty strings for other JSON fields
    for field in ['business_hours', 'social_media']:
        if field in shop_data and (shop_data[field] == "" or shop_data[field] is None):
            shop_data[field] = {}
    
    # Create the shop object
    db_shop = Shop(**shop_data)
    db.add(db_shop)
    db.commit()
    db.refresh(db_shop)
    return ShopResponse.from_orm(db_shop)

@router.get("/", response_model=List[ShopResponse])
def get_shops(
    skip: int = 0, 
    limit: int = 100, 
    name: Optional[str] = None,
    owner_id: Optional[uuid.UUID] = None,
    is_verified: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get all shops with optional filtering"""
    query = db.query(Shop)
    
    # Apply filters if provided
    if name:
        query = query.filter(Shop.name.ilike(f"%{name}%"))
    if owner_id:
        query = query.filter(Shop.owner_id == owner_id)
    if is_verified is not None:
        query = query.filter(Shop.is_verified == is_verified)
    
    # Get shops and convert to response model    
    shops = query.offset(skip).limit(limit).all()
    return [ShopResponse.from_orm(shop) for shop in shops]

@router.get("/{shop_id}", response_model=ShopResponse)
def get_shop(shop_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific shop by ID"""
    db_shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if db_shop is None:
        raise HTTPException(status_code=404, detail="Shop not found")
    return ShopResponse.from_orm(db_shop)

@router.put("/{shop_id}", response_model=ShopResponse)
def update_shop(shop_id: uuid.UUID, shop: ShopUpdate, db: Session = Depends(get_db)):
    """Update a shop"""
    db_shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if db_shop is None:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    # Get shop data as dictionary
    shop_data = shop.model_dump(exclude_unset=True)
    
    # Process address fields if any are present
    address_fields = ["address", "city", "state", "country", "postal_code"]
    if any(field in shop_data for field in address_fields):
        # Get current address or empty dict
        current_address = db_shop.address or {}
        
        # Update with new values
        if "address" in shop_data:
            current_address["street"] = shop_data.pop("address")
        if "city" in shop_data:
            current_address["city"] = shop_data.pop("city")
        if "state" in shop_data:
            current_address["state"] = shop_data.pop("state")
        if "country" in shop_data:
            current_address["country"] = shop_data.pop("country")
        if "postal_code" in shop_data:
            current_address["postal_code"] = shop_data.pop("postal_code")
            
        # Set the updated address
        shop_data["address"] = current_address
    
    # Handle empty strings for other JSON fields
    for field in ['business_hours', 'social_media']:
        if field in shop_data and (shop_data[field] == "" or shop_data[field] is None):
            shop_data[field] = {}
    
    # Update shop attributes
    for key, value in shop_data.items():
        setattr(db_shop, key, value)
    
    db.commit()
    db.refresh(db_shop)
    return ShopResponse.from_orm(db_shop)

@router.delete("/{shop_id}", response_model=dict)
def delete_shop(shop_id: uuid.UUID, db: Session = Depends(get_db)):
    db_shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if db_shop is None:
        raise HTTPException(status_code=404, detail="Shop not found")
    
    db.delete(db_shop)
    db.commit()
    return {"message": "Shop deleted successfully"}

# Pydantic model for count response
class CountResponse(BaseModel):
    count: int

# Get total count of shops owned by a specific user
@router.get("/count/", response_model=CountResponse)
def get_shop_count(owner_id: uuid.UUID, db: Session = Depends(get_db)):
    count = db.query(Shop).filter(Shop.owner_id == owner_id).count()
    return CountResponse(count=count)
