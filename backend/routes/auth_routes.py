from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from datetime import datetime, timedelta
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
async def signup(user: UserCreate):
    """Register a new user."""
    logger.info(f"Signup attempt for email: {user.email}")
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    hashed_password = get_password_hash(user.password)
    user_data = user.dict()
    user_data["hashed_password"] = hashed_password
    user_data["created_at"] = datetime.utcnow()
    result = await db.users.insert_one(user_data)
    return {"message": "User created successfully", "user_id": str(result.inserted_id)}

@router.post("/login", response_model=dict)
async def login(user: UserLogin):
    """User login and get access token."""
    logger.info(f"Login attempt for email: {user.email}")
    user_data = await db.users.find_one({"email": user.email})
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
    # Check if user already exists
    users_collection = db.get_collection("users")
    if users_collection.find_one({"email": user.email}):
        logger.warning(f"User with email {user.email} already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_dict = user.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    user_dict["created_at"] = user_dict["updated_at"] = datetime.utcnow()
    
    try:
        result = users_collection.insert_one(user_dict)
        logger.info(f"User created with id: {result.inserted_id}")
        return {"message": "User created successfully", "user_id": str(result.inserted_id)}
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )

async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate a user with email and password."""
    users_collection = db.get_collection("users")
    user_data = users_collection.find_one({"email": email})
    
    if not user_data:
        logger.warning(f"User not found with email: {email}")
        return None
        
    if not verify_password(password, user_data["hashed_password"]):
        logger.warning(f"Invalid password for user: {email}")
        return None
        
    # Convert ObjectId to string for the id field
    user_data["id"] = str(user_data["_id"])
    return user_data

@router.post("/login", response_model=dict)
async def login(user: UserLogin):
    """Login user and return access token."""
    logger.info(f"Login attempt for email: {user.email}")
    
    authenticated_user = await authenticate_user(user.email, user.password)
    if not authenticated_user:
        logger.warning(f"Invalid credentials for email: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": authenticated_user["email"]},
        expires_delta=access_token_expires
    )
    
    logger.info(f"User {user.email} logged in successfully")
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": authenticated_user["email"],
            "full_name": authenticated_user["full_name"]
        }
    }

@router.post("/login", response_model=dict)
async def login(login_data: UserLogin):
    """Authenticate user and return access token."""
    logger.info(f"Login attempt for email: {login_data.email}")
    
    users_collection = db.get_collection("users")
    user = users_collection.find_one({"email": login_data.email})
    
    if not user or not verify_password(login_data.password, user["hashed_password"]):
        logger.warning(f"Invalid login attempt for email: {login_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user["_id"])}, 
        expires_delta=access_token_expires
    )
    
    logger.info(f"User {user['email']} logged in successfully")
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": str(user["_id"]),
        "email": user["email"]
    }

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