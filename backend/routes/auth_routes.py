from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
import httpx

from pathlib import Path
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

from ..models.user_model import UserCreate, UserLogin
from ..database import db
from ..utils.security import (
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["authentication"])

RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

async def verify_recaptcha(token: str) -> bool:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            RECAPTCHA_VERIFY_URL,
            data={
                "secret": RECAPTCHA_SECRET_KEY,
                "response": token
            }
        )
        result = response.json()
        return result.get("success", False)

@router.post("/signup", response_model=dict)
def signup(user: UserCreate):
    """Register a new user."""
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

    if not verify_recaptcha(user.recaptcha_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reCAPTCHA token"
        )
    
    return {
        "message": "User created successfully",
        "user_id": str(result.inserted_id)
    }

@router.post("/login", response_model=dict)
def login(user: UserLogin):
    """User login and get access token."""
    users_collection = db.get_collection("users")
    user_data = users_collection.find_one({"email": user.email})

    if not verify_recaptcha(user.recaptcha_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reCAPTCHA token"
        )
    
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

@router.get("/me", response_model=dict)
def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return current_user