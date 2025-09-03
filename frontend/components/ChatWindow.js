'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { getUserToken } from '../lib/firebase';
import VoiceInput from './VoiceInput';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function ChatWindow({ sessionId, onSubmitDiagnosis }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setLoading(true);
    setError('');

    // Add user message to chat
    const newUserMessage = {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const token = await getUserToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/case/respond`,
        {
          session_id: sessionId,
          user_input: userMessage
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Add AI response to chat
      const aiMessage = {
        type: 'ai',
        content: response.data.ai_response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
      console.error('Send message error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-surface rounded-xl shadow-lg border border-border flex flex-col h-full">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center">
            <svg className="h-5 w-5 text-medical mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Patient Interview
          </h2>
          <button
            onClick={onSubmitDiagnosis}
            className="btn-primary px-4 py-2 text-sm"
          >
            Submit Diagnosis
          </button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Ask questions to gather information for your diagnosis
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-elevated/30">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <svg className="mx-auto h-12 w-12 text-muted-foreground/60 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>Start by greeting the patient and asking about their symptoms</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-2 rounded-2xl shadow ${
              message.type === 'user'
                ? 'bg-medical text-white'
                : 'bg-muted text-foreground'
            }`}>
              <p className="text-sm">{message.content}</p>
              <p className={`text-[11px] mt-1 ${
                message.type === 'user' ? 'text-white/70' : 'text-muted-foreground'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground max-w-[80%] px-4 py-2 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-muted-foreground">Patient is typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-6 py-2">
          <div className="border border-error/20 bg-error/10 rounded-md p-3">
            <p className="text-sm text-error">{error}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 sm:px-6 py-3 border-t border-border">
        <div className="rounded-xl border border-border bg-elevated/40 focus-within:ring-1 focus-within:ring-medical transition shadow-sm">
          <div className="flex items-end gap-2 p-2 sm:p-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}
              onKeyPress={handleKeyPress}
              placeholder="Ask the patient a question..."
              className="flex-1 bg-transparent outline-none resize-none max-h-40 min-h-[40px] leading-6 text-foreground placeholder:text-muted-foreground/70 px-3 sm:px-4 py-2"
              rows="1"
              disabled={loading}
            />

            <VoiceInput
              onTranscript={(transcript) => {
                setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
              }}
              isListening={isListening}
              setIsListening={setIsListening}
              className="shrink-0"
              buttonClassName=""
            />

            <button
              onClick={sendMessage}
              disabled={loading || !inputValue.trim()}
              className="shrink-0 inline-flex items-center justify-center rounded-lg bg-medical text-white w-9 h-9 sm:w-10 sm:h-10 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send"
              title="Send"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line.</p>
      </div>
    </div>
  );
}
