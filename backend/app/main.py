"""NeuroSense API – FastAPI Application Entry Point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import init_db
from app.routers import auth, health, stress, mood, devices


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App startup and shutdown events."""
    # Startup: create database tables
    await init_db()
    print(f"🧠 {settings.APP_NAME} v{settings.APP_VERSION} started")
    yield
    # Shutdown
    print(f"🧠 {settings.APP_NAME} shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Mental Wellness Monitoring Application – Analyze wearable physiological signals for stress, burnout, and recovery insights.",
    lifespan=lifespan,
)

# CORS middleware for React Native and web access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(health.router, prefix="/api/v1")
app.include_router(stress.router, prefix="/api/v1")
app.include_router(mood.router, prefix="/api/v1")
app.include_router(devices.router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """API root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Root"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
