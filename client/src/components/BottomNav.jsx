import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flame, MessageCircle, User, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { label: 'Explore', path: '/', icon: Flame },
    { label: 'Chats', path: '/chats', icon: MessageCircle },
    { label: 'My Vibe', path: '/profile', icon: User },
    { label: 'Terms', path: '/terms', icon: ShieldCheck },
    { label: 'Owner', path: '/owner/inbox', icon: Lock },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E0C1A]/95 border-t border-purple-900/40 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isActive ? 'text-pink-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-pink-500 scale-110' : ''} transition-transform`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
