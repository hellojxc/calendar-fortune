/**
 * Navigation param types for type-safe navigation.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// ── Fortune tab stack ──
export type FortuneStackParamList = {
  FortuneMain: undefined;
  BirthData: undefined;
};

export type FortuneMainScreenProps = NativeStackScreenProps<FortuneStackParamList, 'FortuneMain'>;
export type BirthDataScreenProps = NativeStackScreenProps<FortuneStackParamList, 'BirthData'>;

// ── Tab param list ──
export type TabParamList = {
  Today: undefined;
  Calendar: undefined;
  FortuneTab: undefined;
  Me: undefined;
};
