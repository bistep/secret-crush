import React, { useState } from 'react';
import { Phone, Lock, Heart, CheckCircle2, AlertCircle, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';

export default function PhoneLoginModal({ isOpen, onClose, personaName = 'your crush', onLoginSuccess }) {
  const { loginWithPhone } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePhoneChange = (e) => {
    // Only accept numeric digits, up to 10 characters
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setPhoneNumber(val);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phoneNumber.length !== 10) {
      setErrorMsg('Mandatory: Mobile number must be exactly 10 digits.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await loginWithPhone(phoneNumber);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FF2E7E', '#8B5CF6']
      });
      if (onLoginSuccess) onLoginSuccess(phoneNumber);
      if (onClose) onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-[#140F24] border border-pink-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl text-white space-y-5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="text-center space-y-2">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-pink-500/30">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-extrabold tracking-tight text-white">
            Quick Mobile Login
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            Log in with your 10-digit mobile number to continue your private conversation with{' '}
            <span className="text-pink-300 font-semibold">{personaName}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-pink-200 mb-1.5 flex items-center justify-between">
              <span>Enter 10-Digit Mobile Number</span>
              <span className={`text-[10px] font-mono ${phoneNumber.length === 10 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                {phoneNumber.length} / 10 digits
              </span>
            </label>

            <div className="flex items-center rounded-2xl bg-white/5 border border-purple-900/40 focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500 overflow-hidden">
              <span className="px-3.5 py-3 text-xs font-bold text-slate-300 bg-white/5 border-r border-purple-900/40 select-none">
                +91
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="9876543210"
                maxLength={10}
                required
                autoFocus
                className="flex-1 px-4 py-3 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-mono tracking-wider"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-white/5 text-[10px] text-slate-400 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>Strict validation: exactly 10 digits required.</span>
          </div>

          <button
            type="submit"
            disabled={phoneNumber.length !== 10 || loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-pink-600/30 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Login & Continue Chat</span>
                <Heart className="w-4 h-4 fill-white" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
