import React, { useState } from 'react';
import { SmartEvent } from '../types';
import { Activity, Radio, Code, Send, Check } from 'lucide-react';
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
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-sans">Live Event Stream</h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isWsConnected ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60' : 'bg-amber-950/60 text-amber-300'
            }`}>
              {isWsConnected ? 'Connected' : 'Connecting'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standardized smart-home telemetry ingested and routed into the Situation Engine.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:border-blue-400 focus:outline-none"
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
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:border-blue-400 focus:outline-none"
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
      <div className="rounded-xl p-4 border border-slate-800 bg-[#121520] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
          <Radio className="w-4 h-4 text-blue-400" />
          <span>Manual Event Injection:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={injectType}
            onChange={(e) => setInjectType(e.target.value)}
            className="bg-[#0b0d14] border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5"
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
            className="bg-[#0b0d14] border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5"
          >
            <option value="front_door">Front Door</option>
            <option value="garage">Garage</option>
            <option value="backyard">Backyard</option>
            <option value="living_room">Living Room</option>
          </select>

          <button
            onClick={handleInjectEvent}
            disabled={injecting}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {injectSuccess ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            {injectSuccess ? 'Sent' : 'Inject Event'}
          </button>
        </div>
      </div>

      {/* Main Grid: Events List + Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#121520] overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>{filteredEvents.length} events logged</span>
            <span>Click to view payload</span>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No events match criteria.
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const isSelected = selectedEvent?.id === evt.id;
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-3.5 flex items-center justify-between text-xs cursor-pointer transition-colors hover:bg-slate-800/40 ${
                      isSelected ? 'bg-slate-800/60 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                      <div>
                        <div className="font-medium text-slate-200 capitalize flex items-center gap-2">
                          {evt.eventType.replace('_', ' ')}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {evt.source}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {evt.deviceId} · {evt.location.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <div className="text-right text-slate-400">
                      <div>{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-xs text-slate-500">{Math.round(evt.confidence * 100)}% conf</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payload Inspector */}
        <div className="rounded-xl p-5 border border-slate-800 bg-[#121520] h-fit">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs font-medium text-slate-300">
            <Code className="w-4 h-4 text-blue-400" />
            <span>Event Contract Inspector</span>
          </div>

          {selectedEvent ? (
            <div className="space-y-3.5 pt-3.5">
              <div>
                <span className="text-xs text-slate-500 block">Event ID</span>
                <p className="font-mono text-xs text-white">{selectedEvent.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 block">Source</span>
                  <p className="text-slate-200 capitalize">{selectedEvent.source}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Confidence</span>
                  <p className="text-slate-200">{Math.round(selectedEvent.confidence * 100)}%</p>
                </div>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Normalized Payload</span>
                <pre className="p-3 rounded-lg bg-[#0b0d14] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-slate-500">
              Select an event to view its normalized data structure.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
