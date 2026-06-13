/**
 * Typed fixture data. All mock/display data extracted from screens into a single source.
 */
import type {
  BirthData,
  DailyFortune,
  ScheduleItem,
  CalendarDay,
  UserProfile,
  SettingItem,
} from '../types';

// ── Birth data fixture ──

export const DEFAULT_BIRTH_DATA: BirthData = {
  year: 1996,
  month: 8,
  day: 18,
  hour: 3,        // 卯 (5-7)
  birthplace: '上海市',
};

// ── Daily fortune fixture (6月13日) ──

export const TODAY_FORTUNE: DailyFortune = {
  date: '2026-06-13',
  lunarDate: '四月廿八',
  stemBranch: '丙午月 戊辰日',
  solarTerm: '芒种',
  solarTermDay: 8,
  keyword: '稳中求进',
  overallScore: 78,
  description:
    '木气偏旺，适合推进沟通、复盘计划。土气偏弱，涉及钱和长期承诺时先放慢半拍。',
  elements: [
    { element: '木', value: 82 },
    { element: '火', value: 55 },
    { element: '土', value: 34 },
    { element: '金', value: 62 },
    { element: '水', value: 48 },
  ],
  aspects: [
    { label: '事业', score: 82, desc: '适合开会、提案、推进合作。' },
    { label: '财运', score: 64, desc: '可整理预算，不宜冲动下单。' },
    { label: '感情', score: 71, desc: '直接表达会比猜测更有效。' },
    { label: '健康', score: 58, desc: '注意作息，下午少喝冰饮。' },
  ],
  advice: '重要沟通尽量放在上午，先定目标再谈细节。遇到临时变化时，不要急着给最终答复，留出复核时间。',
  suitable: '整理计划、约见合作方、复盘项目、学习新内容。涉及投资、签约、借贷时建议二次确认。',
  luckyColor: '青绿',
  luckyTime: '09:00-11:00',
  trend: '均衡偏动',
};

// ── Today's schedule ──

export const TODAY_SCHEDULE: ScheduleItem[] = [
  { id: '1', date: '2026-06-13', time: '09:30', title: '团队周会', hint: '建议先讲结论，再展开细节', type: 'meeting' },
  { id: '2', date: '2026-06-13', time: '14:00', title: '牙医复诊', hint: '出行提前 15 分钟', type: 'health' },
];

// ── Calendar month (June 2026) ──

export const JUNE_2026_DAYS: CalendarDay[] = [
  { day: 1, lunar: '十六' },
  { day: 2, lunar: '十七' },
  { day: 3, lunar: '十八' },
  { day: 4, lunar: '十九' },
  { day: 5, lunar: '芒种', hasEvent: true },
  { day: 6, lunar: '廿一' },
  { day: 7, lunar: '廿二' },
  { day: 8, lunar: '廿三' },
  { day: 9, lunar: '廿四' },
  { day: 10, lunar: '廿五', hasEvent: true },
  { day: 11, lunar: '廿六' },
  { day: 12, lunar: '廿七' },
  { day: 13, lunar: '廿八', isToday: true, hasEvent: true, eventCount: 2 },
  { day: 14, lunar: '廿九' },
  { day: 15, lunar: '五月' },
  { day: 16, lunar: '初二' },
  { day: 17, lunar: '初三' },
  { day: 18, lunar: '初四', hasEvent: true },
  { day: 19, lunar: '初五' },
  { day: 20, lunar: '初六' },
  { day: 21, lunar: '夏至' },
  { day: 22, lunar: '初八' },
  { day: 23, lunar: '初九' },
  { day: 24, lunar: '初十' },
  { day: 25, lunar: '十一' },
  { day: 26, lunar: '十二' },
  { day: 27, lunar: '十三' },
  { day: 28, lunar: '十四' },
  { day: 29, lunar: '十五' },
  { day: 30, lunar: '十六' },
  { day: 1, lunar: '十七', isOtherMonth: true },
  { day: 2, lunar: '十八', isOtherMonth: true },
  { day: 3, lunar: '十九', isOtherMonth: true },
  { day: 4, lunar: '二十', isOtherMonth: true },
  { day: 5, lunar: '廿一', isOtherMonth: true },
];

// ── User profile ──

export const DEFAULT_PROFILE: UserProfile = {
  name: '陈先生',
  avatar: '陈',
  reminderTime: '08:00',
  hasFortuneEnabled: true,
  birthHour: null,
};

// ── Settings ──

export const SETTINGS_ITEMS: SettingItem[] = [
  {
    id: 'privacy',
    icon: '🛡',
    iconColor: '#2f7d63',
    iconBg: '#dcebe2',
    title: '隐私与数据',
    desc: '本地计算，支持删除生辰资料',
  },
  {
    id: 'fortune_model',
    icon: '☯',
    iconColor: '#b8872d',
    iconBg: '#efe0bd',
    title: '运势模型',
    desc: '五行权重、提醒语气、免责声明',
  },
  {
    id: 'lunar',
    icon: '📅',
    iconColor: '#315d78',
    iconBg: '#d6e2e9',
    title: '农历与节日',
    desc: '节气、传统节日、调休显示',
  },
  {
    id: 'delete_data',
    icon: '🗑',
    iconColor: '#a8422d',
    iconBg: '#f0d9d1',
    title: '删除个人资料',
    desc: '清除生辰八字和本地画像',
  },
];

// ── Weekday labels ──

export const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

// ── Chinese hour chips ──

export const HOUR_CHIPS = [
  { label: '子', time: '23-1' },
  { label: '丑', time: '1-3' },
  { label: '寅', time: '3-5' },
  { label: '卯', time: '5-7' },
  { label: '辰', time: '7-9' },
  { label: '巳', time: '9-11' },
  { label: '午', time: '11-13' },
  { label: '未', time: '13-15' },
  { label: '申', time: '15-17' },
  { label: '酉', time: '17-19' },
  { label: '戌', time: '19-21' },
  { label: '亥', time: '21-23' },
];

// ── Bazi preview fixture ──

export const BAZI_PREVIEW = {
  year: { stem: '丙', branch: '子' },
  month: { stem: '甲', branch: '午' },
  day: { stem: '戊', branch: '辰' },
  hour: { stem: '乙', branch: '卯' },
};
