from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from enum import Enum

class ShipmentStatus(str, Enum):
    PENDING = "pending"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class RouteDetails(BaseModel):
    origin: str
    destination: str
    waypoints: Optional[List[str]] = None
    distance: Optional[float] = None
    estimated_time: Optional[str] = None

class ShipmentBase(BaseModel):
    shipment_number: str = Field(...,min_length=5, max_length=20, description="Unique identifier for the shipment")
    route: RouteDetails
    device_id: str = Field(..., description="ID of the tracking device assigned to this shipment")
    po_number: str = Field(..., description="Purchase Order number")
    ndc_number: str = Field(..., description="National Drug Code number")
    serial_numbers: List[str] = Field(..., description="List of serial numbers of goods")
    container_number: str = Field(..., description="Container number")
    goods_type: str = Field(..., description="Type of goods being shipped")
    expected_delivery_date: date = Field(..., description="Expected date of delivery")
    delivery_number: str = Field(..., description="Delivery reference number")
    batch_id: str = Field(..., description="Batch or lot ID of the goods")
    description: Optional[str] = Field(None, description="Additional shipment details")
    status: ShipmentStatus = ShipmentStatus.PENDING

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
    rooute: Optional[RouteDetails] = None
    expected_delivery_date: Optional[date] = None