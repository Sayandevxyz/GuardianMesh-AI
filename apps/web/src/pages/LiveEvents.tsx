import React, { useState } from 'react';
import { SmartEvent } from '../types';
import { Activity, Filter, Radio, Shield, Code, Send, Check } from 'lucide-react';
import { api } from '../api/client';

interface LiveEventsProps {
  events: SmartEvent[];
  isWsConnected: boolean;
  onEventCreated?: (event: SmartEvent) => void;
}

export const LiveEvents: React.FC<LiveEventsProps> = ({ events, isWsConnected, onEventCreated }) => {
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<SmartEvent | null>(null);

  // Manual event injector state
  const [injectType, setInjectType] = useState<string>('person_detected');
  const [injectLocation, setInjectLocation] = useState<string>('front_door');
  const [injecting, setInjecting] = useState<boolean>(false);
  const [injectSuccess, setInjectSuccess] = useState<boolean>(false);

  const filteredEvents = events.filter((evt) => {
    if (selectedZone !== 'all' && evt.location !== selectedZone) return false;
    if (selectedType !== 'all' && evt.eventType !== selectedType) return false;
    return true;
  });

  const handleInjectEvent = async () => {
    setInjecting(true);
    setInjectSuccess(false);
    try {
      const res = await api.ingestEvent({
        source: 'simulator',
        deviceId: `${injectLocation}-cam-01`,
        deviceType: injectType.includes('door') ? 'sensor' : 'camera',
        eventType: injectType,
        location: injectLocation,
        confidence: 0.95,
        metadata: { duration: 15, manual_injection: true }
      });
      if (onEventCreated && res.event) {
        onEventCreated(res.event);
      }
      setInjectSuccess(true);
      setTimeout(() => setInjectSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to inject event:', e);
    } finally {
      setInjecting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white font-sans">Real-Time Event Stream</h2>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase ${
              isWsConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400'
            }`}>
              {isWsConnected ? 'Live WebSocket' : 'Polling'}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Standardized smart-home telemetry ingested and routed into the Situation Engine.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:border-cyan-400 focus:outline-none font-mono"
          >
            <option value="all">All Locations</option>
            <option value="front_door">Front Door</option>
            <option value="garage">Garage</option>
            <option value="backyard">Backyard</option>
            <option value="living_room">Living Room</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:border-cyan-400 focus:outline-none font-mono"
          >
            <option value="all">All Event Types</option>
            <option value="person_detected">Person Detected</option>
            <option value="motion_detected">Motion Detected</option>
            <option value="door_opened">Door Opened</option>
            <option value="package_detected">Package Detected</option>
            <option value="package_removed">Package Removed</option>
            <option value="person_left">Person Left</option>
          </select>
        </div>
      </div>

      {/* Manual Telemetry Injection Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Manual Event Injection:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={injectType}
            onChange={(e) => setInjectType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 font-mono"
          >
            <option value="person_detected">Person Detected</option>
            <option value="motion_detected">Motion Detected</option>
            <option value="door_opened">Door Opened</option>
            <option value="door_closed">Door Closed</option>
            <option value="package_detected">Package Detected</option>
            <option value="package_removed">Package Removed</option>
            <option value="person_left">Person Left</option>
          </select>

          <select
            value={injectLocation}
            onChange={(e) => setInjectLocation(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 font-mono"
          >
            <option value="front_door">Front Door</option>
            <option value="garage">Garage</option>
            <option value="backyard">Backyard</option>
            <option value="living_room">Living Room</option>
          </select>

          <button
            onClick={handleInjectEvent}
            disabled={injecting}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-glow-cyan"
          >
            {injectSuccess ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Send className="w-3.5 h-3.5" />}
            {injectSuccess ? 'Dispatched' : 'Inject Event'}
          </button>
        </div>
      </div>

      {/* Main Grid: Events List + Event Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Table (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Showing {filteredEvents.length} events</span>
            <span>Click row to inspect payload</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                No events matched criteria.
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isSelected = selectedEvent?.id === evt.id;
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-3.5 flex items-center justify-between text-xs cursor-pointer transition-all hover:bg-slate-900/60 ${
                      isSelected ? 'bg-cyan-950/30 border-l-2 border-cyan-400' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"></div>
                      <div>
                        <div className="font-semibold text-slate-200 capitalize flex items-center gap-2">
                          {evt.eventType.replace('_', ' ')}
                          <span className="text-[10px] font-mono px-1.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                            {evt.source.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {evt.deviceId} • {evt.location.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-slate-400">
                      <div>{new Date(evt.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-cyan-400/80">{Math.round(evt.confidence * 100)}% conf</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Event Payload Inspector (1 Col) */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 h-fit">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-mono text-cyan-400">
            <Code className="w-4 h-4" />
            <span>Event Contract Inspector</span>
          </div>

          {selectedEvent ? (
            <div className="space-y-4 pt-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500">Event ID</span>
                <p className="font-mono text-xs text-white font-semibold">{selectedEvent.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500">SOURCE</span>
                  <p className="text-cyan-300">{selectedEvent.source.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">CONFIDENCE</span>
                  <p className="text-cyan-300">{Math.round(selectedEvent.confidence * 100)}%</p>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500">Raw Normalized Payload</span>
                <pre className="mt-1 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs font-mono text-slate-500">
              Select any event from the stream to view its normalized JSON schema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
