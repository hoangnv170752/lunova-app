from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
from pydantic import BaseModel, EmailStr
from datetime import datetime
from models import User, get_db

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

# Pydantic models for request/response
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: Optional[str] = "user"
    preferences: Optional[Dict[str, Any]] = None

class UserCreate(UserBase):
    id: uuid.UUID  # Use the UUID from Supabase auth

class UserUpdate(UserBase):
    pass

class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

# CRUD operations
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    # Check if user already exists
    db_user = db.query(User).filter(User.id == user.id).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Convert the user data to a dictionary
    user_data = user.model_dump()
    
    # Handle empty preferences
    if user_data.get("preferences") is None:
        user_data["preferences"] = {}
    
    # Create the user object
    db_user = User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """Get all users"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific user by ID"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: uuid.UUID, user: UserUpdate, db: Session = Depends(get_db)):
    """Update a user"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user data as dictionary
    user_data = user.model_dump(exclude_unset=True)
    
    # Handle empty preferences
    if "preferences" in user_data and user_data["preferences"] is None:
        user_data["preferences"] = {}
    
    # Update user attributes
    for key, value in user_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a user"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return None
