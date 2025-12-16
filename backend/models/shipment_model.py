from pydantic import BaseModel, Field, field_validator
from datetime import datetime, datetime
from typing import Optional, List
from enum import Enum
import re

ALPHANUMERIC_HYPHEN = re.compile(r"^[A-Za-z0-9-]+$")

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
    shipment_number: str = Field(..., description="Unique identifier for the shipment")
    route: RouteDetails
    device_id: int = Field(..., description="ID of the tracking device assigned to this shipment")
    po_number: str = Field(..., description="Purchase Order number")
    ndc_number: str = Field(..., description="National Drug Code number")
    serial_numbers: List[str] = Field(..., description="List of serial numbers of goods")
    container_number: str = Field(..., description="Container number")
    goods_type: str = Field(..., description="Type of goods being shipped")
    expected_delivery_date: datetime = Field(..., description="Expected date of delivery")
    delivery_number: str = Field(..., description="Delivery reference number")
    batch_id: str = Field(..., description="Batch or lot ID of the goods")
    description: str | None = Field(None, description="Additional shipment details")
    status: ShipmentStatus = ShipmentStatus.PENDING

@field_validator(
    "po_number",
    "ndc_number",
    "container_number",
    "delivery_number",
    "batch_id"
)

@classmethod
def validate_alphanumeric_hyphen(cls, value:str):
    if not ALPHANUMERIC_HYPHEN.match(value):
        raise ValueError(
            "only letters, numbers, and hyphens are allowed"
        )
    return value

@field_validator("serial_numbers")
@classmethod
def validate_serial_numbers(cls, values: List[str]):
    if not values:
        raise ValueError("At least one serial number is required")

    for v in values:
        if not ALPHANUMERIC_HYPHEN.match(v):
            raise ValueError(
                "serial numbers must contain only letters, numbers, and hyphens"
            )
    return values

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
    route: Optional[RouteDetails] = None
    expected_delivery_date: Optional[datetime] = None