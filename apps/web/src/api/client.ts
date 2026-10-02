import {
  HomeInfo, Device, SmartEvent, Situation, Incident,
  Scenario, AIUsageMetrics, PrivacySettings, DeveloperTrace
} from '../types';

const API_BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetch(`${API_BASE}/health`).then(handleResponse<{
    status: string;
    smart_home_provider: string;
    ai_provider: string;
  }>),

  // Home
  getHome: () => fetch(`${API_BASE}/home`).then(handleResponse<HomeInfo>),
  updateHomeState: (state: string) =>
    fetch(`${API_BASE}/home/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    }).then(handleResponse<{ status: string; new_state: string }>),

  // Devices
  getDevices: () => fetch(`${API_BASE}/devices`).then(handleResponse<Device[]>),

  // Events
  getEvents: (limit: number = 50) =>
    fetch(`${API_BASE}/events?limit=${limit}`).then(handleResponse<SmartEvent[]>),
  ingestEvent: (data: Partial<SmartEvent>) =>
    fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<{ status: string; event: SmartEvent; situation: Situation | null }>),

  // Situations
  getSituations: () => fetch(`${API_BASE}/situations`).then(handleResponse<Situation[]>),
  getSituation: (id: string) => fetch(`${API_BASE}/situations/${id}`).then(handleResponse<Situation>),

  // Incidents
  getIncidents: () => fetch(`${API_BASE}/incidents`).then(handleResponse<Incident[]>),
  getIncident: (id: string) => fetch(`${API_BASE}/incidents/${id}`).then(handleResponse<Incident>),
  createIncident: (data: { situation_id?: string; title: string; summary: string }) =>
    fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(handleResponse<Incident>),

  // Simulator
  getScenarios: () => fetch(`${API_BASE}/simulator/scenarios`).then(handleResponse<Scenario[]>),
  runScenario: (scenarioId: string, speedMultiplier: number = 0.0) =>
    fetch(`${API_BASE}/simulator/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenarioId, speed_multiplier: speedMultiplier }),
    }).then(handleResponse<{
      scenario: string;
      title: string;
      events_count: number;
      events: SmartEvent[];
      resulting_situation: Situation | null;
    }>),
  resetSimulator: () =>
    fetch(`${API_BASE}/simulator/reset`, { method: 'POST' }).then(handleResponse<{ status: string }>),

  // AI Assistant ("Ask Guardian")
  chat: (message: string, situationId?: string) =>
    fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, situation_id: situationId }),
    }).then(handleResponse<{
      response: string;
      tool_executions: Array<{ tool_name: string; args: any; result_preview: string }>;
      situation_id: string | null;
      confidence: number;
      provider: string;
    }>),

  // Alexa+ Voice Simulation
  sendAlexaUtterance: (utterance: string) =>
    fetch(`${API_BASE}/alexa/utterance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utterance }),
    }).then(handleResponse<{
      alexa_response: string;
      mcp_tools_called: string[];
      card: { title: string; text: string };
    }>),

  // Developer Traces
  getDeveloperTraces: () => fetch(`${API_BASE}/developer/traces`).then(handleResponse<DeveloperTrace[]>),

  // Privacy
  getPrivacySettings: () => fetch(`${API_BASE}/privacy`).then(handleResponse<PrivacySettings>),
  updatePrivacySettings: (settings: Partial<PrivacySettings>) =>
    fetch(`${API_BASE}/privacy/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).then(handleResponse<{ status: string; settings: PrivacySettings }>),
  purgeData: () => fetch(`${API_BASE}/privacy/purge`, { method: 'POST' }).then(handleResponse<{ status: string }>),

  // AI Usage
  getAIUsage: () => fetch(`${API_BASE}/ai/usage`).then(handleResponse<AIUsageMetrics>),
};
