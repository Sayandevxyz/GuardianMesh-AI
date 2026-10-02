export interface Device {
  id: string;
  name: string;
  device_type: string;
  location: string;
  status: string;
  battery_level: number;
  signal_strength: number;
  source: string;
  source_label: string;
  firmware_version: string;
  created_at: string;
}

export interface SmartEvent {
  id: string;
  source: string;
  deviceId: string;
  deviceType: string;
  eventType: string;
  timestamp: string;
  location: string;
  confidence: number;
  metadata: Record<string, any>;
  processed?: boolean;
  situationId?: string | null;
}

export interface ContributingFactor {
  factor: string;
  weight: number;
  category: string;
  description: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'event' | 'device' | 'location' | 'home_state' | 'situation';
  status?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  animated?: boolean;
}

export interface SituationGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Situation {
  id: string;
  home_id: string;
  title: string;
  situation_type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  location: string;
  status: string;
  duration_seconds: number;
  summary: string;
  reasoning: string;
  recommended_action: string;
  contributing_factors: ContributingFactor[];
  graph_data: SituationGraphData;
  created_at: string;
  updated_at: string;
  events_count?: number;
  events?: SmartEvent[];
}

export interface Incident {
  id: string;
  home_id: string;
  situation_id?: string;
  title: string;
  severity: string;
  status: string;
  summary: string;
  timeline: Array<{
    time: string;
    event: string;
    device?: string;
    location?: string;
  }>;
  ai_analysis?: string;
  recommended_actions: string[];
  created_at: string;
  resolved_at?: string | null;
}

export interface HomeInfo {
  id: string;
  name: string;
  address: string;
  current_state: 'away' | 'home' | 'sleep' | 'guest';
  devices_count: number;
  active_situations_count: number;
  recent_events_count: number;
  system_status: string;
}

export interface ToolExecution {
  tool_name: string;
  args: Record<string, any>;
  result_preview: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tool_executions?: ToolExecution[];
  confidence?: number;
  provider?: string;
}

export interface Scenario {
  id: string;
  title: string;
  category: string;
  badge: string;
  expected_situation: string;
  expected_confidence: number;
  severity: string;
  description: string;
  home_state: string;
  events: Array<{
    deviceId: string;
    deviceType: string;
    eventType: string;
    location: string;
    confidence: number;
    offset_seconds: number;
    metadata: Record<string, any>;
  }>;
}

export interface AIUsageMetrics {
  total_requests: number;
  average_latency_ms: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  estimated_cost_usd: number;
  success_rate: number;
  provider_breakdown: Record<string, number>;
  daily_stats: Array<{
    day: string;
    requests: number;
    latency: number;
    tokens: number;
    cost: number;
  }>;
}

export interface PrivacySettings {
  raw_video_retention_days: number;
  send_raw_video_to_ai: boolean;
  send_structured_metadata_only: boolean;
  cloud_processing_enabled: boolean;
  ai_analysis_enabled: boolean;
  data_retention_days: number;
  local_encryption_enabled: boolean;
  architecture_summary?: string;
}

export interface DeveloperTrace {
  id: string;
  situation_id?: string;
  prompt: string;
  response: string;
  model_id: string;
  provider: string;
  tokens_prompt: number;
  tokens_completion: number;
  latency_ms: number;
  tool_calls: ToolExecution[];
  status: string;
  created_at: string;
}
