/**
 * Navigation param types for type-safe navigation.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ── Shared params for AddSchedule screen (used by Today & Calendar stacks) ──
export type AddScheduleParams = {
  date?: string;
  editItem?: { id: string; date: string; time: string; title: string; hint: string; type: string };
  prefillTime?: string;
  prefillTitle?: string;
  prefillHint?: string;
  prefillType?: string;
};

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
