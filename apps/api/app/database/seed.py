import asyncio
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database.session import AsyncSessionLocal, init_db
from app.models.models import (
    Home, Device, Event, Situation, SituationEvent, Incident,
    Alert, AIUsage, PrivacySetting
)

async def seed_data():
    await init_db()
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        res = await session.execute(select(Home).limit(1))
        if res.scalars().first():
            return

        # 1. Create Home
        home = Home(
            id="home_guardian_01",
            name="Guardian House",
            address="1042 Mesh Lane, Silicon Hills",
            current_state="away"
        )
        session.add(home)
        await session.flush()

        # 2. Create Devices
        devices = [
            Device(
                id="front-door-cam-01",
                home_id=home.id,
                name="Front Door Video Doorbell",
                device_type="doorbell",
                location="front_door",
                status="online",
                battery_level=92,
                signal_strength=96,
                source="simulator",
                firmware_version="v3.18.1-mesh-sim"
            ),
            Device(
                id="garage-cam-02",
                home_id=home.id,
                name="Garage Floodlight Camera",
                device_type="camera",
                location="garage",
                status="online",
                battery_level=100,
                signal_strength=88,
                source="simulator",
                firmware_version="v3.18.1-mesh-sim"
            ),
            Device(
                id="backyard-cam-03",
                home_id=home.id,
                name="Backyard Spotlight Camera",
                device_type="camera",
                location="backyard",
                status="online",
                battery_level=78,
                signal_strength=84,
                source="simulator",
                firmware_version="v3.18.1-mesh-sim"
            ),
            Device(
                id="front-door-sensor-04",
                home_id=home.id,
                name="Front Entrance Contact Sensor",
                device_type="sensor",
                location="front_door",
                status="online",
                battery_level=95,
                signal_strength=92,
                source="simulator",
                firmware_version="v1.4.0-mesh-sim"
            ),
            Device(
                id="living-room-sensor-05",
                home_id=home.id,
                name="Living Room Motion Sensor",
                device_type="sensor",
                location="living_room",
                status="online",
                battery_level=89,
                signal_strength=98,
                source="simulator",
                firmware_version="v1.4.0-mesh-sim"
            )
        ]
        session.add_all(devices)
        await session.flush()

        # 3. Seed active situation: "Unusual Entrance Activity"
        now = datetime.utcnow()
        t_base = now - timedelta(minutes=4)

        factors = [
            {"factor": "Person Detected at Perimeter", "weight": 0.20, "category": "detection", "description": "High-confidence biometric person classification triggered."},
            {"factor": "Extended Presence (92s)", "weight": 0.25, "category": "temporal", "description": "Subject lingered near front door exceeding the 45-second baseline."},
            {"factor": "Repeated Movement Patterns", "weight": 0.20, "category": "behavioral", "description": "Sequential telemetry triggers indicating loitering."},
            {"factor": "Home State: Away (Unoccupied)", "weight": 0.20, "category": "context", "description": "Premises marked unoccupied; visitor presence escalated."},
            {"factor": "Late-Night Time Window", "weight": 0.10, "category": "environmental", "description": "Activity occurred outside standard daytime visitor hours."}
        ]

        graph_data = {
            "nodes": [
                {"id": "node_sit", "label": "Unusual Entrance Activity", "type": "situation", "status": "active"},
                {"id": "node_loc", "label": "Front Door", "type": "location", "status": "monitored"},
                {"id": "node_state", "label": "State: Away", "type": "home_state", "status": "context"},
                {"id": "node_dev", "label": "Front Door Camera", "type": "device", "status": "online"},
                {"id": "node_e1", "label": "Motion Detected", "type": "event", "status": "detected"},
                {"id": "node_e2", "label": "Person Detected", "type": "event", "status": "detected"},
                {"id": "node_e3", "label": "Repeated Movement", "type": "event", "status": "detected"},
                {"id": "node_e4", "label": "Person Left", "type": "event", "status": "detected"}
            ],
            "edges": [
                {"id": "e_loc", "source": "node_loc", "target": "node_sit", "label": "occurred_near", "animated": True},
                {"id": "e_st", "source": "node_state", "target": "node_sit", "label": "correlated_with", "animated": False},
                {"id": "e_dev", "source": "node_dev", "target": "node_e1", "label": "caused_by", "animated": True},
                {"id": "e_seq1", "source": "node_e1", "target": "node_e2", "label": "followed_by", "animated": True},
                {"id": "e_seq2", "source": "node_e2", "target": "node_e3", "label": "followed_by", "animated": True},
                {"id": "e_seq3", "source": "node_e3", "target": "node_e4", "label": "followed_by", "animated": True},
                {"id": "e_esc", "source": "node_e3", "target": "node_sit", "label": "escalated_to", "animated": True}
            ]
        }

        active_situation = Situation(
            id="sit_entrance_01",
            home_id=home.id,
            title="Unusual Entrance Activity",
            situation_type="unusual_entrance_activity",
            severity="medium",
            confidence=0.92,
            location="front_door",
            status="active",
            duration_seconds=92,
            summary="An individual remained near your entrance for 92 seconds while the home was unoccupied.",
            reasoning="The alert was triggered by multiple correlated events rather than a single motion event.",
            recommended_action="Review incident timeline or activate exterior floodlights.",
            contributing_factors_json=factors,
            graph_data_json=graph_data,
            created_at=t_base
        )
        session.add(active_situation)
        await session.flush()

        # Seed events for this situation
        events_data = [
            (t_base, "motion_detected", "Motion detected at entrance perimeter", 0.95),
            (t_base + timedelta(seconds=15), "person_detected", "Person detected near front porch", 0.94),
            (t_base + timedelta(seconds=45), "motion_detected", "Repeated movement detected", 0.92),
            (t_base + timedelta(seconds=92), "person_left", "Person departed towards sidewalk", 0.90)
        ]

        for ts, etype, desc, conf in events_data:
            e = Event(
                home_id=home.id,
                device_id="front-door-cam-01",
                device_type="doorbell",
                event_type=etype,
                timestamp=ts,
                location="front_door",
                confidence=conf,
                metadata_json={"duration": 15, "description": desc},
                source="simulator",
                processed=True,
                situation_id=active_situation.id
            )
            session.add(e)

        # Seed an incident report
        timeline = [
            {"time": t_base.strftime("%I:%M:%S %p"), "event": "Motion Detected", "device": "Front Door Video Doorbell", "location": "Front Door"},
            {"time": (t_base + timedelta(seconds=15)).strftime("%I:%M:%S %p"), "event": "Person Detected", "device": "Front Door Video Doorbell", "location": "Front Door"},
            {"time": (t_base + timedelta(seconds=45)).strftime("%I:%M:%S %p"), "event": "Repeated Movement", "device": "Front Entrance Contact Sensor", "location": "Front Door"},
            {"time": (t_base + timedelta(seconds=92)).strftime("%I:%M:%S %p"), "event": "Person Left", "device": "Front Door Video Doorbell", "location": "Front Door"}
        ]
        incident = Incident(
            id="inc_sample_01",
            home_id=home.id,
            situation_id=active_situation.id,
            title="Unusual Entrance Loitering Incident",
            severity="medium",
            status="open",
            summary="Subject lingered near entrance for 92s without resident access or delivery action.",
            timeline_json=timeline,
            ai_analysis="Algorithmic correlation identified sustained dwell time (92s) and repeated movement in Away mode with 92% confidence.",
            recommended_actions_json=[
                "Review recorded footage from Front Door Camera.",
                "Verify resident safety check.",
                "Verify perimeter locks."
            ],
            created_at=t_base
        )
        session.add(incident)

        # 4. Privacy settings default
        privacy = PrivacySetting(
            id="default",
            raw_video_retention_days=0,
            send_raw_video_to_ai=False,
            send_structured_metadata_only=True,
            cloud_processing_enabled=True,
            ai_analysis_enabled=True,
            data_retention_days=30,
            local_encryption_enabled=True
        )
        session.add(privacy)

        # 5. Baseline AI usage
        ai_u = AIUsage(
            model_id="claude-3-5-sonnet",
            provider="mock",
            requests_count=1284,
            prompt_tokens=420000,
            completion_tokens=180000,
            estimated_cost_usd=0.84,
            latency_ms=180,
            status="success"
        )
        session.add(ai_u)

        await session.commit()
        print("[Database] Successfully seeded GuardianMesh AI baseline data.")

if __name__ == "__main__":
    asyncio.run(seed_data())
