import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, BirthData } from '../types';
import { DEFAULT_PROFILE, DEFAULT_BIRTH_DATA } from '../data/fixtures';

const KEY = '@fortune/profile';

export async function loadProfile(): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...DEFAULT_PROFILE };
  try {
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(profile));
}

/** Extract BirthData from stored profile, or return default if not set. */
export async function loadBirthData(): Promise<BirthData | null> {
  const p = await loadProfile();
  if (!p.birthYear || !p.birthMonth || !p.birthDay) return null;
  return {
    year: p.birthYear,
    month: p.birthMonth,
    day: p.birthDay,
    hour: p.birthHour,
    birthplace: p.birthplace || '未知',
  };
}

/** Check if birth data has been set. */
export async function hasBirthData(): Promise<boolean> {
  const p = await loadProfile();
  return p.birthYear != null && p.birthMonth != null && p.birthDay != null;
}

/** Clear birth data fields from profile. */
export async function clearBirthData(): Promise<void> {
  const p = await loadProfile();
  delete p.birthYear;
  delete p.birthMonth;
  delete p.birthDay;
  p.birthHour = null;
  delete p.birthplace;
  await saveProfile(p);
}
