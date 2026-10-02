import React, { useState, useEffect } from 'react';
import { PrivacySettings } from '../types';
import { api } from '../api/client';
import { Lock, ArrowRight, Trash2, CheckCircle2, EyeOff, Cpu } from 'lucide-react';

export const PrivacyCenter: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [purging, setPurging] = useState<boolean>(false);
  const [purgeSuccess, setPurgeSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getPrivacySettings();
        setSettings(data);
      } catch (e) {
        console.error('Failed to load privacy settings:', e);
      }
    }
    load();
  }, []);

  const handlePurge = async () => {
    if (!window.confirm('Are you sure you want to permanently purge all smart-home event logs and situations?')) {
      return;
    }
    setPurging(true);
    setPurgeSuccess(false);
    try {
      await api.purgeData();
      setPurgeSuccess(true);
      setTimeout(() => setPurgeSuccess(false), 3000);
    } catch (e) {
      console.error('Purge error:', e);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2333] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-sans tracking-tight">Privacy & Data Architecture</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Zero Raw Video to Cloud LLM
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            GuardianMesh extracts structured telemetry locally. Raw video feeds are never transmitted to LLMs.
          </p>
        </div>

        <button
          onClick={handlePurge}
          disabled={purging}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {purging ? 'Purging Data...' : 'Purge All Event History'}
        </button>
      </div>

      {purgeSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          All historical smart-home events and situations have been securely deleted.
        </div>
      )}

      {/* Visual Architectural Data Flow Diagram */}
      <div className="clean-panel rounded-2xl p-6 sm:p-8 border border-[#1e2333]">
        <h3 className="text-sm font-semibold tracking-tight text-white mb-2">
          End-to-End Privacy Architecture
        </h3>
        <p className="text-xs text-slate-300 mb-6 font-sans">
          Unlike camera systems that upload private family video to the cloud, GuardianMesh reduces video to anonymized event metadata at the edge.
        </p>

        {/* Step-by-step pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
          {/* Node 1 */}
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Step 1</span>
            <div className="text-xs font-semibold text-white">Hardware Device</div>
            <p className="text-[11px] text-slate-400">Ring Doorbell / Camera / Sensors</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 2 */}
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-center space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase font-medium">Step 2</span>
            <div className="text-xs font-semibold text-white">Metadata Extraction</div>
            <p className="text-[11px] text-slate-400">Timestamp, zone, duration (no video)</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 3 */}
          <div className="p-4 rounded-xl bg-[#161a29] border border-blue-500/40 text-center space-y-1">
            <span className="text-[10px] text-blue-400 font-semibold block uppercase">Core Engine</span>
            <div className="text-xs font-bold text-white">Situation Engine</div>
            <p className="text-[11px] text-slate-300">Local temporal correlation & graph</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-600">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 4 */}
          <div className="p-4 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-center space-y-1">
            <span className="text-[10px] text-purple-400 font-semibold block uppercase">Step 4</span>
            <div className="text-xs font-semibold text-white">Bedrock AI</div>
            <p className="text-[11px] text-slate-400">Reasoning over structured schema</p>
          </div>
        </div>
      </div>

      {/* User Controls & Privacy Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="clean-panel rounded-xl p-6 border border-[#1e2333] space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-blue-400" />
            Media & Video Privacy
          </h4>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-xs">
            <div>
              <div className="font-medium text-slate-200">Transmit Raw Video to AI</div>
              <p className="text-[11px] text-slate-400">GuardianMesh permanently disables raw video streaming to cloud LLMs.</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 font-medium text-xs">
              Disabled
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-xs">
            <div>
              <div className="font-medium text-slate-200">Send Structured Metadata Only</div>
              <p className="text-[11px] text-slate-400">Only temporal event timestamps and locations are analyzed.</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium text-xs">
              Enforced
            </span>
          </div>
        </div>

        <div className="clean-panel rounded-xl p-6 border border-[#1e2333] space-y-4">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            Local Processing Controls
          </h4>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-xs">
            <div>
              <div className="font-medium text-slate-200">Local Situation Correlation</div>
              <p className="text-[11px] text-slate-400">Run deterministic clustering engine without internet dependency.</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium text-xs">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0b0d14] border border-[#1e2333] text-xs">
            <div>
              <div className="font-medium text-slate-200">Data Retention Window</div>
              <p className="text-[11px] text-slate-400">Auto-purge telemetry after 30 days of inactivity.</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#1e2333] text-slate-300 font-medium text-xs">
              30 Days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
