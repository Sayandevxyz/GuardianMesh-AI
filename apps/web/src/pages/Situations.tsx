import React, { useState } from 'react';
import { Situation } from '../types';
import { Radio, AlertTriangle, ArrowRight, Eye, Shield, Clock, MapPin } from 'lucide-react';

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
        return 'border-red-500/40 bg-red-950/20 text-red-400';
      case 'high':
        return 'border-rose-500/40 bg-rose-950/20 text-rose-300';
      case 'medium':
        return 'border-amber-500/40 bg-amber-950/20 text-amber-300';
      case 'low':
        return 'border-blue-500/40 bg-blue-950/20 text-blue-300';
      case 'info':
      default:
        return 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white font-sans">Correlated Situations</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {situations.length} Detected
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Situations synthesize multiple raw telemetry events into contextual real-world understanding.
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:border-cyan-400 focus:outline-none font-mono"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((sit) => (
          <div
            key={sit.id}
            className="glass-panel rounded-2xl p-6 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${getSeverityStyle(sit.severity)}`}>
                  {sit.severity} SEVERITY
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {Math.round(sit.confidence * 100)}% Confidence
                </span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                {sit.title}
              </h3>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-400 my-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-cyan-400" />
                  {sit.location.replace('_', ' ').toUpperCase()}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {sit.duration_seconds}s
                </span>
                <span className="text-slate-500">
                  {new Date(sit.created_at).toLocaleTimeString()}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mt-3 line-clamp-2">
                "{sit.summary}"
              </p>

              {/* Factor Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {sit.contributing_factors.slice(0, 3).map((f, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-400"
                  >
                    + {f.factor}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                {sit.contributing_factors.length} correlated factors
              </span>
              <button
                onClick={() => onSelectSituation(sit.id)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 group-hover:bg-cyan-500 text-cyan-400 group-hover:text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all"
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
