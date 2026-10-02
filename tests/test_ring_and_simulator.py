import pytest
from app.integrations.ring.ring_provider import (
    RingEventAdapter, RingProvider, SimulatorProvider, get_smart_home_provider
)
from app.integrations.simulator.scenarios import get_scenarios

def test_ring_event_adapter_normalization():
    raw_payload = {
        "kind": "ding",
        "doorbot_id": "doorbot_9981",
        "description": "Front Door",
        "confidence": 0.97,
        "siren_status": "off",
        "duration": 20
    }
    normalized = RingEventAdapter.normalize_ring_event(raw_payload)
    assert normalized["source"] == "ring"
    assert normalized["eventType"] == "person_detected"
    assert normalized["deviceId"] == "doorbot_9981"
    assert normalized["location"] == "front_door"
    assert normalized["confidence"] == 0.97
    assert normalized["metadata"]["is_live_ring"] is True

def test_ring_event_adapter_garage_location_inference():
    raw_payload = {
        "kind": "motion",
        "doorbot_id": "doorbot_102",
        "description": "Garage South Wall",
        "confidence": 0.91
    }
    normalized = RingEventAdapter.normalize_ring_event(raw_payload)
    assert normalized["location"] == "garage"
    assert normalized["eventType"] == "motion_detected"

def test_ring_provider_offline_state():
    provider = RingProvider(token="")
    assert provider.get_source_label() == "RING (DISCONNECTED)"
    assert provider.is_configured is False

@pytest.mark.asyncio
async def test_simulator_provider_devices():
    provider = SimulatorProvider()
    devices = await provider.get_devices()
    assert len(devices) >= 5
    dev_ids = [d["id"] for d in devices]
    assert "front-door-cam-01" in dev_ids
    assert "garage-cam-02" in dev_ids
    assert provider.get_source_label() == "SIMULATOR"

@pytest.mark.asyncio
async def test_simulator_provider_event_emission():
    provider = SimulatorProvider()
    received = []

    async def listener(evt):
        received.append(evt)

    await provider.subscribe_to_events(listener)
    sent = await provider.send_event({
        "deviceId": "front-door-cam-01",
        "eventType": "motion_detected",
        "location": "front_door"
    })

    assert len(received) == 1
    assert received[0]["id"] == sent["id"]
    assert received[0]["source"] == "simulator"

def test_all_scenarios_configured_properly():
    scenarios = get_scenarios()
    required_scenarios = [
        "unusual_entrance", "normal_delivery", "visitor_arrival",
        "late_night", "false_alarm", "device_offline"
    ]
    for sc_id in required_scenarios:
        assert sc_id in scenarios
        sc = scenarios[sc_id]
        assert "events" in sc
        assert len(sc["events"]) >= 1
        assert "home_state" in sc
        assert "title" in sc
        assert "expected_situation" in sc
