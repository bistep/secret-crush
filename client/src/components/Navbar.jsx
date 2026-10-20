import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, User, ShieldCheck, Flame, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
  const location = useLocation();
  const { isAgeVerified, isOwnerLoggedIn, visitorName, visitorAvatar } = useAuth();
  const { isConnected } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll or listen for visitor unread messages in "Chats with Me"
  const { visitorId } = useAuth();
  useEffect(() => {
    if (!visitorId) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/conversations/visitor/${visitorId}`);
        if (res.ok) {
          const list = await res.json();
          const unread = list.reduce((sum, c) => sum + (c.unreadByVisitor || 0), 0);
          setUnreadCount(unread);
        }
      } catch (e) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 12000);
    return () => clearInterval(interval);
  }, [visitorId, location.pathname]);

  const navItems = [
    { label: 'Explore', path: '/', icon: Flame },
    { label: 'Chats with Me', path: '/chats', icon: MessageCircle, badge: unreadCount },
    { label: 'My Vibe', path: '/profile', icon: User },
    { label: 'Safety & Terms', path: '/terms', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-900/40 bg-[#0A0812]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/25 group-hover:scale-105 transition-transform duration-200">
            <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-pink-400 via-rose-300 to-purple-300 bg-clip-text text-transparent">
                Secret Crush
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                20+ Adult
              </span>
            </div>
            <p className="text-[11px] text-pink-200/60 hidden sm:block">Find a vibe. Start a conversation.</p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white bg-white/10 shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-pink-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-pink-500 text-white text-[11px] font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action: Status indicator & Visitor Avatar */}
        <div className="flex items-center gap-2.5">
          {visitorName && (
            <Link
              to="/profile"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs text-white hover:bg-pink-500/20 transition-all"
            >
              {visitorAvatar ? (
                <img src={visitorAvatar} alt={visitorName} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <User className="w-3.5 h-3.5 text-pink-400" />
              )}
              <span className="font-semibold text-pink-300 max-w-[80px] sm:max-w-[120px] truncate">
                {visitorName}
              </span>
            </Link>
          )}

          {/* Connection pulse */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden sm:inline">{isConnected ? 'Live' : 'Connecting'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
