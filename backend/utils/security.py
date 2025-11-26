# backend/utils/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os
import logging
from dotenv import load_dotenv

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET environment variable not set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 300

logger = logging.getLogger(__name__)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Get the current authenticated user from the JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token or token.lower() in ("null", "undefined", "none"):
        logger.error("No token provided")
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"JWT validation error: {e}")
        raise credentials_exception