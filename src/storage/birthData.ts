/**
 * AsyncStorage wrapper for birth data persistence.
 * All data is local-only — no server uploads.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BirthData, Bazi } from '../types';

const KEYS = {
  BIRTH_DATA: '@fortune/birth_data',
  BAZI: '@fortune/bazi',
  SETUP_DONE: '@fortune/setup_done',
} as const;

// ── Birth data ──

export async function saveBirthData(data: BirthData): Promise<void> {
  await AsyncStorage.setItem(KEYS.BIRTH_DATA, JSON.stringify(data));
  await AsyncStorage.setItem(KEYS.SETUP_DONE, 'true');
}

export async function loadBirthData(): Promise<BirthData | null> {
  const raw = await AsyncStorage.getItem(KEYS.BIRTH_DATA);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BirthData;
  } catch {
    return null;
  }
}

export async function hasBirthData(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.SETUP_DONE);
  return val === 'true';
}

export async function deleteBirthData(): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.BIRTH_DATA, KEYS.BAZI, KEYS.SETUP_DONE]);
}

// ── Bazi cache ──

export async function saveBazi(bazi: Bazi): Promise<void> {
  await AsyncStorage.setItem(KEYS.BAZI, JSON.stringify(bazi));
}

export async function loadBazi(): Promise<Bazi | null> {
  const raw = await AsyncStorage.getItem(KEYS.BAZI);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Bazi;
  } catch {
    return null;
  }
}
