'use client';

import { useState, useRef, useEffect } from 'react';
import type { DisplayMessage } from '@/lib/types';
import ToolDisplay from './ToolDisplay';

export default function ChatInterface() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [history, setHistory] = useState<unknown[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cachedTokens] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialized = useRef(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: DisplayMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text.trim(),
      toolResults: [],
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history, newMessage: text.trim() }),
      });

      if (!res.ok) throw new Error('Network error');

      const data = await res.json();

      const assistantMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: data.text,
        toolResults: data.toolResults ?? [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setHistory(data.history);
    } catch {
      const errMsg: DisplayMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Произошла ошибка. Пожалуйста, попробуйте снова.',
        toolResults: [],
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-greeting on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    sendMessage('Привет! Начнём урок.');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-amber-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center shadow-md">
            <span className="font-arabic text-white text-lg font-bold">ع</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">Репетитор по арабскому</h1>
            <p className="text-xs text-gray-500">AI-репетитор на базе Claude</p>
          </div>
        </div>
        {cachedTokens > 0 && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
            кэш: {cachedTokens.toLocaleString()} токенов
          </span>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center">
                    <span className="font-arabic text-white text-xs">ع</span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">Репетитор</span>
                </div>
              )}
              {msg.text && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-white rounded-tr-md'
                      : 'bg-white text-gray-800 rounded-tl-md border border-gray-100 shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              )}
              {msg.toolResults.length > 0 && (
                <ToolDisplay results={msg.toolResults} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center">
                  <span className="font-arabic text-white text-xs">ع</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">Репетитор</span>
              </div>
              <div className="bg-white rounded-2xl rounded-tl-md border border-gray-100 shadow-sm px-4 py-3">
                <div className="flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-4 bg-white/80 backdrop-blur-sm border-t border-amber-100">
        <div className="flex gap-3 items-end bg-white rounded-2xl border border-amber-200 shadow-sm px-4 py-3 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение... (Enter для отправки)"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent max-h-32 overflow-y-auto disabled:opacity-50"
            style={{
              minHeight: '24px',
              height: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-sm"
            aria-label="Отправить"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19V5m0 0l-7 7m7-7l7 7"
              />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Shift+Enter для новой строки
        </p>
      </div>
    </div>
  );
}
