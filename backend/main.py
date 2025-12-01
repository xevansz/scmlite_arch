from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

from pathlib import Path
env_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=env_path)

# Import routers
from .routes import auth_routes, shipment_routes, data_routes
from .database import db

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
    allow_origins=[
        "http://frontend:3000",  # Docker container name
        "http://localhost:3000",  # Local development
        "http://127.0.0.1:3000"   # Local development alternative
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(shipment_routes.router)
app.include_router(data_routes.router)

# Root endpoint
@app.get("/api")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to SCMLite API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

# build files
app.mount("/", StaticFiles(directory="frontend/build", html=True), name="frontend")

# Startup event
@app.on_event("startup")
def startup_db_client():
    """Initialize database connection on startup."""
    print("Starting backend...")
    try:
        # Test the connection
        db.client.admin.command('ping')
        print("MongoDB connected")
        
        # Create indexes
        db.create_index("users", "email", unique=True)
        db.create_index("shipments_usr", "device_id")
        db.create_index("shipments_usr", "timestamp")
        
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise

# Shutdown event
@app.on_event("shutdown")
def shutdown_db_client():
    """Close database connection on shutdown."""
    db.close_connection()
    print("Backend shutdown")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
