from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
import logging
from typing import List
from bson import ObjectId

from ..models.shipment_model import ShipmentCreate, ShipmentInDB, ShipmentUpdate
from ..database import db
from .auth_routes import get_current_user

router = APIRouter(prefix="/shipments", tags=["shipments"])
logger = logging.getLogger(__name__)

@router.post("/create", response_model=dict)
async def create_shipment(
    shipment: ShipmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new shipment."""
    logger.info(f"Creating new shipment for user: {current_user['email']}")
    
    shipment_dict = shipment.model_dump()
    shipment_dict.update({
        "created_by": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    })
    
    try:
        shipments_collection = db.get_collection("shipments")
        result = shipments_collection.insert_one(shipment_dict)
        
        logger.info(f"Shipment created with ID: {result.inserted_id}")
        return {
            "message": "Shipment created successfully",
            "shipment_id": str(result.inserted_id)
        }
    except Exception as e:
        logger.error(f"Error creating shipment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating shipment"
        )

@router.get("/all", response_model=List[ShipmentInDB])
async def get_all_shipments(
    skip: int = 0, 
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Get all shipments (paginated)."""
    logger.info(f"Fetching shipments for user: {current_user['email']}")
    
    try:
        shipments_collection = db.get_collection("shipments")
        
        # Only show shipments created by the current user
        cursor = shipments_collection.find({"created_by": str(current_user["_id"])})
        cursor = cursor.skip(skip).limit(limit)
        
        shipments = []
        for doc in cursor:
            # Convert ObjectId to string for the response
            doc["id"] = str(doc.pop("_id"))
            shipments.append(ShipmentInDB(**doc))
            
        logger.info(f"Found {len(shipments)} shipments")
        return shipments
    except Exception as e:
        logger.error(f"Error fetching shipments: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching shipments"
        )

@router.get("/{shipment_id}", response_model=ShipmentInDB)
async def get_shipment(
    shipment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific shipment by ID."""
    logger.info(f"Fetching shipment {shipment_id} for user {current_user['email']}")
    
    try:
        shipments_collection = db.get_collection("shipments")
        shipment = shipments_collection.find_one({
            "_id": ObjectId(shipment_id),
            "created_by": str(current_user["_id"])
        })
        
        if not shipment:
            logger.warning(f"Shipment {shipment_id} not found or access denied")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shipment not found or access denied"
            )
            
        # Convert ObjectId to string for the response
        shipment["id"] = str(shipment.pop("_id"))
        return ShipmentInDB(**shipment)
        
    except Exception as e:
        logger.error(f"Error fetching shipment {shipment_id}: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error fetching shipment"
        )