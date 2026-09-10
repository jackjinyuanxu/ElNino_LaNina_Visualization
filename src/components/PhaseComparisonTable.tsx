import React from 'react';
import { ENSOPhase } from '../types/enso';
import { Flame, Snowflake, RefreshCw, ArrowRight } from 'lucide-react';

interface PhaseComparisonTableProps {
  currentPhase: ENSOPhase;
  onSelectPhase: (phase: ENSOPhase) => void;
}

export const PhaseComparisonTable: React.FC<PhaseComparisonTableProps> = ({
  currentPhase,
  onSelectPhase,
}) => {
  const comparisonRows = [
    {
      feature: 'Sea Surface Temperature (SST)',
      neutral: 'Warm pool confined to West (~29-30°C); Cold tongue in East (~20-22°C).',
      elNino: 'Warm anomaly (+1°C to +3°C) spreads east across central and eastern Pacific. Cold tongue vanishes.',
      laNina: 'Cold anomaly (-1°C to -2.5°C) expands far westward past Date Line; warm pool pushed far west.',
    },
    {
      feature: 'Thermocline Depth & Slope',
      neutral: 'Moderate tilt: ~150–200m deep in west, ~40–50m shallow in east.',
      elNino: 'Flattens out: shoals in west (~110m), deepens significantly in east (~130–150m).',
      laNina: 'Steepest slope: pushes >200m deep in west, breaches near surface (<20m) in east.',
    },
    {
      feature: 'Easterly Trade Winds',
      neutral: 'Consistent, steady easterlies blowing east to west across equator.',
      elNino: 'Significantly weakened, stalled, or reversed into westerly wind bursts.',
      laNina: 'Supercharged, vigorous easterlies persistently blowing westward.',
    },
    {
      feature: 'Walker Circulation & Rainfall',
      neutral: 'Rising air & heavy convection over Indonesia; dry subsiding air over South America.',
      elNino: 'Convection moves eastward into central/eastern Pacific. Drought in Australia, rain in Peru.',
      laNina: 'Convection heavily concentrated over Australia/Indonesia (monsoon deluges). Very dry in East.',
    },
    {
      feature: 'Coastal Peruvian Upwelling',
      neutral: 'Continuous, nutrient-rich Humboldt Current upwelling fuels global-leading anchovy fishery.',
      elNino: 'Suppressed / blocked by warm water cap. Massive collapse in fish biomass and seabird colonies.',
      laNina: 'Maximized upwelling; cold, intensely nutrient-rich waters fuel hyper-productive marine blooms.',
    },
    {
      feature: 'Atlantic Hurricanes',
      neutral: 'Normal seasonal baseline frequency and wind shear.',
      elNino: 'Suppressed activity: strong upper-level westerly shear rips nascent storms apart.',
      laNina: 'Hyperactive activity: low vertical wind shear fuels frequent, rapidly intensifying major hurricanes.',
    },
    {
      feature: 'North American Winter Weather',
      neutral: 'Standard seasonal variability across the Pacific Northwest and southern tier.',
      elNino: 'Subtropical jet extends east: wet storms in California & South; mild winters in Northern US.',
      laNina: 'Variable polar jet stream: drought/wildfires in Southwest; severe Arctic freezes & snow in North.',
    },
  ];

  return (
    <div id="phase-comparison-panel" className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Scientific Anatomy: El Niño vs. Neutral vs. La Niña
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Key physical mechanisms across oceanic and atmospheric domains.
          </p>
        </div>

        {/* Switch buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSelectPhase('la-nina')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              currentPhase === 'la-nina'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Snowflake className="w-3 h-3" />
            La Niña
          </button>
          <button
            onClick={() => onSelectPhase('neutral')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              currentPhase === 'neutral'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            Neutral
          </button>
          <button
            onClick={() => onSelectPhase('el-nino')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              currentPhase === 'el-nino'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <Flame className="w-3 h-3" />
            El Niño
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-300">
              <th className="p-3 font-semibold uppercase text-[10px] tracking-wider text-slate-400 w-1/4">
                Climate Domain
              </th>
              <th
                className={`p-3 font-semibold transition-colors w-1/4 ${
                  currentPhase === 'neutral' ? 'bg-emerald-950/30 text-emerald-300 border-x border-emerald-800/40' : 'text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-emerald-400" />
                  Neutral (Normal)
                </div>
              </th>
              <th
                className={`p-3 font-semibold transition-colors w-1/4 ${
                  currentPhase === 'el-nino' ? 'bg-rose-950/30 text-rose-300 border-x border-rose-800/40' : 'text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" />
                  El Niño (Warm Phase)
                </div>
              </th>
              <th
                className={`p-3 font-semibold transition-colors w-1/4 ${
                  currentPhase === 'la-nina' ? 'bg-cyan-950/30 text-cyan-300 border-x border-cyan-800/40' : 'text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Snowflake className="w-3 h-3 text-cyan-400" />
                  La Niña (Cold Phase)
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {comparisonRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                <td className="p-3 font-semibold text-slate-300 bg-slate-950/50">
                  {row.feature}
                </td>
                <td
                  className={`p-3 text-slate-300 leading-relaxed ${
                    currentPhase === 'neutral' ? 'bg-emerald-950/15 border-x border-emerald-900/30 font-medium text-emerald-100' : ''
                  }`}
                >
                  {row.neutral}
                </td>
                <td
                  className={`p-3 text-slate-300 leading-relaxed ${
                    currentPhase === 'el-nino' ? 'bg-rose-950/15 border-x border-rose-900/30 font-medium text-rose-100' : ''
                  }`}
                >
                  {row.elNino}
                </td>
                <td
                  className={`p-3 text-slate-300 leading-relaxed ${
                    currentPhase === 'la-nina' ? 'bg-cyan-950/15 border-x border-cyan-900/30 font-medium text-cyan-100' : ''
                  }`}
                >
                  {row.laNina}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
