import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, TabKey } from './components/Navbar';
import { AlexaModal } from './components/AlexaModal';
import { Dashboard } from './pages/Dashboard';
import { LiveEvents } from './pages/LiveEvents';
import { Situations } from './pages/Situations';
import { SituationDetail } from './pages/SituationDetail';
import { Incidents } from './pages/Incidents';
import { AIAssistant } from './pages/AIAssistant';
import { Devices } from './pages/Devices';
import { Simulator } from './pages/Simulator';
import { PrivacyCenter } from './pages/PrivacyCenter';
import { DeveloperConsole } from './pages/DeveloperConsole';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { useWebSocket } from './hooks/useWebSocket';
import { api } from './api/client';
import { HomeInfo, Situation, SmartEvent, Device } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [selectedSituationId, setSelectedSituationId] = useState<string | null>(null);
  const [isAlexaOpen, setIsAlexaOpen] = useState<boolean>(false);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoBanner, setDemoBanner] = useState<string | null>(null);

  // Core smart home state
  const [homeInfo, setHomeInfo] = useState<HomeInfo | null>(null);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [currentSituation, setCurrentSituation] = useState<Situation | null>(null);
  const [recentEvents, setRecentEvents] = useState<SmartEvent[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  // Initial Data Fetch
  const refreshAll = useCallback(async () => {
    try {
      const [h, s, e, d] = await Promise.all([
        api.getHome(),
        api.getSituations(),
        api.getEvents(25),
        api.getDevices(),
      ]);
      setHomeInfo(h);
      setSituations(s);
      if (s.length > 0) {
        setCurrentSituation(s[0]);
      }
      setRecentEvents(e);
      setDevices(d);
    } catch (err) {
      console.error('Error fetching GuardianMesh data:', err);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // WebSocket Live Updates
  const handleLiveEvent = useCallback((event: SmartEvent) => {
    setRecentEvents((prev) => [event, ...prev.slice(0, 49)]);
  }, []);

  const handleLiveSituation = useCallback((sit: Situation) => {
    setCurrentSituation(sit);
    setSituations((prev) => [sit, ...prev.filter((s) => s.id !== sit.id)]);
  }, []);

  const { isConnected: isWsConnected, homeState: liveHomeState } = useWebSocket(
    handleLiveEvent,
    handleLiveSituation
  );

  useEffect(() => {
    if (liveHomeState && homeInfo) {
      setHomeInfo((prev) => (prev ? { ...prev, current_state: liveHomeState as any } : null));
    }
  }, [liveHomeState]);

  // Home State update helper
  const handleSetHomeState = async (state: string) => {
    try {
      await api.updateHomeState(state);
      setHomeInfo((prev) => (prev ? { ...prev, current_state: state as any } : null));
    } catch (e) {
      console.error('Failed to change home state:', e);
    }
  };

  // Navigations
  const handleInvestigate = (situationId: string) => {
    setSelectedSituationId(situationId);
    setActiveTab('situations');
  };

  const handleAskAI = (query?: string) => {
    setActiveTab('assistant');
  };

  const handleGenerateReport = async (situationId: string) => {
    try {
      await api.createIncident({
        situation_id: situationId,
        title: `Certified Security Incident: ${currentSituation?.title || 'Perimeter Alert'}`,
        summary: currentSituation?.summary || 'Automated incident generated from situation telemetry.'
      });
      setActiveTab('incidents');
    } catch (e) {
      console.error('Failed to generate report:', e);
    }
  };

  // 1-Click 60-Second Hackathon DEMO MODE
  const handleRunDemoMode = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    setActiveTab('overview');
    setDemoBanner('DEMO 01: Resetting simulation state & setting Home to Away mode...');

    try {
      await api.resetSimulator();
      await new Promise((r) => setTimeout(r, 600));

      setDemoBanner('DEMO 02: Ingesting sequential entrance event stream from Front Door Doorbell...');
      const scenarioRes = await api.runScenario('unusual_entrance', 0.0);
      
      setDemoBanner('DEMO 03: Situation Engine temporal correlation fusing 5 events into Situation...');
      await new Promise((r) => setTimeout(r, 800));

      await refreshAll();

      if (scenarioRes.resulting_situation) {
        setCurrentSituation(scenarioRes.resulting_situation);
        setSelectedSituationId(scenarioRes.resulting_situation.id);
      }

      setDemoBanner('DEMO 04: AI Reasoning Agent generating contextual explanation & incident report...');
      await new Promise((r) => setTimeout(r, 1000));

      // Auto-generate incident report
      if (scenarioRes.resulting_situation) {
        await api.createIncident({
          situation_id: scenarioRes.resulting_situation.id,
          title: 'Unusual Entrance Activity (Auto-Certified)',
          summary: scenarioRes.resulting_situation.summary
        });
      }

      setDemoBanner('DEMO SUCCESS: 5 events correlated into Unusual Entrance Activity (92% confidence). Inspect below!');
      setTimeout(() => {
        setDemoBanner(null);
      }, 7000);
    } catch (e) {
      console.error('Demo error:', e);
      setDemoBanner('Demo encountered an error. Please try again.');
    } finally {
      setIsDemoRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050711] text-slate-100 cyber-grid flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setSelectedSituationId(null);
          setActiveTab(tab);
        }}
        homeInfo={homeInfo}
        isWsConnected={isWsConnected}
        onOpenAlexa={() => setIsAlexaOpen(true)}
        onRunDemoMode={handleRunDemoMode}
        isDemoRunning={isDemoRunning}
      />

      {/* Demo Mode Notification Banner */}
      {demoBanner && (
        <div className="bg-gradient-to-r from-cyan-950 via-blue-900 to-indigo-950 border-b border-cyan-500/50 py-2.5 px-4 text-center font-mono text-xs text-cyan-200 flex items-center justify-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>{demoBanner}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'overview' && (
          <Dashboard
            homeInfo={homeInfo}
            currentSituation={currentSituation}
            recentEvents={recentEvents}
            devices={devices}
            onInvestigate={(id) => {
              setSelectedSituationId(id);
              setActiveTab('situations');
            }}
            onAskAI={handleAskAI}
            onSetHomeState={handleSetHomeState}
            onRefresh={refreshAll}
          />
        )}

        {activeTab === 'events' && (
          <LiveEvents
            events={recentEvents}
            isWsConnected={isWsConnected}
            onEventCreated={handleLiveEvent}
          />
        )}

        {activeTab === 'situations' && (
          selectedSituationId ? (
            <SituationDetail
              situationId={selectedSituationId}
              onBack={() => setSelectedSituationId(null)}
              onAskAI={handleAskAI}
              onGenerateReport={handleGenerateReport}
            />
          ) : (
            <Situations
              situations={situations}
              onSelectSituation={(id) => setSelectedSituationId(id)}
            />
          )
        )}

        {activeTab === 'incidents' && (
          <Incidents onAskAI={handleAskAI} />
        )}

        {activeTab === 'assistant' && (
          <AIAssistant />
        )}

        {activeTab === 'devices' && (
          <Devices devices={devices} onRefresh={refreshAll} />
        )}

        {activeTab === 'simulator' && (
          <Simulator
            onScenarioCompleted={(sit) => {
              if (sit) {
                setCurrentSituation(sit);
                setSelectedSituationId(sit.id);
              }
              refreshAll();
            }}
            onInvestigate={(id) => {
              setSelectedSituationId(id);
              setActiveTab('situations');
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics />
        )}

        {activeTab === 'developer' && (
          <DeveloperConsole />
        )}

        {activeTab === 'privacy' && (
          <PrivacyCenter />
        )}

        {activeTab === 'settings' && (
          <Settings homeInfo={homeInfo} onSetHomeState={handleSetHomeState} />
        )}
      </main>

      {/* Alexa+ Simulated Voice Modal */}
      <AlexaModal isOpen={isAlexaOpen} onClose={() => setIsAlexaOpen(false)} />

      {/* Cybernetic Footer */}
      <footer className="border-t border-slate-900 bg-[#04060e] py-6 px-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-bold text-slate-300">GuardianMesh AI</span>
            <span>•</span>
            <span>"Smart homes detect. GuardianMesh understands."</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Ring Provider: Active</span>
            <span>AWS Bedrock: Ready</span>
            <span>MCP Server: Port 8100</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
