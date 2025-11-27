from pydantic import BaseModel
from typing import List, Dict, Any

class PaginatedResponse(BaseModel):
    data: List[Dict[str, Any]]
    total: int
    page: int
    limit: int
    total_pages: int