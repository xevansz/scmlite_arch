import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import hashlib
import os
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
import os
from dotenv import load_dotenv

# Import database
from ..database import db

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Password hashing
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    salt = hashed_password[:32]  # Get the salt from the stored hash
    return get_password_hash_with_salt(plain_password, salt) == hashed_password

def get_password_hash(password: str) -> str:
    """Generate a password hash with a random salt."""
    salt = os.urandom(16).hex()  # Generate a random salt
    return get_password_hash_with_salt(password, salt)

def get_password_hash_with_salt(password: str, salt: str) -> str:
    """Generate a password hash with the given salt."""
    # Convert password to bytes if it's a string
    if isinstance(password, str):
        password = password.encode('utf-8')
    # Create a hash using SHA-256 with the salt
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password,
        salt.encode('utf-8'),
        100000  # Number of iterations
    )
    # Return salt + hash as a single string
    return salt + hashed.hex()

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify a JWT token and return the payload if valid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        logger.error(f"JWT verification failed: {e}")
        return None

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Get the current authenticated user from the JWT token.
    
    Args:
        token: JWT token from the Authorization header
        
    Returns:
        dict: User information if authenticated
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verify and decode the token
        payload = verify_token(token)
        if payload is None:
            raise credentials_exception
            
        # Get user ID from token
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
        # Get user from database
        user = await db.users.find_one({"_id": user_id})
        if user is None:
            raise credentials_exception
            
        # Convert ObjectId to string for the id field
        user["id"] = str(user["_id"])
        return user
        
    except JWTError:
        raise credentials_exception
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing authentication"
        )
