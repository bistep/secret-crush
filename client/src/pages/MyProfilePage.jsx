import React, { useState } from 'react';
import { User, Sparkles, ShieldCheck, Heart, Settings, RefreshCw, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MyProfilePage() {
  const { visitorId, gender, preference, updatePreferences, userAge, isAgeVerified } = useAuth();
  const [selectedGender, setSelectedGender] = useState(gender || 'Male');
  const [selectedPref, setSelectedPref] = useState(preference || 'Everyone');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    updatePreferences(selectedGender, selectedPref);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleClearSession = () => {
    if (window.confirm('Are you sure you want to reset your local session data? This will clear preferences and chat history on this browser.')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-16 bg-[#0A0812] text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-purple-900/30">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              My Vibe & Preferences
            </h1>
            <p className="text-xs text-slate-400">
              Customize your dating identity and who you want to see.
            </p>
          </div>
        </div>

        {/* Verification Status Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 to-pink-950/40 border border-pink-500/20 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Age Verified Adult (20+)</span>
              <span className="text-[11px] text-slate-300">
                Confirmed Age: {userAge ? `${userAge} years` : '20+'} • Terms Accepted
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            Active
          </span>
        </div>

        {/* Preferences Form */}
        <form onSubmit={handleSave} className="space-y-6 bg-[#130F22] border border-purple-900/40 rounded-3xl p-6 sm:p-8 shadow-xl">
          {/* Identity */}
          <div>
            <label className="block text-sm font-semibold text-pink-200 mb-2">
              How do you identify?
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedGender(opt)}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium border text-center transition-all ${
                    selectedGender === opt
                      ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-400 text-white shadow-md shadow-pink-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Preference */}
          <div>
            <label className="block text-sm font-semibold text-pink-200 mb-2">
              Who would you like to chat with?
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {['Women', 'Men', 'Everyone'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelectedPref(opt)}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium border text-center transition-all ${
                    selectedPref === opt
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-md shadow-purple-600/30'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Session Identification */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
            <span className="text-[11px] text-slate-400 block font-medium">Session Identification Code</span>
            <code className="text-xs text-pink-300 font-mono select-all block truncate">
              {visitorId}
            </code>
            <p className="text-[10px] text-slate-400 pt-1">
              Private guest session ID stored safely on your device.
            </p>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-pink-600/30 transition-all flex items-center justify-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Preferences Saved!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Update Preferences</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Danger zone / Reset session */}
        <div className="mt-8 pt-6 border-t border-purple-900/30 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-slate-300">Reset Session Data</h4>
            <p className="text-[11px] text-slate-500">Clear local session ID and verification state</p>
          </div>
          <button
            type="button"
            onClick={handleClearSession}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
