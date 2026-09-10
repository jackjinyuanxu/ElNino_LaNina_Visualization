export type ENSOPhase = 'el-nino' | 'neutral' | 'la-nina';

export type ENSOIntensity = 'very-strong' | 'strong' | 'moderate' | 'weak' | 'neutral';

export interface ONIRecord {
  year: number;
  season: string; // e.g. "DJF", "JFM", "FMA", etc.
  monthIndex: number; // 0 to 11
  oni: number; // in Celsius anomaly
  phase: ENSOPhase;
  intensity: ENSOIntensity;
}

export interface LandmarkEvent {
  id: string;
  yearRange: string;
  name: string;
  phase: ENSOPhase;
  peakONI: number;
  peakDate: string;
  description: string;
  globalImpacts: string[];
  scientificSignificance: string;
}

export interface Teleconnection {
  id: string;
  region: string;
  lat: number;
  lng: number;
  elNinoImpact: {
    title: string;
    temperature: 'warmer' | 'cooler' | 'mixed';
    precipitation: 'wetter' | 'drier' | 'mixed';
    details: string;
    hazards: string[];
  };
  laNinaImpact: {
    title: string;
    temperature: 'warmer' | 'cooler' | 'mixed';
    precipitation: 'wetter' | 'drier' | 'mixed';
    details: string;
    hazards: string[];
  };
}

export interface SimulationParams {
  tradeWindStrength: number; // -100 (reversed) to 100 (normal) to 200 (extreme)
  westernWarmPoolTemp: number; // e.g. 28 - 32 °C
  easternUpwellingStrength: number; // 0 to 100%
  thermoclineTilt: number; // -50 to +100
  showWalkerCell: boolean;
  showThermocline: boolean;
  showUpwellingVectors: boolean;
  showWindVectors: boolean;
  showCloudConvection: boolean;
  showDepthLabels: boolean;
}

export interface TourStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  phase: ENSOPhase;
  focusArea: 'basin' | 'thermocline' | 'walker' | 'teleconnections';
  narrative: string[];
  keyTakeaway: string;
  recommendedParams: {
    tradeWindStrength: number;
    thermoclineTilt: number;
    showWalkerCell: boolean;
    showUpwellingVectors: boolean;
  };
}

