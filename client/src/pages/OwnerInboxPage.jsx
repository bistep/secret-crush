import React, { useState, useEffect, useRef } from 'react';
import {
  Lock, MessageSquare, Send, Search, Users, CircleDot,
  Volume2, VolumeX, Shield, Sparkles, RefreshCw, LogOut,
  Clock, CheckCheck, Bot, ToggleLeft, ToggleRight, ArrowRight, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function OwnerInboxPage() {
  const { isOwnerLoggedIn, ownerToken, loginOwner, logoutOwner } = useAuth();
  const { socket, sendOwnerReply, playSoundAlert } = useSocket();

  // Auth form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboard state
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [activeConversationData, setActiveConversationData] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'unread', 'online'
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loadingConv, setLoadingConv] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const replyInputRef = useRef(null);
  const ownerFileInputRef = useRef(null);

  // Fetch all conversations for owner
  const fetchConversations = async () => {
    if (!ownerToken) return;
    try {
      const res = await fetch(`/api/owner/conversations?token=${encodeURIComponent(ownerToken)}`, {
        headers: { 'x-owner-token': ownerToken }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
        // If nothing selected, select first
        if (!selectedConvId && data.length > 0) {
          setSelectedConvId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch specific conversation details
  const fetchActiveConversation = async (convId) => {
    if (!convId || !ownerToken) return;
    setLoadingConv(true);
    try {
      const res = await fetch(`/api/owner/conversation/${encodeURIComponent(convId)}?token=${encodeURIComponent(ownerToken)}`, {
        headers: { 'x-owner-token': ownerToken }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveConversationData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConv(false);
    }
  };

  // Initial fetch on login
  useEffect(() => {
    if (isOwnerLoggedIn && ownerToken) {
      fetchConversations();
    }
  }, [isOwnerLoggedIn, ownerToken]);

  // When selected conversation changes
  useEffect(() => {
    if (selectedConvId) {
      fetchActiveConversation(selectedConvId);
      // Join conversation room
      if (socket) {
        const parts = selectedConvId.split('_');
        const visitorId = parts.slice(0, -1).join('_');
        const personaId = parts[parts.length - 1];
        socket.emit('conversation:join', { visitorId, personaId, role: 'owner' });
      }
    }
  }, [selectedConvId, socket]);

  // Real-time socket events for owner
  useEffect(() => {
    if (!socket || !isOwnerLoggedIn) return;

    const handleNewMessage = (payload) => {
      // Play audio chime
      if (soundEnabled) {
        playSoundAlert();
      }

      // Update conversations list
      fetchConversations();

      // If viewing this conversation, append to active
      if (selectedConvId && payload.message?.conversationId === selectedConvId) {
        setActiveConversationData((prev) => {
          if (!prev) return prev;
          if (prev.messages.some(m => m.id === payload.message.id)) return prev;
          return {
            ...prev,
            messages: [...prev.messages, payload.message]
          };
        });
      }
    };

    const handleReplySent = (payload) => {
      fetchConversations();
      if (selectedConvId && payload.message?.conversationId === selectedConvId) {
        setActiveConversationData((prev) => {
          if (!prev) return prev;
          if (prev.messages.some(m => m.id === payload.message.id)) return prev;
          return {
            ...prev,
            messages: [...prev.messages, payload.message]
          };
        });
      }
    };

    const handleVisitorStatus = () => {
      fetchConversations();
    };

    const handleVisitorTyping = (data) => {
      if (selectedConvId === data.convId) {
        setVisitorTyping(data.isTyping);
      }
    };

    socket.on('owner:new_message', handleNewMessage);
    socket.on('owner:reply_sent', handleReplySent);
    socket.on('visitor:status', handleVisitorStatus);
    socket.on('visitor:typing_status', handleVisitorTyping);

    return () => {
      socket.off('owner:new_message', handleNewMessage);
      socket.off('owner:reply_sent', handleReplySent);
      socket.off('visitor:status', handleVisitorStatus);
      socket.off('visitor:typing_status', handleVisitorTyping);
    };
  }, [socket, isOwnerLoggedIn, selectedConvId, soundEnabled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationData?.messages, visitorTyping]);

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await loginOwner(username, password);
    } catch (err) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  // Toggle Auto-Reply
  const toggleAutoReply = async () => {
    const updated = !autoReplyEnabled;
    setAutoReplyEnabled(updated);
    try {
      await fetch('/api/owner/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': ownerToken
        },
        body: JSON.stringify({ autoReplyEnabled: updated })
      });
    } catch (e) {}
  };

  // Send reply
  const handleSendReply = (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !activeConversationData) return;

    const { visitorId, personaId } = activeConversationData.conversation;
    const content = replyText.trim();
    setReplyText('');

    sendOwnerReply(visitorId, personaId, content, 'text');

    if (replyInputRef.current) {
      replyInputRef.current.focus();
    }
  };

  const handleOwnerImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationData) return;

    const { visitorId, personaId } = activeConversationData.conversation;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Image = event.target?.result;
      if (typeof base64Image === 'string') {
        sendOwnerReply(visitorId, personaId, base64Image, 'image');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleQuickReply = (text) => {
    setReplyText(text);
    if (replyInputRef.current) {
      replyInputRef.current.focus();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesVisitor = c.visitorId.toLowerCase().includes(q);
      const matchesPersona = c.personaName?.toLowerCase().includes(q);
      const matchesMsg = c.lastMessage?.toLowerCase().includes(q);
      if (!matchesVisitor && !matchesPersona && !matchesMsg) return false;
    }
    if (filterTab === 'unread' && (!c.unreadByOwner || c.unreadByOwner === 0)) return false;
    if (filterTab === 'online' && !c.visitorOnline) return false;
    return true;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadByOwner || 0), 0);
  const onlineCount = conversations.filter(c => c.visitorOnline).length;

  // --- RENDER LOGIN FORM IF NOT AUTHENTICATED ---
  if (!isOwnerLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#0A0812] text-white">
        <div className="relative w-full max-w-md bg-[#130F23] border border-purple-800/50 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-600 flex items-center justify-center mx-auto shadow-lg shadow-purple-600/30">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-white">Owner Central Inbox</h2>
            <p className="text-xs text-purple-300/80 mt-1">
              Secure operator portal to receive and reply to all visitor messages.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Operator Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-900/40 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Owner Passcode
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-purple-900/40 text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all"
            >
              {authLoading ? 'Verifying...' : 'Access Owner Inbox'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER OWNER DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#0A0812] text-white flex flex-col">
      {/* Top Owner Header Bar */}
      <header className="bg-[#120E22] border-b border-purple-900/40 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-md shadow-purple-600/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-white">Owner Central Inbox</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Hub
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              All incoming visitor chats delivered here in real time.
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div className="flex items-center gap-3 text-xs">
          {/* Online Visitors Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Online: <strong>{onlineCount}</strong></span>
          </div>

          {/* Unread Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300">
            <MessageSquare className="w-4 h-4 text-pink-400" />
            <span>Unread: <strong>{totalUnread}</strong></span>
          </div>

          {/* Sound alert toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                : 'bg-white/5 text-slate-500 border-white/10'
            }`}
            title={soundEnabled ? 'Sound alert enabled' : 'Sound alert muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Auto-reply toggle */}
          <button
            onClick={toggleAutoReply}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              autoReplyEnabled
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
            title="Toggle Smart Auto-Reply when away"
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Auto-Reply:</span>
            <strong>{autoReplyEnabled ? 'ON' : 'OFF'}</strong>
          </button>

          {/* Logout button */}
          <button
            onClick={logoutOwner}
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 transition-colors"
            title="Log out of Owner Inbox"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Two-Column Hub */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden max-w-[1600px] w-full mx-auto">
        
        {/* LEFT COLUMN: CONVERSATION LIST */}
        <div className={`w-full md:w-80 lg:w-96 bg-[#0E0B1A] border-r border-purple-900/40 flex flex-col ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-purple-900/30 space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitor ID or persona..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-purple-900/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl text-xs font-medium">
              {[
                { id: 'all', label: `All (${conversations.length})` },
                { id: 'unread', label: `Unread (${totalUnread})` },
                { id: 'online', label: `Online (${onlineCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition-all ${
                    filterTab === tab.id
                      ? 'bg-purple-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-purple-900/20">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = selectedConvId === conv.id;
                const time = conv.updatedAt
                  ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-950/60 border-l-4 border-pink-500'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Persona Avatar */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-pink-500/30 shrink-0">
                      <img
                        src={conv.personaAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'}
                        alt={conv.personaName}
                        className="w-full h-full object-cover"
                      />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0E0B1A] ${
                          conv.visitorOnline ? 'bg-emerald-400' : 'bg-slate-400'
                        }`}
                        title={conv.visitorOnline ? 'Visitor is online' : 'Visitor offline'}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-0.5">
                        <span className="text-xs font-bold text-pink-300 truncate">
                          To: {conv.personaName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{time}</span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300 font-mono truncate">
                          {conv.visitorId}
                        </span>
                        {conv.visitorOnline && (
                          <span className="text-[10px] text-emerald-400 font-medium">Online</span>
                        )}
                      </div>

                      <p className={`text-xs truncate ${conv.unreadByOwner > 0 ? 'text-white font-semibold' : 'text-slate-400'}`}>
                        {conv.lastSender === 'visitor' ? 'Visitor: ' : 'You: '}
                        {conv.lastMessage || 'Conversation started'}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {conv.unreadByOwner > 0 && (
                      <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0 animate-pulse">
                        {conv.unreadByOwner}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No conversations match current filter.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE CONVERSATION & REPLY WORKSPACE */}
        <div className={`flex-1 flex flex-col bg-[#0A0812] ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConversationData ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 bg-[#120E22] border-b border-purple-900/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mobile Back to List button */}
                  <button
                    onClick={() => setSelectedConvId(null)}
                    className="md:hidden p-2 rounded-xl bg-white/5 text-slate-300"
                  >
                    &larr;
                  </button>

                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-pink-500/40">
                    <img
                      src={activeConversationData.persona?.avatar_url}
                      alt={activeConversationData.persona?.name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#120E22] ${
                        activeConversationData.visitor?.is_online ? 'bg-emerald-400' : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-white text-sm sm:text-base">
                        Responding as: <span className="text-pink-300">{activeConversationData.persona?.name}</span>
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/20 font-medium">
                        Persona
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Visitor ID: <code className="text-pink-300 font-mono">{activeConversationData.conversation.visitorId}</code></span>
                      <span>&bull;</span>
                      <span className={activeConversationData.visitor?.is_online ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                        {activeConversationData.visitor?.is_online ? 'Visitor connected now' : 'Visitor offline'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {activeConversationData.messages.length} total messages
                  </span>
                </div>
              </div>

              {/* Message Thread Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
                {activeConversationData.messages.map((msg, i) => {
                  const isVisitor = msg.sender === 'visitor';
                  const time = msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <div
                      key={msg.id || i}
                      className={`flex flex-col ${isVisitor ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-semibold text-slate-400">
                          {isVisitor ? `Visitor (${activeConversationData.conversation.visitorId})` : `You as ${activeConversationData.persona?.name}`}
                        </span>
                        <span className="text-[10px] text-slate-500">{time}</span>
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isVisitor
                            ? 'bg-[#181429] text-white border border-purple-900/50 rounded-tl-none'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none shadow-md shadow-purple-600/20'
                        }`}
                      >
                        {msg.type === 'image' || (typeof msg.content === 'string' && msg.content.startsWith('data:image/')) ? (
                          <img
                            src={msg.content}
                            alt="Shared"
                            className="rounded-xl max-h-64 sm:max-h-72 w-full object-cover border border-white/10"
                          />
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Visitor Typing Indicator */}
                {visitorTyping && (
                  <div className="text-xs text-pink-300 italic flex items-center gap-2 py-1">
                    <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                    <span>Visitor is typing a message...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Starters */}
              <div className="px-4 py-2 bg-[#0E0A1A] border-t border-purple-900/30">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
                  <span className="text-[11px] text-purple-300 font-semibold shrink-0">Quick Replies:</span>
                  {[
                    "Hey! So good to hear from you 😊",
                    "Haha you have great energy! What are you doing tonight? ✨",
                    "You caught my attention for sure ❤️",
                    "Tell me something interesting about yourself!",
                    "That sounds lovely! Let's talk more 🥂"
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickReply(preset)}
                      className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 hover:bg-purple-600/20 text-slate-300 hover:text-purple-200 border border-white/10 text-[11px] transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Owner Reply Box */}
              <div className="p-3 sm:p-4 bg-[#120E22] border-t border-purple-900/40">
                <input
                  type="file"
                  ref={ownerFileInputRef}
                  onChange={handleOwnerImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => ownerFileInputRef.current?.click()}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-pink-500/20 border border-purple-900/40 text-slate-400 hover:text-pink-400 transition-colors"
                    title="Send image"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply as ${activeConversationData.persona?.name || 'Owner'} to visitor...`}
                    className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-purple-900/40 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-600/30 transition-all flex items-center gap-1.5"
                  >
                    <span>Send Reply</span>
                    <Send className="w-3.5 h-3.5 fill-white" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
              <div className="max-w-md space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-600/20 text-purple-400 mx-auto flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">Select a Conversation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Choose a visitor conversation from the left to view message history and reply in real time.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
