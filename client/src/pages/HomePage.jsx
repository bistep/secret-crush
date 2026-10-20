import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Sparkles, Users, Flame, RefreshCw, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_PROFILES } from '../data/profiles';
import ProfileCard from '../components/ProfileCard';
import FilterBar from '../components/FilterBar';
import AgeFilter, { AGE_RANGES } from '../components/AgeFilter';
import VisitorOnboardingModal from '../components/VisitorOnboardingModal';

export default function HomePage() {
  const { isProfileComplete, preference: userPreference, favorites, visitorName, visitorAvatar } = useAuth();
  const [profiles, setProfiles] = useState(DEMO_PROFILES);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState(() => {
    if (userPreference === 'Men') return 'Men';
    if (userPreference === 'Women') return 'Women';
    return 'Everyone';
  });
  const [districtFilter, setDistrictFilter] = useState('All Kerala');
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

  // Update gender filter if user preference changes
  useEffect(() => {
    if (userPreference === 'Women') setGenderFilter('Women');
    else if (userPreference === 'Men') setGenderFilter('Men');
  }, [userPreference]);

  // Filter profiles based on all criteria
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // 1. Search Query (name, place, handle)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPlace = (p.place || p.location || '').toLowerCase().includes(q);
        const matchesHandle = (p.handle || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPlace && !matchesHandle) return false;
      }

      // 2. Gender Filter
      if (genderFilter === 'Women' && p.gender !== 'Female') return false;
      if (genderFilter === 'Men' && p.gender !== 'Male') return false;

      // 3. District Filter
      if (districtFilter && districtFilter !== 'All Kerala') {
        const target = districtFilter.toLowerCase();
        const matchesPlace = (p.place || p.location || '').toLowerCase().includes(target);
        if (!matchesPlace) return false;
      }

      // 4. Online Only
      if (onlineOnly && !p.is_online) return false;

      // 5. Favorites Only
      if (favoritesOnly && !favorites.includes(p.id)) return false;

      // 6. Age Range Multi-Filter
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
  }, [profiles, searchQuery, genderFilter, districtFilter, onlineOnly, favoritesOnly, selectedAgeRanges, favorites]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setGenderFilter('Everyone');
    setDistrictFilter('All Kerala');
    setOnlineOnly(false);
    setFavoritesOnly(false);
    setSelectedAgeRanges([]);
  };

  return (
    <div className="min-h-screen pb-24 md:pb-16 bg-[#0A0812]">
      {/* Visitor Onboarding Modal (Name -> Gender/Interest -> 6 Avatar Selection) */}
      <VisitorOnboardingModal isOpen={!isProfileComplete} />

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden pt-6 pb-10 sm:pt-12 sm:pb-14 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Main Headline Badge: Kerala Malayali Free Chats */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-purple-950/80 to-pink-950/80 border border-emerald-500/40 shadow-2xl shadow-emerald-950/40 text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-3 backdrop-blur-md">
              <span className="text-sm">🌴</span>
              <span>100% FREE KERALA CHATS</span>
              <span>•</span>
              <span>കേരളത്തിലെ മലയാളികൾക്കായി</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
              Specially Made for Kerala Malayali Chats — 100% Entirely Free!
            </h1>

            <p className="text-xs sm:text-sm text-pink-200/90 mt-2.5 max-w-2xl mx-auto leading-relaxed font-normal">
              കേരളത്തിലെ എല്ലാ ജില്ലകളിലെയും മലയാളികൾക്കായി പ്രത്യേകം തയ്യാറാക്കിയ ചാറ്റ് പ്ലാറ്റ്‌ഫോം. No subscriptions, no hidden charges — pick any avatar and start chatting freely right now!
            </p>

            {/* If visitor has logged in / finished setup, show their greeting */}
            {visitorName && (
              <div className="mt-4 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
                {visitorAvatar && (
                  <img src={visitorAvatar} alt={visitorName} className="w-5 h-5 rounded-full object-cover" />
                )}
                <span>Chatting as <strong className="text-pink-300">{visitorName}</strong></span>
              </div>
            )}
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100+ Active Kerala Avatars
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
              <Heart className="w-3.5 h-3.5 text-pink-400" />
              Real-time Live Chat
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              All 14 Districts
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Strictly 20+ Adult Only
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
          districtFilter={districtFilter}
          onDistrictFilterChange={setDistrictFilter}
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
              Kerala Profiles
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-xs text-pink-300 font-bold">
              {filteredProfiles.length}
            </span>
          </div>
        </div>

        {/* Profiles Grid */}
        {filteredProfiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
              We couldn't find any profiles matching your filters. Try selecting another district or resetting filters.
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

        {/* Preferred Age Group Selector */}
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
