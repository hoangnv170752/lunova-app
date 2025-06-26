from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime

from models import get_db, UserSetting

router = APIRouter(
    prefix="/user-settings",
    tags=["user-settings"],
)

# Pydantic models for request/response
class EmailNotificationsModel(BaseModel):
    marketing: bool = False
    orders: bool = True
    account: bool = True

class UserSettingBase(BaseModel):
    language: Optional[str] = "en"
    theme: Optional[str] = "dark"
    notifications_enabled: Optional[bool] = True
    email_notifications: Optional[EmailNotificationsModel] = Field(
        default_factory=lambda: EmailNotificationsModel()
    )

class UserSettingCreate(UserSettingBase):
    user_id: UUID

class UserSettingUpdate(UserSettingBase):
    pass

class UserSettingResponse(UserSettingBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Routes
@router.post("/", response_model=UserSettingResponse)
def create_user_setting(
    user_setting: UserSettingCreate, 
    db: Session = Depends(get_db)
):
    # Check if settings already exist for this user
    existing_setting = db.query(UserSetting).filter(UserSetting.user_id == user_setting.user_id).first()
    if existing_setting:
        raise HTTPException(status_code=400, detail="Settings already exist for this user")
    
    # Create database entry
    db_user_setting = UserSetting(
        user_id=user_setting.user_id,
        language=user_setting.language,
        theme=user_setting.theme,
        notifications_enabled=user_setting.notifications_enabled,
        email_notifications=user_setting.email_notifications.dict() if user_setting.email_notifications else None
    )
    
    db.add(db_user_setting)
    db.commit()
    db.refresh(db_user_setting)
    return db_user_setting

@router.get("/user/{user_id}", response_model=UserSettingResponse)
def get_user_setting_by_user_id(user_id: UUID, db: Session = Depends(get_db)):
    user_setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if user_setting is None:
        raise HTTPException(status_code=404, detail="User settings not found")
    return user_setting

@router.get("/{setting_id}", response_model=UserSettingResponse)
def get_user_setting(setting_id: UUID, db: Session = Depends(get_db)):
    user_setting = db.query(UserSetting).filter(UserSetting.id == setting_id).first()
    if user_setting is None:
        raise HTTPException(status_code=404, detail="User settings not found")
    return user_setting

@router.put("/user/{user_id}", response_model=UserSettingResponse)
def update_user_setting_by_user_id(
    user_id: UUID, 
    user_setting: UserSettingUpdate, 
    db: Session = Depends(get_db)
):
    db_user_setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if db_user_setting is None:
        raise HTTPException(status_code=404, detail="User settings not found")
    
    update_data = user_setting.dict(exclude_unset=True)
    
    # Handle email_notifications separately since it's a JSON field
    if "email_notifications" in update_data and update_data["email_notifications"]:
        update_data["email_notifications"] = update_data["email_notifications"].dict()
    
    for key, value in update_data.items():
        setattr(db_user_setting, key, value)
    
    db.commit()
    db.refresh(db_user_setting)
    return db_user_setting

@router.patch("/user/{user_id}/email-notifications", response_model=UserSettingResponse)
def update_email_notifications(
    user_id: UUID,
    email_notifications: Dict[str, bool],
    db: Session = Depends(get_db)
):
    db_user_setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if db_user_setting is None:
        raise HTTPException(status_code=404, detail="User settings not found")
    
    # Get current email notifications
    current_notifications = db_user_setting.email_notifications or {}
    
    # Update with new values
    for key, value in email_notifications.items():
        current_notifications[key] = value
    
    # Set the updated notifications
    db_user_setting.email_notifications = current_notifications
    
    db.commit()
    db.refresh(db_user_setting)
    return db_user_setting

@router.delete("/user/{user_id}", response_model=dict)
def delete_user_setting(user_id: UUID, db: Session = Depends(get_db)):
    db_user_setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if db_user_setting is None:
        raise HTTPException(status_code=404, detail="User settings not found")
    
    db.delete(db_user_setting)
    db.commit()
    return {"message": "User settings deleted successfully"}
