import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Sparkles, Users, Flame, RefreshCw, MapPin, Lock, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_PROFILES, LOCKED_REGIONAL_PROFILES } from '../data/profiles';
import ProfileCard from '../components/ProfileCard';
import FilterBar from '../components/FilterBar';
import AgeFilter, { AGE_RANGES } from '../components/AgeFilter';
import VisitorOnboardingModal from '../components/VisitorOnboardingModal';
import CookieConsentBanner from '../components/CookieConsentBanner';

export default function HomePage() {
  const {
    isProfileComplete,
    preference: userPreference,
    favorites,
    visitorName,
    visitorAvatar,
    visitorPlace,
    visitorId
  } = useAuth();

  const [profiles, setProfiles] = useState(DEMO_PROFILES);
  const [lockedProfiles] = useState(LOCKED_REGIONAL_PROFILES);

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

  // Modal for locked contact click
  const [selectedLocked, setSelectedLocked] = useState(null);

  // Fetch updated profiles from backend if available
  useEffect(() => {
    fetch('/api/profiles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProfiles(data);
        }
      })
      .catch(() => {});
  }, []);

  // Sync gender filter when user preference changes
  useEffect(() => {
    if (userPreference === 'Women') {
      setGenderFilter('Women');
    } else if (userPreference === 'Men') {
      setGenderFilter('Men');
    }
  }, [userPreference]);

  // Handle clicking on a locked regional contact
  const handleLockedClick = (lockedItem) => {
    setSelectedLocked(lockedItem);
    // Send alert to admin backend
    fetch('/api/visitors/unlock-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        profileId: lockedItem.id,
        place: lockedItem.place
      })
    }).catch(err => console.log('Unlock alert sent offline'));
  };

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

  // Profiles from user's hometown/district
  const hometownMatches = useMemo(() => {
    if (!visitorPlace) return [];
    const target = visitorPlace.toLowerCase();
    return profiles.filter(p => {
      const pPlace = (p.place || p.location || '').toLowerCase();
      const matchesPlace = pPlace.includes(target);
      if (genderFilter === 'Women' && p.gender !== 'Female') return false;
      if (genderFilter === 'Men' && p.gender !== 'Male') return false;
      return matchesPlace;
    });
  }, [profiles, visitorPlace, genderFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setGenderFilter(userPreference === 'Men' ? 'Men' : userPreference === 'Women' ? 'Women' : 'Everyone');
    setDistrictFilter('All Kerala');
    setOnlineOnly(false);
    setFavoritesOnly(false);
    setSelectedAgeRanges([]);
  };

  return (
    <div className="min-h-screen pb-28 md:pb-20 bg-[#0A0812]">
      {/* Visitor Onboarding Modal (Name, Place, Gender/Interest, Avatar) */}
      <VisitorOnboardingModal isOpen={!isProfileComplete} />

      {/* Cookie / Storage Consent Banner */}
      <CookieConsentBanner />

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden pt-6 pb-8 sm:pt-10 sm:pb-12 px-4 sm:px-6 lg:px-8 border-b border-purple-900/30">
        <div className="max-w-5xl mx-auto space-y-4">
          
          {/* Main Headline Badge: Kerala Malayali Free Chats */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-purple-950/80 to-pink-950/80 border border-emerald-500/40 shadow-2xl shadow-emerald-950/40 text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2.5 backdrop-blur-md">
              <span className="text-sm">🌴</span>
              <span>100% FREE KERALA CHATS</span>
              <span>•</span>
              <span>കേരളത്തിലെ മലയാളികൾക്കായി</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
              Specially Made for Kerala Malayali Chats — 100% Entirely Free!
            </h1>

            <p className="text-xs sm:text-sm text-pink-200/90 mt-2 max-w-2xl mx-auto leading-relaxed font-normal">
              കേരളത്തിലെ എല്ലാ ജില്ലകളിലെയും മലയാളികൾക്കായി പ്രത്യേകം തയ്യാറാക്കിയ ചാറ്റ് പ്ലാറ്റ്‌ഫോം. No subscriptions, no hidden charges — pick any avatar and start chatting freely right now!
            </p>

            {/* Visitor Greeting */}
            {visitorName && (
              <div className="mt-4 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
                {visitorAvatar && (
                  <img src={visitorAvatar} alt={visitorName} className="w-5 h-5 rounded-full object-cover" />
                )}
                <span>Chatting as <strong className="text-pink-300">{visitorName}</strong></span>
                {visitorPlace && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">
                    📍 {visitorPlace}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* User Required Security & Identity Reminder Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-3 shadow-lg shadow-rose-950/20">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-left">
              <h4 className="font-bold text-white text-xs sm:text-sm">
                🛡️ Important Privacy Rule: Keep Your Identity Safe!
              </h4>
              <p className="text-[11px] sm:text-xs text-rose-200/90 leading-relaxed">
                Don't share any personal details (real full name, personal phone number, private address, or financial info) with anyone in chat. It may reveal your personal identity. Simply chat and enjoy casual conversations anonymously!
              </p>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-300 font-medium pt-1">
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
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              End-to-End Encrypted
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* If user selected a location (e.g. Palakkad), show suggestion banner */}
        {visitorPlace && hometownMatches.length > 0 && (
          <div className="mb-8 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-purple-950/60 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-white">
                  People from <span className="text-emerald-300">{visitorPlace}</span> are available to interact!
                </h3>
                <p className="text-xs text-slate-300">
                  Showing active members near your location. Other regions are locked below.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDistrictFilter(visitorPlace)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0"
            >
              Filter to {visitorPlace}
            </button>
          </div>
        )}

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
              Active Kerala Profiles ({genderFilter === 'Women' ? 'Girls Only' : genderFilter === 'Men' ? 'Boys Only' : 'All'})
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

        {/* LOCKED REGIONAL CONTACTS SECTION */}
        <section className="mt-16 pt-8 border-t border-purple-900/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Locked Regional Contacts
                </h3>
                <p className="text-xs text-slate-400">
                  Tap any contact to see unlock requirements for this region.
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
              🔒 Locked
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {lockedProfiles.map((item) => (
              <div
                key={item.id}
                onClick={() => handleLockedClick(item)}
                className="group relative p-4 rounded-2xl bg-[#140F24]/80 hover:bg-[#1A1330] border border-amber-500/20 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col items-center text-center shadow-md transform hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-black/50 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-105 transition-transform">
                  <Lock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-white truncate max-w-full">
                  {item.name}
                </span>
                <span className="text-[11px] font-semibold text-amber-300 mt-0.5 truncate max-w-full">
                  📍 {item.place}
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400 mt-1.5">
                  Tap to Unlock
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Preferred Age Group Selector */}
        <div className="mt-14 mb-8">
          <AgeFilter
            selectedRanges={selectedAgeRanges}
            onApply={(ranges) => setSelectedAgeRanges(ranges)}
            onReset={() => setSelectedAgeRanges([])}
          />
        </div>
      </main>

      {/* Modal for Locked Regional Contact */}
      {selectedLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-sm bg-[#130E22] border border-amber-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <button
              onClick={() => setSelectedLocked(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white">
              Unlock Contact: {selectedLocked.place}
            </h3>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-left text-xs space-y-2 text-slate-200">
              <div className="font-semibold text-pink-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Unlock Requirements:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-300">
                To unlock contacts from <strong>{selectedLocked.place}</strong>, chat with a minimum of <strong>5 people</strong> from the active list above and share at least <strong>3 images/videos</strong> without losing or revealing your identity.
              </p>
            </div>

            <button
              onClick={() => setSelectedLocked(null)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition-all"
            >
              Start Unlocking Now!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
