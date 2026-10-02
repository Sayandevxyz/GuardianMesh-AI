import React, { useState, useEffect } from 'react';
import { Scenario, Situation } from '../types';
import { api } from '../api/client';
import { PlayCircle, RotateCcw, Zap, ArrowRight } from 'lucide-react';

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
        `T+${evt.offset_seconds}s: ${evt.eventType.replace('_', ' ')} (${evt.deviceId})`
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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2333] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-sans tracking-tight">Smart-Home Event Simulator</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Interactive Testbed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic simulation scenarios executing real sensor event sequences through the Situation Engine.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={isResetting || runningScenarioId !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#121520] border border-[#1e2333] hover:border-slate-600 text-xs text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          Reset Simulation State
        </button>
      </div>

      {/* Real-Time Scenario Playback Tracer Banner */}
      {(runningScenarioId || playbackSteps.length > 0 || resultingSituation) && (
        <div className="clean-panel rounded-xl p-5 border border-blue-500/30 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e2333] pb-2">
            <span className="text-xs text-blue-400 font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              Scenario Execution Tracer
            </span>
            <span className="text-xs text-slate-400">
              {runningScenarioId ? 'Injecting Telemetry Stream...' : 'Execution Completed'}
            </span>
          </div>

          {/* Stepper logs */}
          <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs text-slate-300">
            {playbackSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300 font-mono">
                <span className="text-slate-500">[{idx + 1}]</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {/* Resulting Situation Card */}
          {resultingSituation && (
            <div className="mt-3 p-4 rounded-xl bg-slate-900 border border-[#1e2333] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-rose-400 block mb-0.5">
                  Situation Identified by Situation Engine
                </span>
                <h4 className="text-base font-bold text-white">
                  {resultingSituation.title} ({Math.round(resultingSituation.confidence * 100)}% Confidence)
                </h4>
                <p className="text-xs text-slate-300 mt-1">"{resultingSituation.summary}"</p>
              </div>

              <button
                onClick={() => onInvestigate(resultingSituation.id)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
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
              className="clean-panel rounded-xl p-5 border border-[#1e2333] hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e2333] text-slate-300">
                    {sc.badge}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">
                    State: {sc.home_state}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{sc.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {sc.description}
                </p>

                {/* Event sequence breakdown */}
                <div className="p-3 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-xs font-mono space-y-1.5">
                  <div className="text-slate-500 text-[11px] font-sans font-semibold">
                    Telemetry Sequence ({sc.events.length} events):
                  </div>
                  {sc.events.slice(0, 3).map((e, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300">
                      <span>T+{e.offset_seconds}s</span>
                      <span className="text-blue-400 font-sans">{e.eventType}</span>
                    </div>
                  ))}
                  {sc.events.length > 3 && (
                    <div className="text-slate-500 text-[10px] text-right font-sans">
                      +{sc.events.length - 3} more events...
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#1e2333]">
                <button
                  onClick={() => handleRunScenario(sc)}
                  disabled={runningScenarioId !== null}
                  className={`w-full py-2.5 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all ${
                    isRunning
                      ? 'bg-amber-600 text-white animate-pulse'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                  } disabled:opacity-50`}
                >
                  <PlayCircle className="w-4 h-4" />
                  {isRunning ? 'Running Scenario...' : 'Run Scenario'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
