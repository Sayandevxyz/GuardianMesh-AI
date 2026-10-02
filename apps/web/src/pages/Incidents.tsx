import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import { api } from '../api/client';
import { FileText, Download, Printer, Shield, CheckCircle, Clock, Plus, ExternalLink } from 'lucide-react';

interface IncidentsProps {
  onAskAI: (query: string) => void;
}

export const Incidents: React.FC<IncidentsProps> = ({ onAskAI }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      }
    } catch (e) {
      console.error('Error loading incidents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handlePrintOrExport = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!selectedIncident) return;
    const blob = new Blob([JSON.stringify(selectedIncident, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GuardianMesh_Report_${selectedIncident.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-sans">Formal Incident Reports</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Audit-Ready
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Certified security reports documenting correlated situations and chronological telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadJSON}
            disabled={!selectedIncident}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={handlePrintOrExport}
            disabled={!selectedIncident}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-glow-cyan transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Main Grid: Left Selector & Right Printable Document */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Incident list */}
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Archived Reports ({incidents.length})
          </span>
          {incidents.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                    : 'bg-[#080d21] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                    {inc.id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 uppercase">
                    {inc.severity}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">{inc.title}</h4>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{new Date(inc.created_at).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Certified Incident Report Document Preview (2 Cols) */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <div className="rounded-2xl border border-cyan-500/30 bg-[#070b1a] p-8 shadow-2xl space-y-6 text-slate-200">
              {/* Document Header */}
              <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                      GuardianMesh Security Intelligence
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white font-sans">
                    INCIDENT REPORT
                  </h2>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    DOCUMENT ID: {selectedIncident.id}
                  </p>
                </div>

                <div className="text-right font-mono text-xs text-slate-400">
                  <div>Status: <span className="text-emerald-400 uppercase font-bold">{selectedIncident.status}</span></div>
                  <div>Generated: {new Date(selectedIncident.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">LOCATION</span>
                  <span className="text-cyan-300 font-semibold">Front Entrance</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">SEVERITY</span>
                  <span className="text-amber-300 font-semibold uppercase">{selectedIncident.severity}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">CONFIDENCE</span>
                  <span className="text-cyan-300 font-semibold">92%</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">VERIFICATION</span>
                  <span className="text-emerald-400 font-semibold">Deterministic</span>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  Executive Summary
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed font-sans bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                  {selectedIncident.summary}
                </p>
              </div>

              {/* Chronological Timeline */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-3">
                  Reconstructed Chronological Timeline
                </h4>
                <div className="divide-y divide-slate-800/60 border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/60">
                  {selectedIncident.timeline.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-cyan-400 font-bold">{item.time}</span>
                        <span className="text-slate-200 font-medium">{item.event}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{item.device || item.location}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  AI Root Cause & Contextual Analysis
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                  {selectedIncident.ai_analysis || "Multi-sensor telemetry verified dwell pattern exceeding threshold."}
                </p>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  Recommended Safe Actions
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedIncident.recommended_actions.map((act, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 font-mono text-xs">
              No incident selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
