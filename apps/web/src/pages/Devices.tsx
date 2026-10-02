import React from 'react';
import { Device } from '../types';
import { Video, Wifi, Battery, Shield, Radio, CheckCircle, RefreshCw } from 'lucide-react';

interface DevicesProps {
  devices: Device[];
  onRefresh: () => void;
}

export const Devices: React.FC<DevicesProps> = ({ devices, onRefresh }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-sans">Connected Mesh Devices</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {devices.length} Online
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Ring hardware cameras, auxiliary contact sensors, and simulated smart home telemetry nodes.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Poll Hardware
        </button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {devices.map((device) => {
          const isOnline = device.status === 'online';
          const isRing = device.source === 'ring';

          return (
            <div
              key={device.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Source Badge & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                    isRing
                      ? 'bg-blue-950 border border-blue-500/40 text-blue-300'
                      : 'bg-cyan-950 border border-cyan-500/40 text-cyan-300'
                  }`}>
                    {device.source_label}
                  </span>

                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {device.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{device.name}</h3>
                <span className="text-xs font-mono text-slate-400 block mb-4">
                  ID: {device.id} • {device.location.replace('_', ' ').toUpperCase()}
                </span>

                {/* Telemetry Stats */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">BATTERY</span>
                      <span className="text-slate-200 font-semibold">{device.battery_level}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block">SIGNAL</span>
                      <span className="text-slate-200 font-semibold">{device.signal_strength}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Firmware: {device.firmware_version}</span>
                <span className="text-cyan-400">Mesh Active</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
