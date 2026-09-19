import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  ShieldAlert, 
  Sparkles,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { SimplificationResult } from '../types';
import { sendChatMessage } from '../services/api';

interface Props {
  currentReport: SimplificationResult | null;
  targetLanguage?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const MedClarityChatbot: React.FC<Props> = ({ currentReport, targetLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeLang = currentReport?.target_language || currentReport?.language || targetLanguage || 'English';

  // Initialize initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'assistant',
          text: currentReport
            ? `Hello! I am your MedClarity Assistant. I have reviewed your processed medical document. How can I help clarify your instructions, medications, diet, or follow-ups today?`
            : `Hello! I am your MedClarity Assistant. Please process a medical report to ask specific questions about your instructions, diet, and medications.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [currentReport]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const reply = await sendChatMessage({
        message: text,
        medicalContext: currentReport ? {
          simplified_text: currentReport.simplified_text,
          diet: currentReport.diet,
          follow_up: currentReport.follow_up,
          verification: currentReport.verification,
          original_text: currentReport.original_text,
        } : null,
        targetLanguage: activeLang,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        sender: 'assistant',
        text: "I couldn't find that information in your processed medical document. Please consult your healthcare professional.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "What are my main medications?",
    "What foods should I eat more of?",
    "When is my follow-up appointment?",
    "Can you explain this in simpler terms?",
  ];

  return (
    <div id="medclarity-floating-chatbot" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Popover Window */}
      {isOpen && (
        <div 
          className="w-[92vw] sm:w-[410px] h-[540px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
          role="dialog"
          aria-label="MedClarity Assistant Chat"
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white border border-white/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold tracking-tight">MedClarity Assistant</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </div>
                <p className="text-[11px] text-emerald-100/90">
                  {currentReport ? `Language: ${activeLang}` : 'Ready to help'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Medical Disclaimer Banner */}
          <div className="px-3.5 py-2 bg-amber-50 border-b border-amber-100 flex items-start gap-2 text-[11px] text-amber-900 leading-snug">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Educational assistant only.</strong> Answers are grounded strictly in your document. In an emergency, call local emergency services immediately.
            </span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60 text-xs sm:text-sm">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mb-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl shadow-2xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span
                      className={`text-[10px] block mt-1 ${
                        isUser ? 'text-emerald-100 text-right' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mb-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mb-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl rounded-bl-xs px-4 py-2.5 flex items-center gap-2 text-slate-500 text-xs shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Reviewing medical document...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts (if report loaded) */}
          {currentReport && messages.length <= 3 && !isLoading && (
            <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-[11px] font-medium text-slate-700 rounded-full shrink-0 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                id="medclarity-chat-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  currentReport
                    ? `Ask about your ${activeLang} report...`
                    : "Ask a medical question..."
                }
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                id="medclarity-chat-send-btn"
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        type="button"
        id="medclarity-floating-chat-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-xs sm:text-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer border border-emerald-500/40"
        aria-label="Toggle MedClarity Assistant Chat"
      >
        <div className="relative">
          <MessageCircle className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 border-2 border-emerald-700" />
        </div>
        <span>{isOpen ? 'Close Assistant' : 'Ask MedClarity'}</span>
        {isOpen && <ChevronDown className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
