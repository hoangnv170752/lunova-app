from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional, Dict, Any
import uuid
from pydantic import BaseModel, Field
from datetime import datetime
from models import TicketResponse, Ticket, get_db

router = APIRouter(
    prefix="/ticket-responses",
    tags=["ticket responses"],
    responses={404: {"description": "Not found"}},
)

# Pydantic models for request/response
class TicketResponseBase(BaseModel):
    ticket_id: uuid.UUID
    user_id: uuid.UUID
    is_staff: bool = False
    message: str
    attachments: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class TicketResponseCreate(TicketResponseBase):
    pass

class TicketResponseUpdate(BaseModel):
    message: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None

class TicketResponseResponse(BaseModel):
    id: uuid.UUID
    ticket_id: uuid.UUID
    user_id: uuid.UUID
    is_staff: bool
    message: str
    attachments: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# CRUD operations
@router.post("/", response_model=TicketResponseResponse, status_code=status.HTTP_201_CREATED)
def create_ticket_response(response: TicketResponseCreate, db: Session = Depends(get_db)):
    """Create a new ticket response"""
    # Verify that the ticket exists
    ticket = db.query(Ticket).filter(Ticket.id == response.ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db_response = TicketResponse(
        ticket_id=response.ticket_id,
        user_id=response.user_id,
        is_staff=response.is_staff,
        message=response.message,
        attachments=response.attachments
    )
    
    # If a staff member responds to a ticket, update the ticket status to "in_progress" if it's "open"
    if response.is_staff and ticket.status == "open":
        ticket.status = "in_progress"
        ticket.updated_at = datetime.now()
    
    db.add(db_response)
    db.commit()
    db.refresh(db_response)
    return db_response

@router.get("/", response_model=List[TicketResponseResponse])
def get_ticket_responses(
    skip: int = 0,
    limit: int = 100,
    ticket_id: Optional[uuid.UUID] = None,
    user_id: Optional[uuid.UUID] = None,
    is_staff: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    """Get all ticket responses with optional filtering"""
    query = db.query(TicketResponse)
    
    # Apply filters
    if ticket_id:
        query = query.filter(TicketResponse.ticket_id == ticket_id)
    if user_id:
        query = query.filter(TicketResponse.user_id == user_id)
    if is_staff is not None:
        query = query.filter(TicketResponse.is_staff == is_staff)
    
    # Apply sorting
    if sort_order.lower() == "asc":
        query = query.order_by(asc(getattr(TicketResponse, sort_by)))
    else:
        query = query.order_by(desc(getattr(TicketResponse, sort_by)))
    
    # Apply pagination
    responses = query.offset(skip).limit(limit).all()
    return responses

@router.get("/{response_id}", response_model=TicketResponseResponse)
def get_ticket_response(response_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific ticket response by ID"""
    db_response = db.query(TicketResponse).filter(TicketResponse.id == response_id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Ticket response not found")
    return db_response

@router.get("/ticket/{ticket_id}", response_model=List[TicketResponseResponse])
def get_responses_by_ticket(
    ticket_id: uuid.UUID, 
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all responses for a specific ticket"""
    # Verify that the ticket exists
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    responses = db.query(TicketResponse).filter(
        TicketResponse.ticket_id == ticket_id
    ).order_by(asc(TicketResponse.created_at)).offset(skip).limit(limit).all()
    
    return responses

@router.put("/{response_id}", response_model=TicketResponseResponse)
def update_ticket_response(response_id: uuid.UUID, response: TicketResponseUpdate, db: Session = Depends(get_db)):
    """Update a ticket response"""
    db_response = db.query(TicketResponse).filter(TicketResponse.id == response_id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Ticket response not found")
    
    # Update response fields if provided
    update_data = response.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_response, key, value)
    
    db.commit()
    db.refresh(db_response)
    return db_response

@router.delete("/{response_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket_response(response_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a ticket response"""
    db_response = db.query(TicketResponse).filter(TicketResponse.id == response_id).first()
    if db_response is None:
        raise HTTPException(status_code=404, detail="Ticket response not found")
    
    db.delete(db_response)
    db.commit()
    return None
