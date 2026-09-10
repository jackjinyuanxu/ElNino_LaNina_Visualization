import { ONIRecord, LandmarkEvent, Teleconnection, ENSOPhase, ENSOIntensity, TourStep } from '../types/enso';
export type { TourStep };

// Helper to determine phase and intensity based on ONI
export function classifyONI(oni: number): { phase: ENSOPhase; intensity: ENSOIntensity } {
  if (oni >= 2.0) return { phase: 'el-nino', intensity: 'very-strong' };
  if (oni >= 1.5) return { phase: 'el-nino', intensity: 'strong' };
  if (oni >= 1.0) return { phase: 'el-nino', intensity: 'moderate' };
  if (oni >= 0.5) return { phase: 'el-nino', intensity: 'weak' };
  if (oni <= -2.0) return { phase: 'la-nina', intensity: 'very-strong' };
  if (oni <= -1.5) return { phase: 'la-nina', intensity: 'strong' };
  if (oni <= -1.0) return { phase: 'la-nina', intensity: 'moderate' };
  if (oni <= -0.5) return { phase: 'la-nina', intensity: 'weak' };
  return { phase: 'neutral', intensity: 'neutral' };
}

// NOAA CPC Oceanic Niño Index (ONI) 3-Month Running Mean SST Anomalies (1950-2024)
// Seasons: DJF, JFM, FMA, MAM, AMJ, MJJ, JJA, JAS, ASO, SON, OND, NDJ
export const SEASONS = ['DJF', 'JFM', 'FMA', 'MAM', 'AMJ', 'MJJ', 'JJA', 'JAS', 'ASO', 'SON', 'OND', 'NDJ'];

// Compact authentic historical records matrix [Year, [12 monthly/seasonal values]]
const rawOniData: [number, number[]][] = [
  [1950, [-1.7, -1.5, -1.3, -1.4, -1.4, -1.1, -0.8, -0.8, -0.8, -0.9, -0.9, -1.0]],
  [1951, [-1.0, -0.9, -0.5, -0.2, 0.2, 0.4, 0.6, 0.7, 0.8, 0.8, 0.7, 0.6]],
  [1952, [0.4, 0.3, 0.2, 0.1, 0.0, -0.1, 0.0, 0.1, 0.1, 0.1, 0.0, 0.1]],
  [1953, [0.4, 0.5, 0.6, 0.6, 0.7, 0.7, 0.7, 0.7, 0.8, 0.8, 0.8, 0.7]],
  [1954, [0.7, 0.4, -0.1, -0.6, -0.8, -0.7, -0.7, -0.8, -1.0, -1.1, -1.1, -1.2]],
  [1955, [-1.1, -0.9, -0.9, -1.0, -1.2, -1.2, -1.0, -0.9, -1.2, -1.6, -1.9, -1.9]],
  [1956, [-1.4, -1.0, -0.7, -0.6, -0.6, -0.6, -0.6, -0.6, -0.6, -0.6, -0.6, -0.5]],
  [1957, [-0.4, -0.1, 0.3, 0.6, 0.8, 1.0, 1.1, 1.2, 1.2, 1.3, 1.5, 1.6]],
  [1958, [1.7, 1.5, 1.2, 0.8, 0.7, 0.6, 0.5, 0.4, 0.4, 0.5, 0.6, 0.6]],
  [1959, [0.6, 0.5, 0.4, 0.2, 0.1, -0.2, -0.3, -0.3, -0.2, -0.1, -0.1, -0.1]],
  [1960, [-0.1, -0.2, -0.2, -0.1, -0.2, -0.2, 0.0, 0.1, 0.1, 0.1, 0.0, -0.1]],
  [1961, [-0.1, -0.1, -0.1, -0.1, 0.0, 0.1, 0.0, -0.1, -0.3, -0.4, -0.3, -0.3]],
  [1962, [-0.3, -0.2, -0.2, -0.3, -0.4, -0.3, -0.2, -0.2, -0.3, -0.4, -0.5, -0.5]],
  [1963, [-0.5, -0.3, -0.1, 0.1, 0.2, 0.4, 0.7, 0.9, 1.0, 1.1, 1.2, 1.2]],
  [1964, [1.0, 0.6, 0.1, -0.4, -0.7, -0.8, -0.8, -0.9, -1.0, -1.1, -1.2, -1.2]],
  [1965, [-1.0, -0.6, -0.2, 0.1, 0.4, 0.7, 1.0, 1.2, 1.4, 1.6, 1.8, 1.7]],
  [1966, [1.4, 1.1, 0.8, 0.5, 0.2, 0.1, 0.0, -0.1, -0.1, -0.1, -0.2, -0.2]],
  [1967, [-0.3, -0.4, -0.4, -0.3, -0.2, -0.1, 0.0, 0.0, -0.1, -0.3, -0.4, -0.5]],
  [1968, [-0.7, -0.7, -0.5, -0.4, -0.2, 0.1, 0.4, 0.5, 0.6, 0.7, 0.9, 1.0]],
  [1969, [1.0, 1.0, 0.9, 0.7, 0.6, 0.5, 0.4, 0.4, 0.6, 0.7, 0.7, 0.7]],
  [1970, [0.5, 0.3, 0.2, 0.1, -0.1, -0.4, -0.7, -0.8, -0.8, -0.8, -0.9, -1.1]],
  [1971, [-1.4, -1.4, -1.2, -1.0, -0.8, -0.7, -0.7, -0.6, -0.6, -0.7, -0.9, -1.0]],
  [1972, [-0.8, -0.5, -0.2, 0.3, 0.7, 0.9, 1.1, 1.3, 1.5, 1.8, 2.0, 2.1]],
  [1973, [1.8, 1.2, 0.5, -0.1, -0.6, -0.9, -1.1, -1.3, -1.4, -1.7, -2.0, -2.1]],
  [1974, [-1.9, -1.6, -1.2, -1.0, -0.9, -0.7, -0.6, -0.5, -0.5, -0.7, -0.8, -0.7]],
  [1975, [-0.6, -0.6, -0.7, -0.8, -1.0, -1.1, -1.2, -1.2, -1.4, -1.5, -1.6, -1.7]],
  [1976, [-1.6, -1.2, -0.8, -0.6, -0.5, -0.2, 0.1, 0.3, 0.5, 0.7, 0.8, 0.8]],
  [1977, [0.7, 0.6, 0.4, 0.3, 0.3, 0.4, 0.4, 0.4, 0.5, 0.6, 0.7, 0.8]],
  [1978, [0.7, 0.4, 0.1, -0.2, -0.3, -0.3, -0.4, -0.4, -0.4, -0.3, -0.1, 0.0]],
  [1979, [0.0, 0.1, 0.2, 0.3, 0.3, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.5]],
  [1980, [0.5, 0.4, 0.3, 0.4, 0.4, 0.4, 0.3, 0.1, 0.0, 0.0, 0.0, -0.1]],
  [1981, [-0.3, -0.4, -0.4, -0.3, -0.2, -0.2, -0.3, -0.3, -0.2, -0.1, -0.1, 0.0]],
  [1982, [0.0, 0.1, 0.2, 0.5, 0.7, 0.8, 1.0, 1.3, 1.6, 1.9, 2.1, 2.2]],
  [1983, [2.2, 1.9, 1.5, 1.2, 1.0, 0.6, 0.2, -0.2, -0.6, -0.8, -0.9, -0.7]],
  [1984, [-0.6, -0.4, -0.3, -0.4, -0.5, -0.4, -0.3, -0.2, -0.3, -0.6, -0.9, -1.1]],
  [1985, [-1.0, -0.8, -0.7, -0.7, -0.6, -0.5, -0.4, -0.4, -0.4, -0.4, -0.4, -0.4]],
  [1986, [-0.5, -0.4, -0.2, -0.1, 0.0, 0.3, 0.5, 0.7, 0.9, 1.0, 1.1, 1.2]],
  [1987, [1.2, 1.2, 1.1, 1.0, 1.0, 1.2, 1.4, 1.6, 1.6, 1.4, 1.2, 1.0]],
  [1988, [0.7, 0.5, 0.1, -0.3, -0.8, -1.2, -1.3, -1.2, -1.3, -1.6, -1.8, -1.9]],
  [1989, [-1.7, -1.4, -1.1, -0.9, -0.6, -0.4, -0.3, -0.3, -0.3, -0.3, -0.2, -0.1]],
  [1990, [0.1, 0.2, 0.2, 0.2, 0.2, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.4]],
  [1991, [0.4, 0.3, 0.2, 0.3, 0.5, 0.6, 0.7, 0.7, 0.7, 0.8, 1.2, 1.5]],
  [1992, [1.7, 1.6, 1.5, 1.3, 1.1, 0.7, 0.3, 0.1, -0.1, -0.2, -0.3, -0.1]],
  [1993, [0.1, 0.3, 0.5, 0.7, 0.7, 0.6, 0.4, 0.3, 0.3, 0.3, 0.2, 0.1]],
  [1994, [0.1, 0.1, 0.2, 0.3, 0.4, 0.4, 0.4, 0.4, 0.6, 0.8, 1.0, 1.1]],
  [1995, [1.0, 0.7, 0.5, 0.3, 0.1, -0.1, -0.3, -0.5, -0.8, -0.9, -1.0, -0.9]],
  [1996, [-0.8, -0.7, -0.6, -0.4, -0.3, -0.2, -0.2, -0.3, -0.3, -0.3, -0.4, -0.5]],
  [1997, [-0.5, -0.4, -0.1, 0.3, 0.8, 1.3, 1.7, 2.0, 2.2, 2.4, 2.5, 2.4]],
  [1998, [2.2, 1.9, 1.4, 1.0, 0.5, -0.1, -0.8, -1.1, -1.3, -1.4, -1.5, -1.6]],
  [1999, [-1.6, -1.4, -1.1, -0.9, -0.9, -1.0, -1.1, -1.1, -1.2, -1.3, -1.6, -1.7]],
  [2000, [-1.7, -1.5, -1.2, -0.9, -0.7, -0.6, -0.5, -0.5, -0.6, -0.6, -0.7, -0.7]],
  [2001, [-0.7, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1, -0.1, -0.2, -0.3, -0.3, -0.3]],
  [2002, [-0.2, 0.0, 0.1, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0, 1.2, 1.3, 1.1]],
  [2003, [0.9, 0.6, 0.4, 0.0, -0.2, -0.1, 0.1, 0.2, 0.3, 0.4, 0.4, 0.4]],
  [2004, [0.4, 0.3, 0.2, 0.1, 0.1, 0.2, 0.4, 0.6, 0.7, 0.7, 0.7, 0.7]],
  [2005, [0.6, 0.4, 0.3, 0.1, -0.2, -0.2, -0.2, -0.2, -0.2, -0.4, -0.7, -0.8]],
  [2006, [-0.8, -0.7, -0.5, -0.3, -0.1, 0.0, 0.1, 0.3, 0.5, 0.8, 1.0, 1.0]],
  [2007, [0.7, 0.3, -0.1, -0.3, -0.4, -0.5, -0.6, -0.8, -1.1, -1.3, -1.4, -1.5]],
  [2008, [-1.6, -1.5, -1.3, -1.0, -0.7, -0.4, -0.2, -0.2, -0.3, -0.5, -0.7, -0.8]],
  [2009, [-0.8, -0.7, -0.5, -0.2, 0.1, 0.4, 0.5, 0.6, 0.7, 1.0, 1.3, 1.6]],
  [2010, [1.5, 1.3, 0.9, 0.4, -0.1, -0.6, -1.0, -1.3, -1.6, -1.6, -1.6, -1.6]],
  [2011, [-1.4, -1.2, -0.9, -0.7, -0.5, -0.4, -0.5, -0.6, -0.8, -1.0, -1.1, -1.0]],
  [2012, [-0.8, -0.6, -0.5, -0.3, -0.1, 0.1, 0.3, 0.3, 0.3, 0.1, -0.2, -0.4]],
  [2013, [-0.4, -0.4, -0.3, -0.3, -0.4, -0.4, -0.4, -0.3, -0.3, -0.2, -0.2, -0.3]],
  [2014, [-0.4, -0.5, -0.3, 0.0, 0.2, 0.2, 0.1, 0.1, 0.2, 0.5, 0.7, 0.7]],
  [2015, [0.6, 0.6, 0.6, 0.8, 1.1, 1.3, 1.6, 1.9, 2.2, 2.4, 2.6, 2.6]],
  [2016, [2.5, 2.2, 1.7, 1.0, 0.5, 0.0, -0.4, -0.6, -0.7, -0.8, -0.8, -0.6]],
  [2017, [-0.3, -0.2, 0.1, 0.2, 0.3, 0.3, 0.1, -0.1, -0.4, -0.7, -0.9, -1.0]],
  [2018, [-0.9, -0.8, -0.6, -0.4, -0.2, 0.0, 0.1, 0.2, 0.5, 0.8, 0.9, 0.8]],
  [2019, [0.7, 0.7, 0.7, 0.7, 0.5, 0.5, 0.3, 0.1, 0.2, 0.3, 0.5, 0.5]],
  [2020, [0.5, 0.5, 0.4, 0.2, -0.1, -0.3, -0.4, -0.6, -0.9, -1.2, -1.3, -1.2]],
  [2021, [-1.0, -0.9, -0.8, -0.7, -0.5, -0.4, -0.4, -0.5, -0.7, -0.8, -1.0, -1.0]],
  [2022, [-1.0, -0.9, -1.0, -1.1, -1.0, -0.9, -0.8, -0.9, -1.0, -1.0, -0.9, -0.8]],
  [2023, [-0.7, -0.4, -0.1, 0.2, 0.5, 0.8, 1.1, 1.3, 1.6, 1.8, 1.9, 2.0]],
  [2024, [1.8, 1.5, 1.1, 0.7, 0.3, -0.1, -0.3, -0.4, -0.5, -0.6, -0.5, -0.4]],
];

// Flatten into individual records
export const HISTORICAL_ONI_DATA: ONIRecord[] = rawOniData.flatMap(([year, months]) =>
  months.map((oni, monthIndex) => {
    const { phase, intensity } = classifyONI(oni);
    return {
      year,
      season: SEASONS[monthIndex],
      monthIndex,
      oni,
      phase,
      intensity,
    };
  })
);

// Landmark Historical ENSO Events
export const LANDMARK_EVENTS: LandmarkEvent[] = [
  {
    id: 'super-1997-1998',
    yearRange: '1997–1998',
    name: '1997–1998 Super El Niño',
    phase: 'el-nino',
    peakONI: 2.5,
    peakDate: 'November 1997',
    description:
      'Widely regarded as the benchmark "Super El Niño" of the 20th century. Equatorial Pacific sea surface temperatures soared up to 5°C above average locally, causing massive disruptions to global atmospheric circulation.',
    globalImpacts: [
      'Devastating flooding and coastal erosion in California, Peru, and Ecuador.',
      'Record catastrophic wildfires in Indonesia and Malaysia fueled by unprecedented drought.',
      'Global coral bleaching event destroying ~16% of the world’s reef systems in a single year.',
      'Substantial collapse of the Peruvian anchoveta fisheries due to suppressed coastal upwelling.',
    ],
    scientificSignificance:
      'Catalyzed the completion of the Tropical Atmosphere Ocean (TAO) moored buoy array, giving meteorologists their first real-time ocean basin monitoring system.',
  },
  {
    id: 'godzilla-2015-2016',
    yearRange: '2015–2016',
    name: '2015–2016 Godzilla El Niño',
    phase: 'el-nino',
    peakONI: 2.6,
    peakDate: 'November 2015',
    description:
      'Tied or exceeded 1997 in raw peak ONI anomaly (+2.6°C). Occurring against a backdrop of ongoing human-induced global warming, this event drove 2016 to become the hottest year recorded up to that date.',
    globalImpacts: [
      'Unprecedented back-to-back coral bleaching on Australia’s Great Barrier Reef.',
      'Severe droughts across Southern Africa, Southeast Asia, and northern South America.',
      'Hyperactive Central & Eastern Pacific hurricane season (Hurricane Patricia, strongest wind speeds ever recorded in Western Hemisphere).',
    ],
    scientificSignificance:
      'Revealed how anthropogenic ocean heat content amplification interacts with natural climate oscillations, sustaining anomalous warmth for over 18 months.',
  },
  {
    id: 'event-1982-1983',
    yearRange: '1982–1983',
    name: '1982–1983 Historic El Niño',
    phase: 'el-nino',
    peakONI: 2.2,
    peakDate: 'December 1982',
    description:
      'A surprise super-event that caught scientists off-guard because the dust cloud from the El Chichón volcanic eruption obscured satellite sensors, masking the warming ocean.',
    globalImpacts: [
      'Catastrophic drought and dust storms in eastern Australia (Ash Wednesday bushfires).',
      'Torrents of rain and landslides in Ecuador and northern Peru.',
      'Estimated global economic damage exceeding $8 billion USD (1983 currency).',
    ],
    scientificSignificance:
      'Revolutionized oceanographic research, proving that El Niño is not merely a local Peruvian coastal quirk, but a coupled ocean-atmosphere planetary phenomenon.',
  },
  {
    id: 'recent-2023-2024',
    yearRange: '2023–2024',
    name: '2023–2024 Intense El Niño',
    phase: 'el-nino',
    peakONI: 2.0,
    peakDate: 'December 2023',
    description:
      'Rapidly developed from a three-year La Niña directly into a strong El Niño, combining with record-high global sea surface temperatures and driving historic global temperature spikes.',
    globalImpacts: [
      'Severe drought in the Amazon Basin causing record-low river water levels.',
      'Heavy rainfall and atmospheric rivers striking the US West Coast and East Africa.',
      'Disruption of trade through the Panama Canal due to critical lake drought.',
    ],
    scientificSignificance:
      'Demonstrated transition dynamics from multi-year cold state to supercharged warm state under all-time high ocean heat content.',
  },
  {
    id: 'triple-dip-2020-2023',
    yearRange: '2020–2023',
    name: '2020–2023 "Triple-Dip" La Niña',
    phase: 'la-nina',
    peakONI: -1.3,
    peakDate: 'October 2020 & 2022',
    description:
      'A rare, relentless three-consecutive-year La Niña. Cold upwelling persisted across the equatorial Pacific, locking global weather patterns in place for 36 continuous months.',
    globalImpacts: [
      'Prolonged historic megadrought across the US Southwest and Horn of Africa.',
      'Record catastrophic flooding in Eastern Australia (Brisbane & Lismore floods).',
      'Hyperactive Atlantic hurricane seasons in 2020 and 2021 with record storm counts.',
    ],
    scientificSignificance:
      'Highlighted the multi-year memory of sub-surface ocean heat deficits and challenged prevailing climate model predictions regarding the frequency of multi-year cold events.',
  },
  {
    id: 'deep-1973-1976',
    yearRange: '1973–1976',
    name: '1973–1976 Historic La Niña',
    phase: 'la-nina',
    peakONI: -2.1,
    peakDate: 'December 1973',
    description:
      'One of the most intense and sustained cold phases on modern instrument record, with ONI dipping below -2.0°C and cold anomalies dominating the tropics for over three years.',
    globalImpacts: [
      'Extreme monsoonal flooding in Southeast Asia and parts of India.',
      'Unusually harsh winters in mid-latitude North America.',
      'Remarkable resurgence of cold-water marine biodiversity along the Humboldt Current.',
    ],
    scientificSignificance:
      'Provided benchmark observational data for the oceanic thermocline steepening and equatorial Kelvin/Rossby wave reflections.',
  },
  {
    id: 'classic-1988-1989',
    yearRange: '1988–1989',
    name: '1988–1989 Strong La Niña',
    phase: 'la-nina',
    peakONI: -1.9,
    peakDate: 'November 1988',
    description:
      'A textbook strong La Niña immediately following the 1986–87 El Niño, triggering a sharp atmospheric response across North America.',
    globalImpacts: [
      'Catastrophic North American drought in the summer of 1988 causing massive crop loss.',
      'Yellowstone National Park historic mega-wildfires.',
      'Active North Atlantic hurricane season with Category 5 Hurricane Gilbert.',
    ],
    scientificSignificance:
      'Demonstrated how rapidly the equatorial Pacific can swing between extreme warm and extreme cold phases within a 12-month span.',
  },
];

// Global Teleconnection Locations & Impacts
export const TELECONNECTIONS: Teleconnection[] = [
  {
    id: 'peru-ecuador',
    region: 'Coastal Peru & Ecuador',
    lat: -8.0,
    lng: -79.0,
    elNinoImpact: {
      title: 'Devastating Rains & Fisheries Collapse',
      temperature: 'warmer',
      precipitation: 'wetter',
      details:
        'Warm water shuts off nutrient upwelling. Anchoveta fish migrate or perish, crashing seabird populations. Extreme torrential rains cause coastal flash floods and mudslides.',
      hazards: ['Severe mudslides (huaicos)', 'Fisheries collapse', 'Malaria/dengue outbreaks'],
    },
    laNinaImpact: {
      title: 'Bountiful Fisheries & Arid Coast',
      temperature: 'cooler',
      precipitation: 'drier',
      details:
        'Vigorous coastal upwelling brings ice-cold, nitrate-rich water to the surface. Plankton blooms fuel the most productive marine ecosystem on Earth; coastal desert remains bone-dry.',
      hazards: ['Intensified coastal aridity', 'Cold sea fog (garúa)'],
    },
  },
  {
    id: 'indonesia-australia',
    region: 'Maritime Continent & Australia',
    lat: -4.0,
    lng: 120.0,
    elNinoImpact: {
      title: 'Drought, Heatwaves & Peatland Fires',
      temperature: 'warmer',
      precipitation: 'drier',
      details:
        'Convection shifts eastward away from the region. Sinking atmospheric motion suppresses rainfall, leading to failed crops, dry river basins, and choking peat forest smoke plumes.',
      hazards: ['Catastrophic bushfires', 'Crop failures', 'Severe regional haze'],
    },
    laNinaImpact: {
      title: 'Monsoonal Deluges & Flooding',
      temperature: 'cooler',
      precipitation: 'wetter',
      details:
        'Supercharged warm pool directly over Indonesia fuels massive deep thunderstorm clusters. Enhanced trade winds drive moisture ashore, causing widespread river flooding.',
      hazards: ['Major river flooding', 'Tropical cyclones near Queensland', 'Infrastructure washouts'],
    },
  },
  {
    id: 'california-sw-us',
    region: 'California & US Southwest',
    lat: 36.0,
    lng: -119.0,
    elNinoImpact: {
      title: 'Atmospheric Rivers & Sierra Snowpack',
      temperature: 'cooler',
      precipitation: 'wetter',
      details:
        'The Pacific jet stream extends eastward and shifts southward, aiming a moisture "firehose" directly into Central and Southern California, replenishing reservoirs.',
      hazards: ['Debris flows / landslides', 'Coastal surge erosion', 'River flooding'],
    },
    laNinaImpact: {
      title: 'Severe Drought & Escalated Wildfire Risk',
      temperature: 'warmer',
      precipitation: 'drier',
      details:
        'High pressure ridge in the eastern Pacific blocks storms north into the Pacific Northwest, starving California and the Southwest of vital winter snowpack.',
      hazards: ['Prolonged megadrought', 'Extreme wildfire seasons', 'Reservoir depletion'],
    },
  },
  {
    id: 'us-northern-tier',
    region: 'Northern US & Canada',
    lat: 48.0,
    lng: -100.0,
    elNinoImpact: {
      title: 'Mild Winters & Below-Normal Snow',
      temperature: 'warmer',
      precipitation: 'drier',
      details:
        'Polar jet stream stays anchored north over Canada. Arctic air intrusions are infrequent, leading to warmer-than-average winter temperatures and lighter snowfall.',
      hazards: ['Reduced winter sports economy', 'Early spring snowmelt', 'Winter tick persistence'],
    },
    laNinaImpact: {
      title: 'Polar Vortex Outbreaks & Heavy Snow',
      temperature: 'cooler',
      precipitation: 'wetter',
      details:
        'A wave-like jet stream permits frequent deep Arctic polar air spills down into the Midwest and Great Lakes, producing bitter cold snaps and lake-effect blizzards.',
      hazards: ['Extreme wind chills', 'Severe ice storms', 'Transport groundings'],
    },
  },
  {
    id: 'atlantic-basin',
    region: 'Tropical North Atlantic & Caribbean',
    lat: 18.0,
    lng: -55.0,
    elNinoImpact: {
      title: 'Suppressed Hurricane Activity',
      temperature: 'warmer',
      precipitation: 'drier',
      details:
        'Strong upper-level westerly winds blow across the Caribbean and tropical Atlantic, creating hostile vertical wind shear that tears budding tropical cyclones apart.',
      hazards: ['Caribbean drought', 'Reduced cyclone count (though intense storms can still form)'],
    },
    laNinaImpact: {
      title: 'Hyperactive Atlantic Hurricane Seasons',
      temperature: 'cooler',
      precipitation: 'wetter',
      details:
        'Vertical wind shear plunges to near-zero and atmospheric instability rises, allowing tropical waves off Africa to rapidly organize into major hurricanes.',
      hazards: ['Increased major hurricane landfalls', 'Catastrophic storm surges', 'Widespread power outages'],
    },
  },
  {
    id: 'amazon-basin',
    region: 'Amazon Rainforest',
    lat: -3.5,
    lng: -62.0,
    elNinoImpact: {
      title: 'Severe Drought & Forest Flammability',
      temperature: 'warmer',
      precipitation: 'drier',
      details:
        'Altered Walker circulation causes dry descending air over northern South America, drastically curtailing wet season rainfall and turning typically humid forest understories flammable.',
      hazards: ['Unprecedented forest wildfires', 'Stranded river communities', 'Biodiversity loss'],
    },
    laNinaImpact: {
      title: 'High Humidity & Elevated River Swells',
      temperature: 'cooler',
      precipitation: 'wetter',
      details:
        'Enhanced moisture transport from the Atlantic fuels steady precipitation across the Amazon basin, swelling the Amazon and Rio Negro rivers.',
      hazards: ['Extensive floodplain inundation', 'Disrupted river trade'],
    },
  },
  {
    id: 'horn-of-africa',
    region: 'Horn of Africa (Kenya, Somalia, Ethiopia)',
    lat: 4.0,
    lng: 43.0,
    elNinoImpact: {
      title: 'Elevated Rainfall & Flooding',
      temperature: 'warmer',
      precipitation: 'wetter',
      details:
        'Enhanced short rains (October-December) bring much-needed moisture to parched rangelands, but often culminate in intense localized flash flooding.',
      hazards: ['Flash floods', 'Rift Valley fever outbreaks', 'Livestock washouts'],
    },
    laNinaImpact: {
      title: 'Consecutive Failed Rainy Seasons & Famine',
      temperature: 'warmer',
      precipitation: 'drier',
      details:
        'Subsidence suppresses convective rainfall during both primary rainy seasons. Consecutive failed seasons trigger devastating humanitarian crises and pasture failure.',
      hazards: ['Extreme drought', 'Widespread crop failure', 'Severe pastoralist distress'],
    },
  },
];

// Guided Tour Chapters
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'intro-neutral',
    stepNumber: 1,
    title: 'The Equatorial Pacific Engine',
    subtitle: 'Neutral / Normal Pacific State',
    phase: 'neutral',
    focusArea: 'basin',
    narrative: [
      'The Pacific Ocean spans nearly halfway around Earth’s equator. Under normal conditions, steady Easterly Trade Winds blow perpetually from east to west across the tropical Pacific.',
      'These winds drag sun-warmed surface water into a massive reservoir known as the Western Pacific Warm Pool (near Indonesia and northern Australia), where sea surface temperatures hover between 29°C and 30°C.',
      'As warm surface water is dragged westward, cold, nutrient-rich deep water is pulled upward along the coast of South America (Peru and Ecuador) in a process called coastal upwelling.',
    ],
    keyTakeaway:
      'Trade winds create an east-west temperature contrast: warm water in the west (~30°C) and cool water in the east (~22°C).',
    recommendedParams: {
      tradeWindStrength: 100,
      thermoclineTilt: 50,
      showWalkerCell: true,
      showUpwellingVectors: true,
    },
  },
  {
    id: 'intro-thermocline',
    stepNumber: 2,
    title: 'The Oceanic Thermocline',
    subtitle: 'The Invisible Boundary Beneath the Waves',
    phase: 'neutral',
    focusArea: 'thermocline',
    narrative: [
      'Beneath the sunlit ocean surface lies the "Thermocline" — a sharp transition zone separating the warm, well-mixed surface layer from the vast, frigid abyssal ocean (2°C to 4°C).',
      'In normal conditions, the thermocline is strongly tilted: it is pushed deep down to 150–200 meters in the Western Pacific by the heavy accumulation of warm water, but sits just 30–50 meters below the surface in the Eastern Pacific.',
      'This shallow eastern thermocline makes it easy for wind-driven upwelling to tap into nutrient-dense, icy waters, creating the world’s most prolific anchovy and marine fisheries off South America.',
    ],
    keyTakeaway:
      'The thermocline slope acts like a dynamic see-saw across the 15,000-kilometer expanse of the equatorial Pacific.',
    recommendedParams: {
      tradeWindStrength: 100,
      thermoclineTilt: 50,
      showWalkerCell: false,
      showUpwellingVectors: true,
    },
  },
  {
    id: 'intro-walker',
    stepNumber: 3,
    title: 'The Atmospheric Walker Circulation',
    subtitle: 'Coupling the Atmosphere with the Ocean',
    phase: 'neutral',
    focusArea: 'walker',
    narrative: [
      'The ocean does not act alone. Warm water in the west heats the air above it, causing intense moist air convection (rising motion) and creating towering cumulonimbus clouds and monsoon rains.',
      'After dumping its moisture, this air travels eastward at high altitudes (12–15 km up) toward South America, where it cools and sinks over the cold eastern waters.',
      'At the surface, this dry descending air flows back westward as the easterly trade winds, completing the loop. This giant convective atmospheric wheel is named the Walker Circulation after Sir Gilbert Walker.',
    ],
    keyTakeaway:
      'The Bjerknes Feedback: Strong trade winds push warm water west -> deeper warm pool boosts convection -> stronger convection drives even stronger trade winds!',
    recommendedParams: {
      tradeWindStrength: 100,
      thermoclineTilt: 50,
      showWalkerCell: true,
      showUpwellingVectors: false,
    },
  },
  {
    id: 'el-nino-breakdown',
    stepNumber: 4,
    title: 'El Niño: The System Collapses & Reverses',
    subtitle: 'The Warm Phase of ENSO',
    phase: 'el-nino',
    focusArea: 'basin',
    narrative: [
      'Every 2 to 7 years, this delicate equilibrium breaks down. Trade winds weaken, stall, or even reverse into westerly wind bursts.',
      'Without the easterly wind push holding it back, the vast Western Pacific warm pool sloshes back across the Pacific eastward as massive sub-surface internal waves known as oceanic Kelvin Waves.',
      'The thermocline flattens out: it deepens dramatically in the east (up to 150m) and shoals in the west. Deep cold upwelling off Peru is cut off from the surface by a thick cap of warm water, devastating marine life and causing torrential coastal rain.',
      'Convection and rain clouds follow the warm water east, leaving Indonesia and Australia parched with severe drought and bushfires.',
    ],
    keyTakeaway:
      'El Niño is characterized by anomalously warm central/eastern Pacific waters (ONI ≥ +0.5°C), collapsed trade winds, and a flattened thermocline.',
    recommendedParams: {
      tradeWindStrength: -20,
      thermoclineTilt: 0,
      showWalkerCell: true,
      showUpwellingVectors: false,
    },
  },
  {
    id: 'la-nina-overdrive',
    stepNumber: 5,
    title: 'La Niña: The Pacific in Overdrive',
    subtitle: 'The Cold Phase of ENSO',
    phase: 'la-nina',
    focusArea: 'basin',
    narrative: [
      'La Niña represents the exact opposite extreme. Here, the normal easterly trade winds blow with exceptional vigor, supercharging the oceanic engine.',
      'Warm surface water is violently shoved far to the west, stacking up against Indonesia and the Philippines. The thermocline tilts to an extreme angle: dipping past 200m in the west and surfacing to within 20m in the east.',
      'Cold water upwelling along Peru and the equator is turbocharged, sending an intense tongue of icy water thousands of miles into the central Pacific.',
      'Walker circulation convection is compressed tightly over Australia and Southeast Asia, unleashing historic monsoons and floods, while the Americas face severe drought.',
    ],
    keyTakeaway:
      'La Niña features unusually cold central/eastern Pacific waters (ONI ≤ -0.5°C), supercharged trade winds, and an extremely steep thermocline.',
    recommendedParams: {
      tradeWindStrength: 170,
      thermoclineTilt: 90,
      showWalkerCell: true,
      showUpwellingVectors: true,
    },
  },
  {
    id: 'global-teleconnections',
    stepNumber: 6,
    title: 'Global Teleconnections',
    subtitle: 'How a Tropical Slosh Alters Global Weather',
    phase: 'el-nino',
    focusArea: 'teleconnections',
    narrative: [
      'Because the Pacific tropical convection zone pumps colossal amounts of heat and moisture into the upper troposphere, moving it shifts the entire planetary jet stream.',
      'During El Niño, the subtropical jet stream strengthens and extends across the southern US, bringing winter storms to California, Texas, and Florida, while steering Atlantic hurricanes away with strong wind shear.',
      'During La Niña, the polar jet stream dips erratically, fueling extreme winter outbreaks in the northern US, drought in the Southwest, and hyperactive Atlantic hurricane seasons.',
    ],
    keyTakeaway:
      'ENSO is the single most powerful year-to-year natural driver of global weather extremes on planet Earth.',
    recommendedParams: {
      tradeWindStrength: -10,
      thermoclineTilt: 10,
      showWalkerCell: true,
      showUpwellingVectors: false,
    },
  },
];
