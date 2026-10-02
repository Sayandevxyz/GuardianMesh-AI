import React, { useState, useEffect } from 'react';
import { Scenario, Situation } from '../types';
import { api } from '../api/client';
import { PlayCircle, RotateCcw, AlertTriangle, CheckCircle, Clock, Zap, ArrowRight, Shield } from 'lucide-react';

interface SimulatorProps {
  onScenarioCompleted: (situation: Situation | null) => void;
  onInvestigate: (situationId: string) => void;
}

export const Simulator: React.FC<SimulatorProps> = ({ onScenarioCompleted, onInvestigate }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [runningScenarioId, setRunningScenarioId] = useState<string | null>(null);
  const [playbackSteps, setPlaybackSteps] = useState<string[]>([]);
  const [resultingSituation, setResultingSituation] = useState<Situation | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      try {
        const scs = await api.getScenarios();
        setScenarios(scs);
      } catch (e) {
        console.error('Failed to load scenarios:', e);
      }
    }
    load();
  }, []);

  const handleRunScenario = async (sc: Scenario) => {
    setRunningScenarioId(sc.id);
    setPlaybackSteps([]);
    setResultingSituation(null);

    // Animate synthetic telemetry timeline in UI
    for (let i = 0; i < sc.events.length; i++) {
      const evt = sc.events[i];
      await new Promise((r) => setTimeout(r, 220));
      setPlaybackSteps((prev) => [
        ...prev,
        `T+${evt.offset_seconds}s: ${evt.eventType.replace('_', ' ').toUpperCase()} (${evt.deviceId})`
      ]);
    }

    try {
      const res = await api.runScenario(sc.id, 0.0);
      setResultingSituation(res.resulting_situation);
      onScenarioCompleted(res.resulting_situation);
    } catch (e) {
      console.error('Error running scenario:', e);
    } finally {
      setRunningScenarioId(null);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await api.resetSimulator();
      setPlaybackSteps([]);
      setResultingSituation(null);
    } catch (e) {
      console.error('Reset failed:', e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-sans">Smart-Home Event Simulator</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Demo Testbed
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Deterministic simulation scenarios executing real sensor event sequences through the Situation Engine.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting || runningScenarioId !== null}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-xs font-mono text-slate-300 hover:text-rose-400 transition-all disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          Reset Simulation State
        </button>
      </div>

      {/* Real-Time Scenario Playback Tracer Banner */}
      {(runningScenarioId || playbackSteps.length > 0 || resultingSituation) && (
        <div className="rounded-2xl border border-cyan-500/40 bg-[#080f28] p-5 shadow-2xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-mono text-cyan-400 font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 animate-pulse" />
              Scenario Execution Tracer
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {runningScenarioId ? 'Injecting Telemetry Stream...' : 'Execution Completed'}
            </span>
          </div>

          {/* Stepper logs */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-xs text-slate-300">
            {playbackSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-cyan-300">
                <span className="text-slate-500">[{idx + 1}]</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {/* Resulting Situation Card */}
          {resultingSituation && (
            <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-rose-950/40 to-slate-950 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 block">
                  ⚠ Situation Classified Automatically by Situation Engine
                </span>
                <h4 className="text-base font-bold text-white mt-0.5">
                  {resultingSituation.title} ({Math.round(resultingSituation.confidence * 100)}% Confidence)
                </h4>
                <p className="text-xs text-slate-300 mt-1">"{resultingSituation.summary}"</p>
              </div>

              <button
                onClick={() => onInvestigate(resultingSituation.id)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-glow-cyan"
              >
                Inspect Situation
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Prebuilt Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {scenarios.map((sc) => {
          const isRunning = runningScenarioId === sc.id;

          return (
            <div
              key={sc.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-cyan-300 border border-slate-800">
                    {sc.badge}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Home: {sc.home_state}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{sc.title}</h3>
                <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
                  {sc.description}
                </p>

                {/* Event sequence breakdown */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono space-y-1.5">
                  <div className="text-slate-500 text-[10px] uppercase font-bold">
                    Telemetry Sequence ({sc.events.length} events):
                  </div>
                  {sc.events.slice(0, 3).map((e, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300">
                      <span>T+{e.offset_seconds}s</span>
                      <span className="text-cyan-400">{e.eventType}</span>
                    </div>
                  ))}
                  {sc.events.length > 3 && (
                    <div className="text-slate-500 text-[10px] text-right">
                      +{sc.events.length - 3} more events...
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleRunScenario(sc)}
                  disabled={runningScenarioId !== null}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase font-mono tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isRunning
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-glow-cyan'
                  } disabled:opacity-50`}
                >
                  <PlayCircle className="w-4 h-4" />
                  {isRunning ? 'Running Scenario...' : '▶ Run Scenario'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
