import React from 'react';
import {
  ShieldAlert, ShieldCheck, Activity, Eye, Bot, 
  MapPin, Clock, ArrowRight, Video, CheckCircle2, AlertTriangle, Sparkles, RefreshCw
} from 'lucide-react';
import { HomeInfo, Situation, SmartEvent, Device } from '../types';
import { SituationGraph } from '../components/SituationGraph';

interface DashboardProps {
  homeInfo: HomeInfo | null;
  currentSituation: Situation | null;
  recentEvents: SmartEvent[];
  devices: Device[];
  onInvestigate: (situationId: string) => void;
  onAskAI: (initialQuery?: string) => void;
  onSetHomeState: (state: string) => void;
  onRefresh: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  homeInfo,
  currentSituation,
  recentEvents,
  devices,
  onInvestigate,
  onAskAI,
  onSetHomeState,
  onRefresh
}) => {
  const isProtected = !currentSituation || currentSituation.severity === 'info';

  const severityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/40 text-glow-rose';
      case 'high':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'medium':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 text-glow-amber';
      case 'low':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'info':
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner: Home State Controls & Global Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Home Status Card */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
              isProtected 
                ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-400 shadow-sm shadow-emerald-500/20' 
                : 'bg-amber-500/10 border-amber-400/40 text-amber-400 shadow-glow-amber'
            }`}>
              {isProtected ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6 animate-pulse" />}
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">HOME STATUS</span>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isProtected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`}></span>
                {isProtected ? 'Protected' : 'Activity Under Review'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {homeInfo?.address || '1042 Mesh Lane, Silicon Hills'}
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            title="Refresh State"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Home Mode Selector (Away / Home / Sleep / Guest) */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 col-span-1 lg:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">CONTEXTUAL HOME PROFILE</span>
            <h3 className="text-sm font-semibold text-slate-200">
              The Situation Engine adapts correlation weights based on active occupancy state.
            </h3>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {(['away', 'home', 'sleep', 'guest'] as const).map((mode) => {
              const active = homeInfo?.current_state === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onSetHomeState(mode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all ${
                    active
                      ? 'bg-cyan-500 text-slate-950 shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Section: Large Situation Card + Live Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Primary Situation Intelligence Card & Situation Graph */}
        <div className="lg:col-span-2 space-y-6">
          {/* Situation Hero Card */}
          {currentSituation ? (
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-[#0c132c] via-[#090e24] to-[#050711] p-6 shadow-2xl">
              {/* Subtle top indicator bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500"></div>

              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950/80 border border-rose-500/40 text-rose-300 animate-pulse">
                      ● Active Situation
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${severityBadge(currentSituation.severity)}`}>
                      {currentSituation.severity} Risk
                    </span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight text-white font-sans flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                    {currentSituation.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {currentSituation.location.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Duration: {currentSituation.duration_seconds}s
                    </span>
                  </div>
                </div>

                {/* Circular Confidence Meter */}
                <div className="flex flex-col items-center bg-[#070b1a] p-3 rounded-2xl border border-cyan-500/30">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="26" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        stroke="#00F0FF"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 26}
                        strokeDashoffset={2 * Math.PI * 26 * (1 - currentSituation.confidence)}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <span className="absolute font-mono font-bold text-sm text-cyan-300">
                      {Math.round(currentSituation.confidence * 100)}%
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-1">
                    AI Confidence
                  </span>
                </div>
              </div>

              {/* Summary description quote */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-6">
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  "{currentSituation.summary}"
                </p>
                {currentSituation.reasoning && (
                  <p className="text-xs text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/80">
                    <span className="text-cyan-400 font-semibold">REASONING:</span> {currentSituation.reasoning}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onInvestigate(currentSituation.id)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider flex items-center gap-2 transition-all shadow-glow-cyan"
                >
                  <Eye className="w-4 h-4" />
                  Investigate Situation
                </button>
                <button
                  onClick={() => onAskAI("Why did GuardianMesh trigger this alert?")}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 text-cyan-300 font-semibold text-xs font-mono flex items-center gap-2 transition-all"
                >
                  <Bot className="w-4 h-4 text-cyan-400" />
                  Ask AI About This
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 border border-emerald-500/20 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Suspicious Situations Active</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Perimeter sensors operating normally. Test scenarios in the Simulator tab.
              </p>
            </div>
          )}

          {/* Situation Graph Visualization */}
          {currentSituation?.graph_data && (
            <SituationGraph
              graphData={currentSituation.graph_data}
              activeSituationTitle={currentSituation.title}
              onNodeClick={(node) => console.log('Selected node:', node)}
            />
          )}

          {/* AI Insight Box */}
          <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                AI Temporal Correlation Insight
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                GuardianMesh fuses sequential sensor triggers rather than dispatching alerts on single motion spikes.
                4 correlated events across front entrance sensors were synthesized into 1 coherent situation.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Live Event Stream & Connected Devices */}
        <div className="space-y-6">
          {/* Live Events Stream Card */}
          <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 flex flex-col h-[460px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Live Event Stream
                </h4>
              </div>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                STREAMING
              </span>
            </div>

            {/* Event List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
              {recentEvents.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  Listening for mesh events...
                </div>
              ) : (
                recentEvents.slice(0, 8).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-2.5 rounded-xl bg-[#070b1a] border border-slate-800/80 hover:border-cyan-500/30 transition-all flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 capitalize">
                          {evt.eventType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                          {evt.source.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{evt.location.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className="text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {Math.round(evt.confidence * 100)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Connected Mesh Devices Card */}
          <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Devices Status ({devices.length})
                </h4>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">MESH ONLINE</span>
            </div>

            <div className="space-y-2">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dev.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    <span className="text-slate-300 font-medium">{dev.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                    <span className="px-1 rounded bg-slate-900 text-cyan-300">{dev.source_label}</span>
                    <span>{dev.battery_level}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
