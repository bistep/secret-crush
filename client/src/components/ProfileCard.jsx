import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export default function ProfileCard({ profile, chatLock, onLockedClick }) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useAuth();
  const isFav = favorites.includes(profile.id);

  const cleanPendingId = chatLock?.pendingPersonaId ? String(chatLock.pendingPersonaId).replace(/^@/, '') : '';
  const cleanProfileId = String(profile.id).replace(/^@/, '');
  const isLockedForThisCard = Boolean(
    chatLock?.hasPendingChat && 
    cleanPendingId && 
    cleanPendingId !== cleanProfileId
  );

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(profile.id);
    if (!isFav) {
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.7 },
        colors: ['#FF2E7E', '#F43F5E']
      });
    }
  };

  const handleChatClick = () => {
    if (isLockedForThisCard) {
      if (onLockedClick) {
        onLockedClick(chatLock);
        return;
      }
    }
    navigate(`/chat/${profile.id}`);
  };

  return (
    <div
      onClick={handleChatClick}
      className="group relative bg-[#130F21]/90 hover:bg-[#1A142D] border border-pink-500/20 hover:border-pink-500/50 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-pink-500/15 transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1.5"
    >
      {/* Avatar Picture Container (Game / App Avatar) */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-b from-purple-950/40 to-[#130F21] p-4 flex items-center justify-center">
        {/* If chat is locked for this profile */}
        {isLockedForThisCard && (
          <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-pink-500/40 text-[10px] text-pink-300 font-semibold flex items-center gap-1 shadow">
            <Lock className="w-3 h-3 text-pink-400" />
            <span>Locked</span>
          </div>
        )}
        <div className="relative w-full h-full max-w-[180px] max-h-[180px] rounded-2xl overflow-hidden shadow-inner flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          <img
            src={profile.avatar_url}
            alt={profile.name}
            loading="lazy"
            className="w-full h-full object-contain drop-shadow-md"
            onError={(e) => {
              // Fallback to DiceBear initials if network issue
              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}&backgroundColor=b6e3f4`;
            }}
          />
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
            isFav
              ? 'bg-pink-600 text-white border-pink-400 scale-110 shadow-lg shadow-pink-600/40'
              : 'bg-black/50 text-white/80 border-white/20 hover:bg-black/70 hover:text-pink-400'
          }`}
          title={isFav ? 'Remove favorite' : 'Add favorite'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
        </button>

        {/* Online Status Pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              profile.is_online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span className={`text-[11px] font-medium ${profile.is_online ? 'text-emerald-300' : 'text-slate-300'}`}>
            {profile.is_online ? 'Online now' : profile.last_seen || 'Offline'}
          </span>
        </div>
      </div>

      {/* 5 Details Only: Name, Age, Place, Gender */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Name & Age */}
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-pink-300 transition-colors">
              {profile.name}, <span className="font-normal text-pink-200/90">{profile.age}</span>
            </h3>
            {/* Gender Badge */}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              profile.gender === 'Female'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
            }`}>
              {profile.gender}
            </span>
          </div>

          {/* Place */}
          <div className="flex items-center gap-1 text-xs text-slate-300 mb-3">
            <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="font-medium truncate">{profile.place || profile.location}</span>
          </div>
        </div>

        {/* Chat Button */}
        <button
          type="button"
          onClick={handleChatClick}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs tracking-wide shadow-md shadow-pink-600/25 flex items-center justify-center gap-2 group-hover:shadow-pink-600/40 transition-all mt-1"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-white" />
          <span>Chat with {profile.name}</span>
        </button>
      </div>
    </div>
  );
}
