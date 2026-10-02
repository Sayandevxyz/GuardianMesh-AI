import React, { useEffect, useState } from 'react';
import { Situation } from '../types';
import { api } from '../api/client';
import {
  ArrowLeft, Clock, MapPin, 
  FileText, Bot, AlertTriangle, Activity, Sparkles, CheckCircle
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
        <Activity className="w-6 h-6 text-blue-400 mx-auto animate-pulse mb-2" />
        <p className="text-xs text-slate-400">Loading situation details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Back button & Action buttons */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onGenerateReport(situation.id)}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate Incident Report
          </button>
          <button
            onClick={() => onAskAI(`Explain situation ${situation.title} in detail.`)}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            Ask Guardian
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="rounded-xl border border-slate-800 bg-[#121520] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-950/60 border border-rose-800/60 text-rose-300">
                Active Incident
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium capitalize bg-amber-950/60 border border-amber-800/60 text-amber-300">
                {situation.severity} Risk
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {situation.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-400 mt-2.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                {situation.location.replace('_', ' ')}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Duration: {situation.duration_seconds} Seconds
              </span>
              <span>
                Detected: {new Date(situation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Simple Confidence Pill */}
          <div className="flex items-center gap-3 bg-[#0b0d14] px-5 py-3 rounded-xl border border-slate-800">
            <div className="text-2xl font-bold text-blue-400 font-mono">
              {Math.round(situation.confidence * 100)}%
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Algorithmic Confidence</span>
              <span className="text-[11px] text-slate-500">Multi-Signal Grounded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-slate-800 bg-[#121520] p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
          <Clock className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold text-slate-200">
            Reconstructed Event Timeline
          </h3>
        </div>

        <div className="space-y-3">
          {(situation.events && situation.events.length > 0
            ? situation.events
            : [
                { id: '1', eventType: 'motion_detected', timestamp: situation.created_at, location: situation.location, deviceId: 'Front Door Camera' },
                { id: '2', eventType: 'person_detected', timestamp: situation.created_at, location: situation.location, deviceId: 'Front Door Camera' },
                { id: '3', eventType: 'repeated_movement', timestamp: situation.created_at, location: situation.location, deviceId: 'Front Entrance Sensor' },
                { id: '4', eventType: 'person_left', timestamp: situation.created_at, location: situation.location, deviceId: 'Front Door Camera' },
              ]
          ).map((evt: any, idx: number) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[#0b0d14] border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <div>
                  <span className="font-medium text-slate-200 capitalize">
                    {evt.eventType.replace('_', ' ')}
                  </span>
                  <span className="text-slate-500 text-xs ml-2">
                    {evt.deviceId || 'Sensor'} · {evt.location.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <span className="text-slate-400 font-mono text-xs">
                {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Contributing Factors */}
      <div className="rounded-xl border border-slate-800 bg-[#121520] p-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-semibold text-slate-200">
            Why This Was Detected
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {situation.contributing_factors.map((factor, index) => (
            <div
              key={index}
              className="p-3.5 rounded-lg bg-[#0b0d14] border border-slate-800 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400 uppercase">
                  {factor.category}
                </span>
                <span className="text-xs font-semibold text-emerald-400">
                  +{Math.round(factor.weight * 100)}%
                </span>
              </div>
              <h4 className="text-xs font-semibold text-white">{factor.factor}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {factor.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Situation Graph */}
      {situation.graph_data && (
        <SituationGraph
          graphData={situation.graph_data}
          activeSituationTitle={situation.title}
        />
      )}

      {/* Explanation & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-xl border border-slate-800 bg-[#121520] p-5 space-y-2">
          <h4 className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />
            AI Root Cause Reasoning
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {situation.reasoning}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#121520] p-5 space-y-2">
          <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            Recommended Safe Actions
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {situation.recommended_action}
          </p>
        </div>
      </div>
    </div>
  );
};
