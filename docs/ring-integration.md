# Ring Integration Architecture

## Philosophy
The Ring integration in GuardianMesh AI is designed around a strict provider abstraction:

```python
class SmartHomeProvider(ABC):
    @abstractmethod
    async def get_devices(self) -> List[Dict[str, Any]]: ...
    @abstractmethod
    async def get_events(self, limit: int = 50) -> List[Dict[str, Any]]: ...
    @abstractmethod
    async def subscribe_to_events(self, callback) -> None: ...
    @abstractmethod
    async def send_event(self, event_data: Dict[str, Any]) -> Dict[str, Any]: ...
```

## Ring Adapter Architecture
- **Location**: `apps/api/app/integrations/ring/ring_provider.py`
- **Classes**:
  - `RingProvider`: Connects to `https://api.ring.com` via Bearer access token.
  - `RingEventAdapter`: Normalizes Ring's `ding`, `motion`, `intercom`, and `package_delivered` webhooks into unified contracts.
  - `SimulatorProvider`: Emulates devices with complete parity when Ring credentials are not active.

## Switching Modes
In `.env` or application settings:
```bash
# Production Ring integration
RING_MODE=ring
RING_ACCESS_TOKEN=<your_ring_token>

# Or Local Simulator testbed
RING_MODE=simulator
```
The Situation Engine and UI operate identically without modification.
The UI clearly displays `LIVE RING` or `SIMULATOR` badges to maintain technical integrity.
