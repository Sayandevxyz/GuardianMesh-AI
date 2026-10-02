import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.database.session import Base

def gen_id(prefix: str = "gm") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: gen_id("usr"))
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Home(Base):
    __tablename__ = "homes"
    id = Column(String, primary_key=True, default=lambda: gen_id("home"))
    name = Column(String, nullable=False, default="Guardian House")
    address = Column(String, nullable=True, default="1042 Mesh Lane, Silicon Hills")
    current_state = Column(String, default="away")  # away, home, sleep, guest
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    devices = relationship("Device", back_populates="home", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="home", cascade="all, delete-orphan")
    situations = relationship("Situation", back_populates="home", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="home", cascade="all, delete-orphan")

class Device(Base):
    __tablename__ = "devices"
    id = Column(String, primary_key=True)
    home_id = Column(String, ForeignKey("homes.id"), nullable=False)
    name = Column(String, nullable=False)
    device_type = Column(String, nullable=False)  # camera, sensor, doorbell, lock
    location = Column(String, nullable=False)     # front_door, garage, backyard, living_room
    status = Column(String, default="online")     # online, offline
    battery_level = Column(Integer, default=95)
    signal_strength = Column(Integer, default=92)
    source = Column(String, default="simulator")  # ring, simulator
    firmware_version = Column(String, default="v3.14.2")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    home = relationship("Home", back_populates="devices")
    events = relationship("Event", back_populates="device")

class Event(Base):
    __tablename__ = "events"
    id = Column(String, primary_key=True, default=lambda: gen_id("evt"))
    home_id = Column(String, ForeignKey("homes.id"), nullable=False)
    device_id = Column(String, ForeignKey("devices.id"), nullable=False)
    device_type = Column(String, nullable=False)
    event_type = Column(String, nullable=False)   # person_detected, motion_detected, door_opened, etc.
    timestamp = Column(DateTime, default=datetime.utcnow)
    location = Column(String, nullable=False)
    confidence = Column(Float, default=0.95)
    metadata_json = Column(JSON, default=dict)
    source = Column(String, default="simulator")  # ring, simulator
    processed = Column(Boolean, default=False)
    situation_id = Column(String, ForeignKey("situations.id"), nullable=True)

    home = relationship("Home", back_populates="events")
    device = relationship("Device", back_populates="events")
    situation = relationship("Situation", back_populates="events")

class Situation(Base):
    __tablename__ = "situations"
    id = Column(String, primary_key=True, default=lambda: gen_id("sit"))
    home_id = Column(String, ForeignKey("homes.id"), nullable=False)
    title = Column(String, nullable=False)
    situation_type = Column(String, nullable=False) # unusual_entrance_activity, normal_package_delivery, etc.
    severity = Column(String, default="medium")     # info, low, medium, high, critical
    confidence = Column(Float, default=0.92)
    location = Column(String, nullable=False)
    status = Column(String, default="active")       # active, investigated, resolved, dismissed
    duration_seconds = Column(Integer, default=92)
    summary = Column(Text, nullable=True)
    reasoning = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    contributing_factors_json = Column(JSON, default=list)
    graph_data_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    home = relationship("Home", back_populates="situations")
    events = relationship("Event", back_populates="situation")
    situation_events = relationship("SituationEvent", back_populates="situation", cascade="all, delete-orphan")
    agent_executions = relationship("AgentExecution", back_populates="situation", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="situation", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="situation")

class SituationEvent(Base):
    __tablename__ = "situation_events"
    id = Column(String, primary_key=True, default=lambda: gen_id("sevt"))
    situation_id = Column(String, ForeignKey("situations.id"), nullable=False)
    event_id = Column(String, ForeignKey("events.id"), nullable=False)
    relationship_type = Column(String, nullable=False) # caused_by, followed_by, occurred_near, correlated_with, escalated_to
    weight = Column(Float, default=0.20)
    timestamp = Column(DateTime, default=datetime.utcnow)

    situation = relationship("Situation", back_populates="situation_events")
    event = relationship("Event")

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, default=lambda: gen_id("inc"))
    home_id = Column(String, ForeignKey("homes.id"), nullable=False)
    situation_id = Column(String, ForeignKey("situations.id"), nullable=True)
    title = Column(String, nullable=False)
    severity = Column(String, default="medium")
    status = Column(String, default="open")  # open, under_review, resolved
    summary = Column(Text, nullable=False)
    timeline_json = Column(JSON, default=list)
    ai_analysis = Column(Text, nullable=True)
    recommended_actions_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    home = relationship("Home", back_populates="incidents")
    situation = relationship("Situation", back_populates="incidents")

class AgentExecution(Base):
    __tablename__ = "agent_executions"
    id = Column(String, primary_key=True, default=lambda: gen_id("agtx"))
    situation_id = Column(String, ForeignKey("situations.id"), nullable=True)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    model_id = Column(String, default="claude-3-5-sonnet")
    provider = Column(String, default="mock")  # bedrock, mock
    tokens_prompt = Column(Integer, default=0)
    tokens_completion = Column(Integer, default=0)
    latency_ms = Column(Integer, default=420)
    tool_calls_json = Column(JSON, default=list)
    status = Column(String, default="success")
    created_at = Column(DateTime, default=datetime.utcnow)

    situation = relationship("Situation", back_populates="agent_executions")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(String, primary_key=True, default=lambda: gen_id("alt"))
    home_id = Column(String, ForeignKey("homes.id"), nullable=False)
    situation_id = Column(String, ForeignKey("situations.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String, default="medium")  # info, low, medium, high, critical
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    situation = relationship("Situation", back_populates="alerts")

class Action(Base):
    __tablename__ = "actions"
    id = Column(String, primary_key=True, default=lambda: gen_id("act"))
    situation_id = Column(String, ForeignKey("situations.id"), nullable=True)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True)
    action_type = Column(String, nullable=False)  # review_timeline, ask_guardian, silence_alert, notify_user, export_report
    label = Column(String, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="available")  # available, executing, completed
    executed_at = Column(DateTime, nullable=True)

class AIUsage(Base):
    __tablename__ = "ai_usage"
    id = Column(String, primary_key=True, default=lambda: gen_id("usg"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    model_id = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    requests_count = Column(Integer, default=1)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    estimated_cost_usd = Column(Float, default=0.0)
    latency_ms = Column(Integer, default=0)
    status = Column(String, default="success")

class PrivacySetting(Base):
    __tablename__ = "privacy_settings"
    id = Column(String, primary_key=True, default="default")
    raw_video_retention_days = Column(Integer, default=0) # 0 means raw video never stored / transmitted
    send_raw_video_to_ai = Column(Boolean, default=False)  # NEVER send raw video by default
    send_structured_metadata_only = Column(Boolean, default=True)
    cloud_processing_enabled = Column(Boolean, default=True)
    ai_analysis_enabled = Column(Boolean, default=True)
    data_retention_days = Column(Integer, default=30)
    local_encryption_enabled = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
