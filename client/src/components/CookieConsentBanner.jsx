import React from 'react';
import { Cookie, Check, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CookieConsentBanner() {
  const { cookieConsent, setCookieConsent } = useAuth();

  if (cookieConsent) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-[#120D22]/95 border-t border-purple-900/60 backdrop-blur-lg shadow-2xl animate-slideUp">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center shrink-0">
            <Cookie className="w-5 h-5 animate-pulse" />
          </div>
          <div className="text-left">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>Save Your Chats & Session Locally</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                100% Private
              </span>
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-snug">
              We store your conversations securely in your browser's local cache so you can reopen your link anytime and continue exactly where you left off.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setCookieConsent('declined')}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-semibold transition-all"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={() => setCookieConsent('accepted')}
            className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-pink-600/30 flex items-center justify-center gap-1.5 transition-all"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Accept & Save Chats</span>
          </button>
        </div>
      </div>
    </div>
  );
}
