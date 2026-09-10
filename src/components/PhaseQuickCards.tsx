import React from 'react';
import { ENSOPhase } from '../types/enso';
import { RefreshCw, Flame, Snowflake, Check, Wind, Droplets, Sun, AlertTriangle } from 'lucide-react';

interface PhaseQuickCardsProps {
  currentPhase: ENSOPhase;
  onSelectPhase: (phase: ENSOPhase) => void;
}

export const PhaseQuickCards: React.FC<PhaseQuickCardsProps> = ({
  currentPhase,
  onSelectPhase,
}) => {
  const cards = [
    {
      id: 'neutral' as ENSOPhase,
      title: 'Normal (Neutral)',
      subtitle: 'The Balanced Baseline',
      icon: RefreshCw,
      themeColor: 'emerald',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/50 bg-emerald-950/20',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      bullets: [
        { label: 'Winds', text: 'Steady trade winds blow East → West' },
        { label: 'Warm Water', text: 'Piles up in the West (~30°C near Indonesia)' },
        { label: 'Cold Water', text: 'Rises along South America (~20°C Peru)' },
        { label: 'Rainfall', text: 'Normal monsoons over Asia & Australia' },
      ],
      impact: 'Standard seasonal weather across the globe; healthy fisheries in Peru.',
    },
    {
      id: 'el-nino' as ENSOPhase,
      title: 'El Niño (Warm Phase)',
      subtitle: 'The Wind Dies, Water Sloshes East',
      icon: Flame,
      themeColor: 'rose',
      activeBorder: 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-950/20',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      bullets: [
        { label: 'Winds', text: 'Trade winds weaken, collapse, or reverse' },
        { label: 'Warm Water', text: 'Sloshes across the ocean to South America' },
        { label: 'Cold Water', text: 'Upwelling blocked by deep layer of warm water' },
        { label: 'Rainfall', text: 'Storm clouds follow warm water eastward' },
      ],
      impact: 'Floods & mudslides in Peru & California; devastating bushfires & drought in Australia.',
    },
    {
      id: 'la-nina' as ENSOPhase,
      title: 'La Niña (Cold Phase)',
      subtitle: 'Winds in Overdrive, Ocean Freezes',
      icon: Snowflake,
      themeColor: 'cyan',
      activeBorder: 'border-cyan-500 ring-2 ring-cyan-500/50 bg-cyan-950/20',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      bullets: [
        { label: 'Winds', text: 'Supercharged trade winds blow fiercely West' },
        { label: 'Warm Water', text: 'Shoved extreme West toward Asia' },
        { label: 'Cold Water', text: 'Freezing deep water surges to surface in East' },
        { label: 'Rainfall', text: 'Torrential downpours concentrated in West' },
      ],
      impact: 'Severe floods in Australia & Southeast Asia; intense drought in US Southwest.',
    },
  ];

  return (
    <div id="phase-quick-cards" className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Compare the 3 States at a Glance</span>
          </h3>
          <p className="text-xs text-slate-400">
            Click any card to load its complete 3D ocean and atmospheric simulation.
          </p>
        </div>
        <span className="text-[11px] font-mono text-indigo-400 hidden sm:inline">
          Interactive Phase Selector
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => {
          const isActive = currentPhase === c.id;
          const Icon = c.icon;

          return (
            <button
              key={c.id}
              onClick={() => onSelectPhase(c.id)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? `${c.activeBorder} shadow-xl shadow-slate-950/50`
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.badgeBg}`}>
                    {c.title}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 ${
                    c.id === 'el-nino' ? 'text-rose-400' : c.id === 'la-nina' ? 'text-cyan-400' : 'text-emerald-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {c.subtitle}
                  </h4>
                </div>

                {/* 4 Key Points */}
                <div className="space-y-1.5 mt-3 pt-2 border-t border-slate-800/80 text-xs">
                  {c.bullets.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0 w-20">
                        {b.label}:
                      </span>
                      <span className="text-slate-200 leading-tight">
                        {b.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Real-World Hazard */}
              <div className="mt-4 pt-2.5 border-t border-slate-800/60 text-[11px] text-slate-400 italic">
                <strong className="text-slate-300 not-italic font-semibold">Global Weather: </strong>
                {c.impact}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
