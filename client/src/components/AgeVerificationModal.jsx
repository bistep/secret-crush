import React, { useState } from 'react';
import { Heart, ShieldAlert, Sparkles, Check, AlertCircle, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

export default function AgeVerificationModal({ isOpen, onClose }) {
  const { verifyAge, updatePreferences, gender: initialGender, preference: initialPref } = useAuth();

  const [step, setStep] = useState(1); // 1: Welcome & Gender/Preferences, 2: Mandatory 20+ Age & Terms
  const [gender, setGender] = useState(initialGender || 'Male');
  const [preference, setPreference] = useState(initialPref || 'Everyone');
  const [dob, setDob] = useState('');
  const [confirmAge, setConfirmAge] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [calculatedAge, setCalculatedAge] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calculate age as user changes DOB
  const handleDobChange = (e) => {
    const val = e.target.value;
    setDob(val);
    setErrorMsg('');

    if (val) {
      const birthDate = new Date(val);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setCalculatedAge(age);
      if (age < 20) {
        setErrorMsg('You must be at least 20 years old to access Secret Crush.');
      }
    } else {
      setCalculatedAge(null);
    }
  };

  const handleStep1Continue = () => {
    updatePreferences(gender, preference);
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (calculatedAge !== null && calculatedAge < 20) {
      setErrorMsg('Access denied: You must be 20 or older to enter.');
      return;
    }
    if (!confirmAge || !agreeTerms) {
      setErrorMsg('Please confirm both checkboxes to proceed.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await verifyAge(dob, confirmAge, agreeTerms);
      // Trigger romantic celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF2E7E', '#8B5CF6', '#F43F5E']
      });
      if (onClose) onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#130F23] border border-pink-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-pink-500/10 text-white my-8">
        
        {/* Glow accent */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30 mb-3">
            <Heart className="w-7 h-7 text-white fill-white animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-rose-200 to-purple-300 bg-clip-text text-transparent">
            Secret Crush
          </h2>
          <p className="text-sm text-pink-200/80 mt-1 font-medium">
            Find a vibe. Start a conversation.
          </p>
        </div>

        {/* STEP 1: WELCOME & GENDER / PREFERENCE SELECTION */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
              Welcome to Secret Crush! Discover exciting profiles, select someone who catches your eye, and start private flirting conversations directly in your browser.
            </div>

            {/* How do you identify? */}
            <div>
              <label className="block text-sm font-semibold text-pink-200 mb-2.5">
                How do you identify?
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setGender(opt)}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium border text-center transition-all ${
                      gender === opt
                        ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-400 text-white shadow-md shadow-pink-600/30'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Who would you like to chat with? */}
            <div>
              <label className="block text-sm font-semibold text-pink-200 mb-2.5">
                Who would you like to chat with?
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {['Women', 'Men', 'Everyone'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPreference(opt)}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-medium border text-center transition-all ${
                      preference === opt
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-md shadow-purple-600/30'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Your gender doesn't dictate your preferences. You can update this anytime.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStep1Continue}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-pink-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Continue to Age Verification</span>
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: MANDATORY 20+ AGE VERIFICATION & TERMS */}
        {step === 2 && (
          <form onSubmit={handleFinalSubmit} className="space-y-5">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Strict 20+ Requirement:</strong> Access is reserved exclusively for consenting adults aged 20 and over.
              </span>
            </div>

            {/* Date of Birth Input */}
            <div>
              <label className="block text-sm font-semibold text-pink-200 mb-1.5 flex items-center justify-between">
                <span>Enter Your Date of Birth</span>
                {calculatedAge !== null && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${calculatedAge >= 20 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                    {calculatedAge} years old {calculatedAge >= 20 ? '✓' : '(Under 20)'}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dob}
                  onChange={handleDobChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-pink-500/30 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mandatory Checkboxes */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={confirmAge}
                  onChange={(e) => setConfirmAge(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-pink-500/40 text-pink-600 focus:ring-pink-500 bg-white/10"
                />
                <span className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                  I confirm that I am <strong>20 years or older</strong>. I understand that misrepresenting my age is strictly prohibited.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-pink-500/40 text-pink-600 focus:ring-pink-500 bg-white/10"
                />
                <span className="text-xs text-slate-300 group-hover:text-white leading-relaxed">
                  I agree to the <strong>Terms of Service</strong> & <strong>Privacy Policy</strong>. I agree not to harass, threaten, or abuse others, and understand chat data is handled securely for platform communication.
                </span>
              </label>
            </div>

            {/* Transparency Note */}
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-[11px] text-purple-200/80 leading-relaxed">
              <strong className="text-purple-300">Platform Transparency Notice:</strong> Initial profiles are fictional demonstration personas. Conversations you start are routed to our central site operator inbox for entertainment and responsive engagement.
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={!dob || calculatedAge < 20 || !confirmAge || !agreeTerms || isSubmitting}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-pink-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Verifying...</span>
                ) : (
                  <>
                    <span>Enter Secret Crush</span>
                    <Heart className="w-4 h-4 fill-white" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
