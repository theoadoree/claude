# TaxTrack — Tax Residency & Location Tracking App

A modern iOS/Android app for tracking location and managing tax residency compliance, built with React Native + Expo.

## Features

### 🗺️ Location Tracking
- **WiFi & cell tower-based** automatic location detection via Expo Location
- Manual day entry with jurisdiction selection
- Background tracking with configurable frequency
- Auto-reverse geocoding to map coordinates → state/country

### 📊 Dashboard
- Year-over-year day counts per jurisdiction
- **Audit Risk Score** (0–100) with animated gauge
- Actionable alerts for jurisdictions approaching day limits
- Missing-day tracker with percentage documented
- Year selector for historical analysis

### 📅 Calendar View
- Color-coded monthly calendar with per-jurisdiction colors (Monaeo-style)
- Month summary bar charts by jurisdiction
- Tap any day to view/edit details or add a new entry
- Activity type tagging: Work, Personal, Transit, Unknown

### 📈 Tax Planning
Three-tab planning center:
- **Insights** — Prioritized action items (urgent → low): compliance alerts, optimization tips, audit prep
- **Opportunities** — Jurisdiction recommendations with pros/cons:
  - Florida, Texas, Nevada (no income tax)
  - Puerto Rico Act 60 (0–4% on qualifying income)
  - UAE, Singapore, Portugal NHR, Bermuda
- **Risk Analysis** — Detailed audit risk breakdown with contributing factors

### 📁 Evidence Vault
- Upload **boarding passes**, **hotel receipts**, **photos**, **screenshots**
- Attach documents to specific dates
- Organize by document type with filter chips
- Camera capture or photo library picker
- Flight record: route, airline, flight number
- Hotel record: property, check-in/check-out dates

### ⚙️ Settings
- Manage tracked jurisdictions with custom day limits and colors
- Enable/disable background location tracking and notifications
- **Import Monaeo CSV** — drop in your Monaeo export and all entries are imported (duplicates skipped)
- Export data (coming soon)
- PDF tax report generation (coming soon)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo SDK 55 |
| Navigation | React Navigation v7 (stack + bottom tabs) |
| State | Zustand + AsyncStorage (local persistence) |
| Location | Expo Location (foreground + background) |
| Documents | Expo Image Picker + Document Picker |
| UI | Custom dark-mode design system |
| Charts | Custom animated progress bars |
| Date handling | date-fns |
| Language | TypeScript |

## Getting Started

```bash
cd TaxResidencyTracker
npm install
npx expo start
```

- **iOS**: Scan QR code with Expo Go, or run `npm run ios`
- **Android**: Scan QR code with Expo Go, or run `npm run android`

## Project Structure

```
src/
├── types/          # All TypeScript interfaces
├── theme/          # Colors, typography, spacing constants
├── store/          # Zustand state + AsyncStorage persistence
├── services/
│   ├── LocationService.ts       # GPS + reverse geocoding
│   ├── TaxCalculationService.ts # Day counting, risk scoring, insights
│   └── ImportService.ts         # Monaeo CSV parser
├── navigation/     # React Navigation setup
├── screens/
│   ├── onboarding/ # Welcome, Residency, Jurisdiction, Permissions
│   ├── dashboard/  # Main dashboard + jurisdiction detail
│   ├── calendar/   # Calendar, day detail, add location
│   ├── planning/   # Tax planning (insights, opportunities, risk)
│   ├── documents/  # Evidence vault, add/view documents
│   └── settings/   # Settings, jurisdiction management, CSV import
└── components/
    └── common/     # GradientCard, ProgressBar, RiskBadge, ScreenHeader
```

## Key Tax Rules Built In

- **183-day rule** — NY, CA, NJ, CT, MA, IL, PA, and most high-tax states
- **No-income-tax states** — FL, TX, NV, WA (no day limit)
- **Puerto Rico Act 60** — 183-day residency requirement
- **US Substantial Presence Test** — Federal 183-day rule
- **UK Statutory Residence Test** — 183 days in tax year
- Custom rules configurable per jurisdiction

## Privacy

All data is stored **locally on device** using AsyncStorage. No user data is ever uploaded or shared with external servers.

## Disclaimer

TaxTrack is a record-keeping tool. It does not provide tax, legal, or financial advice. Always consult a qualified tax professional for your specific situation.
