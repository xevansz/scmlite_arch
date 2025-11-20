from fastapi import APIRouter, Depends, HTTPException, status, Query
from datetime import datetime, timedelta
from typing import List, Optional
import logging
from bson import ObjectId

from ..models.data_model import DataPointInDB, DataQueryParams
from ..database import db
from .auth_routes import get_current_user

router = APIRouter(prefix="/data", tags=["data"])
logger = logging.getLogger(__name__)

@router.get("/all", response_model=List[DataPointInDB])
async def get_all_data(
    limit: int = Query(100, le=1000, description="Number of records to return (max 1000)"),
    current_user: dict = Depends(get_current_user)
):
    """Get all data points (paginated)."""
    logger.info(f"Fetching up to {limit} data points")
    
    try:
        data_collection = db.get_collection("device_data")
        cursor = data_collection.find().sort("timestamp", -1).limit(limit)
        
        data_points = []
        for doc in cursor:
            # Convert ObjectId to string for the response
            doc["id"] = str(doc.pop("_id"))
            data_points.append(DataPointInDB(**doc))
            
        logger.info(f"Found {len(data_points)} data points")
        return data_points
    except Exception as e:
        logger.error(f"Error fetching data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching data"
        )

@router.get("/latest", response_model=DataPointInDB)
async def get_latest_data(
    current_user: dict = Depends(get_current_user)
):
    """Get the most recent data point."""
    logger.info("Fetching latest data point")
    
    try:
        data_collection = db.get_collection("device_data")
        latest = data_collection.find_one(
            {},
            sort=[("timestamp", -1)]
        )
        
        if not latest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No data available"
            )
            
        # Convert ObjectId to string for the response
        latest["id"] = str(latest.pop("_id"))
        return DataPointInDB(**latest)
        
    except Exception as e:
        logger.error(f"Error fetching latest data: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching latest data"
        )

@router.get("/device/{device_id}", response_model=List[DataPointInDB])
async def get_device_data(
    device_id: int,
    start_time: Optional[datetime] = Query(None, description="Start time filter"),
    end_time: Optional[datetime] = Query(None, description="End time filter"),
    limit: int = Query(100, le=1000, description="Number of records to return (max 1000)"),
    current_user: dict = Depends(get_current_user)
):
    """Get data points for a specific device with optional time filtering."""
    logger.info(f"Fetching data for device {device_id}")
    
    try:
        query = {"device_id": device_id}
        
        # Add time range filter if provided
        time_filter = {}
        if start_time:
            time_filter["$gte"] = start_time
        if end_time:
            time_filter["$lte"] = end_time
            
        if time_filter:
            query["timestamp"] = time_filter
        
        data_collection = db.get_collection("device_data")
        cursor = data_collection.find(query).sort("timestamp", -1).limit(limit)
        
        data_points = []
        for doc in cursor:
            # Convert ObjectId to string for the response
            doc["id"] = str(doc.pop("_id"))
            data_points.append(DataPointInDB(**doc))
            
        logger.info(f"Found {len(data_points)} data points for device {device_id}")
        return data_points
        
    except Exception as e:
        logger.error(f"Error fetching data for device {device_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching data for device {device_id}"
        )