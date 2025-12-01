from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId

from ..models.shipment_model import ShipmentCreate, ShipmentInDB
from ..database import db
from ..utils.security import get_current_user

router = APIRouter(prefix="/shipments", tags=["shipments"])

@router.post("/create", response_model=Dict[str, Any])
def create_shipment(
    shipment: ShipmentCreate, 
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Create a new shipment."""
    shipment_data = shipment.dict()
    shipment_data["created_by"] = current_user["email"]
    shipment_data["created_at"] = datetime.utcnow()
    
    shipments_collection = db.get_collection("shipments_usr")
    result = shipments_collection.insert_one(shipment_data)
    return {
        "message": "Shipment created successfully", 
        "shipment_id": str(result.inserted_id)
    }

@router.get("/all", response_model=List[Dict[str, Any]])
def get_all_shipments(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get all shipments for the current user."""
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
        
    return shipments

@router.get("/device/{device_id}", response_model=List[Dict[str, Any]])
def get_shipments_by_device_id(
    device_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Get all shipments for a specific device ID for the current user."""
    # Get the collection
    collection = db.get_collection("shipments_usr")
    
    # Query for user's shipments with matching device_id
    query = {
        "created_by": current_user["email"],
        "device_id": device_id
    }
    
    # Execute query
    cursor = collection.find(query).sort("created_at", -1)
    shipments = []
    
    # Convert ObjectId to string for JSON serialization
    for shipment in cursor:
        shipment["_id"] = str(shipment["_id"])
        shipments.append(shipment)
        
    return shipments

@router.get("/{shipment_id}", response_model=ShipmentInDB)
def get_shipment(
    shipment_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> ShipmentInDB:
    """Get a specific shipment by ID."""
    shipments_collection = db.get_collection("shipments_usr")
    shipment = shipments_collection.find_one({
        "_id": ObjectId(shipment_id),
        "created_by": current_user["email"]
    })
    
    if not shipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shipment not found or access denied"
        )
        
    # Convert ObjectId to string for the response
    shipment["id"] = str(shipment.pop("_id"))
    return ShipmentInDB(**shipment)