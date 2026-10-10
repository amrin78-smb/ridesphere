/**
 * Design tokens. Screens and components read colours, spacing, radius and type from here and
 * never hard-code them, so the provisional brand (charcoal, off-white, vivid lime) can change
 * in one place.
 */

import { Platform } from 'react-native';

const palette = {
  charcoal: '#1C1F22',
  charcoalRaised: '#272B2F',
  charcoalSelected: '#343A40',
  offWhite: '#F6F4EE',
  offWhiteRaised: '#ECE9E0',
  offWhiteSelected: '#DEDACE',
  lime: '#C6F432',
  greyOnLight: '#5A6067',
  greyOnDark: '#AEB4BB',
  dangerOnLight: '#B3261E',
  dangerOnDark: '#FFB4AB',
} as const;

export const Colors = {
  light: {
    text: palette.charcoal,
    textSecondary: palette.greyOnLight,
    background: palette.offWhite,
    backgroundElement: palette.offWhiteRaised,
    backgroundSelected: palette.offWhiteSelected,
    // Lime is a fill colour. It does not have enough contrast to be used as text on light backgrounds.
    accent: palette.lime,
    onAccent: palette.charcoal,
    danger: palette.dangerOnLight,
  },
  dark: {
    text: palette.offWhite,
    textSecondary: palette.greyOnDark,
    background: palette.charcoal,
    backgroundElement: palette.charcoalRaised,
    backgroundSelected: palette.charcoalSelected,
    accent: palette.lime,
    onAccent: palette.charcoal,
    danger: palette.dangerOnDark,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  default: { sans: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 16,
  pill: 999,
} as const;

/** Smallest comfortable touch target, in points. */
export const MinTouchTarget = 48;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
