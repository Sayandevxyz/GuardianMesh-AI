from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database.session import init_db
from app.database.seed import seed_data
from app.api.endpoints import router as api_router
from app.api.ws import ws_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database tables and seed baseline demo data
    print(f"[{settings.APP_NAME}] Initializing database schema...")
    await init_db()
    print(f"[{settings.APP_NAME}] Seeding baseline demo data...")
    await seed_data()
    print(f"[{settings.APP_NAME}] Ready on {settings.API_PREFIX} (AI Provider: {settings.AI_PROVIDER})")
    yield
    print(f"[{settings.APP_NAME}] Shutting down gracefully.")

app = FastAPI(
    title=settings.APP_NAME,
    description="GuardianMesh AI — Smart Home Situation Intelligence Platform",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS middleware for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router, prefix=settings.API_PREFIX)

# Live WebSocket Stream
@app.websocket("/ws/events")
async def websocket_events_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial connection handshake
        await websocket.send_json({
            "type": "connection_established",
            "message": "Connected to GuardianMesh real-time telemetry stream",
            "source": settings.RING_MODE
        })
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
