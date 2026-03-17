/**
 * Approximate center coordinates and display radius for US states, territories,
 * and key countries. Used to render colored overlays on the map.
 *
 * radius is in meters — approximates the visual "footprint" of each region
 * on the map so the circle is recognizable but doesn't obscure neighbors.
 */

export interface JurisdictionGeo {
  latitude: number;
  longitude: number;
  /** Radius in meters for the circle overlay */
  radius: number;
  /** Initial map region to focus when tapping this jurisdiction */
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export const JURISDICTION_GEO: Record<string, JurisdictionGeo> = {
  // ─── US States ─────────────────────────────────────────────────────────────
  'Alabama': {
    latitude: 32.806671, longitude: -86.791130, radius: 160000,
    region: { latitude: 32.8, longitude: -86.8, latitudeDelta: 4.5, longitudeDelta: 4.5 },
  },
  'Alaska': {
    latitude: 61.370716, longitude: -152.404419, radius: 700000,
    region: { latitude: 61.4, longitude: -152.4, latitudeDelta: 22, longitudeDelta: 22 },
  },
  'Arizona': {
    latitude: 33.729759, longitude: -111.431221, radius: 240000,
    region: { latitude: 33.7, longitude: -111.4, latitudeDelta: 6.5, longitudeDelta: 6.5 },
  },
  'Arkansas': {
    latitude: 34.969704, longitude: -92.373123, radius: 160000,
    region: { latitude: 35.0, longitude: -92.4, latitudeDelta: 4, longitudeDelta: 4 },
  },
  'California': {
    latitude: 36.778261, longitude: -119.417932, radius: 360000,
    region: { latitude: 36.8, longitude: -119.4, latitudeDelta: 10, longitudeDelta: 10 },
  },
  'Colorado': {
    latitude: 39.550051, longitude: -105.782067, radius: 250000,
    region: { latitude: 39.6, longitude: -105.8, latitudeDelta: 6, longitudeDelta: 6 },
  },
  'Connecticut': {
    latitude: 41.603222, longitude: -73.087749, radius: 60000,
    region: { latitude: 41.6, longitude: -73.1, latitudeDelta: 1.2, longitudeDelta: 1.2 },
  },
  'Delaware': {
    latitude: 38.910832, longitude: -75.527670, radius: 40000,
    region: { latitude: 38.9, longitude: -75.5, latitudeDelta: 1, longitudeDelta: 1 },
  },
  'Florida': {
    latitude: 27.664827, longitude: -81.515754, radius: 280000,
    region: { latitude: 27.7, longitude: -81.5, latitudeDelta: 7, longitudeDelta: 7 },
  },
  'Georgia': {
    latitude: 32.157435, longitude: -82.907123, radius: 200000,
    region: { latitude: 32.2, longitude: -82.9, latitudeDelta: 5, longitudeDelta: 5 },
  },
  'Hawaii': {
    latitude: 19.898682, longitude: -155.665857, radius: 100000,
    region: { latitude: 19.9, longitude: -155.7, latitudeDelta: 3, longitudeDelta: 3 },
  },
  'Idaho': {
    latitude: 44.240459, longitude: -114.478828, radius: 260000,
    region: { latitude: 44.2, longitude: -114.5, latitudeDelta: 7, longitudeDelta: 7 },
  },
  'Illinois': {
    latitude: 40.349457, longitude: -88.986137, radius: 220000,
    region: { latitude: 40.3, longitude: -89.0, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  },
  'Indiana': {
    latitude: 39.849426, longitude: -86.258278, radius: 160000,
    region: { latitude: 39.8, longitude: -86.3, latitudeDelta: 4, longitudeDelta: 4 },
  },
  'Iowa': {
    latitude: 42.011539, longitude: -93.210526, radius: 200000,
    region: { latitude: 42.0, longitude: -93.2, latitudeDelta: 4.5, longitudeDelta: 4.5 },
  },
  'Kansas': {
    latitude: 38.526600, longitude: -96.726486, radius: 230000,
    region: { latitude: 38.5, longitude: -96.7, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  },
  'Kentucky': {
    latitude: 37.668140, longitude: -84.670067, radius: 190000,
    region: { latitude: 37.7, longitude: -84.7, latitudeDelta: 4, longitudeDelta: 4 },
  },
  'Louisiana': {
    latitude: 31.169960, longitude: -91.867805, radius: 190000,
    region: { latitude: 31.2, longitude: -91.9, latitudeDelta: 4.5, longitudeDelta: 4.5 },
  },
  'Maine': {
    latitude: 44.693947, longitude: -69.381927, radius: 150000,
    region: { latitude: 44.7, longitude: -69.4, latitudeDelta: 4, longitudeDelta: 4 },
  },
  'Maryland': {
    latitude: 39.063946, longitude: -76.802101, radius: 90000,
    region: { latitude: 39.1, longitude: -76.8, latitudeDelta: 2, longitudeDelta: 2 },
  },
  'Massachusetts': {
    latitude: 42.230171, longitude: -71.530106, radius: 90000,
    region: { latitude: 42.2, longitude: -71.5, latitudeDelta: 2, longitudeDelta: 2 },
  },
  'Michigan': {
    latitude: 44.314844, longitude: -85.602364, radius: 240000,
    region: { latitude: 44.3, longitude: -85.6, latitudeDelta: 6.5, longitudeDelta: 6.5 },
  },
  'Minnesota': {
    latitude: 46.729553, longitude: -94.685900, radius: 270000,
    region: { latitude: 46.7, longitude: -94.7, latitudeDelta: 7, longitudeDelta: 7 },
  },
  'Mississippi': {
    latitude: 32.354668, longitude: -89.398528, radius: 160000,
    region: { latitude: 32.4, longitude: -89.4, latitudeDelta: 4, longitudeDelta: 4 },
  },
  'Missouri': {
    latitude: 37.964253, longitude: -91.831833, radius: 210000,
    region: { latitude: 38.0, longitude: -91.8, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  },
  'Montana': {
    latitude: 46.879682, longitude: -110.362566, radius: 380000,
    region: { latitude: 46.9, longitude: -110.4, latitudeDelta: 9, longitudeDelta: 9 },
  },
  'Nebraska': {
    latitude: 41.492537, longitude: -99.901810, radius: 240000,
    region: { latitude: 41.5, longitude: -99.9, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  },
  'Nevada': {
    latitude: 38.802610, longitude: -116.419389, radius: 280000,
    region: { latitude: 38.8, longitude: -116.4, latitudeDelta: 7, longitudeDelta: 7 },
  },
  'New Hampshire': {
    latitude: 43.193852, longitude: -71.572395, radius: 80000,
    region: { latitude: 43.2, longitude: -71.6, latitudeDelta: 2, longitudeDelta: 2 },
  },
  'New Jersey': {
    latitude: 40.058324, longitude: -74.405661, radius: 80000,
    region: { latitude: 40.1, longitude: -74.4, latitudeDelta: 1.8, longitudeDelta: 1.8 },
  },
  'New Mexico': {
    latitude: 34.519940, longitude: -105.870090, radius: 280000,
    region: { latitude: 34.5, longitude: -105.9, latitudeDelta: 7, longitudeDelta: 7 },
  },
  'New York': {
    latitude: 42.165726, longitude: -74.948051, radius: 220000,
    region: { latitude: 42.2, longitude: -74.9, latitudeDelta: 5, longitudeDelta: 5 },
  },
  'New York City': {
    latitude: 40.7128, longitude: -74.0060, radius: 30000,
    region: { latitude: 40.7, longitude: -74.0, latitudeDelta: 0.5, longitudeDelta: 0.5 },
  },
  'North Carolina': {
    latitude: 35.630066, longitude: -79.806419, radius: 230000,
    region: { latitude: 35.6, longitude: -79.8, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  },
  'North Dakota': {
    latitude: 47.528912, longitude: -99.784012, radius: 240000,
    region: { latitude: 47.5, longitude: -99.8, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  },
  'Ohio': {
    latitude: 40.417287, longitude: -82.907123, radius: 180000,
    region: { latitude: 40.4, longitude: -82.9, latitudeDelta: 4.5, longitudeDelta: 4.5 },
  },
  'Oklahoma': {
    latitude: 35.007752, longitude: -97.092877, radius: 230000,
    region: { latitude: 35.0, longitude: -97.1, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  },
  'Oregon': {
    latitude: 43.804133, longitude: -120.554201, radius: 260000,
    region: { latitude: 43.8, longitude: -120.6, latitudeDelta: 6.5, longitudeDelta: 6.5 },
  },
  'Pennsylvania': {
    latitude: 41.203322, longitude: -77.194525, radius: 180000,
    region: { latitude: 41.2, longitude: -77.2, latitudeDelta: 3.5, longitudeDelta: 3.5 },
  },
  'Rhode Island': {
    latitude: 41.680893, longitude: -71.511780, radius: 30000,
    region: { latitude: 41.7, longitude: -71.5, latitudeDelta: 0.8, longitudeDelta: 0.8 },
  },
  'South Carolina': {
    latitude: 33.836081, longitude: -81.163725, radius: 170000,
    region: { latitude: 33.8, longitude: -81.2, latitudeDelta: 4, longitudeDelta: 4 },
  },
  'South Dakota': {
    latitude: 43.969515, longitude: -99.901810, radius: 240000,
    region: { latitude: 44.0, longitude: -99.9, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  },
  'Tennessee': {
    latitude: 35.517491, longitude: -86.580447, radius: 220000,
    region: { latitude: 35.5, longitude: -86.6, latitudeDelta: 4.5, longitudeDelta: 4.5 },
  },
  'Texas': {
    latitude: 31.968599, longitude: -99.901810, radius: 520000,
    region: { latitude: 32.0, longitude: -99.9, latitudeDelta: 12, longitudeDelta: 12 },
  },
  'Utah': {
    latitude: 39.320980, longitude: -111.093731, radius: 230000,
    region: { latitude: 39.3, longitude: -111.1, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  },
  'Vermont': {
    latitude: 44.558803, longitude: -72.577841, radius: 90000,
    region: { latitude: 44.6, longitude: -72.6, latitudeDelta: 2, longitudeDelta: 2 },
  },
  'Virginia': {
    latitude: 37.431573, longitude: -78.656894, radius: 200000,
    region: { latitude: 37.4, longitude: -78.7, latitudeDelta: 4.5, longitudeDelta: 4.5 },
  },
  'Washington': {
    latitude: 47.751074, longitude: -120.740139, radius: 220000,
    region: { latitude: 47.8, longitude: -120.7, latitudeDelta: 5.5, longitudeDelta: 5.5 },
  },
  'West Virginia': {
    latitude: 38.597626, longitude: -80.454903, radius: 130000,
    region: { latitude: 38.6, longitude: -80.5, latitudeDelta: 3.5, longitudeDelta: 3.5 },
  },
  'Wisconsin': {
    latitude: 43.784440, longitude: -88.787868, radius: 200000,
    region: { latitude: 43.8, longitude: -88.8, latitudeDelta: 5, longitudeDelta: 5 },
  },
  'Wyoming': {
    latitude: 43.075968, longitude: -107.290284, radius: 260000,
    region: { latitude: 43.1, longitude: -107.3, latitudeDelta: 6.5, longitudeDelta: 6.5 },
  },

  // ─── US Territories ─────────────────────────────────────────────────────────
  'Puerto Rico': {
    latitude: 18.220833, longitude: -66.590149, radius: 80000,
    region: { latitude: 18.2, longitude: -66.6, latitudeDelta: 2, longitudeDelta: 2 },
  },
  'U.S. Virgin Islands': {
    latitude: 18.335765, longitude: -64.896335, radius: 20000,
    region: { latitude: 18.3, longitude: -64.9, latitudeDelta: 0.5, longitudeDelta: 0.5 },
  },

  // ─── Countries ──────────────────────────────────────────────────────────────
  'United States': {
    latitude: 37.09024, longitude: -95.712891, radius: 2500000,
    region: { latitude: 37.1, longitude: -95.7, latitudeDelta: 35, longitudeDelta: 35 },
  },
  'United Kingdom': {
    latitude: 55.378051, longitude: -3.435973, radius: 500000,
    region: { latitude: 55.4, longitude: -3.4, latitudeDelta: 10, longitudeDelta: 10 },
  },
  'France': {
    latitude: 46.227638, longitude: 2.213749, radius: 480000,
    region: { latitude: 46.2, longitude: 2.2, latitudeDelta: 10, longitudeDelta: 10 },
  },
  'Germany': {
    latitude: 51.165691, longitude: 10.451526, radius: 380000,
    region: { latitude: 51.2, longitude: 10.5, latitudeDelta: 8, longitudeDelta: 8 },
  },
  'Switzerland': {
    latitude: 46.818188, longitude: 8.227512, radius: 140000,
    region: { latitude: 46.8, longitude: 8.2, latitudeDelta: 3, longitudeDelta: 3 },
  },
  'UAE': {
    latitude: 23.424076, longitude: 53.847818, radius: 280000,
    region: { latitude: 23.4, longitude: 53.8, latitudeDelta: 5, longitudeDelta: 5 },
  },
  'United Arab Emirates': {
    latitude: 23.424076, longitude: 53.847818, radius: 280000,
    region: { latitude: 23.4, longitude: 53.8, latitudeDelta: 5, longitudeDelta: 5 },
  },
  'Singapore': {
    latitude: 1.352083, longitude: 103.819836, radius: 30000,
    region: { latitude: 1.35, longitude: 103.8, latitudeDelta: 0.4, longitudeDelta: 0.4 },
  },
  'Bermuda': {
    latitude: 32.321384, longitude: -64.757370, radius: 15000,
    region: { latitude: 32.3, longitude: -64.8, latitudeDelta: 0.3, longitudeDelta: 0.3 },
  },
  'Cayman Islands': {
    latitude: 19.513469, longitude: -80.566956, radius: 20000,
    region: { latitude: 19.5, longitude: -80.6, latitudeDelta: 0.5, longitudeDelta: 0.5 },
  },
  'Monaco': {
    latitude: 43.738418, longitude: 7.424616, radius: 5000,
    region: { latitude: 43.7, longitude: 7.4, latitudeDelta: 0.15, longitudeDelta: 0.15 },
  },
  'Portugal': {
    latitude: 39.399872, longitude: -8.224454, radius: 220000,
    region: { latitude: 39.4, longitude: -8.2, latitudeDelta: 5, longitudeDelta: 5 },
  },
  'Italy': {
    latitude: 41.871940, longitude: 12.567380, radius: 400000,
    region: { latitude: 41.9, longitude: 12.6, latitudeDelta: 9, longitudeDelta: 9 },
  },
  'Spain': {
    latitude: 40.463667, longitude: -3.749220, radius: 420000,
    region: { latitude: 40.5, longitude: -3.7, latitudeDelta: 9, longitudeDelta: 9 },
  },
  'Netherlands': {
    latitude: 52.132633, longitude: 5.291266, radius: 140000,
    region: { latitude: 52.1, longitude: 5.3, latitudeDelta: 3, longitudeDelta: 3 },
  },
  'Canada': {
    latitude: 56.130366, longitude: -106.346771, radius: 2500000,
    region: { latitude: 56.1, longitude: -106.3, latitudeDelta: 35, longitudeDelta: 35 },
  },
  'Australia': {
    latitude: -25.274398, longitude: 133.775136, radius: 2000000,
    region: { latitude: -25.3, longitude: 133.8, latitudeDelta: 35, longitudeDelta: 35 },
  },
  'Japan': {
    latitude: 36.204824, longitude: 138.252924, radius: 500000,
    region: { latitude: 36.2, longitude: 138.3, latitudeDelta: 10, longitudeDelta: 10 },
  },
  'Hong Kong': {
    latitude: 22.396428, longitude: 114.109497, radius: 30000,
    region: { latitude: 22.4, longitude: 114.1, latitudeDelta: 0.5, longitudeDelta: 0.5 },
  },
  'Ireland': {
    latitude: 53.142367, longitude: -7.692054, radius: 180000,
    region: { latitude: 53.1, longitude: -7.7, latitudeDelta: 4, longitudeDelta: 4 },
  },
  'Luxembourg': {
    latitude: 49.815273, longitude: 6.129583, radius: 30000,
    region: { latitude: 49.8, longitude: 6.1, latitudeDelta: 0.7, longitudeDelta: 0.7 },
  },
};

/**
 * Look up geo info for a jurisdiction by trying various name matches.
 * Handles partial matches (e.g. "New York, NY" → "New York").
 */
export function getJurisdictionGeo(jurisdictionName: string): JurisdictionGeo | null {
  // Direct match first
  if (JURISDICTION_GEO[jurisdictionName]) return JURISDICTION_GEO[jurisdictionName];

  // Try case-insensitive match
  const nameLower = jurisdictionName.toLowerCase();
  const key = Object.keys(JURISDICTION_GEO).find(
    (k) => k.toLowerCase() === nameLower ||
           nameLower.includes(k.toLowerCase()) ||
           k.toLowerCase().includes(nameLower)
  );
  return key ? JURISDICTION_GEO[key] : null;
}

/**
 * Default map region — continental US
 */
export const DEFAULT_MAP_REGION = {
  latitude: 38.5,
  longitude: -97.0,
  latitudeDelta: 32,
  longitudeDelta: 32,
};
