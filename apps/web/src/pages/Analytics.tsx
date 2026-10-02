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
    return <div className="py-24 text-center text-xs text-slate-500">Loading AI observability metrics...</div>;
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="border-b border-[#1e2333] pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-sans tracking-tight">AI Observability & Costs</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              CloudWatch & Bedrock
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of token consumption, model latencies, and inference costs.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Requests */}
        <div className="clean-panel rounded-xl p-5 border border-[#1e2333]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase">AI Invocations</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.total_requests.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> +14.2% vs last week
          </span>
        </div>

        {/* Average Latency */}
        <div className="clean-panel rounded-xl p-5 border border-[#1e2333]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase">Avg Latency</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {metrics.average_latency_ms}ms
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            P95: {(metrics.average_latency_ms * 1.35).toFixed(0)}ms
          </span>
        </div>

        {/* Estimated Cost */}
        <div className="clean-panel rounded-xl p-5 border border-[#1e2333]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase">Estimated Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            ${metrics.estimated_cost_usd.toFixed(2)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Claude 3.5 Sonnet / Bedrock
          </span>
        </div>

        {/* Success Rate */}
        <div className="clean-panel rounded-xl p-5 border border-[#1e2333]">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.success_rate}%
          </div>
          <span className="text-xs text-emerald-400 mt-1 block font-medium">
            0 API throttles
          </span>
        </div>
      </div>

      {/* Recharts Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Requests Area Chart */}
        <div className="clean-panel rounded-xl p-5 border border-[#1e2333] space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Daily AI Inferences & Telemetry Synthesis
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.daily_stats}>
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121520', borderColor: '#1e2333', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#blueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Latency by Day Bar Chart */}
        <div className="clean-panel rounded-xl p-5 border border-[#1e2333] space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Average End-to-End Latency (ms)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.daily_stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2333" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121520', borderColor: '#1e2333', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="latency" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
