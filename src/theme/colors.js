import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_COMPACT = SCREEN_WIDTH < 390;

export const COLORS = {
  background: '#0F1115',
  card: '#1A1D24',
  surfaceElevated: '#222630',
  border: '#2A2F3A',
  borderLight: '#374151',

  primary: '#D97706',
  primaryLight: '#F59E0B',
  primaryMuted: 'rgba(217, 119, 6, 0.16)',

  danger: '#DC2626',
  dangerMuted: 'rgba(220, 38, 38, 0.16)',

  magic: '#2563EB',
  magicLight: '#3B82F6',
  magicMuted: 'rgba(37, 99, 235, 0.18)',

  success: '#16A34A',
  successMuted: 'rgba(22, 163, 74, 0.16)',

  textPrimary: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  white: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.75)',
};

export const SPACING = {
  xs: 4,
  sm: IS_COMPACT ? 6 : 8,
  md: IS_COMPACT ? 10 : 12,
  lg: IS_COMPACT ? 12 : 15,
  xl: IS_COMPACT ? 14 : 18,
  xxl: IS_COMPACT ? 18 : 22,
};

export const RADIUS = {
  sm: 6,
  md: 9,
  lg: 12,
  xl: 16,
  full: 999,
};

export const FONT_SIZE = {
  xs: IS_COMPACT ? 10 : 11,
  sm: IS_COMPACT ? 11.5 : 12.5,
  md: IS_COMPACT ? 13 : 14,
  lg: IS_COMPACT ? 14.5 : 15.5,
  xl: IS_COMPACT ? 16.5 : 18,
  xxl: IS_COMPACT ? 19 : 21,
  title: IS_COMPACT ? 22 : 24,
};

export const LAYOUT = {
  maxAuthWidth: 440,
  maxContentWidth: 740,
  isCompact: IS_COMPACT,
};

export default COLORS;
