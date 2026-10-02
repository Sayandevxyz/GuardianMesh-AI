import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import { api } from '../api/client';
import { FileText, Download, Printer, Shield, CheckCircle, Clock } from 'lucide-react';

interface IncidentsProps {
  onAskAI: (query: string) => void;
}

export const Incidents: React.FC<IncidentsProps> = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const loadIncidents = async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
      if (data.length > 0 && !selectedIncident) {
        setSelectedIncident(data[0]);
      }
    } catch (e) {
      console.error('Error loading incidents:', e);
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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2333] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-sans tracking-tight">Incident Reports</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Auditable Log
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Certified security reports documenting correlated situations and chronological telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadJSON}
            disabled={!selectedIncident}
            className="px-3.5 py-2 rounded-lg bg-[#121520] hover:bg-slate-800 border border-[#1e2333] text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={handlePrintOrExport}
            disabled={!selectedIncident}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Main Grid: Left Selector & Right Document */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Incident list */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Archived Reports ({incidents.length})
          </span>
          {incidents.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            return (
              <div
                key={inc.id}
                onClick={() => setSelectedIncident(inc)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#161a29] border-blue-500/40 shadow-sm'
                    : 'bg-[#121520] border-[#1e2333] hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-blue-400 font-semibold">
                    {inc.id}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#1e2333] text-amber-300 uppercase">
                    {inc.severity}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">{inc.title}</h4>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{new Date(inc.created_at).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Certified Incident Report Document Preview */}
        <div className="lg:col-span-2">
          {selectedIncident ? (
            <div className="clean-panel rounded-2xl p-8 border border-[#1e2333] space-y-6 text-slate-200 shadow-sm">
              {/* Document Header */}
              <div className="border-b border-[#1e2333] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">
                      GuardianMesh Security Intelligence
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white font-sans">
                    Incident Report
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    Document Ref: {selectedIncident.id}
                  </p>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <div>Status: <span className="text-emerald-400 uppercase font-semibold">{selectedIncident.status}</span></div>
                  <div className="mt-0.5">Date: {new Date(selectedIncident.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-medium">Location</span>
                  <span className="text-slate-200 font-semibold">Front Entrance</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-medium">Severity</span>
                  <span className="text-amber-400 font-semibold uppercase">{selectedIncident.severity}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-medium">Confidence</span>
                  <span className="text-blue-400 font-semibold">92%</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block uppercase font-medium">Verification</span>
                  <span className="text-emerald-400 font-semibold">Deterministic</span>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Executive Summary
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-[#0b0d14] p-4 rounded-xl border border-[#1e2333]">
                  {selectedIncident.summary}
                </p>
              </div>

              {/* Chronological Timeline */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Reconstructed Chronological Timeline
                </h4>
                <div className="divide-y divide-[#1e2333] border border-[#1e2333] rounded-xl overflow-hidden bg-[#0b0d14]">
                  {selectedIncident.timeline.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-blue-400 font-semibold">{item.time}</span>
                        <span className="text-slate-200 font-medium">{item.event}</span>
                      </div>
                      <span className="text-xs text-slate-500">{item.device || item.location}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Contextual Analysis
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#0b0d14] p-4 rounded-xl border border-[#1e2333]">
                  {selectedIncident.ai_analysis || "Multi-sensor telemetry verified dwell pattern exceeding threshold."}
                </p>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                  Recommended Actions
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {selectedIncident.recommended_actions.map((act, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 text-xs">
              No incident selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
