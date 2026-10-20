import React, { useState } from 'react';
import { Sparkles, Info, X } from 'lucide-react';

export default function HonestDisclosureBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-purple-950/80 via-pink-950/60 to-purple-950/80 border-b border-pink-500/20 px-4 py-2.5 text-xs text-pink-200/90">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-full bg-pink-500/20 text-pink-400">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <p>
            <strong className="text-pink-300 font-semibold">Transparent Persona Chat:</strong>{' '}
            Profiles represent curated virtual demonstration personas. Messages are received and handled directly by the central platform concierge team for romantic conversation and adult entertainment.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-pink-500/10 rounded text-pink-400/60 hover:text-pink-300 transition-colors"
          title="Dismiss notice"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
