/**
 * Premium AI Chatbot Component — Gemini-Style
 * Deep indigo / electric-blue theme · glassmorphism · micro-interactions
 * Enhanced with Voice Input (Web Speech API)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import '../styles/Chatbot.css';

/* ── Inline SVG components ─────────────────────────────────── */

const AiLogoSvg = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="ai-logo-svg">
    <circle cx="20" cy="20" r="8" stroke="url(#spark)" strokeWidth="1.5" fill="none" />
    <path d="M20 8 L20 2 M20 32 L20 38 M8 20 L2 20 M32 20 L38 20" stroke="url(#spark)" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13 13 L9 9 M27 13 L31 9 M13 27 L9 31 M27 27 L31 31" stroke="url(#spark)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <circle cx="20" cy="20" r="3.5" fill="url(#spark)" />
    <defs>
      <linearGradient id="spark" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#818cf8" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  </svg>
);

const BotAvatarSvg = () => (
  <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="bot-avatar-svg">
    <circle cx="14" cy="14" r="5" stroke="url(#ba)" strokeWidth="1.2" fill="none"/>
    <path d="M14 6V3M14 22v3M6 14H3M22 14h3" stroke="url(#ba)" strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="14" cy="14" r="2" fill="url(#ba)"/>
    <defs>
      <linearGradient id="ba" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a78bfa"/><stop offset="1" stopColor="#22d3ee"/>
      </linearGradient>
    </defs>
  </svg>
);

const SendArrowSvg = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
    <path d="M3.5 10H16M16 10L10.5 4.5M16 10L10.5 15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MicSvg = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
    <path d="M10 2.5C8.067 2.5 6.5 4.067 6.5 6v6c0 1.933 1.567 3.5 3.5 3.5s3.5-1.567 3.5-3.5V6c0-1.933-1.567-3.5-3.5-3.5Z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M5.5 12c0 2.485 1.791 4.574 4.167 4.928V18.5M10 17.928c2.376-.354 4.167-2.443 4.167-4.928M5.5 12h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

/* ── Markdown Renderer ─────────────────────────────────────── */

const MarkdownRenderer = ({ content }) => {
  const renderMarkdown = (text) => {
    // Split by double newlines to create sections
    const sections = text.split(/\n\n+/);
    
    return sections.map((section, idx) => {
      const lines = section.split('\n');
      const elements = [];
      
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        
        // Handle bold headings: **text** or numbered headers like **1. text**
        if (line.match(/^\*\*(.*?)\*\*$/)) {
          const heading = line.replace(/\*\*/g, '');
          elements.push(
            <div key={`${idx}-${i}`} className="md-heading">
              {heading}
            </div>
          );
        }
        // Handle bullet points: - text
        else if (line.match(/^\s*-\s+/)) {
          const bulletText = line.replace(/^\s*-\s+/, '');
          elements.push(
            <div key={`${idx}-${i}`} className="md-bullet">
              {renderInlineMarkdown(bulletText)}
            </div>
          );
        }
        // Handle numbered lists: 1. text, 2. text, etc.
        else if (line.match(/^\s*\d+\.\s+/)) {
          const numText = line.replace(/^\s*\d+\.\s+/, '');
          const match = line.match(/^(\s*\d+\.)/);
          const number = match ? match[1].trim() : '';
          elements.push(
            <div key={`${idx}-${i}`} className="md-numbered">
              <span className="md-number">{number}</span>
              {renderInlineMarkdown(numText)}
            </div>
          );
        }
        // Handle regular paragraphs
        else if (line.trim()) {
          elements.push(
            <p key={`${idx}-${i}`} className="md-paragraph">
              {renderInlineMarkdown(line)}
            </p>
          );
        }
        
        i++;
      }
      
      return (
        <div key={`section-${idx}`} className="md-section">
          {elements}
        </div>
      );
    });
  };
  
  const renderInlineMarkdown = (text) => {
    const parts = [];
    let lastIndex = 0;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before bold
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add bold text
      parts.push(
        <strong key={`bold-${match.index}`}>{match[1]}</strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length ? parts : text;
  };
  
  return <>{renderMarkdown(content)}</>;
};

/* ── Component ─────────────────────────────────────────────── */

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI scholarship assistant. Ask me about scholarships, exams, career guidance, or anything related to your education.",
      timestamp: new Date(),
      status: 'success'
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sendRipple, setSendRipple] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speakEnabled, setSpeakEnabled] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const speechSynthesisRef = useRef(window.speechSynthesis || null);

  /* ── Effects ──────────────────────────────────────────────── */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => { loadSuggestions(); }, []);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setMicSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            setInputValue(prev => (prev + ' ' + transcript).trim());
          } else {
            interim += transcript;
          }
        }
        if (interim) setTranscript(interim);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setError(`Voice error: ${event.error}`);
      };

      recognitionRef.current = recognition;
    } else {
      setMicSupported(false);
    }

    // Check if speech synthesis is available
    if (speechSynthesisRef.current) {
      setSpeakEnabled(true);
    }
  }, []);

  /* ── Helpers ─────────────────────────────────────────────── */

  const loadSuggestions = async () => {
    const fallback = [
      { id: 1, title: '🎓 Scholarship Help', message: 'What scholarships are available for me?' },
      { id: 2, title: '📚 Exam Prep', message: 'How do I prepare for competitive exams?' },
      { id: 3, title: '🚀 Career Path', message: 'What career options should I explore?' },
      { id: 4, title: '🏫 Top Colleges', message: 'What are the top colleges in India?' },
      { id: 5, title: '💡 Study Tips', message: 'Give me effective study tips for board exams.' }
    ];
    try {
      const res = await apiService.getChatbotSuggestions();
      setSuggestions(res?.success && res.suggestions?.length ? res.suggestions : fallback);
    } catch { setSuggestions(fallback); }
  };

  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Handle voice input toggle
  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
    } else {
      try {
        recognitionRef.current.start();
        setTranscript('');
        setError('');
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  }, [isListening]);

  // Text-to-speech for bot messages
  const speakMessage = useCallback((text) => {
    if (!speechSynthesisRef.current) return;
    
    try {
      speechSynthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      speechSynthesisRef.current.speak(utterance);
    } catch (err) {
      console.error('Error speaking:', err);
    }
  }, []);

  /* ── Send message ────────────────────────────────────────── */

  const sendMessage = useCallback(async (content = inputValue) => {
    if (!content.trim() || isLoading) return;
    if (!isOnline) { setError('You appear to be offline.'); return; }

    setError('');
    const userMsg = { id: Date.now(), type: 'user', content, timestamp: new Date(), status: 'success' };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setTranscript('');
    setIsLoading(true);

    // Ripple animation
    setSendRipple(true);
    setTimeout(() => setSendRipple(false), 500);

    try {
      const history = messages
        .filter(m => m.status !== 'error')
        .map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.content }));
      history.push({ role: 'user', content });

      const res = await apiService.sendChatMessage({ message: content, conversation_history: history });

      if (res.success) {
        const botMessage = res.message;
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: botMessage, timestamp: new Date(), status: 'success' }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: res.message || 'Something went wrong. Please try again.', timestamp: new Date(), status: 'error' }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, type: 'bot',
        content: isOnline ? 'Connection error — please try again.' : 'You are offline.',
        timestamp: new Date(), status: 'error'
      }]);
      setError('Failed to get a response.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isLoading, isOnline, messages, speakEnabled, speakMessage]);

  const handleRetry = useCallback((id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    const last = messages.filter(m => m.type === 'user').slice(-1)[0];
    if (last) sendMessage(last.content);
  }, [messages, sendMessage]);

  const handleSuggestionClick = (s) => sendMessage(s.message || s.title);

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="cb-container">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="cb-header">
        <div className="cb-header-left">
          <div className="ai-logo-ring">
            <AiLogoSvg />
          </div>
          <div className="cb-header-text">
            <h2>EduAssist AI</h2>
            <p>Scholarships · Exams · Career Guidance</p>
          </div>
        </div>
        <div className={`cb-status ${isOnline ? 'online' : 'offline'}`}>
          <span className="cb-status-dot" />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </header>

      {/* ── Messages ───────────────────────────────────────── */}
      <div className="cb-messages" ref={messagesContainerRef}>

        {/* Welcome suggestions */}
        {messages.length === 1 && suggestions.length > 0 && !isLoading && (
          <div className="cb-welcome">
            <p className="cb-welcome-label">Try asking about&hellip;</p>
            <div className="cb-chips-grid">
              {suggestions.slice(0, 4).map(s => (
                <button key={s.id} className="cb-chip" onClick={() => handleSuggestionClick(s)} disabled={isLoading}>
                  <span className="cb-chip-text">{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map(msg => (
          <div key={msg.id} className={`cb-msg cb-msg--${msg.type}`}>
            {msg.type === 'bot' && (
              <div className="cb-msg-avatar cb-msg-avatar--bot"><BotAvatarSvg /></div>
            )}
            <div className="cb-msg-body">
              <div className={`cb-bubble cb-bubble--${msg.type} ${msg.status === 'error' ? 'cb-bubble--error' : ''}`}>
                {msg.type === 'bot' ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
              {msg.status === 'error' && (
                <button className="cb-retry" onClick={() => handleRetry(msg.id)} disabled={isLoading}>
                  ↻ Retry
                </button>
              )}
              <span className="cb-time">{formatTime(msg.timestamp)}</span>
            </div>
            {msg.type === 'user' && (
              <div className="cb-msg-avatar cb-msg-avatar--user">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5Zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5Z" fill="white"/></svg>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="cb-msg cb-msg--bot">
            <div className="cb-msg-avatar cb-msg-avatar--bot"><BotAvatarSvg /></div>
            <div className="cb-msg-body">
              <div className="cb-bubble cb-bubble--bot cb-bubble--typing">
                <span className="cb-dot" /><span className="cb-dot" /><span className="cb-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Inline suggestions ─────────────────────────────── */}
      {messages.length > 1 && suggestions.length > 0 && !isLoading && (
        <div className="cb-suggestions-bar">
          <div className="cb-suggestions-scroll">
            {suggestions.slice(0, 5).map(s => (
              <button key={s.id} className="cb-pill" onClick={() => handleSuggestionClick(s)} disabled={isLoading}>
                {s.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Voice input indicator ───────────────────────────── */}
      {isListening && (
        <div className="cb-voice-indicator">
          <span className="cb-voice-pulse"></span>
          <span className="cb-voice-text">
            {transcript ? transcript : 'Listening...'}
          </span>
          <span className="cb-voice-pulse"></span>
        </div>
      )}

      {/* ── Error banner ───────────────────────────────────── */}
      {error && <div className="cb-error">{error}</div>}

      {/* ── Input area ─────────────────────────────────────── */}
      <div className="cb-input-area">
        <form className="cb-form" onSubmit={e => { e.preventDefault(); sendMessage(); }}>
          <div className="cb-input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="cb-input"
              placeholder="Ask anything about scholarships, exams, careers… or use voice!"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              disabled={isLoading || !isOnline}
              maxLength={500}
              autoComplete="off"
            />
            <span className="cb-charcount">{inputValue.length}/500</span>
          </div>

          <div className="cb-input-actions">
            {/* Mic button */}
            {micSupported && (
              <button
                type="button"
                className={`cb-mic ${isListening ? 'cb-mic--active' : ''}`}
                onClick={toggleVoiceInput}
                disabled={isLoading || !isOnline}
                title={isListening ? 'Stop listening' : 'Start voice input'}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              >
                <MicSvg />
              </button>
            )}

            {/* Send button */}
            <button
              type="submit"
              className={`cb-send ${sendRipple ? 'cb-send--ripple' : ''}`}
              disabled={isLoading || !inputValue.trim() || !isOnline}
              title={!isOnline ? 'Offline' : 'Send'}
            >
              {isLoading ? <span className="cb-spinner" /> : <SendArrowSvg />}
            </button>
          </div>
        </form>

        {/* Voice not supported message */}
        {!micSupported && (
          <p className="cb-voice-info">💡 Voice input not supported in your browser</p>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
