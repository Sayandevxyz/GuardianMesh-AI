import React, { useState, useEffect } from 'react';
import { DeveloperTrace } from '../types';
import { api } from '../api/client';
import { Terminal, ArrowRight } from 'lucide-react';

export const DeveloperConsole: React.FC = () => {
  const [traces, setTraces] = useState<DeveloperTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<DeveloperTrace | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getDeveloperTraces();
        setTraces(data);
        if (data.length > 0) {
          setSelectedTrace(data[0]);
        }
      } catch (e) {
        console.error('Error fetching traces:', e);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-[#1e2333] pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-sans tracking-tight">Developer Console & Traces</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Audit Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deep-dive inspection: Telemetry Ingestion → Correlation → Situation Graph → Agent Tool Calls → Bedrock Response.
          </p>
        </div>
      </div>

      {/* Visual Pipeline Inspector Breadcrumb */}
      <div className="clean-panel rounded-xl p-5 border border-[#1e2333]">
        <span className="text-xs uppercase font-medium text-slate-400 tracking-wider block mb-3">
          Situation Intelligence Execution Pipeline
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            1. Event Ingest
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

          <div className="px-3 py-1.5 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            2. Temporal Correlation
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

          <div className="px-3 py-1.5 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            3. Situation Graph
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

          <div className="px-3 py-1.5 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            4. Agent Tools (MCP)
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

          <div className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            5. Bedrock / AI Synthesis
          </div>
        </div>
      </div>

      {/* Main Grid: Left Traces List & Right JSON Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Traces */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
            Agent Invocations ({traces.length})
          </span>
          {traces.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 clean-panel rounded-xl">
              No executions logged yet. Run a scenario or ask the AI assistant.
            </div>
          ) : (
            traces.map((trace) => {
              const isSelected = selectedTrace?.id === trace.id;
              return (
                <div
                  key={trace.id}
                  onClick={() => setSelectedTrace(trace)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs ${
                    isSelected
                      ? 'bg-[#161a29] border-blue-500/40 shadow-sm'
                      : 'bg-[#121520] border-[#1e2333] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-blue-400 font-mono font-semibold">{trace.id}</span>
                    <span className="text-emerald-400 text-xs">{trace.latency_ms}ms</span>
                  </div>
                  <div className="text-slate-300 font-sans truncate mb-1">
                    "{trace.prompt}"
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate max-w-[140px]">{trace.model_id}</span>
                    <span className="uppercase text-slate-400 font-medium">{trace.provider}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Execution Payload Inspector */}
        <div className="lg:col-span-2">
          {selectedTrace ? (
            <div className="clean-panel rounded-xl p-6 border border-[#1e2333] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2333] pb-4">
                <div>
                  <span className="text-[11px] uppercase text-slate-500 font-medium">Invocation Trace</span>
                  <h3 className="text-base font-bold text-white font-mono">{selectedTrace.id}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Tokens: {selectedTrace.tokens_prompt + selectedTrace.tokens_completion}</span>
                  <span>•</span>
                  <span className="text-blue-400 font-semibold">{selectedTrace.latency_ms}ms Latency</span>
                </div>
              </div>

              {/* Prompt & Tool Calls */}
              <div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">
                  User Inbound Prompt
                </span>
                <div className="p-3 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-xs text-slate-200 font-sans">
                  {selectedTrace.prompt}
                </div>
              </div>

              <div>
                <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider block mb-1">
                  Tool Execution Calls (Model Context Protocol)
                </span>
                <div className="p-3 rounded-lg bg-[#0b0d14] border border-[#1e2333] space-y-2 text-xs">
                  {selectedTrace.tool_calls && selectedTrace.tool_calls.length > 0 ? (
                    selectedTrace.tool_calls.map((tc, i) => (
                      <div key={i} className="flex items-center justify-between text-xs pb-1 border-b border-[#1e2333] last:border-none">
                        <span className="text-blue-300 font-mono font-semibold">{tc.tool_name}()</span>
                        <span className="text-slate-400 text-xs">{tc.result_preview}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs">No external tools invoked for this query.</span>
                  )}
                </div>
              </div>

              {/* Full Agent Response Output */}
              <div>
                <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider block mb-1">
                  AI Grounded Response Output
                </span>
                <div className="p-4 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-xs text-slate-200 font-sans leading-relaxed">
                  {selectedTrace.response}
                </div>
              </div>

              {/* Raw JSON View */}
              <div>
                <span className="text-xs text-slate-500 uppercase font-medium tracking-wider block mb-1">
                  Raw Trace Metadata
                </span>
                <pre className="p-3 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-[11px] font-mono text-slate-400 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedTrace, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs text-slate-500 clean-panel rounded-xl">
              Select a trace from the left to inspect execution internals.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
