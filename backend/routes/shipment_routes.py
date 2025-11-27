from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
import logging
from datetime import datetime
from bson import ObjectId

from ..models.shipment_model import ShipmentCreate, ShipmentInDB
from ..database import db
from ..utils.security import get_current_user

router = APIRouter(prefix="/shipments", tags=["shipments"])
logger = logging.getLogger(__name__)

@router.post("/create", response_model=Dict[str, Any])
def create_shipment(
    shipment: ShipmentCreate, 
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Create a new shipment."""
    try:
        logger.info(f"Creating new shipment for user: {current_user['email']}")
        shipment_data = shipment.dict()
        shipment_data["created_by"] = current_user["email"]
        shipment_data["created_at"] = datetime.utcnow()
        
        shipments_collection = db.get_collection("shipments_usr")
        result = shipments_collection.insert_one(shipment_data)
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

@router.get("/all", response_model=List[Dict[str, Any]])
def get_all_shipments(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get all shipments for the current user."""
    try:
        logger.info(f"Fetching all shipments for user: {current_user['email']}")
        
        # Get the collection
        collection = db.get_collection("shipments_usr")
        
        # Query for user's shipments
        query = {"created_by": current_user["email"]}
        
        # Execute query
        cursor = collection.find(query)
        shipments = []
        
        # Convert ObjectId to string for JSON serialization
        for shipment in cursor:
            shipment["_id"] = str(shipment["_id"])
            shipments.append(shipment)
            
        logger.info(f"Found {len(shipments)} shipments")
        return shipments
        
    except Exception as e:
        logger.error(f"Error in get_all_shipments: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching shipments: {str(e)}"
        )

@router.get("/{shipment_id}", response_model=ShipmentInDB)
def get_shipment(
    shipment_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> ShipmentInDB:
    """Get a specific shipment by ID."""
    logger.info(f"Fetching shipment {shipment_id} for user {current_user['email']}")
    
    try:
        shipments_collection = db.get_collection("shipments_usr")
        shipment = shipments_collection.find_one({
            "_id": ObjectId(shipment_id),
            "created_by": current_user["email"]
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