import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.session import init_db
from app.database.seed import seed_data


@pytest.mark.asyncio
async def test_api_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "smart_home_provider" in data

@pytest.mark.asyncio
async def test_api_get_home():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/home")
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "Guardian House"
        assert data["system_status"] in ["Protected", "Incident Active"]

@pytest.mark.asyncio
async def test_api_update_home_state():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/home/state", json={"state": "sleep"})
        assert res.status_code == 200
        data = res.json()
        assert data["new_state"] == "sleep"

@pytest.mark.asyncio
async def test_api_get_devices():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/devices")
        assert res.status_code == 200
        devices = res.json()
        assert len(devices) >= 5

@pytest.mark.asyncio
async def test_api_get_events():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/events")
        assert res.status_code == 200
        events = res.json()
        assert isinstance(events, list)

@pytest.mark.asyncio
async def test_api_ingest_event_and_correlate():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "source": "simulator",
            "deviceId": "front-door-cam-01",
            "deviceType": "doorbell",
            "eventType": "person_detected",
            "location": "front_door",
            "confidence": 0.96,
            "metadata": {"duration": 50}
        }
        res = await ac.post("/api/events", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ingested"
        assert data["event"]["eventType"] == "person_detected"

@pytest.mark.asyncio
async def test_api_get_situations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/situations")
        assert res.status_code == 200
        situations = res.json()
        assert len(situations) >= 1

@pytest.mark.asyncio
async def test_api_get_situation_detail():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        situations_res = await ac.get("/api/situations")
        sit_id = situations_res.json()[0]["id"]
        res = await ac.get(f"/api/situations/{sit_id}")
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == sit_id
        assert "contributing_factors" in data
        assert "graph_data" in data

@pytest.mark.asyncio
async def test_api_assistant_chat():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        req = {"message": "What happened outside?"}
        res = await ac.post("/api/assistant/chat", json=req)
        assert res.status_code == 200
        data = res.json()
        assert "response" in data
        assert "tool_executions" in data
        assert len(data["tool_executions"]) >= 1

@pytest.mark.asyncio
async def test_api_end_to_end_simulator_scenario():
    """
    End-to-End Test:
    Simulate scenario -> Events generated -> Situation Engine creates situation -> AI explanation generated
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        req = {"scenario_id": "unusual_entrance", "speed_multiplier": 0.0}
        res = await ac.post("/api/simulator/scenario", json=req)
        assert res.status_code == 200
        data = res.json()
        assert data["scenario"] == "unusual_entrance"
        assert data["events_count"] == 5
        sit = data["resulting_situation"]
        assert sit is not None
        assert sit["situation_type"] == "unusual_entrance_activity"
        assert sit["confidence"] >= 0.85
        assert "summary" in sit

@pytest.mark.asyncio
async def test_api_privacy_settings():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/privacy")
        assert res.status_code == 200
        data = res.json()
        assert data["send_raw_video_to_ai"] is False
        assert data["send_structured_metadata_only"] is True

@pytest.mark.asyncio
async def test_api_ai_usage_analytics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/ai/usage")
        assert res.status_code == 200
        data = res.json()
        assert "total_requests" in data
        assert "estimated_cost_usd" in data
        assert "daily_stats" in data
