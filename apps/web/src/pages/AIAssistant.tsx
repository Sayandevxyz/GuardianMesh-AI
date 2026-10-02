import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ToolExecution } from '../types';
import { api } from '../api/client';
import { Bot, Send, User, Sparkles, Terminal, CheckCircle2, Shield } from 'lucide-react';

interface AIAssistantProps {
  initialQuery?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ initialQuery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm0',
      role: 'assistant',
      content: 'Hello! I am Guardian AI, your smart-home situation intelligence assistant. I analyze relationships across your perimeter sensors, cameras, and home state to answer questions grounded in real telemetry.',
      timestamp: new Date().toLocaleTimeString(),
      provider: 'mock'
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sampleQuestions = [
    'What happened outside?',
    'Why did I get this alert?',
    'Was this one event or multiple events?',
    'Which device detected it?',
    'How confident are you?',
    'Is my home safe right now?'
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chat(query);
      const assistantMsg: ChatMessage = {
        id: `asst_${Date.now()}`,
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toLocaleTimeString(),
        tool_executions: res.tool_executions,
        confidence: res.confidence,
        provider: res.provider
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `Unable to query AI agent: ${err.message || 'Network error'}. Showing deterministic state.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-sans">Guardian AI Assistant</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Grounded Telemetry Reasoner
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Queries live smart-home events and situation graphs via tool execution before answering.
          </p>
        </div>
      </div>

      {/* Suggested Chips */}
      <div>
        <span className="text-[11px] font-mono text-slate-400 block mb-2">Suggested Inquiries:</span>
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-slate-300 hover:text-cyan-200 transition-all font-sans"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="glass-panel rounded-2xl border border-cyan-500/20 flex flex-col h-[520px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-sans leading-relaxed ${
                  isUser
                    ? 'bg-cyan-600 text-white font-medium ml-auto'
                    : 'bg-[#070b1a] border border-slate-800 text-slate-200 shadow-panel'
                }`}>
                  {/* Subtle Tool Executions Step Preview */}
                  {msg.tool_executions && msg.tool_executions.length > 0 && (
                    <div className="mb-3 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-[10px] space-y-1 text-slate-400">
                      <div className="text-cyan-400 font-semibold flex items-center gap-1.5 pb-1 border-b border-slate-800">
                        <Terminal className="w-3 h-3" />
                        Tool Calls Executed ({msg.tool_executions.length}):
                      </div>
                      {msg.tool_executions.map((tool, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-400">
                          <span className="text-cyan-300">✓ {tool.tool_name}()</span>
                          <span className="text-slate-500 text-[9px]">{tool.result_preview}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 pt-1 border-t border-slate-800/50">
                    <span>{msg.timestamp}</span>
                    {msg.provider && (
                      <span className="uppercase text-cyan-400/70">
                        {msg.provider} reasoning engine
                      </span>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 items-center text-xs font-mono text-cyan-400">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="animate-pulse">Retrieving events & correlating timeline...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about events, situation causes, confidence, or home safety..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-glow-cyan transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
