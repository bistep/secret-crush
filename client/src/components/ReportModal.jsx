import React, { useState } from 'react';
import { AlertTriangle, Ban, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ReportModal({ isOpen, onClose, profile, onBlocked }) {
  const { visitorId } = useAuth();
  const [reason, setReason] = useState('Inappropriate content');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !profile) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          personaId: profile.id,
          reason,
          details
        })
      });

      if (alsoBlock) {
        await fetch('/api/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId,
            personaId: profile.id
          })
        });
        if (onBlocked) onBlocked(profile.id);
      }

      setIsSubmitted(true);
    } catch (e) {
      setIsSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setDetails('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-[#161224] border border-pink-500/25 rounded-3xl p-6 shadow-2xl text-white">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        {isSubmitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Report Received</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Thank you for helping keep Secret Crush safe. Our moderation team reviews reports promptly. {alsoBlock && `${profile.name} has been blocked from your account.`}
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Report or Block</h3>
                <p className="text-xs text-slate-400">Regarding {profile.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-pink-200 mb-1.5">
                Reason for report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-purple-900/50 text-white text-xs focus:outline-none focus:border-pink-500"
              >
                <option value="Inappropriate content">Inappropriate / offensive content</option>
                <option value="Harassment or abuse">Harassment or abusive language</option>
                <option value="Underage concern">Suspected underage user</option>
                <option value="Spam or scam">Spam, solicitation, or scam</option>
                <option value="Other">Other safety concern</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-pink-200 mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Briefly describe what happened..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-purple-900/50 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Block Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 cursor-pointer">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="mt-0.5 rounded border-rose-400 text-rose-600 focus:ring-rose-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-rose-200 block">Block {profile.name}</span>
                <span className="text-[11px] text-rose-300/70">
                  You will no longer see this profile or receive messages from this conversation.
                </span>
              </div>
            </label>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-95 text-xs font-bold text-white shadow-md shadow-rose-600/30"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
