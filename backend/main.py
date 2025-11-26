from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import uvicorn
from dotenv import load_dotenv

load_dotenv()

# Import routers
from .routes import auth_routes, shipment_routes, data_routes
from .database import db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SCMLite API",
    description="API for SCMLite - A supply chain management system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(shipment_routes.router)
app.include_router(data_routes.router)

# Startup event
@app.on_event("startup")
async def startup_db_client():
    """Initialize database connection on startup."""
    try:
        # Test the connection
        db.client.admin.command('ping')
        logger.info("Connected to MongoDB!")
        
        # Create indexes
        db.get_collection("users").create_index("email", unique=True)
        db.get_collection("shipments_usr").create_index("device_id")
        db.get_collection("shipments_usr").create_index("timestamp")
        
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise

# Shutdown event
@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown."""
    db.close_connection()
    logger.info("MongoDB connection closed.")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to SCMLite API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
