import React, { useState, useMemo } from 'react';
import { ONIRecord, LandmarkEvent, ENSOPhase } from '../types/enso';
import { HISTORICAL_ONI_DATA, LANDMARK_EVENTS } from '../data/ensoHistoricalData';
import { Calendar, TrendingUp, Filter, Play, Pause, RotateCcw, Info, Sparkles, Award } from 'lucide-react';

interface HistoricalTimelineProps {
  currentRecord: ONIRecord;
  onSelectRecord: (record: ONIRecord) => void;
  onSelectLandmark: (event: LandmarkEvent) => void;
}

export const HistoricalTimeline: React.FC<HistoricalTimelineProps> = ({
  currentRecord,
  onSelectRecord,
  onSelectLandmark,
}) => {
  const [decadeFilter, setDecadeFilter] = useState<'all' | 'recent' | 'modern' | 'midcentury'>('recent');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'el-nino' | 'la-nina'>('all');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLandmark, setSelectedLandmark] = useState<LandmarkEvent | null>(null);

  // Filter records based on selected decade range
  const filteredRecords = useMemo(() => {
    return HISTORICAL_ONI_DATA.filter((r) => {
      let decadeMatch = true;
      if (decadeFilter === 'recent') decadeMatch = r.year >= 2000;
      else if (decadeFilter === 'modern') decadeMatch = r.year >= 1980 && r.year < 2000;
      else if (decadeFilter === 'midcentury') decadeMatch = r.year < 1980;

      let phaseMatch = true;
      if (phaseFilter === 'el-nino') phaseMatch = r.phase === 'el-nino';
      else if (phaseFilter === 'la-nina') phaseMatch = r.phase === 'la-nina';

      return decadeMatch && phaseMatch;
    });
  }, [decadeFilter, phaseFilter]);

  // Key stats
  const stats = useMemo(() => {
    const elNinoCount = HISTORICAL_ONI_DATA.filter((r) => r.phase === 'el-nino').length;
    const laNinaCount = HISTORICAL_ONI_DATA.filter((r) => r.phase === 'la-nina').length;
    const neutralCount = HISTORICAL_ONI_DATA.filter((r) => r.phase === 'neutral').length;
    const maxONI = Math.max(...HISTORICAL_ONI_DATA.map((r) => r.oni));
    const minONI = Math.min(...HISTORICAL_ONI_DATA.map((r) => r.oni));

    return {
      elNinoMonths: elNinoCount,
      laNinaMonths: laNinaCount,
      neutralMonths: neutralCount,
      maxONI,
      minONI,
    };
  }, []);

  // Time machine animation player
  React.useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      const currentIndex = HISTORICAL_ONI_DATA.findIndex(
        (r) => r.year === currentRecord.year && r.monthIndex === currentRecord.monthIndex
      );
      if (currentIndex !== -1 && currentIndex < HISTORICAL_ONI_DATA.length - 1) {
        onSelectRecord(HISTORICAL_ONI_DATA[currentIndex + 1]);
      } else {
        setIsPlaying(false);
      }
    }, 280);
    return () => clearInterval(interval);
  }, [isPlaying, currentRecord, onSelectRecord]);

  return (
    <div id="historical-timeline-panel" className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl text-slate-200">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Historical ENSO Index (1950 – 2024)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official NOAA CPC Oceanic Niño Index (ONI) 3-Month running mean SST anomalies in the Niño 3.4 region.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Play / Time Machine Button */}
          <button
            id="btn-timeline-play"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Replay' : 'Play Time Machine'}</span>
          </button>

          {/* Era / Decade Filter Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setDecadeFilter('recent')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                decadeFilter === 'recent' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2000–2024
            </button>
            <button
              onClick={() => setDecadeFilter('modern')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                decadeFilter === 'modern' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1980–1999
            </button>
            <button
              onClick={() => setDecadeFilter('midcentury')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                decadeFilter === 'midcentury' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1950–1979
            </button>
            <button
              onClick={() => setDecadeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                decadeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All (74y)
            </button>
          </div>
        </div>
      </div>

      {/* Current Scrubber / Selected Record Banner */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Selected Date</span>
            <span className="text-sm font-bold text-white font-mono">
              {currentRecord.season} {currentRecord.year}
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">ONI Anomaly</span>
            <span
              className={`text-sm font-bold font-mono ${
                currentRecord.oni >= 0.5
                  ? 'text-rose-400'
                  : currentRecord.oni <= -0.5
                  ? 'text-cyan-400'
                  : 'text-emerald-400'
              }`}
            >
              {currentRecord.oni >= 0 ? `+${currentRecord.oni.toFixed(2)}` : currentRecord.oni.toFixed(2)} °C
            </span>
          </div>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Phase &amp; Intensity</span>
            <span className="text-xs font-semibold text-slate-200 capitalize">
              {currentRecord.intensity} {currentRecord.phase.replace('-', ' ')}
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 max-w-md text-right">
          Interactive: Click any bar along the chart below to synchronize the 3D cutaway and Earth globe to that exact historical ocean state.
        </div>
      </div>

      {/* Interactive ONI Bar Chart */}
      <div className="relative w-full h-44 bg-slate-950/90 rounded-xl border border-slate-800 p-2 overflow-x-auto overflow-y-hidden select-none">
        {/* Threshold Reference Lines */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-700/60 z-0" />
        {/* +0.5°C threshold */}
        <div className="absolute inset-x-0 top-[30%] border-t border-rose-500/25 border-dashed z-0">
          <span className="absolute left-2 -top-3 text-[9px] font-mono text-rose-400/60">+0.5°C El Niño</span>
        </div>
        {/* -0.5°C threshold */}
        <div className="absolute inset-x-0 top-[70%] border-t border-cyan-500/25 border-dashed z-0">
          <span className="absolute left-2 -top-3 text-[9px] font-mono text-cyan-400/60">-0.5°C La Niña</span>
        </div>

        {/* Bars Container */}
        <div className="relative h-full flex items-center min-w-full gap-[2px] px-2 z-10">
          {filteredRecords.map((rec, i) => {
            const isSelected = rec.year === currentRecord.year && rec.monthIndex === currentRecord.monthIndex;
            // Map ONI (-2.6 to +2.6) to percentage height (max 45% above or below center)
            const magnitude = Math.min(1, Math.abs(rec.oni) / 2.7);
            const heightPercent = Math.max(3, magnitude * 44);
            const isWarm = rec.oni >= 0;

            return (
              <button
                key={`${rec.year}-${rec.season}-${i}`}
                onClick={() => onSelectRecord(rec)}
                className="group relative h-full flex-1 flex flex-col justify-center items-center focus:outline-none"
                title={`${rec.season} ${rec.year}: ${rec.oni > 0 ? '+' : ''}${rec.oni}°C (${rec.phase})`}
              >
                {/* Upper bar (Warm anomaly) */}
                <div className="w-full h-1/2 flex items-end justify-center">
                  {isWarm && (
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[8px] rounded-t-sm transition-all duration-150 ${
                        isSelected
                          ? 'bg-rose-400 ring-2 ring-white scale-110 z-20 shadow-[0_0_10px_rgba(244,63,94,0.9)]'
                          : rec.oni >= 2.0
                          ? 'bg-rose-500 hover:bg-rose-400'
                          : rec.oni >= 1.5
                          ? 'bg-orange-500 hover:bg-orange-400'
                          : rec.oni >= 0.5
                          ? 'bg-amber-500 hover:bg-amber-400'
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  )}
                </div>

                {/* Lower bar (Cold anomaly) */}
                <div className="w-full h-1/2 flex items-start justify-center">
                  {!isWarm && (
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[8px] rounded-b-sm transition-all duration-150 ${
                        isSelected
                          ? 'bg-cyan-300 ring-2 ring-white scale-110 z-20 shadow-[0_0_10px_rgba(34,211,238,0.9)]'
                          : rec.oni <= -2.0
                          ? 'bg-blue-600 hover:bg-blue-500'
                          : rec.oni <= -1.5
                          ? 'bg-cyan-500 hover:bg-cyan-400'
                          : rec.oni <= -0.5
                          ? 'bg-sky-500 hover:bg-sky-400'
                          : 'bg-slate-600 hover:bg-slate-500'
                      }`}
                    />
                  )}
                </div>

                {/* Year labels on first season (DJF) */}
                {rec.season === 'DJF' && rec.year % 5 === 0 && (
                  <span className="absolute -bottom-1 text-[8px] font-mono text-slate-500 pointer-events-none">
                    {rec.year}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Landmark Historical Events Jump Buttons */}
      <div className="mt-5">
        <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-slate-300">
          <Award className="w-4 h-4 text-amber-400" />
          <span>Landmark Historical Events (Jump to Event Profile):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {LANDMARK_EVENTS.map((event) => {
            const isElNino = event.phase === 'el-nino';
            return (
              <button
                key={event.id}
                onClick={() => {
                  onSelectLandmark(event);
                  setSelectedLandmark(event);
                  // Also jump timeline to event peak
                  const [yrStr] = event.yearRange.split('–');
                  const targetYear = parseInt(yrStr, 10);
                  const matchingRec = HISTORICAL_ONI_DATA.find(
                    (r) => r.year === targetYear && Math.abs(r.oni - event.peakONI) < 0.4
                  );
                  if (matchingRec) onSelectRecord(matchingRec);
                }}
                className={`text-left p-3 rounded-xl border transition-all duration-200 group ${
                  isElNino
                    ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-500/60 hover:bg-rose-950/35'
                    : 'bg-cyan-950/20 border-cyan-900/40 hover:border-cyan-500/60 hover:bg-cyan-950/35'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {event.name}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isElNino ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {event.peakONI > 0 ? `+${event.peakONI}` : event.peakONI}°C
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-snug">
                  {event.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Landmark Modal / Drawer */}
      {selectedLandmark && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
              <div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    selectedLandmark.phase === 'el-nino'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                  }`}
                >
                  {selectedLandmark.phase === 'el-nino' ? 'El Niño Warm Event' : 'La Niña Cold Event'} • Peak: {selectedLandmark.peakDate}
                </span>
                <h3 className="text-xl font-extrabold text-white mt-1">
                  {selectedLandmark.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLandmark(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              {selectedLandmark.description}
            </p>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                Documented Planetary Impacts:
              </h4>
              <ul className="space-y-1.5">
                {selectedLandmark.globalImpacts.map((impact, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{impact}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40 mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                Scientific Legacy:
              </h4>
              <p className="text-xs text-indigo-200/90 leading-relaxed">
                {selectedLandmark.scientificSignificance}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLandmark(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                Close &amp; Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Statistics Card Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px] block">El Niño Months</span>
          <span className="text-base font-bold text-rose-400 font-mono mt-0.5 block">
            {stats.elNinoMonths} <span className="text-[10px] text-slate-500 font-normal">({((stats.elNinoMonths / HISTORICAL_ONI_DATA.length) * 100).toFixed(0)}%)</span>
          </span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px] block">La Niña Months</span>
          <span className="text-base font-bold text-cyan-400 font-mono mt-0.5 block">
            {stats.laNinaMonths} <span className="text-[10px] text-slate-500 font-normal">({((stats.laNinaMonths / HISTORICAL_ONI_DATA.length) * 100).toFixed(0)}%)</span>
          </span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px] block">All-Time Peak Warm</span>
          <span className="text-base font-bold text-rose-300 font-mono mt-0.5 block">
            +{stats.maxONI.toFixed(1)} °C <span className="text-[10px] text-slate-500 font-normal">(2015)</span>
          </span>
        </div>
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px] block">All-Time Peak Cold</span>
          <span className="text-base font-bold text-cyan-300 font-mono mt-0.5 block">
            {stats.minONI.toFixed(1)} °C <span className="text-[10px] text-slate-500 font-normal">(1973)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
