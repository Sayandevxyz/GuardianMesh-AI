from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import httpx
from app.config import settings

class SmartHomeProvider(ABC):
    """
    Abstract interface for smart home providers (Ring, Simulator, Zigbee/Matter).
    Ensures seamless interchangeability without altering the Situation Engine.
    """
    @abstractmethod
    async def get_devices(self) -> List[Dict[str, Any]]:
        """Fetch list of active devices."""
        pass

    @abstractmethod
    async def get_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch historical or recent telemetry events."""
        pass

    @abstractmethod
    async def subscribe_to_events(self, callback) -> None:
        """Register live event listener."""
        pass

    @abstractmethod
    async def send_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatch or ingest an event into the provider bus."""
        pass

    @abstractmethod
    def get_source_label(self) -> str:
        """Returns provider label: 'LIVE RING' or 'SIMULATOR'."""
        pass


class RingEventAdapter:
    """
    Normalizes proprietary Ring webhook/API event payloads
    into standard GuardianMesh AI Event contracts.
    """
    @staticmethod
    def normalize_ring_event(payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Converts Ring Push/Webhook payloads:
        e.g., {'kind': 'motion', 'doorbot_id': 12345, 'created_at': '...'}
        into GuardianMesh standard event format.
        """
        ring_kind = payload.get("kind", payload.get("event_type", "motion"))
        
        # Mapping Ring event types to GuardianMesh ontology
        type_mapping = {
            "motion": "motion_detected",
            "ding": "person_detected",
            "intercom_handset_audio_ding": "person_detected",
            "doorbell": "person_detected",
            "on_demand": "motion_detected",
            "person": "person_detected",
            "package_delivered": "package_detected",
            "package_retrieved": "package_removed",
        }
        
        normalized_type = type_mapping.get(ring_kind, "motion_detected")
        device_id = str(payload.get("doorbot_id", payload.get("device_id", "ring-device-01")))
        
        # Location inference or extraction
        location = payload.get("location", "front_door")
        if "description" in payload and "garage" in payload["description"].lower():
            location = "garage"
        elif "backyard" in payload.get("description", "").lower():
            location = "backyard"

        return {
            "id": f"evt_ring_{uuid.uuid4().hex[:8]}",
            "source": "ring",
            "deviceId": device_id,
            "deviceType": payload.get("device_type", "camera"),
            "eventType": normalized_type,
            "timestamp": payload.get("created_at", datetime.utcnow().isoformat()),
            "location": location,
            "confidence": float(payload.get("confidence", 0.96)),
            "metadata": {
                "raw_ring_kind": ring_kind,
                "siren_status": payload.get("siren_status", "off"),
                "duration": payload.get("duration", 15),
                "hq_snapshot_url": payload.get("snapshot_url", None),
                "is_live_ring": True
            }
        }


class RingProvider(SmartHomeProvider):
    """
    Integration adapter for the real Ring API (via Ring Connect / OAuth / Ring Client).
    Configurable with credentials. If unconfigured or offline, gracefully reports
    connection status without interrupting GuardianMesh operation.
    """
    def __init__(self, api_url: str = settings.RING_API_URL, token: str = settings.RING_ACCESS_TOKEN):
        self.api_url = api_url.rstrip('/')
        self.token = token
        self.is_configured = bool(token and token.strip())
        self._subscribers = []

    def get_source_label(self) -> str:
        return "LIVE RING" if self.is_configured else "RING (DISCONNECTED)"

    async def get_devices(self) -> List[Dict[str, Any]]:
        if not self.is_configured:
            # Explicitly return empty or documented warning rather than fabricating fake real data
            return []
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {"Authorization": f"Bearer {self.token}"}
                response = await client.get(f"{self.api_url}/clients_api/ring_devices", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    devices = []
                    # Parse doorbots, authorized_doorbots, stickup_cams
                    for d in data.get("doorbots", []) + data.get("stickup_cams", []):
                        devices.append({
                            "id": f"ring_{d.get('id')}",
                            "name": d.get("description", "Ring Camera"),
                            "device_type": "camera" if "cam" in d.get("kind", "").lower() else "doorbell",
                            "location": "front_door" if "front" in d.get("description", "").lower() else "perimeter",
                            "status": "online" if d.get("health", {}).get("connected") else "offline",
                            "battery_level": d.get("battery_life", 100),
                            "signal_strength": d.get("health", {}).get("wifi_signal_strength", 90),
                            "source": "ring",
                            "firmware_version": d.get("firmware_version", "ring-firmware-latest")
                        })
                    return devices
        except Exception as e:
            print(f"[RingProvider] Error communicating with Ring API: {e}")
        return []

    async def get_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        if not self.is_configured:
            return []
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                headers = {"Authorization": f"Bearer {self.token}"}
                response = await client.get(f"{self.api_url}/clients_api/doorbots/history", headers=headers)
                if response.status_code == 200:
                    raw_events = response.json()
                    return [RingEventAdapter.normalize_ring_event(e) for e in raw_events[:limit]]
        except Exception as e:
            print(f"[RingProvider] Error fetching history: {e}")
        return []

    async def subscribe_to_events(self, callback) -> None:
        self._subscribers.append(callback)

    async def send_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        normalized = RingEventAdapter.normalize_ring_event(event_data)
        for sub in self._subscribers:
            try:
                await sub(normalized)
            except Exception as e:
                print(f"[RingProvider] Error delivering to subscriber: {e}")
        return normalized


class SimulatorProvider(SmartHomeProvider):
    """
    High-fidelity hardware simulator simulating devices and smart-home events.
    Clearly tags all events and devices with source: 'simulator'.
    """
    def __init__(self):
        self._devices = [
            {
                "id": "front-door-cam-01",
                "name": "Front Door Video Doorbell",
                "device_type": "doorbell",
                "location": "front_door",
                "status": "online",
                "battery_level": 92,
                "signal_strength": 96,
                "source": "simulator",
                "firmware_version": "v3.18.1-mesh-sim"
            },
            {
                "id": "garage-cam-02",
                "name": "Garage Floodlight Camera",
                "device_type": "camera",
                "location": "garage",
                "status": "online",
                "battery_level": 100,  # Hardwired
                "signal_strength": 88,
                "source": "simulator",
                "firmware_version": "v3.18.1-mesh-sim"
            },
            {
                "id": "backyard-cam-03",
                "name": "Backyard Spotlight Camera",
                "device_type": "camera",
                "location": "backyard",
                "status": "online",
                "battery_level": 78,
                "signal_strength": 84,
                "source": "simulator",
                "firmware_version": "v3.18.1-mesh-sim"
            },
            {
                "id": "front-door-sensor-04",
                "name": "Front Entrance Contact Sensor",
                "device_type": "sensor",
                "location": "front_door",
                "status": "online",
                "battery_level": 95,
                "signal_strength": 92,
                "source": "simulator",
                "firmware_version": "v1.4.0-mesh-sim"
            },
            {
                "id": "living-room-sensor-05",
                "name": "Living Room Motion Sensor",
                "device_type": "sensor",
                "location": "living_room",
                "status": "online",
                "battery_level": 89,
                "signal_strength": 98,
                "source": "simulator",
                "firmware_version": "v1.4.0-mesh-sim"
            }
        ]
        self._subscribers = []
        self._events_history = []

    def get_source_label(self) -> str:
        return "SIMULATOR"

    async def get_devices(self) -> List[Dict[str, Any]]:
        return self._devices

    async def get_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self._events_history[-limit:]

    async def subscribe_to_events(self, callback) -> None:
        self._subscribers.append(callback)

    async def send_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]:
        evt = dict(event_data)
        if "id" not in evt:
            evt["id"] = f"evt_sim_{uuid.uuid4().hex[:8]}"
        evt["source"] = "simulator"
        if "timestamp" not in evt:
            evt["timestamp"] = datetime.utcnow().isoformat()
        
        self._events_history.append(evt)
        for sub in self._subscribers:
            try:
                await sub(evt)
            except Exception as e:
                print(f"[SimulatorProvider] Error broadcasting event: {e}")
        return evt


def get_smart_home_provider() -> SmartHomeProvider:
    """Factory creating configured provider based on RING_MODE."""
    if settings.RING_MODE == "ring" and settings.RING_ACCESS_TOKEN:
        return RingProvider()
    return SimulatorProvider()
