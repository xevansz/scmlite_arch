from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from datetime import datetime, timedelta, timezone
from ..database import db
from ..utils.security import get_current_user, is_admin

router = APIRouter(prefix="/admin", tags=["admin"])

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Dependency to ensure the current user is an admin."""
    if not current_user.get("is_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/users", response_model=List[Dict[str, Any]])
def get_all_users(current_user: Dict[str, Any] = Depends(require_admin)):
    """Get all users (admin only)."""
    users_collection = db.get_collection("users")
    users = []
    
    for user in users_collection.find():
        users.append({
            "_id": str(user["_id"]),
            "email": user["email"],
            "full_name": user["full_name"],
            "created_at": user["created_at"].isoformat() if isinstance(user.get("created_at"), datetime) else str(user.get("created_at", ""))
        })
    
    return users

@router.delete("/users/{user_id}")
def delete_user(user_id: str, current_user: Dict[str, Any] = Depends(require_admin)):
    """Delete a user (admin only)."""
    from bson import ObjectId
    from bson.errors import InvalidId
    
    users_collection = db.get_collection("users")
    
    # Prevent admin from deleting themselves
    if str(current_user.get("sub")) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    result = users_collection.delete_one({"_id": object_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"message": "User deleted successfully"}

@router.get("/health/devices")
def get_device_health(current_user: Dict[str, Any] = Depends(require_admin)):
    """Check which device IDs have been seen in recent data stream (admin only)."""
    collection = db.get_collection("shipment_data")
    
    # Expected device IDs based on the simulator (1150-1158)
    expected_devices = list(range(1150, 1159))
    
    # Check data from the last 5 minutes
    time_threshold = datetime.now(timezone.utc) - timedelta(minutes=5)
    
    # Get unique device IDs from recent data
    pipeline = [
        {
            "$match": {
                "timestamp": {"$gte": time_threshold}
            }
        },
        {
            "$group": {
                "_id": "$Device_ID"
            }
        }
    ]
    
    recent_devices = set()
    for doc in collection.aggregate(pipeline):
        if doc["_id"]:
            recent_devices.add(doc["_id"])
    
    # Classify devices
    active_devices = [dev for dev in expected_devices if dev in recent_devices]
    missing_devices = [dev for dev in expected_devices if dev not in recent_devices]
    
    # Get total data points in the last 5 minutes
    total_recent_data = collection.count_documents({
        "timestamp": {"$gte": time_threshold}
    })
    
    return {
        "time_window_minutes": 5,
        "expected_devices": expected_devices,
        "active_devices": sorted(active_devices),
        "missing_devices": sorted(missing_devices),
        "total_recent_data_points": total_recent_data,
        "health_status": "healthy" if len(missing_devices) == 0 else "degraded"
    }
