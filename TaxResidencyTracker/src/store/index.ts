import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  Jurisdiction,
  LocationEntry,
  Document,
  FlightRecord,
  HotelRecord,
  JurisdictionStat,
  YearSummary,
  RiskLevel,
  AuditRisk,
  TaxPlanningInsight,
} from '../types';
import { JURISDICTION_COLORS as COLORS } from '../theme';
import { calculateJurisdictionStats, calculateAuditRisk, generateInsights } from '../services/TaxCalculationService';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  USER_PROFILE: '@taxtracker/user_profile',
  JURISDICTIONS: '@taxtracker/jurisdictions',
  LOCATION_ENTRIES: '@taxtracker/location_entries',
  DOCUMENTS: '@taxtracker/documents',
  FLIGHTS: '@taxtracker/flights',
  HOTELS: '@taxtracker/hotels',
};

// ─── App State Interface ───────────────────────────────────────────────────────
interface AppState {
  // Data
  userProfile: UserProfile | null;
  jurisdictions: Jurisdiction[];
  locationEntries: LocationEntry[];
  documents: Document[];
  flights: FlightRecord[];
  hotels: HotelRecord[];

  // Computed
  yearSummary: YearSummary | null;
  auditRisk: AuditRisk | null;
  insights: TaxPlanningInsight[];

  // UI State
  isLoading: boolean;
  hasHydrated: boolean;
  selectedYear: number;

  // Actions - Profile
  setUserProfile: (profile: UserProfile) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // Actions - Jurisdictions
  addJurisdiction: (jurisdiction: Omit<Jurisdiction, 'id' | 'createdAt'>) => Promise<Jurisdiction>;
  updateJurisdiction: (id: string, updates: Partial<Jurisdiction>) => Promise<void>;
  removeJurisdiction: (id: string) => Promise<void>;

  // Actions - Location Entries
  addLocationEntry: (entry: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLocationEntry: (id: string, updates: Partial<LocationEntry>) => Promise<void>;
  removeLocationEntry: (id: string) => Promise<void>;
  importLocationEntries: (entries: Omit<LocationEntry, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;

  // Actions - Documents
  addDocument: (doc: Omit<Document, 'id' | 'createdAt'>) => Promise<Document>;
  removeDocument: (id: string) => Promise<void>;

  // Actions - Flights & Hotels
  addFlight: (flight: Omit<FlightRecord, 'id'>) => Promise<void>;
  addHotel: (hotel: Omit<HotelRecord, 'id'>) => Promise<void>;
  removeFlight: (id: string) => Promise<void>;
  removeHotel: (id: string) => Promise<void>;

  // Actions - UI
  setSelectedYear: (year: number) => void;
  refreshComputed: () => void;

  // Persistence
  hydrate: () => Promise<void>;
  clearAll: () => Promise<void>;
}

// ─── Default jurisdictions (common tax jurisdictions) ─────────────────────────
const DEFAULT_JURISDICTIONS: Jurisdiction[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
const now = () => new Date().toISOString();

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAppStore = create<AppState>((set, get) => ({
  userProfile: null,
  jurisdictions: [],
  locationEntries: [],
  documents: [],
  flights: [],
  hotels: [],
  yearSummary: null,
  auditRisk: null,
  insights: [],
  isLoading: false,
  hasHydrated: false,
  selectedYear: new Date().getFullYear(),

  // ─── Profile Actions ────────────────────────────────────────────────────
  setUserProfile: async (profile) => {
    set({ userProfile: profile });
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    get().refreshComputed();
  },

  updateUserProfile: async (updates) => {
    const current = get().userProfile;
    if (!current) return;
    const updated = { ...current, ...updates };
    set({ userProfile: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
  },

  // ─── Jurisdiction Actions ───────────────────────────────────────────────
  addJurisdiction: async (data) => {
    const existing = get().jurisdictions;
    const newJ: Jurisdiction = {
      ...data,
      id: generateId(),
      color: COLORS[existing.length % COLORS.length],
      createdAt: now(),
    };
    const updated = [...existing, newJ];
    set({ jurisdictions: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.JURISDICTIONS, JSON.stringify(updated));
    get().refreshComputed();
    return newJ;
  },

  updateJurisdiction: async (id, updates) => {
    const updated = get().jurisdictions.map((j) => (j.id === id ? { ...j, ...updates } : j));
    set({ jurisdictions: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.JURISDICTIONS, JSON.stringify(updated));
    get().refreshComputed();
  },

  removeJurisdiction: async (id) => {
    const updated = get().jurisdictions.filter((j) => j.id !== id);
    set({ jurisdictions: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.JURISDICTIONS, JSON.stringify(updated));
    get().refreshComputed();
  },

  // ─── Location Entry Actions ─────────────────────────────────────────────
  addLocationEntry: async (data) => {
    const entry: LocationEntry = {
      ...data,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    const updated = [...get().locationEntries, entry];
    set({ locationEntries: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_ENTRIES, JSON.stringify(updated));
    get().refreshComputed();
  },

  updateLocationEntry: async (id, updates) => {
    const updated = get().locationEntries.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: now() } : e
    );
    set({ locationEntries: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_ENTRIES, JSON.stringify(updated));
    get().refreshComputed();
  },

  removeLocationEntry: async (id) => {
    const updated = get().locationEntries.filter((e) => e.id !== id);
    set({ locationEntries: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_ENTRIES, JSON.stringify(updated));
    get().refreshComputed();
  },

  importLocationEntries: async (entries) => {
    const newEntries: LocationEntry[] = entries.map((e) => ({
      ...e,
      id: generateId(),
      createdAt: now(),
      updatedAt: now(),
    }));
    const existing = get().locationEntries;
    // Deduplicate by date
    const existingDates = new Set(existing.map((e) => e.date));
    const toAdd = newEntries.filter((e) => !existingDates.has(e.date));
    const updated = [...existing, ...toAdd];
    set({ locationEntries: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_ENTRIES, JSON.stringify(updated));
    get().refreshComputed();
  },

  // ─── Document Actions ───────────────────────────────────────────────────
  addDocument: async (data) => {
    const doc: Document = { ...data, id: generateId(), createdAt: now() };
    const updated = [...get().documents, doc];
    set({ documents: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updated));
    return doc;
  },

  removeDocument: async (id) => {
    const updated = get().documents.filter((d) => d.id !== id);
    set({ documents: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(updated));
  },

  // ─── Flight & Hotel Actions ─────────────────────────────────────────────
  addFlight: async (data) => {
    const flight: FlightRecord = { ...data, id: generateId() };
    const updated = [...get().flights, flight];
    set({ flights: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(updated));
  },

  addHotel: async (data) => {
    const hotel: HotelRecord = { ...data, id: generateId() };
    const updated = [...get().hotels, hotel];
    set({ hotels: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(updated));
  },

  removeFlight: async (id) => {
    const updated = get().flights.filter((f) => f.id !== id);
    set({ flights: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(updated));
  },

  removeHotel: async (id) => {
    const updated = get().hotels.filter((h) => h.id !== id);
    set({ hotels: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.HOTELS, JSON.stringify(updated));
  },

  // ─── UI Actions ─────────────────────────────────────────────────────────
  setSelectedYear: (year) => {
    set({ selectedYear: year });
    get().refreshComputed();
  },

  // ─── Computed Refresh ───────────────────────────────────────────────────
  refreshComputed: () => {
    const { jurisdictions, locationEntries, selectedYear } = get();
    if (!jurisdictions.length) return;

    const yearEntries = locationEntries.filter((e) => e.date.startsWith(String(selectedYear)));
    const stats = calculateJurisdictionStats(jurisdictions, yearEntries, selectedYear);
    const auditRisk = calculateAuditRisk(stats, yearEntries);
    const insights = generateInsights(stats, auditRisk, yearEntries, selectedYear);

    const missingDays = calculateMissingDays(yearEntries, selectedYear);
    const overallRisk = determineOverallRisk(stats);

    const yearSummary: YearSummary = {
      year: selectedYear,
      totalDaysTracked: yearEntries.length,
      totalDaysInYear: isLeapYear(selectedYear) ? 366 : 365,
      jurisdictionStats: stats,
      overallRisk,
      missingDays,
    };

    set({ yearSummary, auditRisk, insights });
  },

  // ─── Persistence ────────────────────────────────────────────────────────
  hydrate: async () => {
    set({ isLoading: true });
    try {
      const [profile, jurisdictions, entries, documents, flights, hotels] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.JURISDICTIONS),
        AsyncStorage.getItem(STORAGE_KEYS.LOCATION_ENTRIES),
        AsyncStorage.getItem(STORAGE_KEYS.DOCUMENTS),
        AsyncStorage.getItem(STORAGE_KEYS.FLIGHTS),
        AsyncStorage.getItem(STORAGE_KEYS.HOTELS),
      ]);

      set({
        userProfile: profile ? JSON.parse(profile) : null,
        jurisdictions: jurisdictions ? JSON.parse(jurisdictions) : [],
        locationEntries: entries ? JSON.parse(entries) : [],
        documents: documents ? JSON.parse(documents) : [],
        flights: flights ? JSON.parse(flights) : [],
        hotels: hotels ? JSON.parse(hotels) : [],
        hasHydrated: true,
        isLoading: false,
      });

      get().refreshComputed();
    } catch (e) {
      console.error('Hydration error:', e);
      set({ hasHydrated: true, isLoading: false });
    }
  },

  clearAll: async () => {
    await Promise.all(Object.values(STORAGE_KEYS).map((key) => AsyncStorage.removeItem(key)));
    set({
      userProfile: null,
      jurisdictions: [],
      locationEntries: [],
      documents: [],
      flights: [],
      hotels: [],
      yearSummary: null,
      auditRisk: null,
      insights: [],
    });
  },
}));

// ─── Helper Functions ──────────────────────────────────────────────────────────
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function calculateMissingDays(entries: LocationEntry[], year: number): number {
  const totalDays = isLeapYear(year) ? 366 : 365;
  return totalDays - entries.length;
}

function determineOverallRisk(stats: ReturnType<typeof calculateJurisdictionStats>): RiskLevel {
  if (stats.some((s) => s.riskLevel === 'critical')) return 'critical';
  if (stats.some((s) => s.riskLevel === 'high')) return 'high';
  if (stats.some((s) => s.riskLevel === 'moderate')) return 'moderate';
  return 'low';
}
