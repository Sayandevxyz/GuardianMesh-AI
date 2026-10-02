from typing import List, Dict, Any
from datetime import datetime, timedelta

def get_scenarios() -> Dict[str, Dict[str, Any]]:
    now = datetime.utcnow()
    
    return {
        "unusual_entrance": {
            "id": "unusual_entrance",
            "title": "Unusual Entrance Activity",
            "category": "security_threat",
            "badge": "SUSPICIOUS DWELL",
            "expected_situation": "UNUSUAL ENTRANCE ACTIVITY",
            "expected_confidence": 0.92,
            "severity": "medium",
            "description": "Individual lingers at front entrance for 92s while residence is unoccupied.",
            "home_state": "away",
            "events": [
                {
                    "deviceId": "front-door-cam-01",
                    "deviceType": "doorbell",
                    "eventType": "motion_detected",
                    "location": "front_door",
                    "confidence": 0.96,
                    "offset_seconds": 0,
                    "metadata": {"duration": 5, "lux": 4, "zone": "outer_porch"}
                },
                {
                    "deviceId": "front-door-cam-01",
                    "deviceType": "doorbell",
                    "eventType": "person_detected",
                    "location": "front_door",
                    "confidence": 0.95,
                    "offset_seconds": 6,
                    "metadata": {"duration": 18, "clothing": "dark", "proximity": "near"}
                },
                {
                    "deviceId": "front-door-cam-01",
                    "deviceType": "doorbell",
                    "eventType": "person_detected",
                    "location": "front_door",
                    "confidence": 0.94,
                    "offset_seconds": 38,
                    "metadata": {"duration": 25, "action": "inspecting_entrance"}
                },
                {
                    "deviceId": "front-door-sensor-04",
                    "deviceType": "sensor",
                    "eventType": "motion_detected",
                    "location": "front_door",
                    "confidence": 0.92,
                    "offset_seconds": 65,
                    "metadata": {"duration": 22, "repeated": True}
                },
                {
                    "deviceId": "front-door-cam-01",
                    "deviceType": "doorbell",
                    "eventType": "person_left",
                    "location": "front_door",
                    "confidence": 0.91,
                    "offset_seconds": 92,
                    "metadata": {"duration": 5, "direction": "street"}
                }
            ]
        },
        "normal_delivery": {
            "id": "normal_delivery",
            "title": "Normal Package Delivery",
            "category": "routine",
            "badge": "DELIVERY",
            "expected_situation": "PACKAGE DELIVERY VERIFIED",
            "expected_confidence": 0.94,
            "severity": "info",
            "description": "Courier drops package and departs immediately (dwell <40s).",
            "home_state": "away",
            "events": [
                {
                    "deviceId": "front-door-cam-01",
                    "deviceType": "doorbell",
                    "eventType": "person_detected",
                    "location": "front_door",
                    "confidence": 0.98,
                    "offset_seconds": 0,
                    "metadata": {"duration": 10, "courier_uniform": True}
                },
                {
                    "deviceId": "front-door-cam-01",
                    "deviceType": "doorbell",
                    "eventType": "package_detected",
                    "location": "front_door",
                    "confidence": 0.97,
                    "offset_seconds": 15,
                    "metadata": {"box_size": "medium", "carrier": "Prime"}
                },
                {
                    "deviceId": "front-door-cam-01",
                    "deviceType": "doorbell",
                    "eventType": "person_left",
                    "location": "front_door",
                    "confidence": 0.95,
                    "offset_seconds": 32,
                    "metadata": {"duration": 8}
                }
            ]
        },
        "visitor_arrival": {
            "id": "visitor_arrival",
            "title": "Visitor Arrival & Greeting",
            "category": "routine",
            "badge": "VISITOR",
            "expected_situation": "VISITOR ARRIVAL",
            "expected_confidence": 0.88,
            "severity": "low",
            "description": "Visitor arrives while residents are home; entrance door opens normally.",
            "home_state": "home",
            "events": [
                {
                    "deviceId": "front-door-cam-01",
                    "deviceType": "doorbell",
                    "eventType": "person_detected",
                    "location": "front_door",
                    "confidence": 0.95,
                    "offset_seconds": 0,
                    "metadata": {"duration": 12}
                },
                {
                    "deviceId": "front-door-sensor-04",
                    "deviceType": "sensor",
                    "eventType": "door_opened",
                    "location": "front_door",
                    "confidence": 0.99,
                    "offset_seconds": 18,
                    "metadata": {"actor": "resident_greeting"}
                },
                {
                    "deviceId": "living-room-sensor-05",
                    "deviceType": "sensor",
                    "eventType": "motion_detected",
                    "location": "living_room",
                    "confidence": 0.93,
                    "offset_seconds": 28,
                    "metadata": {"duration": 15}
                }
            ]
        },
        "late_night": {
            "id": "late_night",
            "title": "Repeated Late-Night Activity",
            "category": "security_threat",
            "badge": "PERIMETER CURFEW",
            "expected_situation": "LATE NIGHT ACTIVITY",
            "expected_confidence": 0.82,
            "severity": "medium",
            "description": "Backyard floodlight detects human presence at 2:15 AM while occupants sleep.",
            "home_state": "sleep",
            "events": [
                {
                    "deviceId": "backyard-cam-03",
                    "deviceType": "camera",
                    "eventType": "motion_detected",
                    "location": "backyard",
                    "confidence": 0.91,
                    "offset_seconds": 0,
                    "metadata": {"duration": 8, "time_hour": 2}
                },
                {
                    "deviceId": "backyard-cam-03",
                    "deviceType": "camera",
                    "eventType": "person_detected",
                    "location": "backyard",
                    "confidence": 0.86,
                    "offset_seconds": 12,
                    "metadata": {"duration": 22, "time_hour": 2}
                },
                {
                    "deviceId": "garage-cam-02",
                    "deviceType": "camera",
                    "eventType": "motion_detected",
                    "location": "garage",
                    "confidence": 0.88,
                    "offset_seconds": 35,
                    "metadata": {"duration": 14}
                }
            ]
        },
        "false_alarm": {
            "id": "false_alarm",
            "title": "Transient Wind / Branch (False Alarm)",
            "category": "noise_reduction",
            "badge": "FILTERED NOISE",
            "expected_situation": "TRANSIENT MOTION (FILTERED)",
            "expected_confidence": 0.28,
            "severity": "info",
            "description": "Momentary foliage motion under 10 seconds; notification suppressed.",
            "home_state": "home",
            "events": [
                {
                    "deviceId": "front-door-cam-01",
                    "deviceType": "doorbell",
                    "eventType": "motion_detected",
                    "location": "front_door",
                    "confidence": 0.42,
                    "offset_seconds": 0,
                    "metadata": {"duration": 6, "pixel_variance": "foliage"}
                }
            ]
        },
        "device_offline": {
            "id": "device_offline",
            "title": "Camera Hardware Heartbeat Loss",
            "category": "infrastructure",
            "badge": "HEALTH FAILURE",
            "expected_situation": "DEVICE OFFLINE",
            "expected_confidence": 0.99,
            "severity": "medium",
            "description": "Perimeter camera drops Wi-Fi telemetry and misses heartbeat response.",
            "home_state": "away",
            "events": [
                {
                    "deviceId": "garage-cam-02",
                    "deviceType": "camera",
                    "eventType": "device_offline",
                    "location": "garage",
                    "confidence": 0.99,
                    "offset_seconds": 0,
                    "metadata": {"reason": "heartbeat_timeout", "rssi": -92}
                }
            ]
        }
    }
