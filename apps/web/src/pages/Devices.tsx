import React from 'react';
import { Device } from '../types';
import { Video, Wifi, Battery, RefreshCw } from 'lucide-react';

interface DevicesProps {
  devices: Device[];
  onRefresh: () => void;
}

export const Devices: React.FC<DevicesProps> = ({ devices, onRefresh }) => {
  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2333] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-sans tracking-tight">Connected Devices</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {devices.length} Online
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ring hardware cameras, auxiliary contact sensors, and simulated smart home telemetry nodes.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121520] border border-[#1e2333] text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Poll Hardware
        </button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {devices.map((device) => {
          const isRing = device.source === 'ring';

          return (
            <div
              key={device.id}
              className="clean-panel rounded-xl p-5 border border-[#1e2333] hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Source Badge & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isRing
                      ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {device.source_label}
                  </span>

                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    {device.status.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white mb-1">{device.name}</h3>
                <span className="text-xs text-slate-400 block mb-4">
                  ID: {device.id} • {device.location.replace('_', ' ')}
                </span>

                {/* Telemetry Stats */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-[#0b0d14] border border-[#1e2333] text-xs">
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Battery</span>
                      <span className="text-slate-200 font-semibold">{device.battery_level}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-blue-400" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Signal</span>
                      <span className="text-slate-200 font-semibold">{device.signal_strength}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#1e2333] flex items-center justify-between text-xs text-slate-500">
                <span>Firmware: {device.firmware_version}</span>
                <span className="text-slate-400 font-medium">Mesh Active</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
