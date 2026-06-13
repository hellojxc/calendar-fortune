/**
 * Daily fortune calculator powered by lunar-typescript for astronomically
 * accurate bazi (八字), lunar calendar, and solar terms.
 */
import { Solar } from 'lunar-typescript';
import type {
  BirthData,
  DailyFortune,
  ElementScore,
  AspectScore,
  Bazi,
  BaziPillar,
  ElementName,
} from '../types';

// ── Element / stem tables ──

const ELEMENT_ORDER: ElementName[] = ['木', '火', '土', '金', '水'];

const GAN_ELEMENT: Record<string, ElementName> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

// ── Chinese hour → representative solar hour ──

const CHINESE_HOUR_TO_SOLAR: number[] = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

// ── Bazi from real calendar ──

export function computeBazi(birth: BirthData): Bazi {
  const solar =
    birth.hour !== null
      ? Solar.fromYmdHms(birth.year, birth.month, birth.day, CHINESE_HOUR_TO_SOLAR[birth.hour], 0, 0)
      : Solar.fromYmd(birth.year, birth.month, birth.day);

  const bz = solar.getLunar().getEightChar();

  const pillar = (gz: string): BaziPillar => ({
    stem: gz.charAt(0),
    branch: gz.charAt(1),
  });

  return {
    year: pillar(bz.getYear()),
    month: pillar(bz.getMonth()),
    day: pillar(bz.getDay()),
    hour: birth.hour !== null ? pillar(bz.getTime()) : null,
  };
}

// ── Daily fortune ──

const KEYWORDS_POOL = [
  '稳中求进', '顺势而为', '厚积薄发', '以静制动',
  '主动出击', '守正出奇', '藏锋守拙', '因势利导',
  '循序渐进', '随机应变',
];

const ADVICE_POOL = [
  '重要沟通尽量放在上午，先定目标再谈细节。',
  '今天适合推进积压事项，但涉及长期承诺需多核对。',
  '保持耐心，外界节奏偏慢，适合复盘和规划。',
  '注意情绪管理，关键时刻多等半拍再做决定。',
  '适合对外沟通、约见合作方，上午效率最高。',
];

const SUITABLE_POOL = [
  '整理计划、约见合作方、复盘项目、学习新内容。',
  '处理文书、安排会议、推进协作、适度运动。',
  '清点待办、联系旧友、创意工作、放松休息。',
  '深度工作、技能练习、预算整理、提前准备下周。',
];

const COLORS = ['青绿', '浅蓝', '米白', '暖黄', '淡紫'];
const TIMES = ['07:00-09:00', '09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00'];
const TRENDS = ['均衡偏动', '偏静为宜', '小步快跑', '先稳后进', '顺势而为'];

/** Simple string hash → 0..n */
function hashToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Map hash 0..1 → integer in [min, max] */
function ranged(hash: number, min: number, max: number): number {
  return min + (hash % (max - min + 1));
}

/** Return YYYY-MM-DD in local timezone. */
function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeDailyFortune(birth: BirthData, date: Date = new Date()): DailyFortune {
  const seed = `${birth.year}-${birth.month}-${birth.day}-${birth.hour ?? -1}-${localDateStr(date)}`;
  const h = hashToInt(seed);

  // ── Real bazi from lunar-typescript ──
  const bazi = computeBazi(birth);
  const dayStemElement = GAN_ELEMENT[bazi.day.stem] ?? '木';

  // Five elements: day-stem element weighted higher
  const elementScores: ElementScore[] = ELEMENT_ORDER.map((el) => {
    const base = el === dayStemElement ? 60 : 40;
    const val = base + (hashToInt(seed + el) % 50);
    return { element: el, value: Math.min(val, 99) };
  });

  // Overall score
  const avg = elementScores.reduce((s, e) => s + e.value, 0) / 5;
  const score = Math.round(avg + (hashToInt(seed + 'score') % 20 - 10));
  const overallScore = Math.max(30, Math.min(95, score));

  // Aspects
  const aspects: AspectScore[] = [
    { label: '事业', score: ranged(hashToInt(seed + 'A'), 55, 92), desc: '适合开会、提案、推进合作。' },
    { label: '财运', score: ranged(hashToInt(seed + 'B'), 45, 85), desc: '可整理预算，不宜冲动下单。' },
    { label: '感情', score: ranged(hashToInt(seed + 'C'), 50, 88), desc: '直接表达会比猜测更有效。' },
    { label: '健康', score: ranged(hashToInt(seed + 'D'), 45, 80), desc: '注意作息，下午少喝冰饮。' },
  ];

  // ── Real lunar data from lunar-typescript ──
  const solarToday = Solar.fromDate(date);
  const lunarToday = solarToday.getLunar();

  const lunarMonthStr = lunarToday.getMonthInChinese(); // e.g. "四" for April
  const lunarDayStr = lunarToday.getDayInChinese();     // e.g. "廿八"

  // Solar term
  const nextJie = lunarToday.getNextJieQi();
  const prevJie = lunarToday.getPrevJieQi();
  const termObj = lunarToday.getJieQi() || prevJie || nextJie;
  const termName: string = typeof termObj === 'object' && termObj !== null && 'getName' in termObj
    ? (termObj as any).getName()
    : '—';

  // ── Today's stem-branch (from today's bazi, NOT user's birth bazi) ──
  const todayBazi = lunarToday.getEightChar();
  const stemBranch = `${todayBazi.getMonth()}月 ${todayBazi.getDay()}日`;

  return {
    date: localDateStr(date),
    lunarDate: `${lunarMonthStr}月${lunarDayStr}`,
    stemBranch,
    solarTerm: termName,
    solarTermDay: 1, // simplified — would need proper term-day calculation
    keyword: KEYWORDS_POOL[hashToInt(seed + 'kw') % KEYWORDS_POOL.length],
    overallScore,
    description: (() => {
      const highs = elementScores.filter((e) => e.value > 70);
      const elemPart = highs.length > 0
        ? highs.map((e) => `${e.element}气偏旺`).join('，') + '。'
        : '';
      return elemPart + ADVICE_POOL[hashToInt(seed + 'adv') % ADVICE_POOL.length];
    })(),
    elements: elementScores,
    aspects,
    advice: ADVICE_POOL[hashToInt(seed + 'adv2') % ADVICE_POOL.length],
    suitable: SUITABLE_POOL[hashToInt(seed + 'suit') % SUITABLE_POOL.length],
    luckyColor: COLORS[hashToInt(seed + 'lc') % COLORS.length],
    luckyTime: TIMES[hashToInt(seed + 'lt') % TIMES.length],
    trend: TRENDS[hashToInt(seed + 'trend') % TRENDS.length],
  };
}

// ── Helpers ──

/** Generic reference birth for fallback fortune. */
const GENERIC_BIRTH: BirthData = { year: 1996, month: 1, day: 1, hour: null, birthplace: '未知' };

/** Compute fallback fortune for the given date. */
export function computeFallbackFortune(date: Date = new Date()): DailyFortune {
  return computeDailyFortune(GENERIC_BIRTH, date);
}

/** Validate that year/month/day form a real calendar date. */
export function isValidDate(y: number, m: number, d: number): boolean {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() + 1 === m && dt.getDate() === d;
}
