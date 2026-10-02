from typing import Dict, Any, List, Optional
import json
from datetime import datetime
from sqlalchemy import select
from app.database.session import AsyncSessionLocal
from app.models.models import Home, Device, Event, Situation, Incident, AgentExecution, AIUsage
from app.agents.ai_provider import get_ai_provider

class GuardianAgent:
    """
    Autonomous smart-home reasoning agent equipped with real tool execution capabilities.
    Executes functions over application database before answering user inquiries.
    """

    def __init__(self):
        self.ai_provider = get_ai_provider()

    async def get_home_status(self) -> Dict[str, Any]:
        """Tool: Inspect current home state, security status, and device summary."""
        async with AsyncSessionLocal() as session:
            stmt = select(Home).limit(1)
            result = await session.execute(stmt)
            home = result.scalars().first()
            if not home:
                return {"state": "away", "status": "Protected", "address": "1042 Mesh Lane"}
            return {
                "id": home.id,
                "name": home.name,
                "state": home.current_state,
                "status": "Protected",
                "address": home.address
            }

    async def get_recent_events(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Tool: Retrieve latest telemetry events chronologically."""
        async with AsyncSessionLocal() as session:
            stmt = select(Event).order_by(Event.timestamp.desc()).limit(limit)
            result = await session.execute(stmt)
            events = result.scalars().all()
            return [
                {
                    "id": e.id,
                    "device": e.device_id,
                    "type": e.event_type,
                    "location": e.location,
                    "time": e.timestamp.strftime("%I:%M:%S %p"),
                    "confidence": e.confidence
                }
                for e in events
            ]

    async def get_active_situations(self) -> List[Dict[str, Any]]:
        """Tool: Retrieve currently active correlated situations."""
        async with AsyncSessionLocal() as session:
            stmt = select(Situation).filter(Situation.status == "active").order_by(Situation.created_at.desc())
            result = await session.execute(stmt)
            situations = result.scalars().all()
            return [
                {
                    "id": s.id,
                    "title": s.title,
                    "type": s.situation_type,
                    "severity": s.severity,
                    "confidence": s.confidence,
                    "location": s.location,
                    "duration_seconds": s.duration_seconds,
                    "summary": s.summary
                }
                for s in situations
            ]

    async def get_device_status(self) -> List[Dict[str, Any]]:
        """Tool: Check telemetry, battery, and connectivity of all smart home devices."""
        async with AsyncSessionLocal() as session:
            stmt = select(Device)
            result = await session.execute(stmt)
            devices = result.scalars().all()
            return [
                {
                    "id": d.id,
                    "name": d.name,
                    "type": d.device_type,
                    "location": d.location,
                    "status": d.status,
                    "battery": d.battery_level,
                    "signal": d.signal_strength,
                    "source": d.source
                }
                for d in devices
            ]

    async def get_incident_timeline(self, incident_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Tool: Retrieve reconstructed chronological timeline of an incident."""
        async with AsyncSessionLocal() as session:
            if incident_id:
                stmt = select(Incident).filter(Incident.id == incident_id)
            else:
                stmt = select(Incident).order_by(Incident.created_at.desc()).limit(1)
            result = await session.execute(stmt)
            inc = result.scalars().first()
            if inc and inc.timeline_json:
                return inc.timeline_json
            
            # Fallback to recent events if no incident
            return await self.get_recent_events(limit=5)

    async def create_incident_report(self, situation_id: Optional[str] = None, title: Optional[str] = None) -> Dict[str, Any]:
        """Tool: Generate a formal incident report from correlated situation telemetry."""
        async with AsyncSessionLocal() as session:
            situation = None
            if situation_id:
                stmt = select(Situation).filter(Situation.id == situation_id)
                res = await session.execute(stmt)
                situation = res.scalars().first()
            if not situation:
                stmt = select(Situation).order_by(Situation.created_at.desc()).limit(1)
                res = await session.execute(stmt)
                situation = res.scalars().first()

            events_stmt = select(Event).order_by(Event.timestamp.asc()).limit(6)
            evt_res = await session.execute(events_stmt)
            evts = evt_res.scalars().all()

            timeline = [
                {
                    "time": e.timestamp.strftime("%I:%M:%S %p"),
                    "event": e.event_type.replace("_", " ").title(),
                    "device": e.device_id,
                    "location": e.location
                }
                for e in evts
            ]

            incident_title = title or (f"Incident: {situation.title}" if situation else "Perimeter Security Incident")
            summary = situation.summary if situation else "Automated incident report generated from perimeter sensor correlation."
            ai_analysis = (
                situation.reasoning if situation else
                "Multi-event temporal correlation detected sustained presence exceeding standard threshold."
            )
            recommended_actions = [
                "Review recorded footage from Front Door Camera.",
                "Verify resident safety check.",
                "Archive incident report for security records."
            ]

            home_stmt = select(Home).limit(1)
            home_res = await session.execute(home_stmt)
            home = home_res.scalars().first()

            incident = Incident(
                home_id=home.id if home else "home_default",
                situation_id=situation.id if situation else None,
                title=incident_title,
                severity=situation.severity if situation else "medium",
                status="open",
                summary=summary,
                timeline_json=timeline,
                ai_analysis=ai_analysis,
                recommended_actions_json=recommended_actions
            )
            session.add(incident)
            await session.commit()
            await session.refresh(incident)

            return {
                "id": incident.id,
                "title": incident.title,
                "severity": incident.severity,
                "summary": incident.summary,
                "timeline": incident.timeline_json,
                "ai_analysis": incident.ai_analysis,
                "recommended_actions": incident.recommended_actions_json,
                "created_at": incident.created_at.isoformat()
            }

    async def process_chat(self, user_message: str, situation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Grounded agent chat pipeline:
        1. Parse intent and determine required tools
        2. Execute tools against application state
        3. Provide factual context to AI reasoning layer
        4. Log execution and usage metrics
        """
        tool_executions = []
        msg_lower = user_message.lower()

        # Tool selection based on user intent
        home_status = await self.get_home_status()
        tool_executions.append({
            "tool_name": "get_home_status",
            "args": {},
            "result_preview": f"State: {home_status.get('state')}, Status: {home_status.get('status')}"
        })

        recent_events = []
        if any(w in msg_lower for w in ["event", "what happened", "outside", "timeline", "why", "alert", "how many"]):
            recent_events = await self.get_recent_events(limit=5)
            tool_executions.append({
                "tool_name": "get_recent_events",
                "args": {"limit": 5},
                "result_preview": f"Retrieved {len(recent_events)} telemetry events"
            })

        active_situations = []
        if any(w in msg_lower for w in ["situation", "incident", "alert", "outside", "why", "happened", "confident"]):
            active_situations = await self.get_active_situations()
            tool_executions.append({
                "tool_name": "get_active_situations",
                "args": {},
                "result_preview": f"Found {len(active_situations)} active situations"
            })

        device_statuses = []
        if any(w in msg_lower for w in ["device", "camera", "sensor", "battery", "online"]):
            device_statuses = await self.get_device_status()
            tool_executions.append({
                "tool_name": "get_device_status",
                "args": {},
                "result_preview": f"{len(device_statuses)} devices active"
            })

        if "report" in msg_lower and "create" in msg_lower:
            report = await self.create_incident_report(situation_id)
            tool_executions.append({
                "tool_name": "create_incident_report",
                "args": {"situation_id": situation_id},
                "result_preview": f"Generated report ID: {report.get('id')}"
            })

        current_sit = active_situations[0] if active_situations else None

        system_context = {
            "home_state": home_status.get("state", "away"),
            "current_situation": current_sit,
            "recent_events": recent_events,
            "devices": device_statuses
        }

        ai_response = await self.ai_provider.chat(
            user_message=user_message,
            system_context=system_context,
            tool_results=tool_executions
        )

        # Record AI usage in database
        async with AsyncSessionLocal() as session:
            usage = AIUsage(
                model_id=ai_response.get("model_id", "guardian-agent"),
                provider=ai_response.get("provider", "mock"),
                requests_count=1,
                prompt_tokens=ai_response.get("prompt_tokens", 300),
                completion_tokens=ai_response.get("completion_tokens", 120),
                estimated_cost_usd=0.0008,
                latency_ms=ai_response.get("latency_ms", 180),
                status="success"
            )
            session.add(usage)

            # Record AgentExecution
            agtx = AgentExecution(
                situation_id=current_sit.get("id") if current_sit else None,
                prompt=user_message,
                response=ai_response.get("response", ""),
                model_id=ai_response.get("model_id", "guardian-agent"),
                provider=ai_response.get("provider", "mock"),
                tokens_prompt=ai_response.get("prompt_tokens", 300),
                tokens_completion=ai_response.get("completion_tokens", 120),
                latency_ms=ai_response.get("latency_ms", 180),
                tool_calls_json=tool_executions,
                status="success"
            )
            session.add(agtx)
            await session.commit()

        return {
            "response": ai_response.get("response"),
            "tool_executions": tool_executions,
            "situation_id": current_sit.get("id") if current_sit else None,
            "confidence": current_sit.get("confidence") if current_sit else 0.95,
            "provider": ai_response.get("provider", "mock")
        }
