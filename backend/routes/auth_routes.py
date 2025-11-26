from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import logging

from ..models.user_model import UserCreate, UserLogin
from ..database import db
from ..utils.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["authentication"])
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/signup", response_model=dict)
def signup(user: UserCreate):
    """Register a new user."""
    logger.info(f"Signup attempt for email: {user.email}")

    try:
        # Get users collection
        users_collection = db.get_collection("users")
        
        # Check if user already exists
        if users_collection.find_one({"email": user.email}):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password and prepare user data
        hashed_password = get_password_hash(user.password)
        user_data = user.dict()
        user_data["hashed_password"] = hashed_password
        user_data["created_at"] = datetime.now(timezone.utc)
        
        # Save user to database
        result = users_collection.insert_one(user_data)
        
        return {
            "message": "User created successfully", 
            "user_id": str(result.inserted_id)
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )

@router.post("/login", response_model=dict)
def login(user: UserLogin):
    """User login and get access token."""
    logger.info(f"Login attempt for email: {user.email}")
    users_collection = db.get_collection("users")
    user_data = users_collection.find_one({"email": user.email})
    if not user_data or not verify_password(user.password, user_data["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user_data["_id"])}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Dependency to get current user from token
async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Get the current authenticated user from the token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = verify_token(token)
        if not payload:
            raise credentials_exception
        
        user_id = payload.get("sub")
        if not user_id:
            raise credentials_exception
            
        users_collection = db.get_collection("users")
        user = users_collection.find_one({"_id": user_id})
        
        if not user:
            raise credentials_exception
            
        return user
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise credentials_exception