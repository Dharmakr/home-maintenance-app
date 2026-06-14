export const Colors = {
  primary: '#1B4F72',
  primaryLight: '#2E86C1',
  primaryDark: '#154360',

  success: '#27AE60',
  successLight: '#D5F5E3',

  warning: '#F39C12',
  warningLight: '#FDEBD0',

  danger: '#E74C3C',
  dangerLight: '#FADBD8',

  info: '#2980B9',
  infoLight: '#D6EAF8',

  background: '#F0F4F8',
  card: '#FFFFFF',
  border: '#E8EDF2',
  borderLight: '#F2F5F8',

  text: '#1A252F',
  textSecondary: '#566573',
  textMuted: '#99A3A4',
  textInverse: '#FFFFFF',

  overdue: '#E74C3C',
  dueSoon: '#F39C12',
  ok: '#27AE60',
  neverDone: '#95A5A6',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;
