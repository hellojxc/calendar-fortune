/**
 * Navigation param types for type-safe navigation.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ── Fortune tab stack ──
export type FortuneStackParamList = {
  FortuneMain: undefined;
  BirthData: undefined;
};

// ── Me tab stack ──
export type MeStackParamList = {
  MeMain: undefined;
  EditProfile: undefined;
};

// ── Tab param list (root) ──
export type TabParamList = {
  TodayTab: undefined;
  Calendar: undefined;
  FortuneTab: undefined;
  MeTab: undefined;
};
