from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

# Device schemas
class DeviceBase(BaseModel):
    name: str
    device_type: str
    location: str
    status: str = "online"
    battery_level: int = 95
    signal_strength: int = 90
    source: str = "simulator"
    firmware_version: str = "v3.14.2"

class DeviceCreate(DeviceBase):
    id: str
    home_id: str

class DeviceOut(DeviceBase):
    id: str
    home_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Event schemas
class EventCreate(BaseModel):
    source: str = "simulator"
    deviceId: str
    deviceType: str
    eventType: str
    timestamp: Optional[datetime] = None
    location: str
    confidence: float = 0.95
    metadata: Dict[str, Any] = Field(default_factory=dict)

class EventOut(BaseModel):
    id: str
    source: str
    deviceId: str
    deviceType: str
    eventType: str
    timestamp: datetime
    location: str
    confidence: float
    metadata: Dict[str, Any]
    processed: bool = False
    situationId: Optional[str] = None

    class Config:
        from_attributes = True

# Situation Graph Schemas
class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # event, device, location, home_state, situation
    icon: Optional[str] = None
    status: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str  # caused_by, followed_by, occurred_near, correlated_with, escalated_to
    animated: bool = True

class SituationGraph(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# Situation schemas
class ContributingFactor(BaseModel):
    factor: str
    weight: float
    category: str
    description: str

class SituationOut(BaseModel):
    id: str
    home_id: str
    title: str
    situation_type: str
    severity: str
    confidence: float
    location: str
    status: str
    duration_seconds: int
    summary: Optional[str] = None
    reasoning: Optional[str] = None
    recommended_action: Optional[str] = None
    contributing_factors: List[ContributingFactor] = Field(default_factory=list)
    graph_data: Optional[SituationGraph] = None
    created_at: datetime
    updated_at: datetime
    events_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Incident schemas
class IncidentCreate(BaseModel):
    situation_id: Optional[str] = None
    title: str
    severity: str = "medium"
    summary: str
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    ai_analysis: Optional[str] = None
    recommended_actions: List[str] = Field(default_factory=list)

class IncidentOut(BaseModel):
    id: str
    home_id: str
    situation_id: Optional[str] = None
    title: str
    severity: str
    status: str
    summary: str
    timeline: List[Dict[str, Any]]
    ai_analysis: Optional[str]
    recommended_actions: List[str]
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Home schemas
class HomeOut(BaseModel):
    id: str
    name: str
    address: str
    current_state: str  # away, home, sleep, guest
    devices_count: int = 0
    active_situations_count: int = 0
    recent_events_count: int = 0
    system_status: str = "Protected"

class HomeStateUpdate(BaseModel):
    state: str  # away, home, sleep, guest

# Chat & AI Assistant
class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    situation_id: Optional[str] = None
    history: List[ChatMessage] = Field(default_factory=list)

class ToolExecution(BaseModel):
    tool_name: str
    args: Dict[str, Any]
    result_preview: str

class ChatResponse(BaseModel):
    response: str
    tool_executions: List[ToolExecution] = Field(default_factory=list)
    situation_id: Optional[str] = None
    confidence: Optional[float] = None
    provider: str = "mock"

# Simulator Scenario
class ScenarioRequest(BaseModel):
    scenario_id: str  # unusual_entrance, normal_delivery, visitor_arrival, late_night, false_alarm, device_offline
    speed_multiplier: float = 1.0  # 1.0 = fast playback, 0.0 = instant batch

# Privacy Schemas
class PrivacySettingsSchema(BaseModel):
    raw_video_retention_days: int = 0
    send_raw_video_to_ai: bool = False
    send_structured_metadata_only: bool = True
    cloud_processing_enabled: bool = True
    ai_analysis_enabled: bool = True
    data_retention_days: int = 30
    local_encryption_enabled: bool = True

# AI Usage & Analytics
class AIUsageOut(BaseModel):
    total_requests: int
    average_latency_ms: float
    total_prompt_tokens: int
    total_completion_tokens: int
    estimated_cost_usd: float
    success_rate: float
    provider_breakdown: Dict[str, int]
    daily_stats: List[Dict[str, Any]]
