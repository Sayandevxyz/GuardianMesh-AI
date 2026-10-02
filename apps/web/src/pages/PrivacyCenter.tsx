import React, { useState, useEffect } from 'react';
import { PrivacySettings } from '../types';
import { api } from '../api/client';
import { Lock, Shield, ArrowRight, Trash2, CheckCircle2, Server, EyeOff, Cpu, CloudOff } from 'lucide-react';

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

  const handleToggle = async (key: keyof PrivacySettings) => {
    if (!settings) return;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await api.updatePrivacySettings(updated);
    } catch (e) {
      console.error('Failed to update privacy settings:', e);
    }
  };

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
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-sans">Privacy Center & Data Flow Architecture</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              Zero Raw Video to Cloud LLM
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            GuardianMesh extracts structured telemetry locally. Raw video feeds are never transmitted to LLMs.
          </p>
        </div>

        <button
          onClick={handlePurge}
          disabled={purging}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-950/80 border border-red-500/40 text-xs font-mono text-red-300 hover:bg-red-900/60 hover:text-white transition-all disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {purging ? 'Purging Data...' : 'Purge All Event History'}
        </button>
      </div>

      {purgeSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          All historical smart-home events and situations have been securely deleted.
        </div>
      )}

      {/* Visual Architectural Data Flow Diagram */}
      <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-cyan-500/30">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-cyan-400 mb-2">
          End-to-End Privacy Architecture
        </h3>
        <p className="text-xs text-slate-300 mb-6 font-sans">
          Unlike camera systems that upload private family video to the cloud, GuardianMesh reduces video to anonymized event metadata at the edge.
        </p>

        {/* Step-by-step pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
          {/* Node 1 */}
          <div className="p-4 rounded-2xl bg-[#080d22] border border-cyan-500/30 text-center space-y-1">
            <span className="text-[10px] font-mono text-slate-500 block">STEP 1</span>
            <div className="text-xs font-bold text-white">DEVICE</div>
            <p className="text-[10px] text-slate-400">Ring Doorbell / Camera / Sensors</p>
          </div>

          <div className="hidden md:flex justify-center text-cyan-400">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 2 */}
          <div className="p-4 rounded-2xl bg-[#080d22] border border-cyan-500/30 text-center space-y-1">
            <span className="text-[10px] font-mono text-slate-500 block">STEP 2</span>
            <div className="text-xs font-bold text-white">METADATA</div>
            <p className="text-[10px] text-slate-400">Timestamp, zone, duration (no video)</p>
          </div>

          <div className="hidden md:flex justify-center text-cyan-400">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 3 */}
          <div className="p-4 rounded-2xl bg-[#091535] border border-cyan-400/50 text-center space-y-1 shadow-glow-cyan">
            <span className="text-[10px] font-mono text-cyan-400 font-bold block">CORE</span>
            <div className="text-xs font-bold text-cyan-300">SITUATION ENGINE</div>
            <p className="text-[10px] text-slate-300">Local temporal correlation & graph</p>
          </div>

          <div className="hidden md:flex justify-center text-cyan-400">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Node 4 */}
          <div className="p-4 rounded-2xl bg-[#080d22] border border-violet-500/40 text-center space-y-1">
            <span className="text-[10px] font-mono text-violet-400 block">STEP 4</span>
            <div className="text-xs font-bold text-white">BEDROCK AI</div>
            <p className="text-[10px] text-slate-400">Reasoning over structured schema</p>
          </div>
        </div>
      </div>

      {/* User Controls & Privacy Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-cyan-400" />
            Media & Video Privacy
          </h4>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <div>
              <div className="font-semibold text-slate-200">Transmit Raw Video to AI</div>
              <p className="text-[11px] text-slate-400 font-mono">GuardianMesh permanently disables raw video streaming to cloud LLMs.</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-300 font-mono text-[10px]">
              DISABLED
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <div>
              <div className="font-semibold text-slate-200">Send Structured Metadata Only</div>
              <p className="text-[11px] text-slate-400 font-mono">Only temporal event timestamps and locations are analyzed.</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-[10px]">
              ENFORCED
            </span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Local Processing & Cloud Controls
          </h4>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <div>
              <div className="font-semibold text-slate-200">Local Situation Correlation</div>
              <p className="text-[11px] text-slate-400 font-mono">Run deterministic clustering engine without internet dependency.</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-[10px]">
              ACTIVE
            </span>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <div>
              <div className="font-semibold text-slate-200">Data Retention Window</div>
              <p className="text-[11px] text-slate-400 font-mono">Auto-purge telemetry after 30 days of inactivity.</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[10px]">
              30 DAYS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
