import React from 'react';
import { ENSOPhase, SimulationParams } from '../types/enso';
import { Sliders, Wind, Waves, CloudRain, Eye, RefreshCw, Zap, Flame, Snowflake, HelpCircle } from 'lucide-react';

interface PhysicsSandboxProps {
  phase: ENSOPhase;
  params: SimulationParams;
  onChangeParams: (newParams: SimulationParams) => void;
  onSetPhasePreset: (phase: ENSOPhase) => void;
}

export const PhysicsSandbox: React.FC<PhysicsSandboxProps> = ({
  phase,
  params,
  onChangeParams,
  onSetPhasePreset,
}) => {
  const updateParam = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    onChangeParams({ ...params, [key]: value });
  };

  // Physical State Diagnostic text
  const getPhysicalDiagnosis = () => {
    if (params.tradeWindStrength < 20) {
      return {
        state: 'El Niño Regime: Atmospheric Collapse & Kelvin Waves',
        color: 'text-rose-400',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        detail:
          'Easterly trade winds have collapsed or reversed to westerlies. The massive Western Pacific warm pool is freely sloshing eastward as sub-surface Kelvin waves. The thermocline flattens, suppressing nutrient upwelling off Peru.',
      };
    } else if (params.tradeWindStrength > 130) {
      return {
        state: 'La Niña Regime: Supercharged Trade Winds & Deep Tilt',
        color: 'text-cyan-400',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        detail:
          'Fierce easterly trade winds are piling up warm water against the maritime continent. The thermocline tilts to an extreme angle, surfacing in the east and pulling up cold, nutrient-rich water far into the central Pacific.',
      };
    } else {
      return {
        state: 'Neutral Equilibrium: Steady Walker Circulation',
        color: 'text-emerald-400',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        detail:
          'Normal balanced conditions. Moderate trade winds maintain the classic ~30°C western warm pool and ~22°C eastern cold tongue with a standard tilted thermocline.',
      };
    }
  };

  const diagnosis = getPhysicalDiagnosis();

  return (
    <div id="physics-sandbox-panel" className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white">Interactive Physics Sandbox</h3>
            <p className="text-xs text-slate-400">
              Manipulate atmospheric wind forces and thermocline geometry to observe coupled ocean dynamics.
            </p>
          </div>
        </div>

        {/* Phase Quick Presets */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSetPhasePreset('la-nina')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              phase === 'la-nina'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
          >
            <Snowflake className="w-3 h-3" />
            La Niña
          </button>
          <button
            onClick={() => onSetPhasePreset('neutral')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              phase === 'neutral'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            Neutral
          </button>
          <button
            onClick={() => onSetPhasePreset('el-nino')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              phase === 'el-nino'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3 h-3" />
            El Niño
          </button>
        </div>
      </div>

      {/* Physics Diagnosis Banner */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Physical Diagnosis
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${diagnosis.badge}`}>
            {diagnosis.state}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {diagnosis.detail}
        </p>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Trade Wind Strength */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-sky-400" />
              Easterly Trade Wind Strength
            </label>
            <span className="text-xs font-mono font-bold text-sky-400">
              {params.tradeWindStrength}% {params.tradeWindStrength < 0 ? '(Reversed Westerly)' : ''}
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="200"
            step="5"
            value={params.tradeWindStrength}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              // Bjerknes feedback link: if trade wind drops, thermocline flattens
              const coupledTilt = Math.max(0, Math.min(100, (val / 150) * 80));
              onChangeParams({
                ...params,
                tradeWindStrength: val,
                thermoclineTilt: coupledTilt,
              });
            }}
            className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
            <span>-50% (Westerly Burst)</span>
            <span>0% (Calm)</span>
            <span>100% (Normal)</span>
            <span>200% (Vigorous)</span>
          </div>
        </div>

        {/* Thermocline Slope Tilt */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-indigo-400" />
              Thermocline Tilt Angle
            </label>
            <span className="text-xs font-mono font-bold text-indigo-400">
              {params.thermoclineTilt < 25 ? 'Flat (El Niño)' : params.thermoclineTilt > 75 ? 'Steep (La Niña)' : 'Normal Slope'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={params.thermoclineTilt}
            onChange={(e) => updateParam('thermoclineTilt', parseInt(e.target.value, 10))}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1.5">
            <span>0 (Completely Flat)</span>
            <span>50 (Normal See-Saw)</span>
            <span>100 (Max Tilt)</span>
          </div>
        </div>
      </div>

      {/* 3D Visual Layers Toggles */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-slate-300">
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span>3D Model Render Layers:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => updateParam('showThermocline', !params.showThermocline)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
              params.showThermocline
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Waves className="w-3 h-3" />
            Thermocline
          </button>

          <button
            onClick={() => updateParam('showWindVectors', !params.showWindVectors)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
              params.showWindVectors
                ? 'bg-sky-600/30 border-sky-500 text-sky-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Wind className="w-3 h-3" />
            Trade Winds
          </button>

          <button
            onClick={() => updateParam('showUpwellingVectors', !params.showUpwellingVectors)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
              params.showUpwellingVectors
                ? 'bg-cyan-600/30 border-cyan-500 text-cyan-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <Zap className="w-3 h-3" />
            Upwelling
          </button>

          <button
            onClick={() => updateParam('showCloudConvection', !params.showCloudConvection)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
              params.showCloudConvection
                ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <CloudRain className="w-3 h-3" />
            Clouds &amp; Rain
          </button>

          <button
            onClick={() => updateParam('showWalkerCell', !params.showWalkerCell)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
              params.showWalkerCell
                ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            Walker Cell
          </button>

          <button
            onClick={() => updateParam('showDepthLabels', !params.showDepthLabels)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1.5 ${
              params.showDepthLabels
                ? 'bg-slate-700/60 border-slate-500 text-slate-200'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            Depth Legend
          </button>
        </div>
      </div>
    </div>
  );
};
