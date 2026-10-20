import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Sparkles, Filter, Users, Flame, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_PROFILES } from '../data/profiles';
import ProfileCard from '../components/ProfileCard';
import FilterBar from '../components/FilterBar';
import AgeFilter, { AGE_RANGES } from '../components/AgeFilter';
import AgeVerificationModal from '../components/AgeVerificationModal';

export default function HomePage() {
  const { isAgeVerified, preference: userPreference, favorites } = useAuth();
  const [profiles, setProfiles] = useState(DEMO_PROFILES);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState(() => {
    if (userPreference === 'Men') return 'Men';
    if (userPreference === 'Women') return 'Women';
    return 'Everyone';
  });
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedAgeRanges, setSelectedAgeRanges] = useState([]);

  // Fetch updated profiles from backend if available
  useEffect(() => {
    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProfiles(data);
        }
      })
      .catch(() => {
        // Fallback to local DEMO_PROFILES
      });
  }, []);

  // Filter profiles based on all criteria
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesLoc = p.location?.toLowerCase().includes(q);
        const matchesBio = p.bio?.toLowerCase().includes(q) || p.tagline?.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesBio) return false;
      }

      // 2. Gender Filter
      if (genderFilter === 'Women' && p.gender !== 'Female') return false;
      if (genderFilter === 'Men' && p.gender !== 'Male') return false;

      // 3. Online Only
      if (onlineOnly && !p.is_online) return false;

      // 4. Favorites Only
      if (favoritesOnly && !favorites.includes(p.id)) return false;

      // 5. Age Range Multi-Filter
      if (selectedAgeRanges.length > 0) {
        const matchesAnyRange = selectedAgeRanges.some((rangeId) => {
          const rangeObj = AGE_RANGES.find(r => r.id === rangeId);
          if (!rangeObj) return false;
          return p.age >= rangeObj.min && p.age <= rangeObj.max;
        });
        if (!matchesAnyRange) return false;
      }

      return true;
    });
  }, [profiles, searchQuery, genderFilter, onlineOnly, favoritesOnly, selectedAgeRanges, favorites]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setGenderFilter('Everyone');
    setOnlineOnly(false);
    setFavoritesOnly(false);
    setSelectedAgeRanges([]);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-16 bg-[#0A0812]">
      {/* Mandatory 20+ Age Verification Modal */}
      <AgeVerificationModal isOpen={!isAgeVerified} />

      {/* Romantic Hero Banner */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        {/* Glowing atmospheric backgrounds */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-pink-600/20 via-purple-600/20 to-transparent blur-3xl rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-semibold backdrop-blur-md">
            <Flame className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
            <span>Discover Passionate Connections</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Find a vibe.{' '}
            <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-purple-400 bg-clip-text text-transparent">
              Start a conversation.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300/80 max-w-2xl mx-auto font-normal leading-relaxed">
            Browse through attractive, charismatic personas, choose someone you like, and dive into thrilling, private flirtatious chat right now.
          </p>

          {/* Quick Stats Pill */}
          <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              18+ Curated Personas
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-pink-400" />
              Instant Real-time Chat
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Strictly 20+ Consenting Adults
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Filters Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          genderFilter={genderFilter}
          onGenderFilterChange={setGenderFilter}
          onlineOnly={onlineOnly}
          onOnlineOnlyChange={setOnlineOnly}
          favoritesOnly={favoritesOnly}
          onFavoritesOnlyChange={setFavoritesOnly}
          favoritesCount={favorites.length}
        />

        {/* Section Heading & Result Count */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Featured Profiles
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-slate-300 font-medium">
              {filteredProfiles.length}
            </span>
          </div>
        </div>

        {/* Profiles Grid */}
        {filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-[#120F20]/50 border border-purple-900/40 rounded-3xl max-w-lg mx-auto space-y-4 my-8">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 text-pink-400 mx-auto flex items-center justify-center">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-white">No Profiles Found</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
              We couldn't find any profiles matching your current filters. Try expanding your age range or resetting filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold text-xs shadow-md shadow-pink-600/30 hover:opacity-95 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}

        {/* Section 8: Preferred Age Group Selector */}
        <div className="mt-14 mb-8">
          <AgeFilter
            selectedRanges={selectedAgeRanges}
            onApply={(ranges) => setSelectedAgeRanges(ranges)}
            onReset={() => setSelectedAgeRanges([])}
          />
        </div>
      </main>
    </div>
  );
}
