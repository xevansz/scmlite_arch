from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
import httpx

from pathlib import Path

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from ..models.user_model import UserCreate, UserLogin, UserInDB
from ..database import db
from ..utils.security import (
    create_access_token,
    get_current_user,
    verify_password,
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)

router = APIRouter(prefix="/auth", tags=["authentication"])

RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"


async def verify_recaptcha(token: str) -> bool:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            RECAPTCHA_VERIFY_URL,
            data={"secret": RECAPTCHA_SECRET_KEY, "response": token},
        )
        result = response.json()
        return result.get("success", False)


@router.post("/signup", response_model=dict)
async def signup(user: UserCreate):
    """Register a new user with secure password hashing."""
    users_collection = db.get_collection("users")

    # verify recaptcha
    if not verify_recaptcha(user.recaptcha_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reCAPTCHA token"
        )

    # Check if user exists
    if users_collection.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    # Hash the password before storing
    hashed_password = get_password_hash(user.password)

    # Create user data with hashed password
    user_data = user.model_dump(exclude={"password", "recaptcha_token"})
    user_data["hashed_password"] = hashed_password
    user_data["created_at"] = datetime.now(timezone.utc)

    result = users_collection.insert_one(user_data)

    return {"message": "User created successfully", "user_id": str(result.inserted_id)}


@router.post("/login", response_model=dict)
async def login(user: UserLogin):
    """User login and get access token with password verification."""
    from ..utils.security import ADMIN_MAIL, ADMIN_PASSWORD, is_admin

    users_collection = db.get_collection("users")

    # verify recaptcha
    if not verify_recaptcha(user.recaptcha_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid reCAPTCHA token"
        )

    # Check if this is admin login with admin password override
    is_admin_user = False
    if ADMIN_MAIL and user.email == ADMIN_MAIL and ADMIN_PASSWORD:
        if user.password == ADMIN_PASSWORD:
            # Admin login with env password - find or verify user exists
            user_data = users_collection.find_one({"email": user.email})
            if not user_data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Admin user not found in database",
                )
            is_admin_user = True
        else:
            # Admin email but wrong password - try normal auth
            user_data = users_collection.find_one({"email": user.email})
            if not user_data or not verify_password(
                user.password, user_data["hashed_password"]
            ):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                )
            is_admin_user = True
    else:
        # Normal user login
        user_data = users_collection.find_one({"email": user.email})
        if not user_data or not verify_password(
            user.password, user_data["hashed_password"]
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        is_admin_user = (user.email == ADMIN_MAIL) if ADMIN_MAIL else False

    # Create token with is_admin flag
    access_token = create_access_token(
        data={
            "sub": str(user_data["_id"]),
            "email": user.email,
            "is_admin": is_admin_user,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get("/me", response_model=dict)
def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user information."""
    return current_user
