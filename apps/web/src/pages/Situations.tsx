import React, { useState } from 'react';
import { Situation } from '../types';
import { Radio, AlertTriangle, Eye, Clock, MapPin } from 'lucide-react';

interface SituationsProps {
  situations: Situation[];
  onSelectSituation: (situationId: string) => void;
}

export const Situations: React.FC<SituationsProps> = ({ situations, onSelectSituation }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const filtered = situations.filter((sit) => {
    if (filterSeverity !== 'all' && sit.severity !== filterSeverity) return false;
    return true;
  });

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'border-red-800/60 bg-red-950/50 text-red-300';
      case 'high':
        return 'border-rose-800/60 bg-rose-950/50 text-rose-300';
      case 'medium':
        return 'border-amber-800/60 bg-amber-950/50 text-amber-300';
      case 'low':
        return 'border-blue-800/60 bg-blue-950/50 text-blue-300';
      case 'info':
      default:
        return 'border-emerald-800/60 bg-emerald-950/50 text-emerald-300';
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-sans">Correlated Situations</h2>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-800 text-slate-300 border border-slate-700">
              {situations.length} Detected
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Situations synthesize multiple raw telemetry events into contextual real-world understanding.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:border-blue-400 focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Situations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((sit) => (
          <div
            key={sit.id}
            className="rounded-xl p-5 border border-slate-800 bg-[#121520] hover:border-slate-700 transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium uppercase border ${getSeverityStyle(sit.severity)}`}>
                  {sit.severity} Risk
                </span>
                <span className="text-xs font-medium text-blue-400">
                  {Math.round(sit.confidence * 100)}% Confidence
                </span>
              </div>

              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                {sit.title}
              </h3>

              <div className="flex items-center gap-3 text-xs text-slate-400 my-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  {sit.location.replace('_', ' ')}
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  {sit.duration_seconds}s
                </span>
                <span>·</span>
                <span className="text-slate-500">
                  {new Date(sit.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mt-2 line-clamp-2">
                "{sit.summary}"
              </p>

              {/* Factor Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {sit.contributing_factors.slice(0, 3).map((f, i) => (
                  <span
                    key={i}
                    className="text-[11px] px-2 py-0.5 rounded bg-[#0b0d14] border border-slate-800 text-slate-400"
                  >
                    + {f.factor}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {sit.contributing_factors.length} signals correlated
              </span>
              <button
                onClick={() => onSelectSituation(sit.id)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <Eye className="w-3.5 h-3.5" />
                Investigate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
