import React, { useState, useMemo } from 'react';
import { ENSOPhase, SimulationParams, ONIRecord, LandmarkEvent, Teleconnection } from './types/enso';
import { HISTORICAL_ONI_DATA, TOUR_STEPS, TELECONNECTIONS } from './data/ensoHistoricalData';
import { ThreePacificBasin } from './components/ThreePacificBasin';
import { ThreeGlobe } from './components/ThreeGlobe';
import { HistoricalTimeline } from './components/HistoricalTimeline';
import { PhysicsSandbox } from './components/PhysicsSandbox';
import { VirtualCTDProbe } from './components/VirtualCTDProbe';
import { PhaseComparisonTable } from './components/PhaseComparisonTable';
import { GuidedTourModal } from './components/GuidedTourModal';
import { SimpleExplainer } from './components/SimpleExplainer';
import { PhaseQuickCards } from './components/PhaseQuickCards';
import {
  Waves,
  Globe,
  Flame,
  Snowflake,
  RefreshCw,
  BookOpen,
  Sliders,
  TrendingUp,
  Columns,
  Layers,
  Thermometer,
  Wind,
  Info,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Compass,
  Table,
} from 'lucide-react';

export default function App() {
  // Main view modes
  const [activeTab, setActiveTab] = useState<'basin' | 'globe' | 'split'>('basin');

  // Active ENSO phase
  const [phase, setPhase] = useState<ENSOPhase>('neutral');

  // Continuous ONI anomaly (-2.5 to +2.5)
  const [oniValue, setOniValue] = useState<number>(0.0);

  // Simulation Parameters for the 3D engine
  const [simParams, setSimParams] = useState<SimulationParams>({
    tradeWindStrength: 100, // 100% normal
    westernWarmPoolTemp: 29.5,
    easternUpwellingStrength: 100,
    thermoclineTilt: 50, // 50 is normal slope
    showWalkerCell: true,
    showThermocline: true,
    showUpwellingVectors: true,
    showWindVectors: true,
    showCloudConvection: true,
    showDepthLabels: true,
  });

  // Selected historical record (defaults to recent or landmark)
  const [currentRecord, setCurrentRecord] = useState<ONIRecord>(() => {
    // Default to landmark 1997-1998 Super El Niño or latest
    return HISTORICAL_ONI_DATA.find((r) => r.year === 1997 && r.season === 'NDJ') || HISTORICAL_ONI_DATA[HISTORICAL_ONI_DATA.length - 1];
  });

  // Selected teleconnection for globe view
  const [selectedTeleconnection, setSelectedTeleconnection] = useState<Teleconnection | null>(null);

  // Guided Tour modal state
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  // State for deep dive tools
  const [deepDiveTab, setDeepDiveTab] = useState<'timeline' | 'probe' | 'sandbox' | 'table'>('timeline');
  const [isDeepDiveOpen, setIsDeepDiveOpen] = useState(false);

  // Preset Phase Switcher
  const handleSetPhasePreset = (newPhase: ENSOPhase) => {
    setPhase(newPhase);
    if (newPhase === 'el-nino') {
      setOniValue(2.0);
      setSimParams((prev) => ({
        ...prev,
        tradeWindStrength: -15, // Weak/reversed
        thermoclineTilt: 10, // Flat
      }));
    } else if (newPhase === 'la-nina') {
      setOniValue(-1.8);
      setSimParams((prev) => ({
        ...prev,
        tradeWindStrength: 175, // Supercharged
        thermoclineTilt: 90, // Steep
      }));
    } else {
      setOniValue(0.0);
      setSimParams((prev) => ({
        ...prev,
        tradeWindStrength: 100,
        thermoclineTilt: 50,
      }));
    }
  };

  // Continuous slider change for ONI
  const handleOniSliderChange = (newVal: number) => {
    setOniValue(newVal);
    let newPhase: ENSOPhase = 'neutral';
    if (newVal >= 0.5) newPhase = 'el-nino';
    else if (newVal <= -0.5) newPhase = 'la-nina';
    setPhase(newPhase);

    const wind = Math.round(100 - newVal * 55);
    const tilt = Math.round(50 - newVal * 25);
    setSimParams((prev) => ({
      ...prev,
      tradeWindStrength: wind,
      thermoclineTilt: Math.max(0, Math.min(100, tilt)),
    }));
  };

  // When selecting historical record from timeline
  const handleSelectRecord = (record: ONIRecord) => {
    setCurrentRecord(record);
    handleOniSliderChange(record.oni);
  };

  // When clicking landmark event
  const handleSelectLandmark = (event: LandmarkEvent) => {
    handleSetPhasePreset(event.phase);
    setOniValue(event.peakONI);
  };

  // Tour step navigation
  const handleSetTourStep = (index: number) => {
    setTourStepIndex(index);
    const step = TOUR_STEPS[index];
    if (step) {
      setPhase(step.phase);
      if (step.phase === 'el-nino') setOniValue(2.2);
      else if (step.phase === 'la-nina') setOniValue(-1.9);
      else setOniValue(0.1);

      setSimParams((prev) => ({
        ...prev,
        ...step.recommendedParams,
      }));

      if (step.focusArea === 'teleconnections') {
        setActiveTab('globe');
        setSelectedTeleconnection(TELECONNECTIONS[0]);
      } else {
        setActiveTab('basin');
      }
    }
  };

  return (
    <div id="enso-app" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                ENSO 3D
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                El Niño &amp; La Niña
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              The Pacific Ocean Wind &amp; Warm Water Seesaw Explained
            </p>
          </div>
        </div>

        {/* Center: Simple 3-Phase Switcher */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            id="nav-btn-la-nina"
            onClick={() => handleSetPhasePreset('la-nina')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              phase === 'la-nina'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>La Niña (Cold)</span>
          </button>
          <button
            id="nav-btn-neutral"
            onClick={() => handleSetPhasePreset('neutral')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              phase === 'neutral'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/60'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Normal</span>
          </button>
          <button
            id="nav-btn-el-nino"
            onClick={() => handleSetPhasePreset('el-nino')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              phase === 'el-nino'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>El Niño (Warm)</span>
          </button>
        </div>

        {/* Right: Masterclass & View Modes */}
        <div className="flex items-center gap-2">
          {/* Guided Tour Trigger */}
          <button
            id="btn-open-tour"
            onClick={() => {
              setIsTourOpen(true);
              handleSetTourStep(0);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/25 transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guided Tour</span>
          </button>

          {/* View Tab Selector */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('basin')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'basin'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="3D Ocean Seesaw Cutaway"
            >
              <Waves className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Pacific Cutaway</span>
            </button>
            <button
              onClick={() => setActiveTab('globe')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'globe'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="3D Earth & Global Weather Impacts"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Global Weather</span>
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                activeTab === 'split'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Side-by-Side Comparison"
            >
              <Columns className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Side-by-Side</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* The 30-Second Core Idea Explainer */}
        <SimpleExplainer
          phase={phase}
          oniValue={oniValue}
          onSelectPhase={handleSetPhasePreset}
        />

        {/* 3D Visualizer Stage */}
        <div className="w-full space-y-3">
          {activeTab === 'basin' && (
            <div className="h-[480px] sm:h-[540px] w-full">
              <ThreePacificBasin
                phase={phase}
                oniValue={oniValue}
                tradeWindStrength={simParams.tradeWindStrength}
                thermoclineTilt={simParams.thermoclineTilt}
                showWalkerCell={simParams.showWalkerCell}
                showThermocline={simParams.showThermocline}
                showUpwellingVectors={simParams.showUpwellingVectors}
                showWindVectors={simParams.showWindVectors}
                showCloudConvection={simParams.showCloudConvection}
                showDepthLabels={simParams.showDepthLabels}
              />
            </div>
          )}

          {activeTab === 'globe' && (
            <div className="h-[480px] sm:h-[540px] w-full">
              <ThreeGlobe
                phase={phase}
                oniValue={oniValue}
                selectedTeleconnection={selectedTeleconnection}
                onSelectTeleconnection={setSelectedTeleconnection}
              />
            </div>
          )}

          {activeTab === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[620px] lg:h-[520px] w-full">
              {/* El Niño Side */}
              <div className="relative h-full flex flex-col">
                <div className="absolute top-3 left-3 z-20 bg-rose-950/90 border border-rose-800/80 px-3 py-1 rounded-xl text-xs font-bold text-rose-300 shadow-md">
                  El Niño (Warm Phase: Winds Stalled, Water Sloshed East)
                </div>
                <ThreePacificBasin
                  phase="el-nino"
                  oniValue={2.2}
                  tradeWindStrength={-10}
                  thermoclineTilt={10}
                  showWalkerCell={true}
                  showThermocline={true}
                  showUpwellingVectors={false}
                  showWindVectors={true}
                  showCloudConvection={true}
                  showDepthLabels={false}
                />
              </div>

              {/* La Niña Side */}
              <div className="relative h-full flex flex-col">
                <div className="absolute top-3 left-3 z-20 bg-cyan-950/90 border border-cyan-800/80 px-3 py-1 rounded-xl text-xs font-bold text-cyan-300 shadow-md">
                  La Niña (Cold Phase: Powerful Winds, Water Pushed West)
                </div>
                <ThreePacificBasin
                  phase="la-nina"
                  oniValue={-2.0}
                  tradeWindStrength={180}
                  thermoclineTilt={90}
                  showWalkerCell={true}
                  showThermocline={true}
                  showUpwellingVectors={true}
                  showWindVectors={true}
                  showCloudConvection={true}
                  showDepthLabels={false}
                />
              </div>
            </div>
          )}

          {/* Interactive Ocean Seesaw Scrubber */}
          <div className="bg-slate-900/95 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Interactive Ocean Seesaw Dial
                </span>
                <span className="text-[11px] text-slate-400">
                  Drag to slosh the warm water pool back and forth
                </span>
              </div>
            </div>

            {/* Slider with plain English anchors */}
            <div className="flex-1 max-w-xl w-full flex items-center gap-3">
              <span className="text-[11px] font-bold text-cyan-400 shrink-0">
                ← La Niña (Cold)
              </span>
              <input
                id="slider-oni-dial"
                type="range"
                min="-2.5"
                max="2.5"
                step="0.05"
                value={oniValue}
                onChange={(e) => handleOniSliderChange(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-2.5 bg-gradient-to-r from-blue-600 via-emerald-500 to-rose-600 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[11px] font-bold text-rose-400 shrink-0">
                El Niño (Warm) →
              </span>
            </div>

            {/* Current reading pill */}
            <div className="shrink-0">
              <span
                className={`font-mono font-bold px-2.5 py-1 rounded-lg text-xs border ${
                  oniValue >= 0.5
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : oniValue <= -0.5
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {oniValue >= 0 ? `+${oniValue.toFixed(2)}` : oniValue.toFixed(2)}°C Anomaly
              </span>
            </div>
          </div>
        </div>

        {/* 3-State Quick Comparison Cards */}
        <PhaseQuickCards
          currentPhase={phase}
          onSelectPhase={handleSetPhasePreset}
        />

        {/* Deep Dive & Science Tools Section (Collapsible & Clean) */}
        <div className="pt-2">
          <div className="border border-slate-800 rounded-2xl bg-slate-900/90 overflow-hidden shadow-xl">
            <button
              onClick={() => setIsDeepDiveOpen(!isDeepDiveOpen)}
              className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Explore Further: NOAA Historical Data &amp; Ocean Science Tools</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                      Deep Dive
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    74-year historical climate timeline (1950–2024), ocean depth sounder, physics sandbox, and science table.
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                  isDeepDiveOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {isDeepDiveOpen && (
              <div className="p-4 sm:p-6 border-t border-slate-800 space-y-6 animate-in fade-in duration-200">
                {/* Secondary Tab Switcher */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
                  <button
                    onClick={() => setDeepDiveTab('timeline')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                      deepDiveTab === 'timeline'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Historical Records (1950–2024)</span>
                  </button>
                  <button
                    onClick={() => setDeepDiveTab('probe')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                      deepDiveTab === 'probe'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Thermometer className="w-3.5 h-3.5" />
                    <span>Ocean CTD Depth Probe</span>
                  </button>
                  <button
                    onClick={() => setDeepDiveTab('sandbox')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                      deepDiveTab === 'sandbox'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Physics Sandbox</span>
                  </button>
                  <button
                    onClick={() => setDeepDiveTab('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                      deepDiveTab === 'table'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Science Comparison Matrix</span>
                  </button>
                </div>

                {/* Sub-tab content */}
                {deepDiveTab === 'timeline' && (
                  <HistoricalTimeline
                    currentRecord={currentRecord}
                    onSelectRecord={handleSelectRecord}
                    onSelectLandmark={handleSelectLandmark}
                  />
                )}

                {deepDiveTab === 'probe' && (
                  <VirtualCTDProbe phase={phase} oniValue={oniValue} />
                )}

                {deepDiveTab === 'sandbox' && (
                  <PhysicsSandbox
                    phase={phase}
                    params={simParams}
                    onChangeParams={setSimParams}
                    onSetPhasePreset={handleSetPhasePreset}
                  />
                )}

                {deepDiveTab === 'table' && (
                  <PhaseComparisonTable
                    currentPhase={phase}
                    onSelectPhase={handleSetPhasePreset}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Guided Tour Modal */}
      <GuidedTourModal
        isOpen={isTourOpen}
        currentStepIndex={tourStepIndex}
        onClose={() => setIsTourOpen(false)}
        onSetStep={handleSetTourStep}
      />

      {/* Scientific Footer */}
      <footer className="mt-12 bg-slate-950 border-t border-slate-800/80 px-4 lg:px-8 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            ENSO 3D Climate Explorer • Grounded in NOAA Climate Prediction Center ERSSTv5 and TAO/TRITON buoy observations.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Niño 3.4 Region (5°N–5°S, 120°–170°W)</span>
            <span>•</span>
            <span>Walker Circulation Dynamics</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
