import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, FileText, CheckCircle2, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-24 md:pb-16 bg-[#0A0812] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Header */}
        <div className="pb-6 border-b border-purple-900/40">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-6 h-6 text-pink-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Terms of Service & Safety
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Rules, 20+ age verification policy, platform transparency, and privacy guidelines.
          </p>
        </div>

        {/* 1. Strict 20+ Age Requirement */}
        <section className="p-6 rounded-3xl bg-[#130F23] border border-amber-500/30 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-amber-300 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2>1. Strict Minimum Age Requirement (20+ Years)</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Secret Crush is exclusively designed and operated for consenting adults aged <strong>20 years or older</strong>. 
            Anyone under the age of 20 is strictly prohibited from accessing, viewing profiles, or initiating conversations on this website. 
            All visitors must input their authentic date of birth and affirm their age prior to accessing chat features.
          </p>
        </section>

        {/* 2. Platform Transparency & Virtual Demonstration Personas */}
        <section className="p-6 rounded-3xl bg-[#130F23] border border-purple-800/40 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-pink-300 font-bold text-base">
            <Heart className="w-5 h-5 text-pink-400" />
            <h2>2. Transparent Persona Communication</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            The profiles displayed on Secret Crush (including Manuel, Arjun, Meera, Anjali, etc.) are curated demonstration personas designed for romantic, flirtatious entertainment and casual conversation. 
            When you send a message to any persona, your messages are routed directly to our <strong>central website concierge and operator team</strong>. 
            Replies are provided by authorized operators or interactive demonstration assistants. We do not represent these initial personas as unmoderated third-party end users.
          </p>
        </section>

        {/* 3. Community Standards & Zero Tolerance for Abuse */}
        <section className="p-6 rounded-3xl bg-[#130F23] border border-purple-800/40 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-purple-300 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-purple-400" />
            <h2>3. Respectful Conduct & Zero Tolerance Policy</h2>
          </div>
          <ul className="text-xs sm:text-sm text-slate-300 space-y-2 list-disc list-inside leading-relaxed">
            <li>No harassment, abusive language, hate speech, defamation, or threats of any kind.</li>
            <li>No sharing of non-consensual content, solicitations, spam, financial scams, or illegal material.</li>
            <li>Users can report any inappropriate message or block any persona at any time using the in-chat reporting tool.</li>
            <li>Violations will result in permanent device IP and session blacklisting.</li>
          </ul>
        </section>

        {/* 4. Privacy & Data Handling */}
        <section className="p-6 rounded-3xl bg-[#130F23] border border-purple-800/40 space-y-3 shadow-lg">
          <div className="flex items-center gap-2.5 text-purple-300 font-bold text-base">
            <Lock className="w-5 h-5 text-purple-400" />
            <h2>4. Privacy & Chat Data Handling</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We value your confidentiality. We do not sell your personal data or expose your identity publicly. 
            Conversations are stored securely on our backend to enable continuous messaging and operator response delivery. 
            You may reset your session identifiers and delete locally stored cookies and preferences at any time from the <Link to="/profile" className="text-pink-400 hover:underline">My Vibe</Link> page.
          </p>
        </section>

        {/* Back Link */}
        <div className="pt-4 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white font-bold text-xs shadow-lg shadow-pink-600/30"
          >
            <span>Return to Secret Crush</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
