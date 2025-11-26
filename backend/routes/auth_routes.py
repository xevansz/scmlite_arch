from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
import logging
from pymongo import ReturnDocument

from ..models.user_model import UserCreate, UserLogin
from ..database import db
from ..utils.security import (
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["authentication"])
logger = logging.getLogger(__name__)

@router.post("/signup", response_model=dict)
async def signup(user: UserCreate):
    """Register a new user."""
    try:
        users_collection = db.get_collection("users")
        
        # Check if user exists
        if users_collection.find_one({"email": user.email}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # In production, you should hash the password here
        user_data = user.dict()
        user_data["hashed_password"] = user.password  # In production, use password hashing
        user_data["created_at"] = datetime.now(timezone.utc)
        
        result = users_collection.insert_one(user_data)
        return {
            "message": "User created successfully",
            "user_id": str(result.inserted_id)
        }
        
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )

@router.post("/login", response_model=dict)
async def login(user: UserLogin):
    """User login and get access token."""
    try:
        users_collection = db.get_collection("users")
        user_data = users_collection.find_one({"email": user.email})
        
        if not user_data or user_data.get("hashed_password") != user.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Create token
        access_token = create_access_token(
            data={"sub": str(user_data["_id"]), "email": user.email}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error during login"
        )

@router.get("/me", response_model=dict)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return current_user