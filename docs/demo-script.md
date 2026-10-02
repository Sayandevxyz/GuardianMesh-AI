# GuardianMesh AI — Hackathon 60-Second Demo Walkthrough

## The Hackathon Demo Pitch
> "Traditional smart homes notify you about isolated events: 'Motion detected', 'Person detected'.
> GuardianMesh AI understands **relationships between events** to deliver real-world Situation Intelligence."

---

### Step 1: Open Dashboard (0:00 - 0:10)
1. Point out the top header:
   - System Operational badge
   - **Home Status: Protected** (occupancy mode: Away)
2. Explain:
   - "Right now, the home is unoccupied. Let's see what happens when unexpected perimeter activity occurs."

### Step 2: 1-Click "DEMO MODE" (0:10 - 0:25)
1. Click the cyan **DEMO MODE** button in the top navbar.
2. Watch the execution notifications:
   - "DEMO 01: Resetting simulation state & setting Home to Away mode..."
   - "DEMO 02: Ingesting sequential entrance event stream from Front Door Doorbell..."
   - "DEMO 03: Situation Engine temporal correlation fusing 5 events into Situation..."
   - "DEMO 04: AI Reasoning Agent generating contextual explanation & incident report..."
3. The dashboard animates live:
   - Live event stream populates in real-time
   - Large hero situation card escalates:
     **⚠ UNUSUAL ENTRANCE ACTIVITY (92% Confidence)**

### Step 3: Investigate Situation & Interactive Graph (0:25 - 0:40)
1. Click **Investigate Situation**.
2. Highlight:
   - Reconstructed timeline: 10:41 Motion → 10:42 Person → 10:42 Extended presence (92s) → 10:43 Repeated movement → 10:44 Person left.
   - **Why This Was Detected**: Show contributing factors (+25% dwell time, +20% person detected, +20% home unoccupied).
   - **Situation Topology Graph**: Point to the visual nodes and directed edges (`caused_by`, `followed_by`, `escalated_to`).

### Step 4: Ask Guardian & Tool Execution (0:40 - 0:50)
1. Click **Ask Guardian** or open the AI Assistant tab.
2. Click the suggested chip: *"Why did I get this alert?"*
3. Show the tool calls executed:
   - `get_home_status()`, `get_recent_events()`, `get_active_situations()`
4. Point out the grounded answer:
   - Explains the multi-signal dwell correlation rather than a single motion event.

### Step 5: Incident Report & Developer Console (0:50 - 1:00)
1. Click **Incidents**: Show the formal printable security incident report.
2. Click **Developer Console**: Show the live pipeline trace:
   `EVENT → CORRELATION → SITUATION → AGENT → BEDROCK`
3. Conclude with tagline:
   **"Smart homes detect. GuardianMesh understands."**
