import React from 'react';
import { Search, Heart, CircleDot, X, MapPin } from 'lucide-react';

export const KERALA_DISTRICTS = [
  'All Kerala', 'Ernakulam', 'Kozhikode', 'Trivandrum', 'Thrissur', 'Kollam',
  'Kottayam', 'Palakkad', 'Malappuram', 'Alappuzha', 'Kannur',
  'Kasaragod', 'Wayanad', 'Idukki', 'Pathanamthitta'
];

export default function FilterBar({
  searchQuery,
  onSearchChange,
  genderFilter,
  onGenderFilterChange,
  districtFilter,
  onDistrictFilterChange,
  onlineOnly,
  onOnlineOnlyChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  favoritesCount
}) {
  return (
    <div className="w-full space-y-3.5 mb-8">
      {/* Search Input & Quick Toggles */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, place, handle (e.g. Arjun, Ernakulam, @arjun324)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/5 border border-purple-900/40 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Online & Favorites Toggles */}
        <div className="flex items-center gap-2">
          {/* Online Only */}
          <button
            type="button"
            onClick={() => onOnlineOnlyChange(!onlineOnly)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
              onlineOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-white/5 border-purple-900/40 text-slate-300 hover:bg-white/10'
            }`}
          >
            <CircleDot className={`w-3.5 h-3.5 ${onlineOnly ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Online now</span>
          </button>

          {/* Favorites Only */}
          <button
            type="button"
            onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
              favoritesOnly
                ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm'
                : 'bg-white/5 border-purple-900/40 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoritesOnly ? 'text-pink-400 fill-pink-400' : 'text-slate-400'}`} />
            <span>Favorites {favoritesCount > 0 && `(${favoritesCount})`}</span>
          </button>
        </div>
      </div>

      {/* Gender Preference Tabs */}
      <div className="flex items-center gap-2 border-b border-purple-900/30 pb-2">
        <span className="text-xs text-slate-400 font-medium mr-1">Show:</span>
        {[
          { id: 'Everyone', label: 'Everyone' },
          { id: 'Women', label: '👩 Women' },
          { id: 'Men', label: '👨 Men' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onGenderFilterChange(tab.id)}
            className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
              genderFilter === tab.id
                ? 'bg-pink-600/30 text-pink-300 border border-pink-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Kerala Districts Pills Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1 text-[11px] text-pink-400 font-semibold shrink-0 pr-1">
          <MapPin className="w-3 h-3" />
          <span>District:</span>
        </div>
        {KERALA_DISTRICTS.map((d) => {
          const isSelected = (districtFilter || 'All Kerala') === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onDistrictFilterChange(d)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-600/30 font-semibold'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
