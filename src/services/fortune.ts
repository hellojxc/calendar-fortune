/**
 * Simplified daily fortune calculator.
 *
 * Production would use a real 八字/五行 engine; this minimal version
 * hashes birth data + date to produce deterministic, visually-plausible results.
 */
import type {
  BirthData,
  DailyFortune,
  ElementScore,
  AspectScore,
  Bazi,
  BaziPillar,
  ElementName,
} from '../types';

// ── TIAN GAN / DI ZHI tables ──

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

const ELEMENT_ORDER: ElementName[] = ['木', '火', '土', '金', '水'];

// Stem→element map
const GAN_ELEMENT: Record<string, ElementName> = {
  '甲': '木', '乙': '木',
  '丙': '火', '丁': '火',
  '戊': '土', '己': '土',
  '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
};

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

// ── Bazi generation (simplified) ──

export function computeBazi(birth: BirthData): Bazi {
  const seed = `${birth.year}-${birth.month}-${birth.day}-${birth.hour ?? -1}`;
  const h = hashToInt(seed);

  const yearIdx = (birth.year + h) % 10;
  const monthIdx = (birth.month + h) % 10;
  const dayIdx = (birth.day + h) % 10;
  const hourIdx = birth.hour !== null ? (birth.hour + h) % 10 : -1;

  const branchYear = (birth.year + h) % 12;
  const branchMonth = (birth.month + h) % 12;
  const branchDay = (birth.day + h) % 12;
  const branchHour = birth.hour !== null ? (birth.hour + h) % 12 : -1;

  const pillar = (sIdx: number, bIdx: number): BaziPillar => ({
    stem: TIAN_GAN[sIdx],
    branch: DI_ZHI[bIdx],
  });

  return {
    year: pillar(yearIdx, branchYear),
    month: pillar(monthIdx, branchMonth),
    day: pillar(dayIdx, branchDay),
    hour: birth.hour !== null ? pillar(hourIdx, branchHour) : null,
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

// Lunar / solar term data (2026 approximations)
const SOLAR_TERMS_2026: Record<string, string> = {
  '06-01': '芒种', '06-06': '芒种', '06-13': '芒种',
  '06-21': '夏至', '06-30': '夏至',
};
const STILL_CURRENT = (month: number, day: number) => {
  if (month === 6 && day <= 20) return { name: '芒种', startDay: 5 };
  if (month === 6) return { name: '夏至', startDay: 21 };
  return { name: '小暑', startDay: 7 };
};

/** Return YYYY-MM-DD in local timezone (never UTC). */
function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function computeDailyFortune(birth: BirthData, date: Date = new Date()): DailyFortune {
  const seed = `${birth.year}-${birth.month}-${birth.day}-${birth.hour ?? -1}-${localDateStr(date)}`;
  const h = hashToInt(seed);

  // Five elements from stem elements of bazi pillars weighted by day
  const bazi = computeBazi(birth);
  const dayStemElement = GAN_ELEMENT[bazi.day.stem] ?? '木';

  // Boost the day-element, randomize others
  const elementScores: ElementScore[] = ELEMENT_ORDER.map((el) => {
    const base = el === dayStemElement ? 60 : 40;
    const val = base + (hashToInt(seed + el) % 50);
    return { element: el, value: Math.min(val, 99) };
  });

  // Overall score: average adjusted toward centre
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

  // Lunar: simplified — we just tag the solar term and return a stub lunar
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const term = STILL_CURRENT(m, d);
  const termDay = d - (term.startDay - 1);

  const lunarDayStr = `四月${['','一','二','三','四','五','六','七','八','九','十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九'][d] ?? d}日`;

  const stemBranch = bazi.day
    ? `${bazi.month.stem}${bazi.month.branch}月 ${bazi.day.stem}${bazi.day.branch}日`
    : '丙午月 戊辰日';

  return {
    date: localDateStr(date),
    lunarDate: lunarDayStr,
    stemBranch,
    solarTerm: term.name,
    solarTermDay: Math.max(1, termDay),
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
