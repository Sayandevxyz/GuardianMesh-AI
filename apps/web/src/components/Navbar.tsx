import React from 'react';
import {
  Shield, Activity, Radio, Cpu, FileText, Bot, 
  Video, PlayCircle, BarChart3, Terminal, Lock, Mic, Settings
} from 'lucide-react';
import { HomeInfo } from '../types';

export type TabKey =
  | 'overview'
  | 'events'
  | 'situations'
  | 'incidents'
  | 'assistant'
  | 'devices'
  | 'simulator'
  | 'analytics'
  | 'developer'
  | 'privacy'
  | 'settings';

interface NavbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  homeInfo: HomeInfo | null;
  isWsConnected: boolean;
  onOpenAlexa: () => void;
  onRunDemoMode: () => void;
  isDemoRunning: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  homeInfo,
  isWsConnected,
  onOpenAlexa,
  onRunDemoMode,
  isDemoRunning
}) => {
  const navItems: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'overview', label: 'Overview', icon: Shield },
    { key: 'events', label: 'Live Events', icon: Activity },
    { key: 'situations', label: 'Situations', icon: Radio },
    { key: 'incidents', label: 'Incidents', icon: FileText },
    { key: 'assistant', label: 'AI Assistant', icon: Bot },
    { key: 'devices', label: 'Devices', icon: Video },
    { key: 'simulator', label: 'Simulator', icon: PlayCircle },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'developer', label: 'Developer', icon: Terminal },
    { key: 'privacy', label: 'Privacy', icon: Lock },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-cyan-500/15 bg-[#050711]/90 backdrop-blur-xl">
      {/* Top Banner with Brand and System Health */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('overview')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/10 border border-cyan-400/40 shadow-glow-cyan">
              <Shield className="w-5 h-5 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-75"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white font-sans">
                  GUARDIAN<span className="text-cyan-400">MESH</span> <span className="text-xs font-mono text-cyan-300 font-normal">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {isWsConnected ? 'System Operational' : 'Reconnecting Mesh'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wide hidden sm:block">
                "From smart-home events to real-world understanding."
              </p>
            </div>
          </div>

          {/* Right Status Badges & Quick Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Home Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <span className="text-slate-400">HOME STATUS:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                {homeInfo?.system_status || 'Protected'}
              </span>
              <span className="text-slate-600 font-mono">|</span>
              <span className="font-mono text-cyan-300 uppercase text-[11px]">
                {homeInfo?.current_state || 'Away'} Mode
              </span>
            </div>

            {/* Alexa+ voice simulator button */}
            <button
              onClick={onOpenAlexa}
              title="Test Alexa+ Voice Query"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-300 hover:text-white hover:bg-blue-900/50 hover:border-blue-400/60 transition-all text-xs font-mono"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="hidden sm:inline">Alexa+</span>
            </button>

            {/* One-Click DEMO MODE Button */}
            <button
              onClick={onRunDemoMode}
              disabled={isDemoRunning}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-glow-cyan ${
                isDemoRunning
                  ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              {isDemoRunning ? 'Running 60s Demo...' : 'DEMO MODE'}
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
