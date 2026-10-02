import os
from typing import List, Dict
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    APP_NAME: str = "GuardianMesh AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./guardianmesh.db",
        description="Database URL for SQLite or PostgreSQL"
    )

    # AWS & Bedrock
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    AI_PROVIDER: str = "mock"  # 'bedrock' or 'mock'

    # Ring Smart Home Provider
    RING_MODE: str = "simulator"  # 'ring' or 'simulator'
    RING_API_URL: str = "https://api.ring.com"
    RING_ACCESS_TOKEN: str = ""
    RING_REFRESH_TOKEN: str = ""

    # Alexa & MCP
    ALEXA_MODE: str = "simulation"
    MCP_PORT: int = 8100

    # Security & CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    # Home State Simulation (home, away, sleep, guest)
    DEFAULT_HOME_STATE: str = "away"

    # Situation Correlation Engine Weights
    CORRELATION_WINDOW_SECONDS: int = 180  # 3 minute temporal window
    EXTENDED_PRESENCE_THRESHOLD_SECONDS: int = 45

    WEIGHT_PERSON_DETECTED: float = 0.20
    WEIGHT_LONG_PRESENCE: float = 0.25
    WEIGHT_REPEATED_MOVEMENT: float = 0.20
    WEIGHT_HOME_UNOCCUPIED: float = 0.20
    WEIGHT_LATE_NIGHT: float = 0.10
    WEIGHT_MULTIPLE_EVENTS: float = 0.05

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Auto-detect Bedrock capability
if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
    settings.AI_PROVIDER = "bedrock"
