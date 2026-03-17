export const Colors = {
  // Primary brand
  primary: '#0A84FF',
  primaryLight: '#4DA3FF',
  primaryDark: '#0055CC',

  // Secondary
  secondary: '#30D158',
  secondaryLight: '#60E080',
  secondaryDark: '#1A9E3C',

  // Accent
  accent: '#FF9F0A',
  accentLight: '#FFB940',
  accentDark: '#CC7A00',

  // Risk levels
  riskLow: '#30D158',
  riskModerate: '#FF9F0A',
  riskHigh: '#FF453A',
  riskCritical: '#FF2D55',

  // Backgrounds
  background: '#0C0C0E',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  card: '#1C1C1E',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.35)',
  textInverse: '#000000',

  // Borders
  border: 'rgba(255,255,255,0.1)',
  borderStrong: 'rgba(255,255,255,0.2)',
  separator: 'rgba(255,255,255,0.06)',

  // Status
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  info: '#0A84FF',

  // Chart colors (jurisdiction palette)
  chartColors: [
    '#0A84FF',
    '#30D158',
    '#FF9F0A',
    '#FF453A',
    '#BF5AF2',
    '#FF2D55',
    '#64D2FF',
    '#FFD60A',
    '#FF6961',
    '#77DD77',
  ],

  // Gradients
  gradientPrimary: ['#0A84FF', '#0055CC'] as const,
  gradientSuccess: ['#30D158', '#1A9E3C'] as const,
  gradientWarning: ['#FF9F0A', '#CC7A00'] as const,
  gradientDanger: ['#FF453A', '#CC1A10'] as const,
  gradientSurface: ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)'] as const,

  // Transparent
  overlay: 'rgba(0,0,0,0.6)',
  glassBg: 'rgba(255,255,255,0.05)',
  glassStroke: 'rgba(255,255,255,0.1)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 40,

  // Line heights
  lineHeightSm: 18,
  lineHeightBase: 22,
  lineHeightMd: 26,
  lineHeightLg: 30,

  // Font weights (as strings for RN)
  thin: '100' as const,
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Letter spacing
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  primary: {
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const JURISDICTION_COLORS = [
  '#0A84FF',
  '#30D158',
  '#FF9F0A',
  '#BF5AF2',
  '#FF2D55',
  '#64D2FF',
  '#FF6961',
  '#77DD77',
  '#FFD60A',
  '#FF9500',
];

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
};
