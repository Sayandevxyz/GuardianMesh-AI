import React, { useState, useEffect } from 'react';
import { DeveloperTrace } from '../types';
import { api } from '../api/client';
import { Terminal, Code, Cpu, ArrowRight, Clock, Zap, CheckCircle2 } from 'lucide-react';

export const DeveloperConsole: React.FC = () => {
  const [traces, setTraces] = useState<DeveloperTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<DeveloperTrace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getDeveloperTraces();
        setTraces(data);
        if (data.length > 0) {
          setSelectedTrace(data[0]);
        }
      } catch (e) {
        console.error('Error fetching traces:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-sans">Developer Console & Execution Traces</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Audit Pipeline
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Deep-dive inspection: Telemetry Ingestion → Correlation → Situation Graph → Agent Tool Calls → Bedrock Response.
          </p>
        </div>
      </div>

      {/* Visual Pipeline Inspector Breadcrumb */}
      <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
        <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block mb-3">
          SITUATION INTELLIGENCE EXECUTION PIPELINE
        </span>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            1. Event Ingest
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            2. Temporal Correlation
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            3. Situation Graph
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            4. Agent Tools (MCP)
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-600" />

          <div className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold flex items-center gap-1.5 shadow-glow-cyan">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            5. Bedrock / AI Synthesis
          </div>
        </div>
      </div>

      {/* Main Grid: Left Traces List & Right JSON Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Traces */}
        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Agent Invocations ({traces.length})
          </span>
          {traces.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500 glass-panel rounded-2xl">
              No executions logged yet. Run a scenario or ask the AI assistant.
            </div>
          ) : (
            traces.map((trace) => {
              const isSelected = selectedTrace?.id === trace.id;
              return (
                <div
                  key={trace.id}
                  onClick={() => setSelectedTrace(trace)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all text-xs font-mono ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                      : 'bg-[#080d21] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-cyan-400 font-bold">{trace.id}</span>
                    <span className="text-emerald-400 text-[10px]">{trace.latency_ms}ms</span>
                  </div>
                  <div className="text-slate-300 font-sans truncate mb-1">
                    "{trace.prompt}"
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{trace.model_id}</span>
                    <span className="uppercase text-cyan-300">{trace.provider}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Execution Payload Inspector (2 Cols) */}
        <div className="lg:col-span-2">
          {selectedTrace ? (
            <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500">INVOCATION TRACE</span>
                  <h3 className="text-base font-bold text-white font-mono">{selectedTrace.id}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span>Tokens: {selectedTrace.tokens_prompt + selectedTrace.tokens_completion}</span>
                  <span>•</span>
                  <span className="text-cyan-400">{selectedTrace.latency_ms}ms Latency</span>
                </div>
              </div>

              {/* Prompt & Tool Calls */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  User Inbound Prompt
                </span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200">
                  {selectedTrace.prompt}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                  Tool Execution Calls (Model Context Protocol)
                </span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                  {selectedTrace.tool_calls && selectedTrace.tool_calls.length > 0 ? (
                    selectedTrace.tool_calls.map((tc, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-900 last:border-none">
                        <span className="text-cyan-300 font-bold">⚡ {tc.tool_name}()</span>
                        <span className="text-slate-400">{tc.result_preview}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-500 text-[11px]">No external tools invoked for this query.</span>
                  )}
                </div>
              </div>

              {/* Full Agent Response Output */}
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                  AI Grounded Response Output
                </span>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-sans leading-relaxed">
                  {selectedTrace.response}
                </div>
              </div>

              {/* Raw JSON View */}
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">
                  Raw Trace Metadata
                </span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 overflow-x-auto max-h-48">
                  {JSON.stringify(selectedTrace, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-xs font-mono text-slate-500 glass-panel rounded-2xl">
              Select a trace from the left to inspect execution internals.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
