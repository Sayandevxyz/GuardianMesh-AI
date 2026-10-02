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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-[#1e2333] bg-[#121520] shadow-2xl p-6 overflow-hidden">
        {/* Subtle top border line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Alexa+ / MCP Voice Simulator
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
                Voice Assistant
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Natural Language Voice Queries Grounded via Model Context Protocol
            </p>
          </div>
        </div>

        {/* Quick utterance suggestions */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 mb-1.5 block font-medium">Suggested Utterances:</label>
          <div className="flex flex-wrap gap-2">
            {sampleUtterances.map((sample) => (
              <button
                key={sample}
                onClick={() => {
                  setUtterance(sample);
                  handleSpeak(sample);
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#0b0d14] border border-[#1e2333] hover:border-slate-600 hover:bg-[#161a29] text-slate-300 hover:text-white transition-all text-left"
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
            className="flex-1 bg-[#0b0d14] border border-[#1e2333] rounded-lg px-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors font-sans"
          />
          <button
            onClick={() => handleSpeak()}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
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
          <div className="rounded-xl border border-[#1e2333] bg-[#0b0d14] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e2333] pb-2">
              <span className="text-xs text-blue-400 flex items-center gap-1.5 font-medium">
                <Volume2 className="w-3.5 h-3.5" /> Alexa Spoken Response
              </span>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Terminal className="w-3 h-3" />
                <span>MCP Tools:</span>
                {result.mcp_tools_called.map((tool) => (
                  <span key={tool} className="text-blue-300 font-medium px-1 rounded bg-[#1e2333] font-mono">
                    {tool}()
                  </span>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed italic">
              "{result.alexa_response}"
            </p>

            {/* Echo Show / Fire TV Card preview */}
            <div className="p-3 rounded-lg bg-[#121520] border border-[#1e2333] text-xs">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-medium">
                Display Card (Echo Show / Fire TV)
              </div>
              <div className="font-semibold text-white">{result.card.title}</div>
              <div className="text-slate-300 text-xs mt-0.5">{result.card.text}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
