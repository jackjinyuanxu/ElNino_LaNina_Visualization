import React from 'react';
import { ENSOPhase } from '../types/enso';
import { Wind, Waves, CloudRain, Flame, Snowflake, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';

interface SimpleExplainerProps {
  phase: ENSOPhase;
  oniValue: number;
  onSelectPhase: (phase: ENSOPhase) => void;
}

export const SimpleExplainer: React.FC<SimpleExplainerProps> = ({
  phase,
  oniValue,
  onSelectPhase,
}) => {
  const content = {
    neutral: {
      badge: 'Normal / Neutral',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      headline: 'The Standard Setup: Steady Winds Push Warm Water West',
      summary:
        'Under normal conditions, steady trade winds blow warm surface water across the Pacific toward Asia and Australia. Cold, nutrient-rich water rises from the deep ocean along the coast of South America.',
      windTitle: 'Trade Winds: Steady & Strong',
      windDesc: 'Blowing East-to-West, shoving warm surface water toward Indonesia.',
      waterTitle: 'Ocean Heat: Piled in the West',
      waterDesc: 'Warm pool (~30°C) stacks in the West; thermocline is shallow in the East.',
      weatherTitle: 'Rainfall: Over Asia & Australia',
      weatherDesc: 'Rising warm, humid air fuels tropical rainforests and normal monsoons.',
      analogy: 'Imagine blowing gently on a hot cup of soup: the hot broth piles up on the far side!',
    },
    'el-nino': {
      badge: 'El Niño (Warm Event)',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      headline: 'The Winds Stall: Warm Water Sloshes Eastward to the Americas',
      summary:
        'The trade winds weaken or even reverse. Without the wind pushing it west, the massive pool of warm water sloshes back across the Pacific toward South America. Heavy rains follow the heat eastward.',
      windTitle: 'Trade Winds: Weakened or Stalled',
      windDesc: 'The atmospheric engine slows down; winds fail to hold the warm pool back.',
      waterTitle: 'Ocean Heat: Sloshes Across the Pacific',
      waterDesc: 'Warm water caps South America; the thermocline flattens out and blocks cold upwelling.',
      weatherTitle: 'Rainfall: Shifts to the Americas',
      weatherDesc: 'Devastating floods & mudslides in Peru and California, while Australia & Indonesia face severe droughts.',
      analogy: 'Imagine turning off the hair dryer that was holding back the water in a bathtub — the water rushes back!',
    },
    'la-nina': {
      badge: 'La Niña (Cold Event)',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      headline: 'Winds in Overdrive: Warm Water Crammed Far to the West',
      summary:
        'The trade winds blow extra hard! They shove the warm water even further west toward Asia. Meanwhile, freezing deep ocean water surges up intensely along South America, cooling the entire equatorial Pacific.',
      windTitle: 'Trade Winds: Supercharged',
      windDesc: 'Blowing with extreme force toward the west.',
      waterTitle: 'Ocean Heat: Shoved Far West',
      waterDesc: 'Deep freezing water rushes to the surface near Peru, making the eastern Pacific very cold.',
      weatherTitle: 'Rainfall: Extreme Deluges in Asia',
      weatherDesc: 'Australia and Indonesia experience catastrophic monsoons and floods, while the US Southwest faces drought.',
      analogy: 'Imagine blowing as hard as you can across the soup: hot soup is forced to the far rim while cold broth wells up behind it.',
    },
  };

  const current = content[phase];

  return (
    <div id="simple-enso-explainer" className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
      {/* Top Banner with 1-Click Phase Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
              The Big Idea in 30 Seconds
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${current.badgeColor}`}>
              {current.badge}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {current.headline}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {current.summary}
          </p>
        </div>

        {/* Big tactile switcher buttons */}
        <div className="flex items-center gap-2 self-start md:self-center shrink-0 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            id="btn-simple-la-nina"
            onClick={() => onSelectPhase('la-nina')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              phase === 'la-nina'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 ring-1 ring-cyan-400'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900'
            }`}
          >
            <Snowflake className="w-4 h-4" />
            <span>1. La Niña</span>
          </button>
          <button
            id="btn-simple-neutral"
            onClick={() => onSelectPhase('neutral')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              phase === 'neutral'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>2. Normal</span>
          </button>
          <button
            id="btn-simple-el-nino"
            onClick={() => onSelectPhase('el-nino')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              phase === 'el-nino'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-1 ring-rose-400'
                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-900'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>3. El Niño</span>
          </button>
        </div>
      </div>

      {/* The 3 Things That Change: Wind -> Water -> Weather */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {/* Step 1: Winds */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1: The Wind</span>
                <h4 className="text-xs font-bold text-white">{current.windTitle}</h4>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {current.windDesc}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] font-mono text-sky-300/80 flex items-center gap-1">
            {phase === 'el-nino' ? (
              <>
                <ArrowRight className="w-3.5 h-3.5 text-rose-400" />
                <span>Winds stalled or blowing east</span>
              </>
            ) : (
              <>
                <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
                <span>Blowing West (Trade Winds)</span>
              </>
            )}
          </div>
        </div>

        {/* Step 2: Water */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2: The Ocean Seesaw</span>
                <h4 className="text-xs font-bold text-white">{current.waterTitle}</h4>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {current.waterDesc}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] font-mono text-amber-300/80">
            {phase === 'el-nino'
              ? 'Warm pool sloshed East'
              : phase === 'la-nina'
              ? 'Warm pool pushed Far West'
              : 'Warm West • Cold East'}
          </div>
        </div>

        {/* Step 3: Weather */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <CloudRain className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 3: The Rain &amp; Storms</span>
                <h4 className="text-xs font-bold text-white">{current.weatherTitle}</h4>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {current.weatherDesc}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-900 text-[11px] font-mono text-indigo-300/80">
            Rain clouds always sit over the warmest water
          </div>
        </div>
      </div>

      {/* Simple Real-World Analogy */}
      <div className="mt-4 p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex items-center gap-3">
        <span className="text-lg shrink-0">💡</span>
        <p className="text-xs text-indigo-200">
          <strong className="font-semibold text-white">Simple Analogy: </strong>
          {current.analogy}
        </p>
      </div>
    </div>
  );
};
