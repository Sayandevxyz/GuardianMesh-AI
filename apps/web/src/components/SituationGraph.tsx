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
  activeSituationTitle,
  onNodeClick
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40">
        <Activity className="w-6 h-6 text-slate-600 mb-2" />
        <p className="text-xs">No active situation graph available</p>
      </div>
    );
  }

  const width = 640;
  const height = 340;
  const centerX = width / 2;
  const centerY = height / 2;

  const nodePositions: Record<string, { x: number; y: number }> = {};
  const eventNodes = graphData.nodes.filter((n) => n.type === 'event');
  const otherNodes = graphData.nodes.filter((n) => n.type !== 'event');

  otherNodes.forEach((node) => {
    if (node.type === 'situation') {
      nodePositions[node.id] = { x: centerX, y: 65 };
    } else if (node.type === 'location') {
      nodePositions[node.id] = { x: centerX - 180, y: 105 };
    } else if (node.type === 'home_state') {
      nodePositions[node.id] = { x: centerX + 180, y: 105 };
    } else if (node.type === 'device') {
      nodePositions[node.id] = { x: centerX - 130, y: 185 };
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
      y: 270 + (i % 2 === 1 ? 15 : 0)
    };
  });

  const getNodeStyle = (type: string) => {
    switch (type) {
      case 'situation':
        return { bg: '#291415', border: '#f43f5e', text: '#fda4af' };
      case 'location':
        return { bg: '#131b2e', border: '#3b82f6', text: '#93c5fd' };
      case 'home_state':
        return { bg: '#1e1b2e', border: '#8b5cf6', text: '#c4b5fd' };
      case 'device':
        return { bg: '#102422', border: '#14b8a6', text: '#99f6e4' };
      case 'event':
      default:
        return { bg: '#161c28', border: '#475569', text: '#cbd5e1' };
    }
  };

  return (
    <div className="w-full rounded-xl border border-slate-800 bg-[#10131d] p-5">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <h4 className="text-xs font-semibold text-slate-200">
            Situation Relationship Graph
          </h4>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Situation
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span> Event
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-400"></span> Context
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[16/9] max-h-[350px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
          {/* Edges */}
          {graphData.edges.map((edge) => {
            const src = nodePositions[edge.source];
            const tgt = nodePositions[edge.target];
            if (!src || !tgt) return null;

            const isEscalation = edge.label === 'escalated_to';
            const midX = (src.x + tgt.x) / 2;
            const midY = (src.y + tgt.y) / 2;

            return (
              <g key={edge.id}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke={isEscalation ? '#f43f5e' : '#334155'}
                  strokeWidth={isEscalation ? 2 : 1.5}
                  strokeDasharray={edge.animated ? '4,4' : 'none'}
                />
                {/* Edge Label Badge */}
                <rect
                  x={midX - 34}
                  y={midY - 8}
                  width="68"
                  height="16"
                  rx="4"
                  fill="#0b0d14"
                  stroke={isEscalation ? '#f43f5e' : '#334155'}
                  strokeWidth="1"
                />
                <text
                  x={midX}
                  y={midY + 3.5}
                  textAnchor="middle"
                  fill={isEscalation ? '#fca5a5' : '#94a3b8'}
                  fontSize="8.5"
                  fontFamily="sans-serif"
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {graphData.nodes.map((node) => {
            const pos = nodePositions[node.id] || { x: centerX, y: centerY };
            const style = getNodeStyle(node.type);
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
                <circle
                  r={isSituation ? 28 : 20}
                  fill={style.bg}
                  stroke={style.border}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="transition-colors group-hover:stroke-blue-400"
                />

                <circle
                  r={isSituation ? 16 : 10}
                  fill="#111420"
                  stroke={style.border}
                  strokeWidth="1"
                />

                {/* Node Label */}
                <text
                  y={isSituation ? 42 : 32}
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize={isSituation ? "11.5" : "9.5"}
                  fontWeight={isSituation ? "600" : "500"}
                  className="transition-colors group-hover:fill-blue-400"
                >
                  {node.label}
                </text>

                <text
                  y={isSituation ? 54 : 42}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="8"
                >
                  {node.type}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selectedNode && (
        <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-white font-medium">{selectedNode.label}</span>
            <span className="text-slate-400 ml-2">Type: {selectedNode.type}</span>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};
