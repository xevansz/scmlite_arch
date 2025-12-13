from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from fastapi.exception_handlers import http_exception_handler
from starlette.exceptions import HTTPException as StarletteHTTPException
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

# Include routers
app.include_router(auth_routes.router)
app.include_router(shipment_routes.router)
app.include_router(data_routes.router)

# Root endpoint (API health/info)
@app.get("/api")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Welcome to SCMLite API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
    }

# Serve built frontend assets (Vite build output)
app.mount("/", StaticFiles(directory="build", html=True), name="frontend")


@app.exception_handler(StarletteHTTPException)
async def spa_fallback(request: Request, exc: StarletteHTTPException):
    """
    SPA fallback:
    - If a non-API GET route returns 404 and the client expects HTML,
      serve the React index.html so that React Router can handle the route.
    - This fixes reload / direct navigation on routes like /dashboard, /device-data, etc.
    """
    # Only handle 404s for GET requests that expect HTML
    if (
        exc.status_code == 404
        and request.method == "GET"
        and "text/html" in request.headers.get("accept", "")
    ):
        path = request.url.path or ""
        if path.startswith((
            "/auth",
            "/shipments",
            "/data",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api",
        )):
            return await http_exception_handler(request, exc)

        index_file = Path("build/index.html")
        if index_file.exists():
            return HTMLResponse(index_file.read_text(encoding="utf-8"), status_code=200)

    return await http_exception_handler(request, exc)

# Startup event
@app.on_event("startup")
def startup_db_client():
    """Initialize database connection on startup."""
    print("Starting backend...")
    try:
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
