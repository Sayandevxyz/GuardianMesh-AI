# GuardianMesh AI — Developer Friction Log

This document records the technical friction, challenges, edge cases, and unexpected behaviors encountered during the design, implementation, and integration of **GuardianMesh AI** (AWS Bedrock, Ring Integration, Model Context Protocol, and Situation Intelligence Engine).

---

## Friction Entry 1: Amazon Bedrock Converse Tool-Use Output Formatting & Schema Rigidity

- **Specific Task Attempted**:  
  Implementing deterministic agent tool-calling using Anthropic Claude 3.5 Sonnet on Amazon Bedrock to let GuardianMesh reason over multi-sensor smart-home situations and invoke tools (`explain_situation`, `get_recent_events`, `trigger_alexa_announcement`).
- **Steps Taken**:
  1. Configured `boto3.client('bedrock-runtime', region_name='us-east-1')`.
  2. Defined tool specifications conforming to the Model Context Protocol (MCP) JSON Schema.
  3. Sent conversation messages with `toolConfig` containing the tool definitions.
  4. Parsed the resulting `toolUse` blocks returned by the model to trigger local situation graph lookups.
- **Expected Result**:  
  Bedrock would consistently return pure JSON payloads in the tool arguments without markdown code fences (` ```json `) or extraneous conversational preamble, conforming strictly to the defined schema.
- **Actual Result**:  
  When testing complex prompts with multi-event timelines or edge-case false alarm conditions, Claude 3.5 Sonnet occasionally wrapped JSON strings in backtick fences inside the string attributes or prepended conversational reasoning text before the tool invocation block, resulting in JSON decode exceptions (`json.decoder.JSONDecodeError`).
- **Severity Rating**: **High** (breaks automated agent reasoning loop if uncaught).
- **Workaround Used**:  
  1. Implemented a robust multi-pass JSON parser that strips markdown code blocks, normalizes unescaped newlines, and extracts JSON objects using regex delimiters.
  2. Built a dual-provider abstraction (`BedrockAIProvider` and `MockAIProvider`): if Bedrock throttles, is unreachable, or returns malformed payloads during hackathon demos, the engine automatically falls back to an offline deterministic mock with verified schema outputs.
- **Actionable Suggestion for AWS Bedrock Team**:  
  Provide native strict schema enforcement (similar to OpenAI `response_format: {"type": "json_schema", "strict": true}`) directly in the Bedrock Converse API so the model weights are constrained to valid JSON tokens during tool execution.

---

## Friction Entry 2: Ring Telemetry Ingestion & Device Event Schema Inconsistencies

- **Specific Task Attempted**:  
  Abstracting live Ring Video Doorbell and Security Camera webhooks into a unified typed telemetry schema (`SmartHomeEvent`) for real-time temporal clustering.
- **Steps Taken**:
  1. Designed the `SmartHomeProvider` base class and `RingProvider` adapter.
  2. Registered webhook endpoints to receive motion, doorbell press ("ding"), and person detection events.
  3. Tested event payloads against both battery-powered and hardwired Ring cameras.
- **Expected Result**:  
  All Ring devices would emit a uniform payload structure with standardized ISO-8601 UTC timestamps, explicit motion classification tags (`person`, `vehicle`, `general_motion`), and reliable device battery/signal telemetry.
- **Actual Result**:  
  - Battery devices frequently omitted person detection metadata unless a Ring Protect subscription was active with cloud CV enabled.
  - Event timestamps varied between ISO strings and Unix millisecond timestamps across different Ring API firmware versions.
  - "Ding" events and motion events used differing nesting (`data.event_type` vs `kind`).
- **Severity Rating**: **Medium** (causes dropped correlation links if events fail schema validation).
- **Workaround Used**:  
  Created `RingProvider.normalize_event()` with defensive type coercion, multi-key fallback extraction, and synthetic dwell-time estimators for devices that only fire instantaneous motion triggers.
- **Actionable Suggestion for Ring Developer Team**:  
  Publish a standardized CloudEvents v1.0 compliant webhook specification with guaranteed top-level envelope fields (`id`, `source`, `type`, `time`, `data`) across all Ring doorbells, floodlights, and auxiliary contact sensors.

---

## Friction Entry 3: Model Context Protocol (MCP) FastMCP & Async FastAPI Event Loop Collision

- **Specific Task Attempted**:  
  Exposing GuardianMesh's Situation Graph and incident investigation tools as a standard Model Context Protocol (MCP) server over SSE and stdio for consumption by Claude Desktop and Alexa+.
- **Steps Taken**:
  1. Installed the `mcp` Python SDK and initialized `FastMCP("guardianmesh-mcp")`.
  2. Decorated situation intelligence methods with `@mcp.tool()`.
  3. Attempted to mount the FastMCP SSE handler inside the existing FastAPI app running under Uvicorn.
- **Expected Result**:  
  FastMCP's SSE routes would cleanly mount as sub-routes under FastAPI (`/sse` and `/messages`) sharing the existing `asyncio` event loop.
- **Actual Result**:  
  FastMCP attempts to manage its own event loop and register OS signal handlers (`signal.signal`), causing `RuntimeError: This event loop is already running` and crashing the FastAPI process on Windows.
- **Severity Rating**: **High** (prevents simultaneous hosting of REST API and MCP SSE server on a single port).
- **Workaround Used**:  
  1. Created a dedicated stdio entrypoint (`apps/api/app/mcp/server.py`) for standalone MCP runners (like Claude Desktop).
  2. Exposed an HTTP MCP bridge (`/api/mcp/tools` and `/api/alexa/simulate`) inside FastAPI that directly invokes the registered MCP tool functions without conflicting with the transport layer.
- **Actionable Suggestion for Anthropic MCP Team**:  
  Provide an official, decoupled ASGI middleware or Starlette router wrapper in the Python `mcp` SDK so developers can embed MCP SSE endpoints into standard FastAPI/Starlette backends without transport-level event loop takeovers.

---

## Friction Entry 4: Async SQLAlchemy with SQLite Greenlet Spawn Requirement in Background Coroutines

- **Specific Task Attempted**:  
  Persisting continuous sensor event telemetry, updating situation graphs, and emitting real-time WebSocket updates asynchronously without blocking user requests.
- **Steps Taken**:
  1. Configured SQLAlchemy async engine with `sqlite+aiosqlite:///./guardianmesh.db`.
  2. Created background tasks via `asyncio.create_task` or FastAPI `BackgroundTasks` to evaluate situation rules post event ingestion.
  3. Accessed related incident and situation records across relationships.
- **Expected Result**:  
  Async queries and relationship traversal would execute seamlessly across coroutines.
- **Actual Result**:  
  When an event triggered situation clustering in the background, traversing `situation.events` threw `sqlalchemy.exc.InvalidRequestError: greenlet_spawn has not been called`, causing the event stream to silently stall.
- **Severity Rating**: **High** (intermittent data loss during continuous simulation playback).
- **Workaround Used**:  
  1. Explicitly installed `greenlet` in the virtual environment.
  2. Configured database relationships with `lazy="selectin"` to ensure all child records are eagerly fetched within the active session boundary.
  3. Implemented scoped session factories (`async_sessionmaker`) with explicit `async with` context manager wrappers inside all background worker tasks.
- **Actionable Suggestion for SQLAlchemy / aiosqlite Documentation**:  
  Add prominent callouts in the async ORM documentation regarding background task execution with SQLite, explicitly warning that default lazy-loading mechanisms fail outside the primary request coroutine context.

---

## Friction Entry 5: False-Alarm Filtering vs. Curfew Heuristics Precedence

- **Specific Task Attempted**:  
  Building deterministic temporal clustering rules that accurately distinguish between benign nocturnal activity (wind/foliage movement) and legitimate perimeter intrusions (late-night loitering).
- **Steps Taken**:
  1. Wrote correlation rules for `late_night_curfew` (motion between 11 PM and 5 AM).
  2. Wrote correlation rules for `false_alarm` (isolated motion under 15s duration without person detection).
  3. Ran test scenarios containing synthetic wind gusts at 2 AM.
- **Expected Result**:  
  The engine would classify 2 AM leaf rustling as a `false_alarm` rather than alerting the homeowner to an intrusion.
- **Actual Result**:  
  The curfew rule evaluated first in the engine pipeline and immediately flagged the event as a `high_severity` perimeter breach because the timestamp fell within the curfew window, overriding the transient duration heuristic.
- **Severity Rating**: **Medium** (leads to alert fatigue, undermining the core value proposition of GuardianMesh).
- **Workaround Used**:  
  Reordered the engine evaluation hierarchy to execute **transient/false-alarm suppression filters prior to contextual curfew escalations**. An event cluster must contain confirmed person telemetry or exceed the 15-second persistence threshold before curfew weights can be applied.
- **Actionable Suggestion for Smart Home Analytics Developers**:  
  Always treat spatial/biometric persistence (person confirmed + dwell duration) as a gatekeeper before applying temporal severity escalations (time of day / occupancy status).

---

## Summary of Friction Points

| # | Component | Task Attempted | Severity | Workaround Status |
|---|---|---|---|---|
| **1** | Amazon Bedrock Claude 3.5 | Agent Tool Calling & Structured JSON | **High** | Resolved (Regex sanitizer + Dual Provider fallback) |
| **2** | Ring Developer APIs | Multi-device Webhook Normalization | **Medium** | Resolved (Defensive coercion layer in `RingProvider`) |
| **3** | Model Context Protocol (MCP) | FastMCP co-hosting in FastAPI | **High** | Resolved (Dedicated stdio runner + HTTP bridge) |
| **4** | Async SQLAlchemy / SQLite | Background task relationship loading | **High** | Resolved (`selectinload` + `greenlet` dependency) |
| **5** | Situation Engine Rules | Transient wind vs. Curfew breach precedence | **Medium** | Resolved (Filter gatekeeper pattern) |

---

*This friction log was compiled as part of the GuardianMesh AI submission to document authentic developer experience and integration insights for the developer community and hackathon judges.*
