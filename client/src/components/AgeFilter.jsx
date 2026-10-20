import React, { useState } from 'react';
import { SlidersHorizontal, Check, RefreshCw } from 'lucide-react';

const AGE_RANGES = [
  { id: '20-24', label: '20–24', min: 20, max: 24 },
  { id: '25-29', label: '25–29', min: 25, max: 29 },
  { id: '30-34', label: '30–34', min: 30, max: 34 },
  { id: '35-39', label: '35–39', min: 35, max: 39 },
  { id: '40-49', label: '40–49', min: 40, max: 49 },
  { id: '50+', label: '50+', min: 50, max: 120 },
];

export default function AgeFilter({ selectedRanges, onApply, onReset }) {
  const [localSelected, setLocalSelected] = useState(selectedRanges || []);

  const toggleRange = (rangeId) => {
    if (localSelected.includes(rangeId)) {
      setLocalSelected(localSelected.filter(id => id !== rangeId));
    } else {
      setLocalSelected([...localSelected, rangeId]);
    }
  };

  const handleApply = () => {
    onApply(localSelected);
  };

  const handleReset = () => {
    setLocalSelected([]);
    onReset();
  };

  return (
    <div className="w-full bg-[#120F22]/90 border border-purple-900/40 rounded-3xl p-6 sm:p-8 backdrop-blur-lg shadow-xl shadow-purple-950/20">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Choose Your Preferred Age Group
              </h3>
              <p className="text-xs text-pink-200/70">
                Select one or more ranges to filter demonstration profiles.
              </p>
            </div>
          </div>

          {localSelected.length > 0 && (
            <button
              onClick={handleReset}
              className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-slate-400 hover:text-pink-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset filter</span>
            </button>
          )}
        </div>

        {/* Range Selection Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3 mb-6">
          {AGE_RANGES.map((range) => {
            const isSelected = localSelected.includes(range.id);
            return (
              <button
                key={range.id}
                type="button"
                onClick={() => toggleRange(range.id)}
                className={`py-3 px-4 rounded-2xl text-xs sm:text-sm font-semibold border flex items-center justify-center gap-2 transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 border-pink-400 text-white shadow-lg shadow-pink-600/30 scale-102'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-pink-500/30'
                }`}
              >
                <span>{range.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Apply Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleApply}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition-all"
          >
            Apply Age Filters {localSelected.length > 0 && `(${localSelected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
export { AGE_RANGES };
