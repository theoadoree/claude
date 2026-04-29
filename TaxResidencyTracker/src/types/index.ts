// ─── Core Domain Types ────────────────────────────────────────────────────────

export type JurisdictionType = 'primary_residence' | 'state' | 'country' | 'territory' | 'city';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type ActivityType = 'work' | 'personal' | 'transit' | 'unknown';
export type DocumentType = 'flight' | 'hotel' | 'receipt' | 'photo' | 'screenshot' | 'other';

export interface Jurisdiction {
  id: string;
  name: string;
  type: JurisdictionType;
  country: string;
  state?: string;
  city?: string;
  color: string;
  taxRule?: TaxRule;
  isPrimary: boolean;
  isTracked: boolean;
  createdAt: string;
}

export interface TaxRule {
  jurisdictionId: string;
  // Days threshold that triggers residency/obligations
  residencyDayThreshold: number;
  // Days allowed before triggering audit risk
  safeHarborDays: number;
  // Type: domicile, statutory, etc.
  ruleType: 'domicile' | 'statutory' | 'substantial_presence' | 'days_test' | 'custom';
  description: string;
  // Year the rule applies
  taxYear?: number;
  // Penalty for exceeding
  notes?: string;
}

export interface LocationEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  jurisdictionId?: string;
  jurisdictionName?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  activityType: ActivityType;
  isVerified: boolean;
  source: 'auto' | 'manual' | 'import';
  notes?: string;
  documents?: string[]; // Document IDs
  createdAt: string;
  updatedAt: string;
}

export interface DailySummary {
  date: string;
  primaryJurisdictionId?: string;
  jurisdictions: {
    jurisdictionId: string;
    hours: number;
  }[];
  activityType: ActivityType;
  isComplete: boolean;
}

export interface JurisdictionStat {
  jurisdiction: Jurisdiction;
  daysSpent: number;
  daysAllowed: number;
  daysRemaining: number;
  percentageUsed: number;
  riskLevel: RiskLevel;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface YearSummary {
  year: number;
  totalDaysTracked: number;
  totalDaysInYear: number;
  jurisdictionStats: JurisdictionStat[];
  overallRisk: RiskLevel;
  missingDays: number;
}

export interface Document {
  id: string;
  type: DocumentType;
  title: string;
  description?: string;
  uri: string;
  thumbnailUri?: string;
  date: string; // associated date
  jurisdictionId?: string;
  tags: string[];
  fileSize?: number;
  mimeType?: string;
  extractedData?: {
    origin?: string;
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    airline?: string;
    flightNumber?: string;
    hotel?: string;
    amount?: number;
    currency?: string;
  };
  createdAt: string;
}

export interface FlightRecord {
  id: string;
  date: string;
  airline?: string;
  flightNumber?: string;
  origin: string;
  originCode?: string;
  destination: string;
  destinationCode?: string;
  departureTime?: string;
  arrivalTime?: string;
  documentId?: string;
}

export interface HotelRecord {
  id: string;
  checkIn: string;
  checkOut: string;
  hotel: string;
  city: string;
  state?: string;
  country: string;
  confirmationNumber?: string;
  documentId?: string;
}

// ─── Tax Planning Types ────────────────────────────────────────────────────────

export interface AuditRisk {
  score: number; // 0-100
  level: RiskLevel;
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // 0-1
  details?: string;
}

export interface JurisdictionRecommendation {
  jurisdictionName: string;
  country: string;
  type: 'tax_haven' | 'territorial' | 'low_tax' | 'treaty_benefit';
  potentialSavings?: string;
  requiredDays: number;
  pros: string[];
  cons: string[];
  notes?: string;
}

export interface TaxPlanningInsight {
  id: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  category: 'compliance' | 'optimization' | 'risk' | 'opportunity';
  actionItems: string[];
  deadline?: string;
}

// ─── User Profile Types ────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  primaryJurisdictionId?: string;
  trackedJurisdictionIds: string[];
  onboardingCompleted: boolean;
  taxYear: number;
  trackingEnabled: boolean;
  trackingFrequency: 'continuous' | 'hourly' | 'daily';
  notificationsEnabled: boolean;
  notificationThresholds: {
    jurisdictionId: string;
    daysWarning: number;
  }[];
  createdAt: string;
}

// ─── Import/Export Types ───────────────────────────────────────────────────────

export interface MonaeoCSVRow {
  date: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
  type?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

// ─── Navigation Types ──────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

export type OnboardingStackParamList = {
  Welcome: undefined;
  ResidencySetup: undefined;
  JurisdictionSetup: undefined;
  TrackingPermissions: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  Planning: undefined;
  Documents: undefined;
  Settings: undefined;
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  JurisdictionDetail: { jurisdictionId: string };
};

export type CalendarStackParamList = {
  CalendarHome: undefined;
  DayDetail: { date: string };
  AddLocation: { date?: string };
};

export type DocumentsStackParamList = {
  DocumentsHome: undefined;
  DocumentDetail: { documentId: string };
  AddDocument: { type?: DocumentType; date?: string };
  FlightImport: undefined;
  HotelImport: undefined;
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  ManageJurisdictions: undefined;
  JurisdictionEdit: { jurisdictionId?: string };
  ImportData: undefined;
  ExportData: undefined;
  TaxRules: undefined;
};
