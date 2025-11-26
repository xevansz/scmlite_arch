from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from bson import ObjectId

from ..database import db
from ..utils.security import get_current_user

router = APIRouter(prefix="/data", tags=["device_data"])
logger = logging.getLogger(__name__)

@router.get("/all", response_model=List[Dict[str, Any]])
async def get_all_data(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get all device data."""
    try:
        logger.info(f"Fetching all device data for user: {current_user['email']}")
        data = []
        async for item in db.device_data.find():
            item["_id"] = str(item["_id"])
            data.append(item)
        return data
    except Exception as e:
        logger.error(f"Error fetching device data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching device data"
        )

@router.get("/latest", response_model=Dict[str, Any])
async def get_latest_data(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get the latest data point from all devices."""
    try:
        logger.info(f"Fetching latest device data for user: {current_user['email']}")
        latest = await db.device_data.find_one(
            sort=[("timestamp", -1)]
        )
        if latest:
            latest["_id"] = str(latest["_id"])
        return latest or {}
    except Exception as e:
        logger.error(f"Error fetching latest data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching latest data"
        )

@router.get("/device/{device_id}", response_model=List[Dict[str, Any]])
async def get_device_data(
    device_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get all data for a specific device."""
    try:
        logger.info(f"Fetching data for device {device_id} for user: {current_user['email']}")
        data = []
        async for item in db.device_data.find({"Device_ID": device_id}):
            item["_id"] = str(item["_id"])
            data.append(item)
        return data
    except Exception as e:
        logger.error(f"Error fetching device data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching data for device {device_id}"
        )
        # Find the latest document for the device
        latest = await db.device_data.find_one(
            {"Device_ID": device_id},
            sort=[("timestamp", -1)]
        )
        
        if latest:
            latest["_id"] = str(latest["_id"])
            return [latest]
        return []
    except Exception as e:
        logger.error(f"Error fetching data for device {device_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching data for device {device_id}"
        )