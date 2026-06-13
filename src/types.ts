/**
 * Shared types for 时序日历. All screen data shapes live here.
 */

// ── Birth data (extractable from UserProfile) ──

export interface BirthData {
  /** Gregorian year, e.g. 1996 */
  year: number;
  /** 1-based month */
  month: number;
  /** 1-based day */
  day: number;
  /** Chinese hour index 0-11 (子丑寅卯辰巳午未申酉戌亥), or null if unknown */
  hour: number | null;
  /** City name for timezone correction */
  birthplace: string;
}

/** One Bazi pillar (柱), e.g. { stem: '丙', branch: '子' } */
export interface BaziPillar {
  stem: string;
  branch: string;
}

/** All four pillars */
export interface Bazi {
  year: BaziPillar;
  month: BaziPillar;
  day: BaziPillar;
  hour: BaziPillar | null;
}

// ── Fortune ──

export type ElementName = '木' | '火' | '土' | '金' | '水';

export interface ElementScore {
  element: ElementName;
  value: number; // 0-100
}

export interface AspectScore {
  label: string;   // e.g. 事业
  score: number;   // 0-100
  desc: string;
}

export interface DailyFortune {
  date: string;              // ISO date string
  lunarDate: string;         // e.g. 四月廿八
  stemBranch: string;        // e.g. 丙午月 戊辰日
  solarTerm: string;         // e.g. 芒种
  keyword: string;           // e.g. 稳中求进
  overallScore: number;      // 0-100
  description: string;       // main fortune text
  elements: ElementScore[];  // five element breakdown
  aspects: AspectScore[];    // career, wealth, love, health
  advice: string;            // today's reminder
  suitable: string;          // what's good to do
  luckyColor: string;        // e.g. 青绿
  luckyTime: string;         // e.g. 09:00-11:00
  trend: string;             // e.g. 均衡偏动
}

// ── Schedule ──

export interface ScheduleItem {
  id: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  title: string;
  hint: string;
  type: 'meeting' | 'personal' | 'health' | 'other';
}

// ── Calendar ──

export interface CalendarDay {
  day: number;
  lunar: string;
  isToday?: boolean;
  isOtherMonth?: boolean;
  hasEvent?: boolean;
  eventCount?: number;
}

// ── Unified Profile (personal info + birth data) ──

export interface UserProfile {
  name: string;
  avatar: string;
  reminderTime: string;
  hasFortuneEnabled: boolean;
  /** Gregorian birth year, e.g. 1996 */
  birthYear?: number;
  /** 1-based birth month */
  birthMonth?: number;
  /** 1-based birth day */
  birthDay?: number;
  /** Chinese hour index 0-11, or null if unknown */
  birthHour: number | null;
  /** Birth city */
  birthplace?: string;
}

/** Extract BirthData from profile (returns null if birth date incomplete). */
export function profileToBirthData(p: UserProfile): BirthData | null {
  if (!p.birthYear || !p.birthMonth || !p.birthDay) return null;
  return {
    year: p.birthYear,
    month: p.birthMonth,
    day: p.birthDay,
    hour: p.birthHour,
    birthplace: p.birthplace || '未知',
  };
}

// ── Settings ──

export interface SettingItem {
  id: string;
  icon: string;   // emoji
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
}
