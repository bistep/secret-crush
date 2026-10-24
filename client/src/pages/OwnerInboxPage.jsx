import React, { useState, useEffect, useRef } from 'react';
import {
  Lock, MessageSquare, Send, Search, Users, CircleDot,
  Volume2, VolumeX, Shield, Sparkles, RefreshCw, LogOut,
  Clock, CheckCheck, Bot, ToggleLeft, ToggleRight, ArrowRight,
  Image as ImageIcon, Download, Trash2, UserCheck, ChevronDown, Video, AlertCircle, X,
  Sliders, Plus, Check, Edit3
} from 'lucide-react';
import { DEMO_PROFILES } from '../data/profiles';
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

  // Auto-Reply Settings & Custom Replies Manager
  const [showAutoReplyModal, setShowAutoReplyModal] = useState(false);
  const [autoReplyDelaySec, setAutoReplyDelaySec] = useState(6);
  const [replies, setReplies] = useState(() => {
    try {
      const stored = localStorage.getItem('sc_fixed_custom_replies');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 6) return parsed;
      }
    } catch {}
    return [
      { id: 'reply-1', text: 'Hlo', sequence: 1, enabled: true },
      { id: 'reply-2', text: 'Edo njan sex chat aan nokkunne thanikk thalpparyam undo.', sequence: 2, enabled: true },
      { id: 'reply-3', text: 'sadhanathintte pic onnu ayakkuo', sequence: 3, enabled: true },
      { id: 'reply-4', text: 'Face kaanikkalle block aavum', sequence: 4, enabled: true },
      { id: 'reply-5', text: 'Nalla mood aavunnu undo?', sequence: 5, enabled: true },
      { id: 'reply-6', text: 'Wait cheyy njan ipo thirichu varam', sequence: 6, enabled: true }
    ];
  });
  const [replyInputText, setReplyInputText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [validationError, setValidationError] = useState('');
  const [customRules, setCustomRules] = useState([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Switch persona state ("Chat via somebody")
  const [customReplyAsId, setCustomReplyAsId] = useState('');
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const [personaSearch, setPersonaSearch] = useState('');
  const [unlockAlerts, setUnlockAlerts] = useState([]);

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

  // Fetch custom auto-replies
  const fetchReplies = async () => {
    if (!ownerToken) return;
    try {
      const res = await fetch(`/api/owner/replies?token=${encodeURIComponent(ownerToken)}`, {
        headers: { 'x-owner-token': ownerToken }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.autoReplyEnabled !== undefined) setAutoReplyEnabled(data.autoReplyEnabled);
        if (Array.isArray(data.replies) && data.replies.length > 0) {
          setReplies(data.replies);
          try {
            localStorage.setItem('sc_fixed_custom_replies', JSON.stringify(data.replies));
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Initial fetch on login
  useEffect(() => {
    if (isOwnerLoggedIn && ownerToken) {
      fetchConversations();
      fetchReplies();
      // Fetch settings & custom auto-reply rules
      fetch(`/api/owner/settings?token=${encodeURIComponent(ownerToken)}`, {
        headers: { 'x-owner-token': ownerToken }
      })
        .then(res => res.json())
        .then(data => {
          if (data.autoReplyEnabled !== undefined) setAutoReplyEnabled(data.autoReplyEnabled);
          if (data.autoReplyDelaySec !== undefined) setAutoReplyDelaySec(data.autoReplyDelaySec);
          if (Array.isArray(data.customAutoReplies)) setCustomRules(data.customAutoReplies);
          if (Array.isArray(data.replies)) setReplies(data.replies); try { localStorage.setItem("sc_fixed_custom_replies", JSON.stringify(data.replies)); } catch {}
        })
        .catch(() => {});
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

    const handleVisitorPhone = () => {
      fetchConversations();
      if (selectedConvId) {
        fetchActiveConversation(selectedConvId);
      }
    };

    const handleUnlockClicked = (data) => {
      if (soundEnabled) playSoundAlert();
      setUnlockAlerts(prev => [data, ...prev.slice(0, 9)]);
    };

    const handleMessageDeleted = ({ messageId }) => {
      setActiveConversationData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter(m => m.id !== messageId)
        };
      });
    };

    socket.on('owner:new_message', handleNewMessage);
    socket.on('owner:reply_sent', handleReplySent);
    socket.on('visitor:status', handleVisitorStatus);
    socket.on('visitor:typing_status', handleVisitorTyping);
    socket.on('visitor:phone_updated', handleVisitorPhone);
    socket.on('visitor:unlock_clicked', handleUnlockClicked);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      socket.off('owner:new_message', handleNewMessage);
      socket.off('owner:reply_sent', handleReplySent);
      socket.off('visitor:status', handleVisitorStatus);
      socket.off('visitor:typing_status', handleVisitorTyping);
      socket.off('visitor:phone_updated', handleVisitorPhone);
      socket.off('visitor:unlock_clicked', handleUnlockClicked);
      socket.off('message:deleted', handleMessageDeleted);
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

  // Save full auto-reply settings & custom rules
  const handleSaveAutoReplySettings = async () => {
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      await fetch('/api/owner/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': ownerToken
        },
        body: JSON.stringify({
          autoReplyEnabled,
          autoReplyDelaySec: Number(autoReplyDelaySec) || 6,
          replies,
          customAutoReplies: customRules
        })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Add or Edit Reply in the Auto-Reply Customizer
  const handleAddOrEditReply = async (e) => {
    if (e) e.preventDefault();
    setValidationError('');
    const text = replyInputText.trim();
    if (!text) {
      setValidationError('Reply text cannot be empty.');
      return;
    }

    if (editingReplyId) {
      // Edit existing reply
      try {
        const res = await fetch(`/api/owner/replies/${encodeURIComponent(editingReplyId)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-owner-token': ownerToken
          },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (res.ok) {
          setReplies(data.replies); try { localStorage.setItem("sc_fixed_custom_replies", JSON.stringify(data.replies)); } catch {}
          setReplyInputText('');
          setEditingReplyId(null);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        } else {
          setValidationError(data.error || 'Failed to update reply');
        }
      } catch (err) {
        setValidationError('Failed to update reply');
      }
    } else {
      // Add new reply
      if (replies.length >= 10) {
        setValidationError('Maximum 10 replies allowed');
        return;
      }

      try {
        const res = await fetch('/api/owner/replies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-owner-token': ownerToken
          },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (res.ok) {
          setReplies(data.replies); try { localStorage.setItem("sc_fixed_custom_replies", JSON.stringify(data.replies)); } catch {}
          setReplyInputText('');
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2500);
        } else {
          setValidationError(data.error || 'Failed to add reply');
        }
      } catch (err) {
        setValidationError('Failed to add reply');
      }
    }
  };

  const handleStartEdit = (reply) => {
    setEditingReplyId(reply.id);
    setReplyInputText(reply.text);
    setValidationError('');
  };

  const handleCancelEdit = () => {
    setEditingReplyId(null);
    setReplyInputText('');
    setValidationError('');
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Delete this auto-reply message?')) {
      return;
    }
    setValidationError('');
    try {
      const res = await fetch(`/api/owner/replies/${encodeURIComponent(replyId)}`, {
        method: 'DELETE',
        headers: { 'x-owner-token': ownerToken }
      });
      const data = await res.json();
      if (res.ok) {
        setReplies(data.replies); try { localStorage.setItem("sc_fixed_custom_replies", JSON.stringify(data.replies)); } catch {}
        if (editingReplyId === replyId) {
          handleCancelEdit();
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        setValidationError(data.error || 'Failed to delete reply');
      }
    } catch (err) {
      setValidationError('Failed to delete reply');
    }
  };

  const handleAddRule = () => {
    setCustomRules(prev => [
      ...prev,
      { id: Date.now().toString(), trigger: '', response: '' }
    ]);
  };

  const handleUpdateRule = (id, field, value) => {
    setCustomRules(prev =>
      prev.map(r => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleDeleteRule = (id) => {
    setCustomRules(prev => prev.filter(r => r.id !== id));
  };

  // Download media file to laptop
  const handleDownloadMedia = async (mediaUrl, filename) => {
    try {
      if (mediaUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = mediaUrl;
        a.download = filename || `media_${Date.now()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const res = await fetch(mediaUrl);
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename || `media_${Date.now()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (e) {
      window.open(mediaUrl, '_blank');
    }
  };

  // Delete media or message
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this photo or message from the chat?')) return;
    try {
      await fetch(`/api/messages/${msgId}`, {
        method: 'DELETE',
        headers: { 'x-owner-token': ownerToken }
      });
      setActiveConversationData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter(m => m.id !== msgId)
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Send reply (supports replying as chosen persona)
  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !activeConversationData) return;

    const { visitorId, personaId, id: convId } = activeConversationData.conversation;
    const content = replyText.trim();
    const personaToUse = customReplyAsId || personaId;
    setReplyText('');

    try {
      await fetch('/api/owner/reply-as', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-token': ownerToken
        },
        body: JSON.stringify({
          conversationId: convId,
          asPersonaId: personaToUse,
          content,
          type: 'text'
        })
      });
      fetchActiveConversation(convId);
    } catch (err) {
      sendOwnerReply(visitorId, personaToUse, content, 'text');
    }

    if (replyInputRef.current) {
      replyInputRef.current.focus();
    }
  };

  // Handle Photo & Video Upload from Owner
  const handleOwnerImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationData) return;

    const { visitorId, personaId, id: convId } = activeConversationData.conversation;
    const personaToUse = customReplyAsId || personaId;
    const isVideo = file.type.startsWith('video/');
    const fileType = isVideo ? 'video' : 'image';

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result;
      if (typeof base64Data === 'string') {
        try {
          await fetch('/api/owner/reply-as', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-owner-token': ownerToken
            },
            body: JSON.stringify({
              conversationId: convId,
              asPersonaId: personaToUse,
              content: base64Data,
              type: fileType
            })
          });
          fetchActiveConversation(convId);
        } catch (err) {
          sendOwnerReply(visitorId, personaToUse, base64Data, fileType);
        }
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
    if (filterTab === 'offline' && (!c.offlineUnreadCount || c.offlineUnreadCount === 0)) return false;
    if (filterTab === 'online' && !c.visitorOnline) return false;
    return true;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadByOwner || 0), 0);
  const totalOfflineMissed = conversations.reduce((acc, c) => acc + (c.offlineUnreadCount || 0), 0);
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

          {/* Offline Missed Counter */}
          {totalOfflineMissed > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 animate-pulse" title="Messages received while admin was logged out">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Offline Missed: <strong>{totalOfflineMissed}</strong></span>
            </div>
          )}

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

          {/* Customize Replies Button */}
          <button
            onClick={() => {
              setValidationError('');
              setShowAutoReplyModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/50 text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
            title="Open Customize Auto-Replies manager"
          >
            <Sliders className="w-3.5 h-3.5 text-pink-200" />
            <span>Customize Replies</span>
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
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl text-[11px] font-medium">
              {[
                { id: 'all', label: `All (${conversations.length})` },
                { id: 'unread', label: `Unread (${totalUnread})` },
                { id: 'offline', label: `📬 Offline (${totalOfflineMissed})` },
                { id: 'online', label: `Online (${onlineCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id)}
                  className={`flex-1 py-1 px-1 rounded-lg text-center transition-all ${
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

          {/* Offline Messages Stored Banner */}
          {totalOfflineMissed > 0 && (
            <div className="p-3 bg-gradient-to-r from-amber-950/60 via-purple-950/60 to-pink-950/60 border-b border-amber-500/30 text-amber-200 text-xs flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2">
                <span className="text-base">📬</span>
                <span>
                  <strong>{totalOfflineMissed} message{totalOfflineMissed > 1 ? 's' : ''}</strong> received while admin was off. Saved safely!
                </span>
              </div>
            </div>
          )}

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

                      {conv.visitorPhone && (
                        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 w-fit mb-1">
                          <span>📱 +91 {conv.visitorPhone}</span>
                        </div>
                      )}

                      <p className={`text-xs truncate ${conv.unreadByOwner > 0 ? 'text-white font-semibold' : 'text-slate-400'}`}>
                        {conv.lastSender === 'visitor' ? 'Visitor: ' : 'You: '}
                        {conv.lastMessage || 'Conversation started'}
                      </p>
                    </div>

                    {/* Unread & Offline badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {conv.unreadByOwner > 0 && (
                        <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[11px] font-bold flex items-center justify-center animate-pulse">
                          {conv.unreadByOwner}
                        </span>
                      )}
                      {conv.offlineUnreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 whitespace-nowrap">
                          📬 Offline
                        </span>
                      )}
                    </div>
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
                    {(activeConversationData.conversation.visitorPhone || activeConversationData.visitor?.phone) && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold w-fit mt-1.5">
                        <span>📱 Mobile: +91 {activeConversationData.conversation.visitorPhone || activeConversationData.visitor?.phone}</span>
                      </div>
                    )}
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
                        {msg.receivedWhileAdminOffline && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1">
                            <span>📬</span>
                            <span>Received while you were offline</span>
                          </span>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] sm:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isVisitor
                            ? 'bg-[#181429] text-white border border-purple-900/50 rounded-tl-none'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-tr-none shadow-md shadow-purple-600/20'
                        }`}
                      >
                        {msg.type === 'video' || (typeof msg.content === 'string' && msg.content.startsWith('data:video/')) ? (
                          <div className="space-y-2">
                            <video
                              src={msg.content}
                              controls
                              className="rounded-xl max-h-64 sm:max-h-72 w-full object-contain bg-black/50 border border-white/10"
                            />
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleDownloadMedia(msg.content, `visitor_video_${Date.now()}.mp4`)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow"
                              >
                                <Download className="w-3 h-3" />
                                <span>Save Video</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 shadow"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        ) : msg.type === 'image' || (typeof msg.content === 'string' && msg.content.startsWith('data:image/')) ? (
                          <div className="space-y-2">
                            <img
                              src={msg.content}
                              alt="Shared"
                              className="rounded-xl max-h-64 sm:max-h-72 w-full object-cover border border-white/10"
                            />
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleDownloadMedia(msg.content, `visitor_photo_${Date.now()}.jpg`)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow"
                              >
                                <Download className="w-3 h-3" />
                                <span>Save Photo</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 shadow"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
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

              {/* Bottom Auto Reply Customization Bar (Replaces Quick Replies) */}
              <div className="px-4 py-2.5 bg-gradient-to-r from-purple-950/60 via-[#130E24] to-pink-950/40 border-t border-purple-500/40 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600/25 border border-purple-500/40 text-purple-200 font-bold text-xs">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span>Auto-Reply:</span>
                    <strong className={autoReplyEnabled ? 'text-emerald-400' : 'text-slate-400'}>
                      {autoReplyEnabled ? 'ON' : 'OFF'}
                    </strong>
                  </div>
                  <span className="text-[11px] text-slate-300 font-semibold">
                    ({replies.length}/10 configured)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setValidationError('');
                    setShowAutoReplyModal(true);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Configure and customize auto-reply sequential messages"
                >
                  <Sliders className="w-3.5 h-3.5 text-pink-200" />
                  <span>Auto Reply Customization</span>
                </button>
              </div>

              {/* Persona Selector Bar (Chat via Somebody) */}
              <div className="px-4 py-2 bg-[#100C1E] border-t border-purple-900/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Replying as:</span>
                  <div className="flex items-center gap-1.5 font-bold text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-lg border border-pink-500/20">
                    <UserCheck className="w-3.5 h-3.5 text-pink-400" />
                    <span>
                      {customReplyAsId ? (DEMO_PROFILES.find(p => p.id === customReplyAsId)?.name || customReplyAsId) : activeConversationData.persona?.name}
                    </span>
                  </div>
                  {customReplyAsId && (
                    <button
                      type="button"
                      onClick={() => setCustomReplyAsId('')}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      (Reset)
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowPersonaPicker(true)}
                  className="px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 font-semibold flex items-center gap-1 transition-all text-[11px]"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Chat via somebody ▾</span>
                </button>
              </div>

              {/* Owner Reply Box */}
              <div className="p-3 sm:p-4 bg-[#120E22] border-t border-purple-900/40">
                <input
                  type="file"
                  ref={ownerFileInputRef}
                  onChange={handleOwnerImageUpload}
                  accept="image/*,video/*"
                  className="hidden"
                />
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => ownerFileInputRef.current?.click()}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-pink-500/20 border border-purple-900/40 text-slate-400 hover:text-pink-400 transition-colors"
                    title="Send photo or video"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    ref={replyInputRef}
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply as ${customReplyAsId ? (DEMO_PROFILES.find(p => p.id === customReplyAsId)?.name || customReplyAsId) : (activeConversationData.persona?.name || 'Owner')} to visitor...`}
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
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0A0812]">
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Header banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/40 via-[#16102B] to-pink-900/30 border border-purple-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 shrink-0">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Automated Chat Engine
                        </span>
                      </div>
                      <h2 className="text-xl font-extrabold text-white mt-1">
                        Customize Auto-Reply Chat
                      </h2>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Set custom auto-replies, typing delay, and keyword rules when visitors message.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    type="button"
                    onClick={toggleAutoReply}
                    className={`px-4 py-2.5 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-all shadow-md shrink-0 ${
                      autoReplyEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${autoReplyEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>Auto-Reply: <strong>{autoReplyEnabled ? 'ON' : 'OFF'}</strong></span>
                  </button>
                </div>

                {/* Global Settings */}
                <div className="p-5 rounded-2xl bg-[#130E24] border border-purple-900/40 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4" />
                    <span>General Auto-Reply Settings</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Typing Delay (Seconds)
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="30"
                        value={autoReplyDelaySec}
                        onChange={(e) => setAutoReplyDelaySec(e.target.value)}
                        className="w-full py-2.5 px-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Wait time with live typing animation before auto-reply sends
                      </span>
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1">
                        <span className="font-semibold text-pink-300">💡 How it works:</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          When a visitor sends a message while you are away, the bot shows a realistic typing indicator for {autoReplyDelaySec} seconds and replies automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customize Auto-Replies Section */}
                <div className="p-5 rounded-2xl bg-[#130E24] border border-purple-900/40 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Customize Auto-Replies ({replies.length} / 10 Configured)</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Messages are delivered in sequence to each client: 1st message to 1st visitor chat, 2nd to 2nd, etc.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-purple-600/25 border border-purple-500/40 text-purple-200 font-bold text-xs">
                      {replies.length} / 10
                    </span>
                  </div>

                  {validationError && (
                    <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span className="font-semibold">{validationError}</span>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    {replies.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs rounded-xl bg-black/20 border border-dashed border-white/10">
                        No custom auto-reply messages configured yet. Add your first reply below.
                      </div>
                    ) : (
                      replies.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#19142D] border border-purple-900/50 hover:border-purple-600/40 transition-colors shadow-sm"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="shrink-0 px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold text-xs">
                              #{idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                                {idx === 0 ? '1st Reply' : idx === 1 ? '2nd Reply' : idx === 2 ? '3rd Reply' : `#${idx + 1} Reply`}
                              </span>
                              <p className="text-sm text-white leading-relaxed break-words whitespace-pre-wrap">
                                {item.text}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Edit this reply"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReply(item.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Delete this reply"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add / Edit Form */}
                  <form onSubmit={handleAddOrEditReply} className="p-4 rounded-2xl bg-[#19142D] border border-purple-500/40 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-purple-200 flex items-center gap-1.5">
                        {editingReplyId ? (
                          <>
                            <Edit3 className="w-3.5 h-3.5 text-pink-400" />
                            <span>Edit Auto-Reply Message</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-pink-400" />
                            <span>Add New Auto-Reply (Reply #{replies.length + 1})</span>
                          </>
                        )}
                      </label>
                      {editingReplyId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <textarea
                      rows="2"
                      value={replyInputText}
                      onChange={(e) => {
                        setReplyInputText(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      placeholder="Type auto-reply message here..."
                      className="w-full py-2.5 px-3.5 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none leading-relaxed"
                    />

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-400">
                        {editingReplyId
                          ? 'Editing message text.'
                          : `${10 - replies.length} slot(s) remaining (max 10).`}
                      </span>

                      <button
                        type="submit"
                        disabled={!replyInputText.trim() || (!editingReplyId && replies.length >= 10)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                      >
                        <span>{editingReplyId ? 'Save Changes' : 'Send / Add Reply'}</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>

                {/* Rules Manager */}
                <div className="p-5 rounded-2xl bg-[#130E24] border border-purple-900/40 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>Custom Auto-Reply Rules ({customRules.length})</span>
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Add keyword triggers and custom messages to reply with
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddRule}
                      className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Rule</span>
                    </button>
                  </div>

                  {customRules.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs rounded-xl bg-black/20 border border-dashed border-white/10">
                      No custom rules added yet. Click &quot;Add New Rule&quot; to configure your first auto-reply.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customRules.map((rule, idx) => (
                        <div
                          key={rule.id || idx}
                          className="p-4 rounded-2xl bg-[#19142D] border border-purple-900/50 space-y-3 shadow-sm hover:border-purple-600/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1">
                              <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                                If visitor message contains (keyword or <span className="text-pink-400">*</span> for any message):
                              </label>
                              <input
                                type="text"
                                value={rule.trigger}
                                onChange={(e) => handleUpdateRule(rule.id, 'trigger', e.target.value)}
                                placeholder="e.g. hi, hello, or *"
                                className="w-full py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteRule(rule.id)}
                              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 transition-colors self-end"
                              title="Delete rule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <label className="text-[11px] uppercase font-bold text-slate-400 block mb-1">
                              Auto-Reply Response Message:
                            </label>
                            <textarea
                              rows="2"
                              value={rule.response}
                              onChange={(e) => handleUpdateRule(rule.id, 'response', e.target.value)}
                              placeholder="Type the message to send automatically..."
                              className="w-full py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Save Settings Button */}
                  <div className="pt-2 flex items-center justify-between">
                    {saveSuccess ? (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 animate-bounce">
                        <Check className="w-4 h-4" />
                        <span>Settings saved to live server!</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Changes take effect immediately on your server.
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveAutoReplySettings}
                      disabled={savingSettings}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:opacity-95 text-white text-xs font-extrabold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{savingSettings ? 'Saving...' : 'Save Auto-Reply Settings'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Switch Persona Modal ("Chat via somebody") */}
      {showPersonaPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#140F24] border border-purple-600/40 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold text-white">
                  Chat via Somebody (Switch Persona)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPersonaPicker(false)}
                className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2 mb-3">
              Select any profile from the 100+ personas to send your next reply as that person:
            </p>

            {/* Persona Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={personaSearch}
                onChange={(e) => setPersonaSearch(e.target.value)}
                placeholder="Search persona by name or place (e.g. Arjun, Meera, Palakkad)..."
                className="w-full pl-9 pr-4 py-2 bg-black/40 border border-purple-900/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Persona Grid / List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {DEMO_PROFILES.filter(p => {
                if (!personaSearch.trim()) return true;
                const q = personaSearch.toLowerCase();
                return p.name.toLowerCase().includes(q) || (p.place || '').toLowerCase().includes(q) || p.handle.toLowerCase().includes(q);
              }).map((p) => {
                const isSelected = customReplyAsId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setCustomReplyAsId(p.id);
                      setShowPersonaPicker(false);
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-pink-600/25 border-pink-500'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-purple-950/40 p-1 shrink-0 border border-white/10">
                        <img src={p.avatar_url} alt={p.name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white">{p.name}, {p.age}</span>
                          <span className="text-[10px] text-pink-300 font-mono">{p.handle}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">📍 {p.place} • {p.gender}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-bold"
                    >
                      Select
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Customize Auto-Replies Modal */}
      {showAutoReplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[92vh] bg-[#130E22] border border-purple-500/50 rounded-3xl p-6 shadow-2xl flex flex-col text-white">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-purple-900/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Customize Auto-Replies</h3>
                  <p className="text-[11px] text-slate-400">Configure sequential automated messages sent to incoming visitors</p>
                </div>
              </div>
              <button
                onClick={() => {
                  handleCancelEdit();
                  setShowAutoReplyModal(false);
                }}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Scroll */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Status and Active Counter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300 font-semibold">Auto-Reply Status:</span>
                  <button
                    type="button"
                    onClick={toggleAutoReply}
                    className={`py-1.5 px-3 rounded-xl border flex items-center gap-1.5 font-bold text-xs transition-all ${
                      autoReplyEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${autoReplyEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>{autoReplyEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-3 py-1 rounded-xl bg-purple-600/25 border border-purple-500/40 text-purple-200 font-bold">
                    {replies.length} / 10 replies configured
                  </span>
                </div>
              </div>

              {/* Validation Error Banner */}
              {validationError && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="font-semibold">{validationError}</span>
                </div>
              )}

              {/* Success Banner */}
              {saveSuccess && (
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="font-semibold">Auto-reply successfully saved to server!</span>
                </div>
              )}

              {/* Multiline Text Input for Entering / Editing Reply */}
              <form onSubmit={handleAddOrEditReply} className="p-4 rounded-2xl bg-[#191330] border border-purple-500/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-purple-200 flex items-center gap-1.5">
                    {editingReplyId ? (
                      <>
                        <Edit3 className="w-3.5 h-3.5 text-pink-400" />
                        <span>Edit Auto-Reply Message</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-pink-400" />
                        <span>Add New Auto-Reply (Reply #{replies.length + 1})</span>
                      </>
                    )}
                  </label>
                  {editingReplyId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <textarea
                  rows="3"
                  value={replyInputText}
                  onChange={(e) => {
                    setReplyInputText(e.target.value);
                    if (validationError) setValidationError('');
                  }}
                  placeholder="Type auto-reply message here..."
                  className="w-full py-2.5 px-3.5 rounded-xl bg-black/40 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none leading-relaxed"
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    {editingReplyId
                      ? 'Editing existing reply text. Order and ID are preserved.'
                      : `${10 - replies.length} slot(s) remaining (max 10).`}
                  </span>

                  <button
                    type="submit"
                    disabled={!replyInputText.trim() || (!editingReplyId && replies.length >= 10)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                  >
                    <span>{editingReplyId ? 'Save Changes' : 'Send / Add Reply'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* List of Saved Auto-Reply Messages */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Saved Auto-Replies Sequence</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Order: Top to bottom (1st message, 2nd, etc.)</span>
                </div>

                {replies.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs rounded-2xl bg-white/5 border border-dashed border-white/15">
                    No custom auto-reply messages configured yet. Add your first reply above!
                  </div>
                ) : (
                  replies.map((item, idx) => {
                    const orderLabel = idx === 0
                      ? '1st Reply (When client sends 1st message)'
                      : idx === 1
                      ? '2nd Reply (When client sends 2nd message)'
                      : idx === 2
                      ? '3rd Reply (When client sends 3rd message)'
                      : `#${idx + 1} Reply`;

                    const isBeingEdited = editingReplyId === item.id;

                    return (
                      <div
                        key={item.id || idx}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all shadow-sm ${
                          isBeingEdited
                            ? 'bg-purple-900/30 border-pink-500/60 ring-1 ring-pink-500/30'
                            : 'bg-[#181329] border-purple-900/50 hover:border-purple-500/40'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="shrink-0 px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold text-[11px]">
                            #{idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                              {orderLabel}
                            </span>
                            <p className="text-xs sm:text-sm text-white leading-relaxed break-words whitespace-pre-wrap">
                              {item.text}
                            </p>
                          </div>
                        </div>

                        {/* Edit & Delete Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-200 border border-purple-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Edit this reply"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReply(item.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Delete this reply"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-purple-900/40 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                All changes are stored permanently on your server.
              </span>
              <button
                type="button"
                onClick={() => {
                  handleCancelEdit();
                  setShowAutoReplyModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
