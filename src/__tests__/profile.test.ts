/**
 * Tests for profile ↔ birth data conversion and persistence.
 * Run: npx jest src/__tests__/profile.test.ts
 */
import { profileToBirthData, UserProfile } from '../types';

describe('profileToBirthData', () => {
  test('returns null when birth data incomplete', () => {
    const p: UserProfile = {
      name: 'Test', avatar: 'T', reminderTime: '08:00',
      hasFortuneEnabled: true, birthHour: null,
    };
    expect(profileToBirthData(p)).toBeNull();
  });

  test('returns null when only year set', () => {
    const p: UserProfile = {
      name: 'Test', avatar: 'T', reminderTime: '08:00',
      hasFortuneEnabled: true, birthHour: null,
      birthYear: 1996,
    };
    expect(profileToBirthData(p)).toBeNull();
  });

  test('returns BirthData when complete', () => {
    const p: UserProfile = {
      name: 'Test', avatar: 'T', reminderTime: '08:00',
      hasFortuneEnabled: true,
      birthYear: 1996, birthMonth: 8, birthDay: 18,
      birthHour: 3, birthplace: '上海市',
    };
    const bd = profileToBirthData(p);
    expect(bd).not.toBeNull();
    expect(bd!.year).toBe(1996);
    expect(bd!.month).toBe(8);
    expect(bd!.day).toBe(18);
    expect(bd!.hour).toBe(3);
    expect(bd!.birthplace).toBe('上海市');
  });

  test('birthplace defaults to 未知', () => {
    const p: UserProfile = {
      name: 'Test', avatar: 'T', reminderTime: '08:00',
      hasFortuneEnabled: true,
      birthYear: 1996, birthMonth: 8, birthDay: 18,
      birthHour: null,
    };
    const bd = profileToBirthData(p);
    expect(bd!.birthplace).toBe('未知');
  });
});
