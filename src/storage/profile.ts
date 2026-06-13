import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '../types';
import { DEFAULT_PROFILE } from '../data/fixtures';

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
