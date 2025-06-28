from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional, Dict, Any
import uuid
from pydantic import BaseModel, Field
from datetime import datetime
from models import Ticket, get_db

router = APIRouter(
    prefix="/tickets",
    tags=["tickets"],
    responses={404: {"description": "Not found"}},
)

# Pydantic models for request/response
class TicketBase(BaseModel):
    subject: str
    description: str
    category: str
    priority: str = "medium"
    related_order_id: Optional[uuid.UUID] = None
    related_product_id: Optional[uuid.UUID] = None
    attachments: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

class TicketCreate(TicketBase):
    user_id: uuid.UUID

class TicketUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    assigned_to: Optional[uuid.UUID] = None
    attachments: Optional[List[Dict[str, Any]]] = None

class TicketResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    subject: str
    description: str
    status: str
    priority: str
    category: str
    assigned_to: Optional[uuid.UUID] = None
    related_order_id: Optional[uuid.UUID] = None
    related_product_id: Optional[uuid.UUID] = None
    attachments: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# CRUD operations
@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    """Create a new ticket"""
    db_ticket = Ticket(
        user_id=ticket.user_id,
        subject=ticket.subject,
        description=ticket.description,
        category=ticket.category,
        priority=ticket.priority,
        related_order_id=ticket.related_order_id,
        related_product_id=ticket.related_product_id,
        attachments=ticket.attachments
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.get("/", response_model=List[TicketResponse])
def get_tickets(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    assigned_to: Optional[uuid.UUID] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db: Session = Depends(get_db)
):
    """Get all tickets with optional filtering"""
    query = db.query(Ticket)
    
    # Apply filters
    if user_id:
        query = query.filter(Ticket.user_id == user_id)
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if category:
        query = query.filter(Ticket.category == category)
    if assigned_to:
        query = query.filter(Ticket.assigned_to == assigned_to)
    
    # Apply sorting
    if sort_order.lower() == "asc":
        query = query.order_by(asc(getattr(Ticket, sort_by)))
    else:
        query = query.order_by(desc(getattr(Ticket, sort_by)))
    
    # Apply pagination
    tickets = query.offset(skip).limit(limit).all()
    return tickets

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: uuid.UUID, db: Session = Depends(get_db)):
    """Get a specific ticket by ID"""
    db_ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if db_ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return db_ticket

@router.put("/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: uuid.UUID, ticket: TicketUpdate, db: Session = Depends(get_db)):
    """Update a ticket"""
    db_ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if db_ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Update ticket fields if provided
    update_data = ticket.dict(exclude_unset=True)
    
    # Check if status is being updated to "resolved"
    if update_data.get("status") == "resolved" and db_ticket.status != "resolved":
        update_data["resolved_at"] = datetime.now()
    
    for key, value in update_data.items():
        setattr(db_ticket, key, value)
    
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: uuid.UUID, db: Session = Depends(get_db)):
    """Delete a ticket"""
    db_ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if db_ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    db.delete(db_ticket)
    db.commit()
    return None
