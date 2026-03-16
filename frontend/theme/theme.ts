/**
 * NeuroSense Material Design 3 Theme
 */
export const theme = {
  colors: {
    // Primary palette - Deep Teal/Cyan
    primary: '#0D9488',
    primaryContainer: '#99F6E4',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#004D40',

    // Secondary palette - Warm Purple
    secondary: '#7C3AED',
    secondaryContainer: '#DDD6FE',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#4C1D95',

    // Tertiary palette - Coral/Pink
    tertiary: '#F43F5E',
    tertiaryContainer: '#FFE4E6',
    onTertiary: '#FFFFFF',

    // Surface colors
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    surfaceElevated: '#2D3A4F',
    onBackground: '#F1F5F9',
    onSurface: '#E2E8F0',
    onSurfaceVariant: '#94A3B8',

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // Stress level colors
    stressLow: '#10B981',
    stressMedium: '#F59E0B',
    stressHigh: '#EF4444',
    stressCritical: '#DC2626',

    // Recovery colors
    recoveryExcellent: '#10B981',
    recoveryGood: '#3B82F6',
    recoveryFair: '#F59E0B',
    recoveryPoor: '#EF4444',

    // Mood colors
    moodHappy: '#FCD34D',
    moodCalm: '#67E8F9',
    moodNeutral: '#94A3B8',
    moodStressed: '#FB923C',
    moodSad: '#818CF8',

    // Charts
    chartLine1: '#0D9488',
    chartLine2: '#7C3AED',
    chartLine3: '#F43F5E',
    chartFill: 'rgba(13, 148, 136, 0.15)',

    // Outline
    outline: '#475569',
    outlineVariant: '#334155',

    // Card
    cardBackground: '#1E293B',
    cardBorder: '#334155',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  typography: {
    displayLarge: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
    displayMedium: { fontSize: 28, fontWeight: '600' as const, lineHeight: 36 },
    headlineLarge: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
    headlineMedium: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
    titleLarge: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    titleMedium: { fontSize: 16, fontWeight: '500' as const, lineHeight: 22 },
    bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
    labelLarge: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
    labelSmall: { fontSize: 11, fontWeight: '500' as const, lineHeight: 16 },
  },

  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;
export default theme;
