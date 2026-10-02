import React, { useState } from 'react';
import { SituationGraphData, GraphNode } from '../types';
import { ShieldAlert, Video, MapPin, Activity, Zap, CheckCircle2 } from 'lucide-react';

interface SituationGraphProps {
  graphData: SituationGraphData;
  activeSituationTitle?: string;
  onNodeClick?: (node: GraphNode) => void;
}

export const SituationGraph: React.FC<SituationGraphProps> = ({
  graphData,
  activeSituationTitle = 'Unusual Entrance Activity',
  onNodeClick
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 border border-slate-800/80 rounded-xl bg-slate-950/40">
        <Activity className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
        <p className="text-sm">No active correlation graph available</p>
      </div>
    );
  }

  // Pre-calculate circular or layered layout positions
  const width = 640;
  const height = 360;
  const centerX = width / 2;
  const centerY = height / 2;

  // Position nodes strategically:
  // Situation in top-center
  // Location and Home State on upper left/right
  // Devices in middle layer
  // Events sequentially along bottom arc
  const nodePositions: Record<string, { x: number; y: number }> = {};
  const eventNodes = graphData.nodes.filter((n) => n.type === 'event');
  const otherNodes = graphData.nodes.filter((n) => n.type !== 'event');

  otherNodes.forEach((node) => {
    if (node.type === 'situation') {
      nodePositions[node.id] = { x: centerX, y: 70 };
    } else if (node.type === 'location') {
      nodePositions[node.id] = { x: centerX - 190, y: 110 };
    } else if (node.type === 'home_state') {
      nodePositions[node.id] = { x: centerX + 190, y: 110 };
    } else if (node.type === 'device') {
      nodePositions[node.id] = { x: centerX - 140, y: 195 };
    } else {
      nodePositions[node.id] = { x: centerX, y: centerY };
    }
  });

  const eventCount = eventNodes.length;
  eventNodes.forEach((node, i) => {
    const spacing = 110;
    const startX = centerX - ((eventCount - 1) * spacing) / 2;
    nodePositions[node.id] = {
      x: startX + i * spacing,
      y: 285 + (i % 2 === 1 ? 15 : 0)
    };
  });

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'situation':
        return { bg: '#881337', border: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', icon: ShieldAlert };
      case 'location':
        return { bg: '#082f49', border: '#0284c7', glow: 'rgba(2, 132, 199, 0.4)', icon: MapPin };
      case 'home_state':
        return { bg: '#2e1065', border: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.4)', icon: CheckCircle2 };
      case 'device':
        return { bg: '#042f2e', border: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)', icon: Video };
      case 'event':
      default:
        return { bg: '#083344', border: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', icon: Activity };
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-cyan-500/20 bg-[#070b1a]/90 backdrop-blur-md p-4">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
          <h4 className="text-xs font-mono font-semibold tracking-wider text-cyan-300 uppercase">
            Situation Topology Graph
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></span> Situation
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Event Sequence
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span> Context
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[16/9] max-h-[380px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
        >
          <defs>
            <linearGradient id="edgeGradientCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="edgeGradientRose" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.4" />
            </linearGradient>
            <marker
              id="arrowhead"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="#00F0FF" opacity="0.75" />
            </marker>
          </defs>

          {/* Render Edges */}
          {graphData.edges.map((edge) => {
            const src = nodePositions[edge.source];
            const tgt = nodePositions[edge.target];
            if (!src || !tgt) return null;

            const isEscalation = edge.label === 'escalated_to';
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return (
              <g key={edge.id} className="transition-opacity duration-300">
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={isEscalation ? '#f43f5e' : '#00F0FF'}
                  strokeWidth={isEscalation ? 2.5 : 1.5}
                  strokeDasharray={edge.animated ? '5,5' : 'none'}
                  strokeOpacity={0.65}
                  className={edge.animated ? 'animate-[dash_15s_linear_infinite]' : ''}
                />
                {/* Edge Label Badge */}
                <rect
                  x={midX - 35}
                  y={midY - 8}
                  width="70"
                  height="16"
                  rx="8"
                  fill="#050711"
                  stroke={isEscalation ? 'rgba(244, 63, 94, 0.4)' : 'rgba(56, 189, 248, 0.2)'}
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={midY + 3.5}
                  textAnchor="middle"
                  fill={isEscalation ? '#fda4af' : '#94a3b8'}
                  fontSize="8.5"
                  fontFamily="monospace"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Render Nodes */}
          {graphData.nodes.map((node) => {
            const pos = nodePositions[node.id] || { x: centerX, y: centerY };
            const style = getNodeColor(node.type);
            const isSelected = selectedNode?.id === node.id;
            const isSituation = node.type === 'situation';

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onClick={() => {
                  setSelectedNode(node);
                  if (onNodeClick) onNodeClick(node);
                }}
              >
                {/* Outer Glow */}
                <circle
                  r={isSituation ? 36 : 24}
                  fill={style.bg}
                  stroke={style.border}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className="transition-all duration-300 group-hover:scale-110"
                  style={{
                    filter: `drop-shadow(0 0 12px ${style.glow})`
                  }}
                />

                {/* Inner Icon or Dot */}
                <circle
                  r={isSituation ? 26 : 16}
                  fill="#0B1021"
                  stroke={style.border}
                  strokeWidth="1"
                />

                {/* Label text below node */}
                <text
                  y={isSituation ? 52 : 36}
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize={isSituation ? "12" : "10"}
                  fontWeight={isSituation ? "700" : "500"}
                  className="transition-colors group-hover:fill-cyan-300"
                >
                  {node.label}
                </text>

                {/* Subtitle / Type */}
                <text
                  y={isSituation ? 65 : 46}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  [{node.type.toUpperCase()}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Node Inspector Footer if selected */}
      {selectedNode && (
        <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between text-xs">
          <div>
            <span className="font-mono text-cyan-400 font-semibold">{selectedNode.label}</span>
            <span className="text-slate-400 ml-2">Type: {selectedNode.type}</span>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded bg-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
