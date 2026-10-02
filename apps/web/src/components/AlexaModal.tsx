import React, { useState } from 'react';
import { Mic, Volume2, X, Sparkles, Terminal } from 'lucide-react';
import { api } from '../api/client';

interface AlexaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlexaModal: React.FC<AlexaModalProps> = ({ isOpen, onClose }) => {
  const [utterance, setUtterance] = useState('Alexa, what happened outside?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    alexa_response: string;
    mcp_tools_called: string[];
    card: { title: string; text: string };
  } | null>(null);

  if (!isOpen) return null;

  const handleSpeak = async (phrase?: string) => {
    const textToSend = phrase || utterance;
    setLoading(true);
    try {
      const res = await api.sendAlexaUtterance(textToSend);
      setResult(res);
    } catch (e) {
      console.error('Alexa simulation error:', e);
    } finally {
      setLoading(false);
    }
  };

  const sampleUtterances = [
    'Alexa, what happened outside?',
    'Alexa, why did GuardianMesh alert me?',
    'Alexa, is my home safe?',
    'Alexa, which camera detected motion?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-cyan-500/30 bg-[#080d21] shadow-2xl p-6 overflow-hidden">
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-glow-cyan">
            <Volume2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Alexa+ / MCP Voice Simulator
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                Agent Skill
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Natural Language Voice Queries Grounded via Model Context Protocol
            </p>
          </div>
        </div>

        {/* Quick utterance suggestions */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 font-mono mb-1.5 block">Suggested Utterances:</label>
          <div className="flex flex-wrap gap-2">
            {sampleUtterances.map((sample) => (
              <button
                key={sample}
                onClick={() => {
                  setUtterance(sample);
                  handleSpeak(sample);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-slate-300 hover:text-cyan-200 transition-all font-sans text-left"
              >
                "{sample}"
              </button>
            ))}
          </div>
        </div>

        {/* Input & Speak Button */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={utterance}
            onChange={(e) => setUtterance(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSpeak()}
            placeholder="Type voice query..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
          />
          <button
            onClick={() => handleSpeak()}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-all shadow-glow-cyan disabled:opacity-50"
          >
            {loading ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            Speak
          </button>
        </div>

        {/* Alexa Simulated Audio Visualizer & Response */}
        {result && (
          <div className="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-4 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" /> Alexa Spoken Response
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                <Terminal className="w-3 h-3" />
                <span>MCP Tools:</span>
                {result.mcp_tools_called.map((tool) => (
                  <span key={tool} className="text-cyan-300 font-semibold px-1 rounded bg-cyan-950/60">
                    {tool}()
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-sans italic">
              "{result.alexa_response}"
            </p>

            {/* Echo Show / Fire TV Card preview */}
            <div className="p-3 rounded-lg bg-[#0e1633] border border-blue-500/20 text-xs">
              <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider mb-1">
                Display Card (Echo Show / Fire TV)
              </div>
              <div className="font-semibold text-white">{result.card.title}</div>
              <div className="text-slate-300 text-[11px] mt-0.5">{result.card.text}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
