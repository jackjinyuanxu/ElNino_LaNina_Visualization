import React, { useState } from 'react';
import { ENSOPhase } from '../types/enso';
import { Compass, Thermometer, Layers, Droplet } from 'lucide-react';

interface VirtualCTDProbeProps {
  phase: ENSOPhase;
  oniValue: number;
}

export const VirtualCTDProbe: React.FC<VirtualCTDProbeProps> = ({ phase, oniValue }) => {
  const [targetDepth, setTargetDepth] = useState<number>(100); // 0 to 300 meters

  // Ocean temperature models by depth for West Pacific (140°E) vs East Pacific (110°W)
  const getWestPacificTemp = (depth: number) => {
    // Warm pool: surface ~ 29.5°C
    // In El Niño, western warm pool cools slightly (~28.5°C) and thermocline shoals slightly
    // In La Niña, western warm pool heats up (~30.2°C) and thermocline deepens
    let sst = 29.5;
    let thermoDepth = 160;
    if (phase === 'el-nino') {
      sst = 28.6;
      thermoDepth = 120;
    } else if (phase === 'la-nina') {
      sst = 30.2;
      thermoDepth = 200;
    }

    if (depth <= thermoDepth) {
      // Well-mixed surface layer
      return sst - (depth / thermoDepth) * 1.8;
    } else {
      // Rapid plunge through thermocline to abyssal 4°C
      const d = depth - thermoDepth;
      return Math.max(4.0, (sst - 1.8) * Math.exp(-d / 65) + 3.5);
    }
  };

  const getEastPacificTemp = (depth: number) => {
    // Cold tongue off Galapagos / Peru: surface normally ~ 22.0°C
    // In El Niño: warms dramatically to 28.5°C; thermocline deepens from 40m down to 130m!
    // In La Niña: drops to 19.5°C; thermocline surfaces to ~20m!
    let sst = 22.2;
    let thermoDepth = 45;

    if (phase === 'el-nino') {
      sst = 22.2 + Math.min(6.8, Math.max(1.0, oniValue * 2.6));
      thermoDepth = 45 + Math.min(90, Math.max(15, oniValue * 40));
    } else if (phase === 'la-nina') {
      sst = 22.2 - Math.min(3.5, Math.abs(oniValue) * 1.5);
      thermoDepth = Math.max(18, 45 - Math.abs(oniValue) * 16);
    }

    if (depth <= thermoDepth) {
      return sst - (depth / thermoDepth) * 2.0;
    } else {
      const d = depth - thermoDepth;
      return Math.max(4.0, (sst - 2.0) * Math.exp(-d / 45) + 3.5);
    }
  };

  // Generate curve points for SVG profile
  const depths = [0, 20, 40, 60, 80, 100, 120, 150, 180, 210, 250, 300];
  const westPoints = depths.map((d) => ({ depth: d, temp: getWestPacificTemp(d) }));
  const eastPoints = depths.map((d) => ({ depth: d, temp: getEastPacificTemp(d) }));

  // SVG coordinate helpers (temp: 0 to 32°C -> X: 40 to 280, depth: 0 to 300m -> Y: 20 to 220)
  const mapX = (t: number) => 40 + (t / 32) * 240;
  const mapY = (d: number) => 20 + (d / 300) * 190;

  const westPath = westPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.temp)} ${mapY(p.depth)}`).join(' ');
  const eastPath = eastPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.temp)} ${mapY(p.depth)}`).join(' ');

  const currentWestTemp = getWestPacificTemp(targetDepth);
  const currentEastTemp = getEastPacificTemp(targetDepth);
  const deltaTemp = currentWestTemp - currentEastTemp;

  return (
    <div id="virtual-ctd-probe" className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            Virtual Ocean Bathythermograph (CTD Probe)
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Equatorial Pacific Thermal Sounding (0–300m)
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Sounding Graph */}
        <div className="lg:col-span-7 bg-slate-950 p-3 rounded-xl border border-slate-800 relative">
          <svg viewBox="0 0 320 230" className="w-full h-56 select-none">
            {/* Grid Lines */}
            {[0, 10, 20, 30].map((t) => (
              <g key={`t-${t}`}>
                <line x1={mapX(t)} y1="20" x2={mapX(t)} y2="210" stroke="#1e293b" strokeDasharray="3 3" />
                <text x={mapX(t)} y="15" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  {t}°C
                </text>
              </g>
            ))}

            {[0, 50, 100, 150, 200, 250, 300].map((d) => (
              <g key={`d-${d}`}>
                <line x1="40" y1={mapY(d)} x2="280" y2={mapY(d)} stroke="#1e293b" strokeDasharray="3 3" />
                <text x="32" y={mapY(d) + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                  {d}m
                </text>
              </g>
            ))}

            {/* Depth Target Scrubber Line */}
            <line
              x1="40"
              y1={mapY(targetDepth)}
              x2="280"
              y2={mapY(targetDepth)}
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />

            {/* Curves */}
            <path d={westPath} fill="none" stroke="#f43f5e" strokeWidth="2.5" />
            <path d={eastPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

            {/* Probe dots at current depth */}
            <circle cx={mapX(currentWestTemp)} cy={mapY(targetDepth)} r="4.5" fill="#f43f5e" stroke="#fff" strokeWidth="1" />
            <circle cx={mapX(currentEastTemp)} cy={mapY(targetDepth)} r="4.5" fill="#38bdf8" stroke="#fff" strokeWidth="1" />
          </svg>

          {/* Depth Slider under graph */}
          <div className="mt-2 px-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Probe Sounding Depth:</span>
              <span className="font-mono font-bold text-amber-400">{targetDepth} meters</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={targetDepth}
              onChange={(e) => setTargetDepth(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Readings & Explanatory Breakdown */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          <div className="space-y-2.5">
            {/* West Pacific Box */}
            <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  West Pacific (Warm Pool - 140°E)
                </span>
                <span className="text-sm font-bold font-mono text-rose-200">
                  {currentWestTemp.toFixed(1)}°C
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                {targetDepth < 120
                  ? 'Warm, well-mixed surface layer with high ocean heat content.'
                  : 'Crossing below the Western Pacific thermocline.'}
              </p>
            </div>

            {/* East Pacific Box */}
            <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sky-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  East Pacific (Cold Tongue - 110°W)
                </span>
                <span className="text-sm font-bold font-mono text-sky-200">
                  {currentEastTemp.toFixed(1)}°C
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                {phase === 'el-nino'
                  ? 'Thermocline suppressed: Warm layer is unusually deep (+6°C anomaly at depth).'
                  : 'Intense cold upwelling pulls cold water right up to near-surface levels.'}
              </p>
            </div>

            {/* Zonal Temperature Gradient */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">East-West Gradient (ΔT):</span>
                <span className="font-mono font-bold text-amber-400">
                  {deltaTemp >= 0 ? `+${deltaTemp.toFixed(1)}` : deltaTemp.toFixed(1)}°C
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                {deltaTemp > 6
                  ? 'Normal / La Niña: High thermal gradient fuels powerful atmospheric Walker circulation winds.'
                  : 'El Niño: Thermal gradient collapsed. Without this temperature difference, trade winds stall.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
