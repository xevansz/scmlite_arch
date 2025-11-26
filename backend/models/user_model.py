from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr = Field(..., max_length=100)
    full_name: str
    
class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=6,
        max_length=50
    )
    
class UserInDB(UserBase):
    id: str
    hashed_password: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str