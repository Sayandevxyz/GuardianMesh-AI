import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Radio, Cpu, Sliders, CheckCircle2, Key } from 'lucide-react';
import { HomeInfo } from '../types';

interface SettingsProps {
  homeInfo: HomeInfo | null;
  onSetHomeState: (state: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ homeInfo, onSetHomeState }) => {
  const [provider, setProvider] = useState<'simulator' | 'ring'>('simulator');
  const [aiProvider, setAiProvider] = useState<'mock' | 'bedrock'>('mock');
  const [ringToken, setRingToken] = useState<string>('');
  const [bedrockModel, setBedrockModel] = useState<string>('anthropic.claude-3-5-sonnet-20241022-v2:0');
  const [saved, setSaved] = useState<boolean>(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-sans">System Configuration & Integrations</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Provider Abstraction
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Configure smart home hardware adapters, AWS Bedrock reasoning endpoints, and correlation thresholds.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Settings updated successfully. Situation Engine adapting to active provider.
        </div>
      )}

      {/* Smart Home Provider Settings (Ring vs Simulator) */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Smart Home Telemetry Provider</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
            provider === 'ring' ? 'bg-blue-950 border border-blue-500/40 text-blue-300' : 'bg-cyan-950 border border-cyan-500/40 text-cyan-300'
          }`}>
            Current: {provider === 'ring' ? 'LIVE RING' : 'SIMULATOR'}
          </span>
        </div>

        <p className="text-xs text-slate-400 font-sans">
          GuardianMesh AI abstracts telemetry ingestion behind the <code className="text-cyan-400">SmartHomeProvider</code> interface.
          Switch between the hardware simulator and production Ring APIs seamlessly without modifying correlation logic.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setProvider('simulator')}
            className={`flex-1 py-3 px-4 rounded-xl border text-xs font-mono font-bold transition-all ${
              provider === 'simulator'
                ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 shadow-glow-cyan'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            SIMULATOR PROVIDER (Recommended for Hackathon Demo)
          </button>
          <button
            onClick={() => setProvider('ring')}
            className={`flex-1 py-3 px-4 rounded-xl border text-xs font-mono font-bold transition-all ${
              provider === 'ring'
                ? 'bg-blue-950/40 border-blue-400 text-blue-300 shadow-glow-cyan'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            PRODUCTION RING INTEGRATION (OAuth / Webhooks)
          </button>
        </div>

        {provider === 'ring' && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-3">
            <label className="text-xs font-mono text-slate-300 block">Ring Access Token (Optional):</label>
            <input
              type="password"
              value={ringToken}
              onChange={(e) => setRingToken(e.target.value)}
              placeholder="Paste Ring 2FA Auth Token (leave blank for disconnected testing)..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
            <p className="text-[11px] text-slate-400 font-mono">
              Note: If credentials are not provided, RingProvider cleanly degrades to simulated telemetry with explicit badge labelling.
            </p>
          </div>
        )}
      </div>

      {/* AI Reasoning Provider (Bedrock vs Mock) */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">AI Reasoning Engine (Amazon Bedrock)</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-purple-950 border border-purple-500/40 text-purple-300">
            {aiProvider.toUpperCase()}
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setAiProvider('mock')}
            className={`flex-1 py-3 px-4 rounded-xl border text-xs font-mono font-bold transition-all ${
              aiProvider === 'mock'
                ? 'bg-purple-950/40 border-purple-400 text-purple-300 shadow-glow-violet'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            MOCK AI PROVIDER (Deterministic Demo Safety)
          </button>
          <button
            onClick={() => setAiProvider('bedrock')}
            className={`flex-1 py-3 px-4 rounded-xl border text-xs font-mono font-bold transition-all ${
              aiProvider === 'bedrock'
                ? 'bg-purple-950/40 border-purple-400 text-purple-300 shadow-glow-violet'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            AMAZON BEDROCK RUNTIME (Claude 3.5 / Nova)
          </button>
        </div>

        {aiProvider === 'bedrock' && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-3 text-xs font-mono">
            <label className="text-slate-300 block">Bedrock Foundation Model ID:</label>
            <input
              type="text"
              value={bedrockModel}
              onChange={(e) => setBedrockModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Region: us-east-1 • Uses IAM credentials from AWS environment variables or EC2/ECS role.
            </p>
          </div>
        )}
      </div>

      {/* Situation Correlation Engine Weights */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Situation Engine Algorithmic Weights</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">PERSON DETECTED</span>
            <span className="text-cyan-300 font-bold text-sm">20%</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">EXTENDED DWELL</span>
            <span className="text-cyan-300 font-bold text-sm">25%</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">REPEATED MOTION</span>
            <span className="text-cyan-300 font-bold text-sm">20%</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">HOME UNOCCUPIED</span>
            <span className="text-cyan-300 font-bold text-sm">20%</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">LATE NIGHT TIME</span>
            <span className="text-cyan-300 font-bold text-sm">10%</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">MULTI-SENSOR FUSION</span>
            <span className="text-cyan-300 font-bold text-sm">5%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider shadow-glow-cyan transition-all"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};
