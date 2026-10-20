import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function ChatsWithMePage() {
  const { visitorId } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!visitorId) return;
    try {
      const res = await fetch(`/api/conversations/visitor/${visitorId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [visitorId]);

  // Listen for realtime conversation updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => {
      fetchConversations();
    };
    socket.on('conversation:updated', handleUpdate);
    socket.on('message:new', handleUpdate);

    return () => {
      socket.off('conversation:updated', handleUpdate);
      socket.off('message:new', handleUpdate);
    };
  }, [socket]);

  return (
    <div className="min-h-screen pb-24 md:pb-16 bg-[#0A0812] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-purple-900/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-5 h-5 text-pink-400" />
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Chats with Me
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Your ongoing conversations with Secret Crush personas.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
            {conversations.length} Active {conversations.length === 1 ? 'Chat' : 'Chats'}
          </span>
        </div>

        {/* Conversations List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-14 h-14 rounded-2xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-white/10 rounded" />
                  <div className="h-3 w-2/3 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.map((conv) => {
              const formattedTime = conv.updatedAt
                ? new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <Link
                  key={conv.id}
                  to={`/chat/${conv.personaId}`}
                  className="group flex items-center gap-4 p-4 rounded-2xl bg-[#130F23] hover:bg-[#1A142E] border border-purple-900/40 hover:border-pink-500/40 transition-all shadow-md hover:shadow-xl hover:shadow-pink-500/5 cursor-pointer"
                >
                  {/* Persona Avatar */}
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-pink-500/30 shrink-0">
                    <img
                      src={conv.personaAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300'}
                      alt={conv.personaName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#130F23] ${
                        conv.personaOnline ? 'bg-emerald-400' : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  {/* Conversation snippet */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-pink-300 transition-colors truncate">
                        {conv.personaName} {conv.personaAge && <span className="font-normal text-xs text-slate-400">({conv.personaAge})</span>}
                      </h3>
                      <span className="text-[11px] text-slate-400 shrink-0 ml-2 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formattedTime}
                      </span>
                    </div>

                    <p className={`text-xs truncate ${conv.unreadByVisitor > 0 ? 'text-pink-200 font-semibold' : 'text-slate-400'}`}>
                      {conv.lastSender === 'visitor' ? 'You: ' : `${conv.personaName}: `}
                      {conv.lastMessage || 'Start a conversation...'}
                    </p>
                  </div>

                  {/* Unread badge & arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    {conv.unreadByVisitor > 0 && (
                      <span className="w-5 h-5 rounded-full bg-pink-500 text-white text-[11px] font-bold flex items-center justify-center animate-pulse">
                        {conv.unreadByVisitor}
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-pink-400 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty Chats State */
          <div className="text-center py-16 px-4 bg-[#120F20]/50 border border-purple-900/40 rounded-3xl max-w-md mx-auto space-y-4 my-8">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mx-auto flex items-center justify-center">
              <MessageCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No Conversations Yet</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              You haven't messaged anyone yet. Explore our charming personas and say hello to start a vibe!
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold text-xs shadow-md shadow-pink-600/30 hover:opacity-95"
            >
              <span>Explore Profiles</span>
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
