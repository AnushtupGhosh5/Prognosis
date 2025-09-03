'use client';

import { useState, useRef, useEffect } from 'react';

// Track listening state reliably across async callbacks
const useListeningRef = (value) => {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
};

export default function VoiceInput({ onTranscript, isListening, setIsListening, className = '', buttonClassName = '' }) {
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);
  const listeningRef = useListeningRef(isListening);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      // Keep the recognizer running until the user toggles it off
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setError('');
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        // Common errors: 'not-allowed', 'no-speech', 'audio-capture'
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone permission denied');
        } else if (event.error === 'no-speech') {
          setError('No speech detected');
        } else if (event.error === 'audio-capture') {
          setError('No microphone found');
        } else {
          setError(`Voice recognition error: ${event.error}`);
        }
        setIsListening(false);
        try { recognition.stop(); } catch (_) {}
      };
      
      recognition.onend = () => {
        if (listeningRef.current) {
          try { recognition.start(); } catch (_) {}
        }
      };
      
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onTranscript, setIsListening]);

  const toggleListening = () => {
    if (!isSupported) {
      setError('Voice recognition not supported in this browser');
      return;
    }

    if (isListening) {
      // Turn off and stop any ongoing recognition
      try { recognitionRef.current?.stop(); } catch (_) {}
      setIsListening(false);
    } else {
      setError('');
      try { recognitionRef.current?.start(); } catch (e) {
        setError('Could not access microphone');
        return;
      }
      setIsListening(true);
    }
  };

  if (!isSupported) {
    return null; // Don't render if not supported
  }

  return (
    <div className={`${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg transition-all duration-200 ${
          isListening
            ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-400/60'
            : 'bg-muted hover:bg-elevated text-muted-foreground hover:text-foreground'
        } ${buttonClassName}`}
        title={isListening ? 'Stop voice input' : 'Start voice input'}
      >
        {isListening ? (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      {/* Announce state changes for screen readers without impacting layout */}
      <span className="sr-only" aria-live="polite">
        {isListening ? 'Listening, click to stop.' : 'Voice input idle.'}
        {error ? ` Error: ${error}` : ''}
      </span>
    </div>
  );
}
