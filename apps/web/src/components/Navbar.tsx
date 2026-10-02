import React from 'react';
import {
  Shield, Activity, Radio, FileText, Bot, 
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
    { key: 'assistant', label: 'Ask AI', icon: Bot },
    { key: 'devices', label: 'Devices', icon: Video },
    { key: 'simulator', label: 'Simulator', icon: PlayCircle },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'developer', label: 'Developer', icon: Terminal },
    { key: 'privacy', label: 'Privacy', icon: Lock },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0d0f17]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('overview')}>
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base tracking-tight text-white">
                  GuardianMesh <span className="text-blue-400 font-medium">AI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-normal bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                  <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  {isWsConnected ? 'System Online' : 'Connecting'}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Smart Home Situation Intelligence
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Home Status Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Home:</span>
              <span className="font-medium text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {homeInfo?.system_status || 'Protected'}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-300 capitalize">
                {homeInfo?.current_state || 'Away'} mode
              </span>
            </div>

            {/* Alexa Voice Dialog */}
            <button
              onClick={onOpenAlexa}
              title="Test Voice Query"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Voice Test</span>
            </button>

            {/* Simple, Professional Demo Mode Button */}
            <button
              onClick={onRunDemoMode}
              disabled={isDemoRunning}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                isDemoRunning
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-600/40'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              {isDemoRunning ? 'Running Demo...' : 'Demo Mode'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
