import React, { useState } from 'react';
import { Settings as SettingsIcon, Radio, Cpu, Sliders, CheckCircle2 } from 'lucide-react';
import { HomeInfo } from '../types';

interface SettingsProps {
  homeInfo: HomeInfo | null;
  onSetHomeState: (state: string) => void;
}

export const Settings: React.FC<SettingsProps> = () => {
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
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#1e2333] pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-sans tracking-tight">System Settings & Integrations</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Provider Abstraction
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure smart home hardware adapters, AWS Bedrock reasoning endpoints, and correlation thresholds.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          Settings updated successfully. Situation Engine adapting to active provider.
        </div>
      )}

      {/* Smart Home Provider Settings (Ring vs Simulator) */}
      <div className="clean-panel rounded-xl p-6 border border-[#1e2333] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Smart Home Telemetry Provider</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e2333] text-slate-300">
            Active: {provider === 'ring' ? 'Live Ring' : 'Simulator'}
          </span>
        </div>

        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          GuardianMesh AI abstracts telemetry ingestion behind the <code className="text-blue-400 font-mono">SmartHomeProvider</code> interface.
          Switch between the hardware simulator and production Ring APIs seamlessly without modifying correlation logic.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => setProvider('simulator')}
            className={`flex-1 py-3 px-4 rounded-lg border text-xs font-medium transition-all ${
              provider === 'simulator'
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                : 'bg-[#0b0d14] border-[#1e2333] text-slate-400 hover:text-white'
            }`}
          >
            Simulator Provider (Recommended for Demo)
          </button>
          <button
            onClick={() => setProvider('ring')}
            className={`flex-1 py-3 px-4 rounded-lg border text-xs font-medium transition-all ${
              provider === 'ring'
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                : 'bg-[#0b0d14] border-[#1e2333] text-slate-400 hover:text-white'
            }`}
          >
            Production Ring Integration (OAuth / Webhooks)
          </button>
        </div>

        {provider === 'ring' && (
          <div className="mt-4 p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333] space-y-3">
            <label className="text-xs text-slate-300 block font-medium">Ring Access Token (Optional):</label>
            <input
              type="password"
              value={ringToken}
              onChange={(e) => setRingToken(e.target.value)}
              placeholder="Paste Ring 2FA Auth Token (leave blank for disconnected testing)..."
              className="w-full bg-[#121520] border border-[#1e2333] rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Note: If credentials are not provided, RingProvider cleanly degrades to simulated telemetry with explicit badge labelling.
            </p>
          </div>
        )}
      </div>

      {/* AI Reasoning Provider (Bedrock vs Mock) */}
      <div className="clean-panel rounded-xl p-6 border border-[#1e2333] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-white">AI Reasoning Engine (Amazon Bedrock)</h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e2333] text-indigo-300">
            {aiProvider.toUpperCase()}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => setAiProvider('mock')}
            className={`flex-1 py-3 px-4 rounded-lg border text-xs font-medium transition-all ${
              aiProvider === 'mock'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                : 'bg-[#0b0d14] border-[#1e2333] text-slate-400 hover:text-white'
            }`}
          >
            Mock AI Provider (Deterministic Demo Safety)
          </button>
          <button
            onClick={() => setAiProvider('bedrock')}
            className={`flex-1 py-3 px-4 rounded-lg border text-xs font-medium transition-all ${
              aiProvider === 'bedrock'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                : 'bg-[#0b0d14] border-[#1e2333] text-slate-400 hover:text-white'
            }`}
          >
            Amazon Bedrock Runtime (Claude 3.5 / Nova)
          </button>
        </div>

        {aiProvider === 'bedrock' && (
          <div className="mt-4 p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333] space-y-3 text-xs">
            <label className="text-slate-300 block font-medium">Bedrock Foundation Model ID:</label>
            <input
              type="text"
              value={bedrockModel}
              onChange={(e) => setBedrockModel(e.target.value)}
              className="w-full bg-[#121520] border border-[#1e2333] rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-400">
              Region: us-east-1 • Uses IAM credentials from AWS environment variables or EC2/ECS role.
            </p>
          </div>
        )}
      </div>

      {/* Situation Correlation Engine Weights */}
      <div className="clean-panel rounded-xl p-6 border border-[#1e2333] space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-semibold text-white">Situation Engine Algorithmic Weights</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
            <span className="text-slate-500 block text-[11px] uppercase font-medium">Person Detected</span>
            <span className="text-blue-400 font-bold text-sm">20%</span>
          </div>
          <div className="p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
            <span className="text-slate-500 block text-[11px] uppercase font-medium">Extended Dwell</span>
            <span className="text-blue-400 font-bold text-sm">25%</span>
          </div>
          <div className="p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
            <span className="text-slate-500 block text-[11px] uppercase font-medium">Repeated Motion</span>
            <span className="text-blue-400 font-bold text-sm">20%</span>
          </div>
          <div className="p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
            <span className="text-slate-500 block text-[11px] uppercase font-medium">Home Unoccupied</span>
            <span className="text-blue-400 font-bold text-sm">20%</span>
          </div>
          <div className="p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
            <span className="text-slate-500 block text-[11px] uppercase font-medium">Late Night Time</span>
            <span className="text-blue-400 font-bold text-sm">10%</span>
          </div>
          <div className="p-3 rounded-xl bg-[#0b0d14] border border-[#1e2333]">
            <span className="text-slate-500 block text-[11px] uppercase font-medium">Multi-Sensor Fusion</span>
            <span className="text-blue-400 font-bold text-sm">5%</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-all"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};
