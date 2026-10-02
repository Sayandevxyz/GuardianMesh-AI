import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { api } from '../api/client';
import { Bot, Send, User, Sparkles, Terminal, Shield } from 'lucide-react';

interface AIAssistantProps {
  initialQuery?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ initialQuery }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm0',
      role: 'assistant',
      content: 'Hello! I am Guardian AI. I can answer questions about your home security, explain why specific alerts were triggered, or summarize recent events based on real sensor data.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    <div className="space-y-6 pb-16 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white font-sans">Ask Guardian AI</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Answers questions grounded in actual smart-home telemetry and situations.
          </p>
        </div>
      </div>

      {/* Suggested Questions */}
      <div>
        <span className="text-xs text-slate-400 block mb-2">Suggested questions:</span>
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#121520] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="rounded-xl border border-slate-800 bg-[#121520] flex flex-col h-[520px] overflow-hidden">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                )}

                <div className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white font-normal ml-auto'
                    : 'bg-[#0b0d14] border border-slate-800 text-slate-200'
                }`}>
                  {/* Tool Executions Step Preview */}
                  {msg.tool_executions && msg.tool_executions.length > 0 && (
                    <div className="mb-2.5 p-2 rounded-lg bg-[#121520] border border-slate-800 text-[11px] space-y-1 text-slate-400">
                      <div className="text-blue-400 font-medium flex items-center gap-1.5 pb-1 border-b border-slate-800">
                        <Terminal className="w-3 h-3" />
                        Retrieved Context ({msg.tool_executions.length} tools):
                      </div>
                      {msg.tool_executions.map((tool, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-400">
                          <span className="text-slate-300">· {tool.tool_name}()</span>
                          <span className="text-slate-500 text-[10px]">{tool.result_preview}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-800/40">
                    <span>{msg.timestamp}</span>
                    {msg.provider && (
                      <span className="capitalize text-slate-400">
                        {msg.provider} provider
                      </span>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 items-center text-xs text-slate-400">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400" />
              </div>
              <div className="p-2.5 rounded-lg bg-[#0b0d14] border border-slate-800">
                Checking situation timeline and device telemetry...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#0b0d14] border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about events, situation causes, or home safety..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
