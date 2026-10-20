import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Smile, MoreVertical, Heart, ShieldAlert, Sparkles, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { DEMO_PROFILES } from '../data/profiles';
import ReportModal from '../components/ReportModal';

const QUICK_FLIRTS = [
  "Hey, how's your evening going? 😊",
  "Pretty good! What about you?",
  "You seem really interesting! ✨",
  "What are you up to tonight? ❤️",
  "Your smile caught my eye immediately 😍",
  "Tell me your idea of a perfect weekend getaway 🌊"
];

const EMOJI_LIST = ['😊', '❤️', '✨', '😍', '🔥', '😘', '😉', '🥰', '🥂', '🌹', '💬', '☕'];

export default function ChatPage() {
  const { personaId } = useParams();
  const navigate = useNavigate();
  const { visitorId, isAgeVerified } = useAuth();
  const { socket, sendMessage, playSoundAlert } = useSocket();

  const [persona, setPersona] = useState(() => {
    return DEMO_PROFILES.find(p => p.id === personaId) || null;
  });
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch initial profile & conversation history
  useEffect(() => {
    if (!personaId || !visitorId) return;

    fetch(`/api/conversations/${visitorId}/${personaId}`)
      .then(res => res.json())
      .then(data => {
        if (data.persona) setPersona(data.persona);
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch(() => {
        // Fallback: seed initial starter message from persona if completely empty
        const found = DEMO_PROFILES.find(p => p.id === personaId);
        if (found) {
          setPersona(found);
          setMessages([
            {
              id: 'starter_1',
              sender: 'owner',
              content: `Hey! Thanks for stopping by my profile 😊 How's your evening going?`,
              createdAt: new Date().toISOString()
            }
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, [personaId, visitorId]);

  // Socket listener for new messages in this conversation
  useEffect(() => {
    if (!socket || !personaId) return;

    // Join this specific conversation room
    socket.emit('visitor:join', { visitorId, personaId });

    const handleNewMessage = (msg) => {
      if (msg.personaId === personaId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        if (msg.sender === 'owner') {
          playSoundAlert();
        }
      }
    };

    const handleTypingStatus = (data) => {
      if (data.personaId === personaId) {
        setIsTyping(data.isTyping);
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('persona:typing_status', handleTypingStatus);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('persona:typing_status', handleTypingStatus);
    };
  }, [socket, personaId, visitorId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');
    setShowEmojiPicker(false);

    // Optimistically add to UI
    const tempMsg = {
      id: 'temp_' + Date.now(),
      conversationId: `${visitorId}_${personaId}`,
      visitorId,
      personaId,
      sender: 'visitor',
      content,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);

    // Send through Socket & Backend
    sendMessage(personaId, content);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleQuickSend = (text) => {
    setInputText(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleEmojiClick = (emoji) => {
    setInputText(prev => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  if (!persona && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0812] text-white">
        <div className="text-center space-y-3">
          <p className="text-slate-400">Profile not found.</p>
          <Link to="/" className="text-pink-400 hover:underline text-sm">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0812] text-white pb-16 md:pb-0">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#100C1D]/95 border-b border-purple-900/40 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-lg shadow-purple-950/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Persona Avatar & Details */}
          {persona && (
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-pink-500/30">
                <img
                  src={persona.avatar_url}
                  alt={persona.name}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#100C1D] ${
                    persona.is_online ? 'bg-emerald-400' : 'bg-slate-400'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-sm sm:text-base text-white">
                    {persona.name}, <span className="font-normal text-pink-300">{persona.age}</span>
                  </h1>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-medium hidden sm:inline">
                    Virtual Persona
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {persona.is_online ? (
                    <span className="text-emerald-400 font-medium">Online now</span>
                  ) : (
                    persona.last_seen || 'Offline'
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/5 transition-colors text-xs flex items-center gap-1.5"
            title="Report or Block"
          >
            <ShieldAlert className="w-4 h-4 text-slate-400 hover:text-rose-400" />
            <span className="hidden sm:inline">Report / Block</span>
          </button>
        </div>
      </header>

      {/* Transparent Chat Disclosure Ribbon */}
      <div className="bg-purple-950/40 border-b border-purple-900/30 px-4 py-1.5 text-[11px] text-purple-200/80 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
        <span>
          You are chatting with Secret Crush Operator on behalf of {persona?.name || 'this persona'}.
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl w-full mx-auto">
        {/* Persona intro card */}
        {persona && (
          <div className="text-center py-6 px-4 bg-white/5 border border-purple-900/30 rounded-3xl max-w-md mx-auto space-y-2 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden mx-auto border-2 border-pink-500/40 shadow-lg shadow-pink-500/20">
              <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-bold text-white text-base">
              {persona.name}, {persona.age}
            </h3>
            <p className="text-xs text-slate-400">{persona.location}</p>
            <p className="text-xs text-slate-300 italic">"{persona.tagline || persona.bio}"</p>
            <p className="text-[11px] text-pink-400 font-medium pt-1">
              Say hi and spark a conversation!
            </p>
          </div>
        )}

        {/* Message history */}
        {messages.map((msg, idx) => {
          const isMe = msg.sender === 'visitor';
          const time = msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

          return (
            <div
              key={msg.id || idx}
              className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {/* Persona Avatar on incoming */}
              {!isMe && persona && (
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-pink-500/30 mb-1">
                  <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[82%] sm:max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-md leading-relaxed ${
                  isMe
                    ? 'bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 text-white rounded-br-none shadow-pink-600/20'
                    : 'bg-[#181428] text-slate-100 border border-purple-900/40 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <div
                  className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                    isMe ? 'text-pink-200/80' : 'text-slate-400'
                  }`}
                >
                  <span>{time}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-pink-200" />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic py-1">
            <div className="flex gap-1 items-center px-3 py-1.5 rounded-full bg-[#181428] border border-purple-900/30">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px] text-pink-300">{persona?.name} is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Flirt Starters */}
      <div className="px-4 py-2 bg-[#0E0B19]/80 border-t border-purple-900/30 max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
          <span className="text-[11px] text-pink-400 font-medium shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quick Flirts:
          </span>
          {QUICK_FLIRTS.map((flirt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickSend(flirt)}
              className="shrink-0 px-3 py-1 rounded-full bg-white/5 hover:bg-pink-500/20 text-slate-300 hover:text-pink-300 border border-white/10 hover:border-pink-500/30 transition-all text-[11px]"
            >
              {flirt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar & Emoji Tray */}
      <div className="sticky bottom-0 bg-[#100C1D] border-t border-purple-900/50 p-3 sm:p-4 backdrop-blur-md">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Emoji Tray */}
          {showEmojiPicker && (
            <div className="p-2.5 rounded-2xl bg-[#1A152E] border border-pink-500/30 flex items-center gap-2 overflow-x-auto shadow-xl">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-lg transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* Emoji toggle */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`p-2.5 rounded-xl border transition-colors ${
                showEmojiPicker
                  ? 'bg-pink-500/20 border-pink-500 text-pink-400'
                  : 'bg-white/5 border-purple-900/40 text-slate-400 hover:text-pink-400'
              }`}
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${persona?.name || '...'}`}
              className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-purple-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-pink-600/30 transition-all flex items-center justify-center shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4 fill-white" />
            </button>
          </form>
        </div>
      </div>

      {/* Report & Block Modal */}
      {persona && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          profile={persona}
          onBlocked={() => navigate('/')}
        />
      )}
    </div>
  );
}
