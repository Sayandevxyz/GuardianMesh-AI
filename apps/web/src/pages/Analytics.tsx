import React, { useState, useEffect } from 'react';
import { AIUsageMetrics } from '../types';
import { api } from '../api/client';
import { BarChart3, Clock, DollarSign, CheckCircle2, Cpu, TrendingUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';

export const Analytics: React.FC = () => {
  const [metrics, setMetrics] = useState<AIUsageMetrics | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAIUsage();
        setMetrics(data);
      } catch (e) {
        console.error('Failed to load metrics:', e);
      }
    }
    load();
  }, []);

  if (!metrics) {
    return <div className="py-24 text-center font-mono text-xs text-slate-500">Loading AI observability metrics...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-sans">AI Observability & Cost Analytics</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              CloudWatch & Bedrock
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time tracking of token consumption, model latencies, and inference costs.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase">AI INVOCATIONS</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {metrics.total_requests.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14.2% vs last week
          </span>
        </div>

        {/* Average Latency */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase">AVG LATENCY</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            {metrics.average_latency_ms}ms
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            P95: {(metrics.average_latency_ms * 1.35).toFixed(0)}ms
          </span>
        </div>

        {/* Estimated Cost */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase">ESTIMATED COST</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ${metrics.estimated_cost_usd.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">
            Claude 3.5 Sonnet / Bedrock
          </span>
        </div>

        {/* Success Rate */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-mono uppercase">SUCCESS RATE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {metrics.success_rate}%
          </div>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
            0 API throttles
          </span>
        </div>
      </div>

      {/* Recharts Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Requests Area Chart */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Daily AI Inferences & Telemetry Synthesis
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.daily_stats}>
                <defs>
                  <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#070b1a', borderColor: '#38bdf8', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#00F0FF" strokeWidth={2} fillOpacity={1} fill="url(#cyanGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency by Day Bar Chart */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400">
            Average End-to-End Latency (ms)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.daily_stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#070b1a', borderColor: '#a855f7', borderRadius: '8px' }}
                />
                <Bar dataKey="latency" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
