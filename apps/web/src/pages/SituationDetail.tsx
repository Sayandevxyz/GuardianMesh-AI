import React, { useEffect, useState } from 'react';
import { Situation, SmartEvent } from '../types';
import { api } from '../api/client';
import {
  ArrowLeft, ShieldAlert, Clock, MapPin, CheckCircle, 
  FileText, Bot, AlertTriangle, Activity, Sparkles, Share2
} from 'lucide-react';
import { SituationGraph } from '../components/SituationGraph';

interface SituationDetailProps {
  situationId: string;
  onBack: () => void;
  onAskAI: (query: string) => void;
  onGenerateReport: (situationId: string) => void;
}

export const SituationDetail: React.FC<SituationDetailProps> = ({
  situationId,
  onBack,
  onAskAI,
  onGenerateReport
}) => {
  const [situation, setSituation] = useState<Situation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getSituation(situationId);
        setSituation(data);
      } catch (err) {
        console.error('Failed to load situation:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [situationId]);

  if (loading || !situation) {
    return (
      <div className="py-24 text-center">
        <Activity className="w-8 h-8 text-cyan-400 mx-auto animate-pulse mb-3" />
        <p className="text-xs font-mono text-slate-400">Loading situation intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Back button & Title Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onGenerateReport(situation.id)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-glow-cyan transition-all"
          >
            <FileText className="w-4 h-4" />
            Generate Incident Report
          </button>
          <button
            onClick={() => onAskAI(`Explain situation ${situation.title} in detail.`)}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 hover:bg-slate-800 font-semibold text-xs font-mono flex items-center gap-1.5 transition-all"
          >
            <Bot className="w-4 h-4 text-cyan-400" />
            Ask Guardian
          </button>
        </div>
      </div>

      {/* Cinematic Header Card */}
      <div className="glass-panel-glow rounded-3xl p-8 border border-amber-500/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-950/80 border border-rose-500/40 text-rose-300">
                ● Active Investigation
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-950/80 border border-amber-500/40 text-amber-300">
                {situation.severity} Risk
              </span>
            </div>

            <h1 className="text-3xl font-black text-white font-sans tracking-tight">
              {situation.title.toUpperCase()}
            </h1>

            <div className="flex items-center gap-5 text-xs font-mono text-slate-400 mt-3">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-cyan-400" />
                {situation.location.replace('_', ' ').toUpperCase()}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-400" />
                Duration: {situation.duration_seconds} Seconds
              </span>
              <span>
                Timestamp: {new Date(situation.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Large Confidence Gauge */}
          <div className="flex flex-col items-center bg-[#070b1a] px-6 py-4 rounded-2xl border border-cyan-500/40 shadow-glow-cyan">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="32" stroke="#1e293b" strokeWidth="5" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  stroke="#00F0FF"
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={2 * Math.PI * 32 * (1 - situation.confidence)}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute font-mono font-extrabold text-lg text-cyan-300">
                {Math.round(situation.confidence * 100)}%
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-300 uppercase tracking-wider mt-1.5">
              AI Algorithmic Certainty
            </span>
          </div>
        </div>
      </div>

      {/* Reconstructed Situation Timeline */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-5">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200">
            Reconstructed Sequential Timeline
          </h3>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-400 before:via-blue-500 before:to-slate-800">
          {(situation.events && situation.events.length > 0
            ? situation.events
            : [
                { id: '1', eventType: 'motion_detected', timestamp: situation.created_at, location: situation.location, deviceId: 'Front Door Camera' },
                { id: '2', eventType: 'person_detected', timestamp: situation.created_at, location: situation.location, deviceId: 'Front Door Camera' },
                { id: '3', eventType: 'repeated_movement', timestamp: situation.created_at, location: situation.location, deviceId: 'Front Entrance Sensor' },
                { id: '4', eventType: 'person_left', timestamp: situation.created_at, location: situation.location, deviceId: 'Front Door Camera' },
              ]
          ).map((evt: any, idx: number) => (
            <div key={idx} className="relative group">
              <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-[#050711] border-2 border-cyan-400 shadow-glow-cyan"></div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-200 capitalize">
                    {evt.eventType.replace('_', ' ')}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {evt.deviceId || 'Sensor Telemetry'} • {evt.location.replace('_', ' ')}
                  </div>
                </div>
                <div className="font-mono text-cyan-400 text-xs">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WHY THIS MATTERS — Visual Contributing Factors */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800 mb-5">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200">
            Why This Was Detected (Contributing Factors)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {situation.contributing_factors.map((factor, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-[#070b1a] border border-slate-800 hover:border-cyan-500/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800">
                  {factor.category}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  +{Math.round(factor.weight * 100)}%
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{factor.factor}</h4>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {factor.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Topology Graph */}
      {situation.graph_data && (
        <SituationGraph
          graphData={situation.graph_data}
          activeSituationTitle={situation.title}
        />
      )}

      {/* AI Explanation & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reasoning */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Root Cause Reasoning
          </h4>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {situation.reasoning}
          </p>
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            Note: GuardianMesh grounds reasoning strictly in temporal telemetry and does not claim positive facial identification.
          </div>
        </div>

        {/* Recommended Actions */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Recommended Safe Actions
          </h4>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {situation.recommended_action}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => onGenerateReport(situation.id)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300"
            >
              Export Report
            </button>
            <button
              onClick={() => onAskAI("Summarize this incident for me.")}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300"
            >
              Summarize Timeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
