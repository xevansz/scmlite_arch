from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any

class PaginatedResponse(BaseModel):
    data: List[Dict[str, Any]]
    total: int
    page: int
    limit: int
    total_pages: int

class DataPointBase(BaseModel):
    device_id: int
    battery_level: float = Field(..., ge=0, le=100)
    temperature: float
    route_from: str
    route_to: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DataPointCreate(DataPointBase):
    pass

class DataPointInDB(DataPointBase):
    id: str
    
    class Config:
        from_attributes = True

class DataQueryParams:
    def __init__(
        self,
        device_id: Optional[int] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100
    ):
        self.device_id = device_id
        self.start_time = start_time
        self.end_time = end_time
        self.limit = limit