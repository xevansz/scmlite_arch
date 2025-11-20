from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class ShipmentStatus(str, Enum):
    PENDING = "pending"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class ShipmentBase(BaseModel):
    origin: str
    destination: str
    status: ShipmentStatus = ShipmentStatus.PENDING
    description: Optional[str] = None

class ShipmentCreate(ShipmentBase):
    pass

class ShipmentInDB(ShipmentBase):
    id: str
    created_by: str  # User ID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ShipmentUpdate(BaseModel):
    status: Optional[ShipmentStatus] = None
    description: Optional[str] = None