import React from 'react';
import {
  ShieldAlert, ShieldCheck, Activity, Eye, Bot, 
  MapPin, Clock, Video, CheckCircle2, AlertTriangle, Sparkles, RefreshCw
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
        return 'bg-red-950/60 text-red-300 border-red-800/60';
      case 'high':
        return 'bg-rose-950/60 text-rose-300 border-rose-800/60';
      case 'medium':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      case 'low':
        return 'bg-blue-950/60 text-blue-300 border-blue-800/60';
      case 'info':
      default:
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Top Banner: Home State Controls & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Status Card */}
        <div className="rounded-xl border border-slate-800 bg-[#121520] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
              isProtected 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' 
                : 'bg-amber-950/40 border-amber-800/60 text-amber-400'
            }`}>
              {isProtected ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Home Status</span>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isProtected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                {isProtected ? 'Protected' : 'Activity Under Review'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {homeInfo?.address || '1042 Mesh Lane, Silicon Hills'}
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            title="Refresh State"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Home Mode Selector */}
        <div className="rounded-xl border border-slate-800 bg-[#121520] p-5 col-span-1 lg:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Context Mode</span>
            <p className="text-sm font-medium text-slate-200 mt-0.5">
              Current profile informs the situation engine's sensitivity.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#0b0d14] p-1.5 rounded-lg border border-slate-800">
            {(['away', 'home', 'sleep', 'guest'] as const).map((mode) => {
              const active = homeInfo?.current_state === mode;
              return (
                <button
                  key={mode}
                  onClick={() => onSetHomeState(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Situation Hero Card & Graph */}
        <div className="lg:col-span-2 space-y-6">
          {/* Situation Hero Card */}
          {currentSituation ? (
            <div className="rounded-xl border border-slate-800 bg-[#121520] p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-950/50 border border-rose-800/60 text-rose-300">
                      Active Alert
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium capitalize border ${severityBadge(currentSituation.severity)}`}>
                      {currentSituation.severity} Risk
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    {currentSituation.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      {currentSituation.location.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      Duration: {currentSituation.duration_seconds}s
                    </span>
                  </div>
                </div>

                {/* Clean Confidence Meter */}
                <div className="flex items-center gap-3 bg-[#0d0f17] px-4 py-2.5 rounded-xl border border-slate-800">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-12 h-12 transform -rotate-90">
                      <circle cx="24" cy="24" r="18" stroke="#1e2333" strokeWidth="3" fill="transparent" />
                      <circle
                        cx="24"
                        cy="24"
                        r="18"
                        stroke="#3b82f6"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 * (1 - currentSituation.confidence)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-semibold text-xs text-white">
                      {Math.round(currentSituation.confidence * 100)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">AI Confidence</span>
                    <span className="text-xs font-medium text-blue-400">High Match</span>
                  </div>
                </div>
              </div>

              {/* Summary Description */}
              <div className="p-4 rounded-lg bg-[#0b0d14] border border-slate-800/80 mb-5">
                <p className="text-sm text-slate-200 leading-relaxed">
                  "{currentSituation.summary}"
                </p>
                {currentSituation.reasoning && (
                  <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
                    <span className="text-slate-300 font-medium">Why flagged:</span> {currentSituation.reasoning}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onInvestigate(currentSituation.id)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Investigate Details
                </button>
                <button
                  onClick={() => onAskAI("Why did GuardianMesh trigger this alert?")}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors border border-slate-700"
                >
                  <Bot className="w-3.5 h-3.5 text-blue-400" />
                  Ask AI About This
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-[#121520] p-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-white">No Active Security Alerts</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your perimeter sensors are quiet and operating normally.
              </p>
            </div>
          )}

          {/* Situation Relationship Graph */}
          {currentSituation?.graph_data && (
            <SituationGraph
              graphData={currentSituation.graph_data}
              activeSituationTitle={currentSituation.title}
              onNodeClick={(node) => console.log('Node selected:', node)}
            />
          )}

          {/* AI Insight Box */}
          <div className="rounded-xl border border-slate-800 bg-[#121520] p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white">
                How GuardianMesh Analyzed This
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mt-0.5">
                Multiple related events were correlated into a single situation. Rather than triggering separate alerts for each step, GuardianMesh evaluated the whole sequence together.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Event Stream & Connected Devices */}
        <div className="space-y-6">
          {/* Live Events Stream */}
          <div className="rounded-xl border border-slate-800 bg-[#121520] p-5 flex flex-col h-[440px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-semibold text-white">
                  Recent Events
                </h4>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Live Feed
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
              {recentEvents.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  Listening for events...
                </div>
              ) : (
                recentEvents.slice(0, 8).map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 rounded-lg bg-[#0b0d14] border border-slate-800/80 hover:border-slate-700 transition-colors flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-200 capitalize">
                          {evt.eventType.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {evt.source}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span>{evt.location.replace('_', ' ')}</span>
                        <span>·</span>
                        <span className="text-slate-500">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {Math.round(evt.confidence * 100)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Connected Devices */}
          <div className="rounded-xl border border-slate-800 bg-[#121520] p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-semibold text-white">
                  Devices ({devices.length})
                </h4>
              </div>
              <span className="text-xs text-slate-400">All Connected</span>
            </div>

            <div className="space-y-2">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0d14] border border-slate-800/70 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dev.status === 'online' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    <span className="text-slate-300 font-medium">{dev.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase">{dev.source}</span>
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
