/**
 * Design system for 时序日历 (Shíxù Calendar)
 * Matches the prototype's Eastern-modern aesthetic exactly.
 */

export const Colors = {
  // Background
  paper: '#f7f2e8',
  paperDeep: '#eee3d2',
  surface: '#fffaf1',
  surface2: '#f4ecdf',

  // Text
  ink: '#24211c',
  muted: '#756d61',

  // Borders
  line: '#dfd1bd',

  // Five Elements
  wood: '#2f7d63',    // jade
  fire: '#a8422d',    // cinnabar
  earth: '#a5783e',
  metal: '#777d84',
  water: '#315d78',

  // Element soft backgrounds
  woodSoft: '#dcebe2',
  fireSoft: '#f0d9d1',
  earthSoft: '#e8dbca',
  metalSoft: '#e4e6e8',
  waterSoft: '#d6e2e9',
  goldSoft: '#efe0bd',

  // Gold (auspicious)
  gold: '#b8872d',

  // UI
  white: '#fffaf1',
  black: '#252119',
  tabActiveBg: '#f0d9d1', // fireSoft
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 17,
  full: 999,
  phone: 32,
};

export const FontSize = {
  xs: 10,
  sm: 11,
  md: 12,
  lg: 13,
  xl: 15,
  xxl: 17,
  hero: 32,
  score: 34,
};

export const Shadow = {
  card: {
    shadowColor: '#473925',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  fab: {
    shadowColor: '#252119',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 12,
  },
};

export const FontFamily = undefined; // Use system default (SF Pro on iOS)
