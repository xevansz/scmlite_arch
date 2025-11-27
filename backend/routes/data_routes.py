from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Dict, Any
import logging
from ..models.data_model import PaginatedResponse
from ..database import db
from ..utils.security import get_current_user

router = APIRouter(prefix="/data", tags=["shipment_data"])
logger = logging.getLogger(__name__)

@router.get("/all", response_model=PaginatedResponse)
def get_all_data(
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
        
        # Get the collection
        collection = db.get_collection("shipment_data")
        
        # Get total count for pagination
        total = collection.count_documents({})
        total_pages = (total + limit - 1) // limit
        
        # Fetch paginated data
        data = []
        for item in collection.find().skip(skip).limit(limit):
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
def get_latest_data(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get the latest data point from all devices."""
    try:
        logger.info(f"Fetching latest device data for user: {current_user['email']}")
        collection = db.get_collection("shipment_data")
        latest = collection.find_one(sort=[("timestamp", -1)])
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
def get_device_data(
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
        
        # Get the collection
        collection = db.get_collection("shipment_data")
        
        # Convert device_id to int for query (matching the data format)
        try:
            device_id_int = int(device_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid device_id format"
            )
        
        # Get total count for pagination
        total = collection.count_documents({"Device_ID": device_id_int})
        total_pages = (total + limit - 1) // limit
        
        # Fetch paginated data
        data = []
        for item in collection.find({"Device_ID": device_id_int})\
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching device data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching data for device {device_id}"
        )