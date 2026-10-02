from typing import Dict, Any, List, Optional
import json
from app.agents.guardian_agent import GuardianAgent
from app.database.session import AsyncSessionLocal
from sqlalchemy import select
from app.models.models import Situation

class GuardianMeshMCPServer:
    """
    Model Context Protocol (MCP) Server for GuardianMesh AI.
    Exposes high-level smart home situation intelligence tools to Alexa+,
    Bedrock AgentCore, Claude Desktop, and modern multi-agent systems.
    """

    def __init__(self):
        self.agent = GuardianAgent()

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Returns standard MCP tool descriptors."""
        return [
            {
                "name": "get_home_status",
                "description": "Returns overall home safety posture, mode (home/away/sleep), and device summary.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "get_recent_events",
                "description": "Returns raw recent telemetry events with timestamps, locations, and sensor types.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "limit": {"type": "integer", "description": "Max events to return", "default": 10}
                    }
                }
            },
            {
                "name": "get_active_situations",
                "description": "Returns currently active correlated situations identified by the Situation Engine.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "get_situation_details",
                "description": "Returns detailed situation metadata, contributing factors, and situation graph nodes.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "situation_id": {"type": "string", "description": "Unique Situation identifier"}
                    },
                    "required": ["situation_id"]
                }
            },
            {
                "name": "get_device_status",
                "description": "Lists all connected smart-home cameras, sensors, and status indicators.",
                "inputSchema": {
                    "type": "object",
                    "properties": {}
                }
            },
            {
                "name": "get_incident_timeline",
                "description": "Retrieves the sequential chronological event timeline for an incident.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "incident_id": {"type": "string", "description": "Optional incident ID"}
                    }
                }
            },
            {
                "name": "create_incident_report",
                "description": "Generates and saves a formal security incident report from correlated situation telemetry.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "situation_id": {"type": "string", "description": "Situation ID to generate report from"},
                        "title": {"type": "string", "description": "Custom title for report"}
                    }
                }
            }
        ]

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatches an MCP tool call to the Guardian agent implementation."""
        if tool_name == "get_home_status":
            res = await self.agent.get_home_status()
            return {"content": [{"type": "text", "text": json.dumps(res)}]}

        elif tool_name == "get_recent_events":
            limit = arguments.get("limit", 10)
            res = await self.agent.get_recent_events(limit=limit)
            return {"content": [{"type": "text", "text": json.dumps(res)}]}

        elif tool_name == "get_active_situations":
            res = await self.agent.get_active_situations()
            return {"content": [{"type": "text", "text": json.dumps(res)}]}

        elif tool_name == "get_situation_details":
            sit_id = arguments.get("situation_id")
            async with AsyncSessionLocal() as session:
                stmt = select(Situation).filter(Situation.id == sit_id)
                r = await session.execute(stmt)
                sit = r.scalars().first()
                if not sit:
                    return {"content": [{"type": "text", "text": json.dumps({"error": "Situation not found"})}]}
                data = {
                    "id": sit.id,
                    "title": sit.title,
                    "severity": sit.severity,
                    "confidence": sit.confidence,
                    "location": sit.location,
                    "summary": sit.summary,
                    "reasoning": sit.reasoning,
                    "factors": sit.contributing_factors_json,
                    "graph": sit.graph_data_json
                }
                return {"content": [{"type": "text", "text": json.dumps(data)}]}

        elif tool_name == "get_device_status":
            res = await self.agent.get_device_status()
            return {"content": [{"type": "text", "text": json.dumps(res)}]}

        elif tool_name == "get_incident_timeline":
            inc_id = arguments.get("incident_id")
            res = await self.agent.get_incident_timeline(incident_id=inc_id)
            return {"content": [{"type": "text", "text": json.dumps(res)}]}

        elif tool_name == "create_incident_report":
            sit_id = arguments.get("situation_id")
            title = arguments.get("title")
            res = await self.agent.create_incident_report(situation_id=sit_id, title=title)
            return {"content": [{"type": "text", "text": json.dumps(res)}]}

        else:
            return {"error": f"Unknown tool: {tool_name}"}

    async def handle_alexa_utterance(self, utterance: str) -> Dict[str, Any]:
        """
        Simulated Alexa+ endpoint:
        Maps voice utterance -> MCP tool invocation -> Situation Engine -> AI response.
        """
        chat_res = await self.agent.process_chat(user_message=utterance)
        return {
            "alexa_response": chat_res.get("response"),
            "mcp_tools_called": [t["tool_name"] for t in chat_res.get("tool_executions", [])],
            "card": {
                "title": "GuardianMesh AI Alert",
                "text": chat_res.get("response")
            }
        }

mcp_server = GuardianMeshMCPServer()
