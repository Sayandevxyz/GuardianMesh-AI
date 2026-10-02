import pytest
import json
from app.agents.ai_provider import MockAIProvider, get_ai_provider
from app.agents.guardian_agent import GuardianAgent
from app.mcp.server import mcp_server

@pytest.mark.asyncio
async def test_mock_ai_provider_situation_analysis():
    provider = MockAIProvider()
    context = {
        "situation_type": "unusual_entrance_activity",
        "location": "front_door",
        "home_state": "away",
        "duration_seconds": 92,
        "confidence": 0.92,
        "events": [{"eventType": "person_detected"}]
    }
    result = await provider.analyze_situation(context)
    assert "summary" in result
    assert "reasoning" in result
    assert "confidence_explanation" in result
    assert "recommended_actions" in result
    assert len(result["recommended_actions"]) >= 1
    assert result["is_demo_response"] is True
    # Verify no crime accusations
    assert "criminal" not in result["summary"].lower()
    assert "burglar" not in result["summary"].lower()

@pytest.mark.asyncio
async def test_mock_ai_provider_chat_what_happened():
    provider = MockAIProvider()
    system_context = {
        "home_state": "away",
        "current_situation": {
            "title": "Unusual Entrance Activity",
            "location": "front_door",
            "duration_seconds": 92,
            "confidence": 0.92
        }
    }
    res = await provider.chat(
        user_message="What happened outside?",
        system_context=system_context
    )
    assert "response" in res
    assert "unusual entrance activity" in res["response"].lower()
    assert "92" in res["response"]

@pytest.mark.asyncio
async def test_mock_ai_provider_chat_why_alert():
    provider = MockAIProvider()
    system_context = {
        "home_state": "away",
        "current_situation": {
            "title": "Unusual Entrance Activity",
            "location": "front_door",
            "duration_seconds": 92,
            "confidence": 0.92
        }
    }
    res = await provider.chat(
        user_message="Why did I get this alert?",
        system_context=system_context
    )
    assert "correlated" in res["response"].lower() or "multiple" in res["response"].lower()

@pytest.mark.asyncio
async def test_guardian_agent_tool_calls():
    agent = GuardianAgent()
    home_status = await agent.get_home_status()
    assert "state" in home_status
    assert "status" in home_status

    devices = await agent.get_device_status()
    assert isinstance(devices, list)

    events = await agent.get_recent_events(limit=5)
    assert isinstance(events, list)

def test_mcp_tool_definitions():
    tools = mcp_server.get_tool_definitions()
    assert len(tools) >= 7
    tool_names = [t["name"] for t in tools]
    assert "get_home_status" in tool_names
    assert "get_recent_events" in tool_names
    assert "get_active_situations" in tool_names
    assert "get_situation_details" in tool_names
    assert "get_device_status" in tool_names
    assert "get_incident_timeline" in tool_names
    assert "create_incident_report" in tool_names

@pytest.mark.asyncio
async def test_mcp_execute_get_home_status():
    result = await mcp_server.execute_tool("get_home_status", {})
    assert "content" in result
    payload = json.loads(result["content"][0]["text"])
    assert "status" in payload

@pytest.mark.asyncio
async def test_alexa_utterance_flow():
    res = await mcp_server.handle_alexa_utterance("Alexa, what happened outside?")
    assert "alexa_response" in res
    assert "mcp_tools_called" in res
    assert len(res["mcp_tools_called"]) >= 1
