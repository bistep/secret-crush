import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, User, Heart, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

export const AVATAR_OPTIONS = [
  {
    id: 'cyber_hunter',
    name: 'Cyber Hunter',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=CyberHunter&backgroundColor=b6e3f4',
    badge: 'Cool Boy'
  },
  {
    id: 'starlight_queen',
    name: 'Starlight Queen',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Starlight&backgroundColor=ffd5dc',
    badge: 'Cute Girl'
  },
  {
    id: 'shadow_ninja',
    name: 'Shadow Ninja',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ShadowNinja&backgroundColor=c0aede',
    badge: 'Chill Guy'
  },
  {
    id: 'blossom_aura',
    name: 'Blossom Aura',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=BlossomGirl&backgroundColor=ffdfbf',
    badge: 'Sweet Girl'
  },
  {
    id: 'golden_hero',
    name: 'Golden Hero',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=GoldenKnight&backgroundColor=fed7aa',
    badge: 'Smart Guy'
  },
  {
    id: 'mystic_vibe',
    name: 'Mystic Vibe',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=MysticVibe&backgroundColor=c1f0d0',
    badge: 'Fun Girl'
  }
];

export default function VisitorOnboardingModal({ isOpen }) {
  const { saveVisitorProfile, visitorName: currentName, gender: currentGender, preference: currentPref, visitorAvatar: currentAvatar } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(currentName || '');
  const [gender, setGender] = useState(currentGender || 'Male');
  const [preference, setPreference] = useState(currentPref || 'Women');
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || AVATAR_OPTIONS[0].url);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmAge, setConfirmAge] = useState(true);

  if (!isOpen) return null;

  const handleStep1Next = (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Please enter a name or nickname (at least 2 letters)');
      return;
    }
    setErrorMsg('');
    setStep(2);
  };

  const handleStep2Next = (e) => {
    e.preventDefault();
    if (!confirmAge) {
      setErrorMsg('You must confirm that you are at least 20 years old to enter');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleFinish = async () => {
    if (!selectedAvatar) {
      setErrorMsg('Please select one avatar icon');
      return;
    }

    try {
      await saveVisitorProfile({
        name: name.trim(),
        gender,
        preference,
        avatar: selectedAvatar
      });

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF2E7E', '#8B5CF6', '#10B981']
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#120D22] border border-pink-500/30 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Top Header Badge */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-400 text-xs font-semibold border border-pink-500/20 mb-2">
            <span>🌴 Kerala Malayali Chat</span>
            <span>•</span>
            <span className="text-emerald-400">100% Free</span>
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {step === 1 && "Create Your Free Chat Profile"}
            {step === 2 && "Tell Us About Yourself"}
            {step === 3 && "Pick Your Favorite Avatar"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {step === 1 && "Enter your name to start meeting people across Kerala"}
            {step === 2 && "Choose your gender and who you'd love to chat with"}
            {step === 3 && "Select a cool gaming avatar picture for your profile"}
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className={`w-8 h-1.5 rounded-full transition-all ${step === 1 ? 'bg-pink-500' : 'bg-white/20'}`} />
            <span className={`w-8 h-1.5 rounded-full transition-all ${step === 2 ? 'bg-pink-500' : 'bg-white/20'}`} />
            <span className={`w-8 h-1.5 rounded-full transition-all ${step === 3 ? 'bg-pink-500' : 'bg-white/20'}`} />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
            {errorMsg}
          </div>
        )}

        {/* STEP 1: Name Input */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                What should people call you? (Name / Nickname)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="e.g. Rahul, Sandra, Jithin, Meera..."
                  className="w-full px-4 py-3.5 bg-black/40 border border-white/15 focus:border-pink-500 rounded-2xl text-white placeholder-slate-500 outline-none text-sm transition-all focus:ring-2 focus:ring-pink-500/20"
                />
                <User className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Gender & Interest */}
        {step === 2 && (
          <form onSubmit={handleStep2Next} className="space-y-5">
            {/* My Gender */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                I am:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Male', label: '👨 Male' },
                  { id: 'Female', label: '👩 Female' },
                  { id: 'Other', label: '🌈 Other' }
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id)}
                    className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                      gender === g.id
                        ? 'bg-pink-600/30 border-pink-500 text-white shadow-md shadow-pink-600/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interest */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Interested in chatting with:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Women', label: '👩 Women' },
                  { id: 'Men', label: '👨 Men' },
                  { id: 'Everyone', label: '💫 Everyone' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPreference(p.id)}
                    className={`py-3 rounded-2xl border text-xs font-bold transition-all ${
                      preference === p.id
                        ? 'bg-purple-600/30 border-purple-500 text-white shadow-md shadow-purple-600/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 20+ Adult Declaration */}
            <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
              <input
                type="checkbox"
                checked={confirmAge}
                onChange={(e) => setConfirmAge(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-pink-500 focus:ring-pink-500/20 bg-slate-900 w-4 h-4"
              />
              <span className="text-[11px] text-slate-300">
                I confirm that I am at least <strong>20 years old</strong> and agree to chat respectfully.
              </span>
            </label>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Next: Choose Avatar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Choose Avatar (6 Game Avatar Choices) */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {AVATAR_OPTIONS.map((av) => {
                const isSelected = selectedAvatar === av.url;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(av.url);
                      setErrorMsg('');
                    }}
                    className={`relative p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center group ${
                      isSelected
                        ? 'bg-pink-600/20 border-pink-500 scale-105 shadow-xl shadow-pink-500/30'
                        : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'
                    }`}
                  >
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden mb-2 bg-purple-950/40">
                      <img
                        src={av.url}
                        alt={av.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-white truncate max-w-full">
                      {av.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-pink-300 font-medium mt-0.5">
                      {av.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-pink-600 to-purple-600 hover:opacity-95 text-white font-extrabold text-sm shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Start Chatting Now! 🚀</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
