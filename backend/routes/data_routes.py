from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
import logging
from bson import ObjectId
from ..models.data_model import PaginatedResponse
from ..database import db
from ..utils.security import get_current_user
from fastapi import Query

router = APIRouter(prefix="/data", tags=["device_data"])
logger = logging.getLogger(__name__)

@router.get("/all", response_model=PaginatedResponse)
async def get_all_data(
    current_user: Dict[str, Any] = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page")
):
    """
    Get paginated device data.
    
    - **page**: Page number (starts from 1)
    - **limit**: Number of items per page (max 100)
    """
    try:
        logger.info(f"Fetching device data (page {page}, limit {limit}) for user: {current_user['email']}")
        
        # Calculate skip value
        skip = (page - 1) * limit
        
        # Get total count for pagination
        total = await db.device_data.count_documents({})
        total_pages = (total + limit - 1) // limit
        
        # Fetch paginated data
        data = []
        async for item in db.device_data.find().skip(skip).limit(limit):
            item["_id"] = str(item["_id"])
            data.append(item)
            
        return {
            "data": data,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
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

@router.get("/device/{device_id}", response_model=PaginatedResponse)
async def get_device_data(
    device_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page")
):
    """
    Get paginated data for a specific device.
    
    - **device_id**: The ID of the device to fetch data for
    - **page**: Page number (starts from 1)
    - **limit**: Number of items per page (max 100)
    """
    try:
        logger.info(f"Fetching data for device {device_id} (page {page}, limit {limit}) for user: {current_user['email']}")
        
        # Calculate skip value
        skip = (page - 1) * limit
        
        # Get total count for pagination
        total = await db.device_data.count_documents({"Device_ID": device_id})
        total_pages = (total + limit - 1) // limit
        
        # Fetch paginated data
        data = []
        async for item in db.device_data.find({"Device_ID": device_id})\
                                 .sort("timestamp", -1)\
                                 .skip(skip)\
                                 .limit(limit):
            item["_id"] = str(item["_id"])
            data.append(item)
            
        return {
            "data": data,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
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