import pytest
from datetime import datetime, timedelta
from app.situation_engine.engine import SituationEngine
from app.config import settings

@pytest.fixture
def engine():
    return SituationEngine()

def test_engine_initialization(engine):
    assert engine.time_window_seconds == settings.CORRELATION_WINDOW_SECONDS
    assert engine.presence_threshold == settings.EXTENDED_PRESENCE_THRESHOLD_SECONDS

def test_empty_events_returns_empty_situations(engine):
    result = engine.correlate_events([], home_state="away")
    assert result == []

def test_unusual_entrance_activity_detection(engine):
    now = datetime.utcnow()
    events = [
        {"id": "e1", "deviceId": "cam1", "deviceType": "camera", "eventType": "motion_detected", "location": "front_door", "confidence": 0.95, "timestamp": now.isoformat()},
        {"id": "e2", "deviceId": "cam1", "deviceType": "camera", "eventType": "person_detected", "location": "front_door", "confidence": 0.94, "timestamp": (now + timedelta(seconds=10)).isoformat()},
        {"id": "e3", "deviceId": "cam1", "deviceType": "camera", "eventType": "person_detected", "location": "front_door", "confidence": 0.94, "timestamp": (now + timedelta(seconds=40)).isoformat()},
        {"id": "e4", "deviceId": "sens1", "deviceType": "sensor", "eventType": "motion_detected", "location": "front_door", "confidence": 0.92, "timestamp": (now + timedelta(seconds=70)).isoformat()},
        {"id": "e5", "deviceId": "cam1", "deviceType": "camera", "eventType": "person_left", "location": "front_door", "confidence": 0.90, "timestamp": (now + timedelta(seconds=92)).isoformat()},
    ]
    situations = engine.correlate_events(events, home_state="away", current_time=now + timedelta(seconds=95))
    assert len(situations) == 1
    sit = situations[0]
    assert sit["situation_type"] == "unusual_entrance_activity"
    assert sit["location"] == "front_door"
    assert sit["confidence"] >= 0.85
    assert sit["severity"] in ["medium", "high", "critical"]
    assert "92" in sit["summary"] or sit["duration_seconds"] >= 45

def test_normal_package_delivery_detection(engine):
    now = datetime.utcnow()
    events = [
        {"id": "e1", "deviceId": "cam1", "deviceType": "doorbell", "eventType": "person_detected", "location": "front_door", "confidence": 0.96, "timestamp": now.isoformat()},
        {"id": "e2", "deviceId": "cam1", "deviceType": "doorbell", "eventType": "package_detected", "location": "front_door", "confidence": 0.98, "timestamp": (now + timedelta(seconds=12)).isoformat()},
        {"id": "e3", "deviceId": "cam1", "deviceType": "doorbell", "eventType": "person_left", "location": "front_door", "confidence": 0.95, "timestamp": (now + timedelta(seconds=28)).isoformat()},
    ]
    situations = engine.correlate_events(events, home_state="away", current_time=now + timedelta(seconds=35))
    assert len(situations) == 1
    sit = situations[0]
    assert sit["situation_type"] == "normal_package_delivery"
    assert sit["severity"] == "info"
    assert sit["confidence"] >= 0.90

def test_visitor_arrival_home_state_context(engine):
    now = datetime.utcnow()
    events = [
        {"id": "e1", "deviceId": "cam1", "deviceType": "doorbell", "eventType": "person_detected", "location": "front_door", "confidence": 0.95, "timestamp": now.isoformat()},
        {"id": "e2", "deviceId": "sens1", "deviceType": "sensor", "eventType": "door_opened", "location": "front_door", "confidence": 0.99, "timestamp": (now + timedelta(seconds=15)).isoformat()},
    ]
    # In Home mode, person + door open = visitor arrival
    situations = engine.correlate_events(events, home_state="home", current_time=now + timedelta(seconds=20))
    assert len(situations) == 1
    sit = situations[0]
    assert sit["situation_type"] == "visitor_arrival"
    assert sit["severity"] == "low"

def test_false_alarm_noise_suppression(engine):
    now = datetime.utcnow()
    # Single isolated motion without person
    events = [
        {"id": "e1", "deviceId": "cam1", "deviceType": "camera", "eventType": "motion_detected", "location": "front_door", "confidence": 0.40, "timestamp": now.isoformat(), "metadata": {"duration": 4}},
    ]
    situations = engine.correlate_events(events, home_state="away", current_time=now + timedelta(seconds=10))
    assert len(situations) == 1
    sit = situations[0]
    assert sit["situation_type"] == "false_alarm"
    assert sit["severity"] == "info"
    assert sit["confidence"] < 0.35

def test_device_offline_detection(engine):
    now = datetime.utcnow()
    events = [
        {"id": "e1", "deviceId": "garage-cam-02", "deviceType": "camera", "eventType": "device_offline", "location": "garage", "confidence": 0.99, "timestamp": now.isoformat()},
    ]
    situations = engine.correlate_events(events, home_state="away", current_time=now + timedelta(seconds=5))
    assert len(situations) == 1
    sit = situations[0]
    assert sit["situation_type"] == "device_offline"
    assert "garage-cam-02" in sit["title"]

def test_package_theft_risk_detection(engine):
    now = datetime.utcnow()
    events = [
        {"id": "e1", "deviceId": "cam1", "deviceType": "doorbell", "eventType": "package_removed", "location": "front_door", "confidence": 0.95, "timestamp": now.isoformat()},
        {"id": "e2", "deviceId": "cam1", "deviceType": "doorbell", "eventType": "person_left", "location": "front_door", "confidence": 0.90, "timestamp": (now + timedelta(seconds=10)).isoformat()},
    ]
    # Removed without door opening while away = theft risk
    situations = engine.correlate_events(events, home_state="away", current_time=now + timedelta(seconds=15))
    assert len(situations) == 1
    sit = situations[0]
    assert sit["situation_type"] == "package_theft_risk"
    assert sit["severity"] in ["high", "critical"]

def test_situation_graph_generation(engine):
    now = datetime.utcnow()
    events = [
        {"id": "e1", "deviceId": "cam1", "deviceType": "camera", "eventType": "motion_detected", "location": "front_door", "confidence": 0.95, "timestamp": now.isoformat()},
        {"id": "e2", "deviceId": "cam1", "deviceType": "camera", "eventType": "person_detected", "location": "front_door", "confidence": 0.94, "timestamp": (now + timedelta(seconds=15)).isoformat()},
    ]
    situations = engine.correlate_events(events, home_state="away", current_time=now + timedelta(seconds=30))
    sit = situations[0]
    graph = sit["graph_data"]
    assert "nodes" in graph
    assert "edges" in graph
    node_types = [n["type"] for n in graph["nodes"]]
    assert "situation" in node_types
    assert "location" in node_types
    assert "device" in node_types
    assert "event" in node_types

def test_severity_score_mapping(engine):
    assert engine._map_severity(0.20) == "info"
    assert engine._map_severity(0.40) == "low"
    assert engine._map_severity(0.65) == "medium"
    assert engine._map_severity(0.85) == "high"
    assert engine._map_severity(0.95) == "critical"

def test_spatial_clustering_different_zones(engine):
    now = datetime.utcnow()
    events = [
        {"id": "e1", "deviceId": "front-cam", "deviceType": "camera", "eventType": "motion_detected", "location": "front_door", "confidence": 0.95, "timestamp": now.isoformat()},
        {"id": "e2", "deviceId": "back-cam", "deviceType": "camera", "eventType": "motion_detected", "location": "backyard", "confidence": 0.95, "timestamp": now.isoformat()},
    ]
    situations = engine.correlate_events(events, home_state="away", current_time=now + timedelta(seconds=5))
    # Should evaluate both front_door and backyard clusters
    locations = [s["location"] for s in situations]
    assert "front_door" in locations
    assert "backyard" in locations
