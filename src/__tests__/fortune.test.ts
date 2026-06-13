/**
 * Tests for fortune service — bazi generation and daily fortune.
 * Run: npx jest src/__tests__/fortune.test.ts
 */
import { computeBazi, computeDailyFortune, isValidDate } from '../services/fortune';
import { BirthData } from '../types';

describe('isValidDate', () => {
  test('accepts real date', () => {
    expect(isValidDate(1996, 8, 18)).toBe(true);
  });

  test('rejects Feb 31', () => {
    expect(isValidDate(2026, 2, 31)).toBe(false);
  });

  test('rejects Nov 31', () => {
    expect(isValidDate(2026, 11, 31)).toBe(false);
  });

  test('rejects month 13', () => {
    expect(isValidDate(2026, 13, 1)).toBe(false);
  });

  test('rejects month 0', () => {
    expect(isValidDate(2026, 0, 1)).toBe(false);
  });

  test('accepts Feb 28 in non-leap year', () => {
    expect(isValidDate(2025, 2, 28)).toBe(true);
  });

  test('rejects Feb 29 in non-leap year', () => {
    expect(isValidDate(2025, 2, 29)).toBe(false);
  });

  test('accepts Feb 29 in leap year', () => {
    expect(isValidDate(2024, 2, 29)).toBe(true);
  });
});

describe('computeBazi', () => {
  const birth: BirthData = { year: 1996, month: 8, day: 18, hour: 3, birthplace: '上海' };

  test('returns all 4 pillars', () => {
    const bazi = computeBazi(birth);
    expect(bazi.year.stem).toBeTruthy();
    expect(bazi.year.branch).toBeTruthy();
    expect(bazi.month.stem).toBeTruthy();
    expect(bazi.month.branch).toBeTruthy();
    expect(bazi.day.stem).toBeTruthy();
    expect(bazi.day.branch).toBeTruthy();
    expect(bazi.hour).not.toBeNull();
    expect(bazi.hour!.stem).toBeTruthy();
    expect(bazi.hour!.branch).toBeTruthy();
  });

  test('known bazi: 1996-08-18 卯时', () => {
    const bazi = computeBazi(birth);
    // Year：丙子, Month：丙申, Day：丁亥, Hour：癸卯
    expect(bazi.year.stem).toBe('丙');
    expect(bazi.year.branch).toBe('子');
    expect(bazi.month.stem).toBe('丙');
    expect(bazi.month.branch).toBe('申');
    expect(bazi.day.stem).toBe('丁');
    expect(bazi.day.branch).toBe('亥');
    expect(bazi.hour!.stem).toBe('癸');
    expect(bazi.hour!.branch).toBe('卯');
  });

  test('null hour when unknown', () => {
    const bazi = computeBazi({ ...birth, hour: null });
    expect(bazi.hour).toBeNull();
  });
});

describe('computeDailyFortune', () => {
  const birth: BirthData = { year: 1996, month: 8, day: 18, hour: 3, birthplace: '上海' };
  const date = new Date(2026, 5, 13); // June 13, 2026

  const fortune = computeDailyFortune(birth, date);

  test('returns a complete DailyFortune shape', () => {
    expect(typeof fortune.date).toBe('string');
    expect(fortune.date).toBe('2026-06-13');
    expect(fortune.lunarDate).toContain('月');
    expect(fortune.lunarDate).not.toContain('农历'); // prefix stripped — page adds it
    expect(fortune.stemBranch).toContain('月');
    expect(fortune.stemBranch).toContain('日');
    expect(typeof fortune.solarTerm).toBe('string');
    expect(fortune.solarTerm.length).toBeGreaterThan(0);
    // solarTermDay must NOT be present (removed from type)
    expect((fortune as any).solarTermDay).toBeUndefined();
    expect(typeof fortune.keyword).toBe('string');
    expect(fortune.overallScore).toBeGreaterThanOrEqual(30);
    expect(fortune.overallScore).toBeLessThanOrEqual(95);
    expect(fortune.elements).toHaveLength(5);
    expect(fortune.aspects).toHaveLength(4);
    expect(typeof fortune.advice).toBe('string');
    expect(typeof fortune.suitable).toBe('string');
    expect(typeof fortune.luckyColor).toBe('string');
    expect(typeof fortune.luckyTime).toBe('string');
    expect(typeof fortune.trend).toBe('string');
  });

  test('stemBranch uses TODAY bazi, not user birth bazi', () => {
    // birth bazi month = 丙申, day = 丁亥
    // today (2026-06-13) bazi should be different
    expect(fortune.stemBranch).not.toBe('丙申月 丁亥日');
  });

  test('dayMasterElement is set from user day stem', () => {
    // Birth day stem is 丁 → 火
    expect(fortune.dayMasterElement).toBe('火');
  });

  test('day-stem element gets higher weight', () => {
    const max = fortune.elements.reduce((a, b) => a.value > b.value ? a : b);
    expect(max.value).toBeGreaterThan(50);
  });
});
