# Privacy Architecture & Edge Processing

## The Problem With Traditional Smart Homes
Conventional cloud AI security products upload video feeds of homeowners' living rooms, children playing in backyards, and front porches to remote servers for vision-model inference. This creates immense privacy vulnerabilities, high bandwidth overhead, and substantial compute costs.

## The GuardianMesh Solution
GuardianMesh AI enforces **Zero Raw Video to Cloud LLMs**:

```
DEVICE (Perimeter Camera / Contact Sensor)
   ↓
EVENT METADATA (Zone, Dwell Seconds, Object Class)
   ↓
LOCAL / EDGE SITUATION ENGINE (Temporal Graph Correlation)
   ↓
STRUCTURED AI CONTEXT (JSON Ontology)
   ↓
AMAZON BEDROCK (Zero Raw Video Transmitted)
```

## User Privacy Controls
1. **Configurable Retention**: Auto-purge events after a user-selected time window (default 30 days).
2. **Instant Full Purge**: One-click deletion of all historical telemetry, graph states, and incident logs.
3. **Local Offline Correlation**: Situation Engine executes deterministically on local microcontrollers or edge servers without cloud dependency.
