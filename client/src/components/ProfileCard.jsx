import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export default function ProfileCard({ profile }) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useAuth();
  const isFav = favorites.includes(profile.id);

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(profile.id);
    if (!isFav) {
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { y: 0.7 },
        colors: ['#FF2E7E', '#F43F5E']
      });
    }
  };

  const handleChatClick = () => {
    navigate(`/chat/${profile.id}`);
  };

  return (
    <div
      onClick={handleChatClick}
      className="group relative bg-[#130F21]/80 hover:bg-[#1A142D] border border-pink-500/15 hover:border-pink-500/40 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Portrait Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-purple-950/30">
        <img
          src={profile.avatar_url}
          alt={profile.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient Overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#130F21] via-transparent to-black/30" />

        {/* Virtual Demo Persona Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-pink-300 font-medium">
          <Sparkles className="w-3 h-3 text-pink-400" />
          <span>Virtual Persona</span>
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
            isFav
              ? 'bg-pink-600/90 text-white border-pink-400 scale-110 shadow-lg shadow-pink-600/40'
              : 'bg-black/50 text-white/80 border-white/20 hover:bg-black/70 hover:text-pink-400'
          }`}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
        </button>

        {/* Presence Status Pill (Bottom Left over image) */}
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

      {/* Profile Details Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Name & Age */}
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-pink-300 transition-colors">
              {profile.name}, <span className="font-normal text-pink-200/90">{profile.age}</span>
            </h3>
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2.5">
            <MapPin className="w-3.5 h-3.5 text-pink-400/80 shrink-0" />
            <span className="truncate">{profile.location}</span>
          </div>

          {/* Tagline / Bio */}
          <p className="text-xs text-slate-300/90 line-clamp-2 leading-relaxed mb-3">
            {profile.tagline || profile.bio}
          </p>

          {/* Interest Chips */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {profile.interests.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Chat Now Action Button */}
        <button
          type="button"
          onClick={handleChatClick}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs tracking-wide shadow-md shadow-pink-600/25 flex items-center justify-center gap-2 group-hover:shadow-pink-600/40 transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5 fill-white" />
          <span>Chat with {profile.name}</span>
        </button>
      </div>
    </div>
  );
}
