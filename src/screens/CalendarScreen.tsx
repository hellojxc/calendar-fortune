import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Solar } from 'lunar-typescript';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { WEEKDAY_LABELS } from '../data/fixtures';
import { computeFallbackFortune } from '../services/fortune';
import { loadSchedule } from '../storage/schedule';
import type { ScheduleItem } from '../types';
import type { CalendarStackParamList } from '../navigation/CalendarStackNavigator';

interface CalendarDay {
  day: number;
  lunar: string;
  isToday: boolean;
  isOtherMonth: boolean;
  isSelected: boolean;
  hasSchedule: boolean;
}

/** Use lunar-typescript for real lunar day conversion. */
function getLunarDay(year: number, month: number, day: number): string {
  try {
    const solar = Solar.fromYmd(year, month, day);
    return solar.getLunar().getDayInChinese();
  } catch {
    return `${day}`;
  }
}

/** Days in month */
function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

/** Build a full calendar grid for year/month */
function buildCalendarGrid(year: number, month: number, today: Date, selectedDay: number | null, scheduleDates: Set<string>): CalendarDay[] {
  const days: CalendarDay[] = [];
  const totalDays = daysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const offset = (firstDayOfWeek + 6) % 7;

  // Previous month tail
  const prevMonthDaysVal = daysInMonth(year, month - 1);
  for (let i = offset - 1; i >= 0; i--) {
    days.push({ day: prevMonthDaysVal - i, lunar: '', isToday: false, isOtherMonth: true, isSelected: false, hasSchedule: false });
  }

  // Current month
  for (let d = 1; d <= totalDays; d++) {
    const ds = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    days.push({
      day: d,
      lunar: getLunarDay(year, month, d),
      isToday: d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear(),
      isOtherMonth: false,
      isSelected: selectedDay === d,
      hasSchedule: scheduleDates.has(ds),
    });
  }

  // Next month head
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, lunar: '', isToday: false, isOtherMonth: true, isSelected: false, hasSchedule: false });
    }
  }

  return days;
}

export default function CalendarScreen() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const today = new Date();
  const [allSchedules, setAllSchedules] = useState<ScheduleItem[]>([]);

  // Load schedules on focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        setAllSchedules(await loadSchedule());
      })();
    }, [])
  );

  const scheduleDates = useMemo(() => {
    const set = new Set<string>();
    for (const s of allSchedules) set.add(s.date);
    return set;
  }, [allSchedules]);

  const grid = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth, today, selectedDay, scheduleDates),
    [viewYear, viewMonth, selectedDay, scheduleDates]
  );

  // Fallback day capped to the view month's actual day count (e.g. March 31 browsing Feb → capped to 28/29)
  const effectiveDay = selectedDay ?? Math.min(today.getDate(), daysInMonth(viewYear, viewMonth));

  // Week view: show only the 7-day row containing the selected day (or today)
  const visibleGrid = useMemo(() => {
    if (viewMode === 'month') return grid;
    const anchorDay = selectedDay ?? (viewYear === today.getFullYear() && viewMonth === today.getMonth() + 1 ? today.getDate() : 1);
    const anchorIdx = grid.findIndex(
      (d) => d.day === anchorDay && !d.isOtherMonth
    );
    const rowStart = anchorIdx >= 0 ? Math.floor(anchorIdx / 7) * 7 : 0;
    return grid.slice(rowStart, rowStart + 7);
  }, [viewMode, grid, selectedDay, viewYear, viewMonth, today]);

  // Week nav: use Date arithmetic for correct cross-month/year jumping
  const goPrevWeek = () => {
    const d = effectiveDay;
    const cur = new Date(viewYear, viewMonth - 1, d);
    cur.setDate(cur.getDate() - 7);
    setViewYear(cur.getFullYear());
    setViewMonth(cur.getMonth() + 1);
    setSelectedDay(cur.getDate());
  };
  const goNextWeek = () => {
    const d = effectiveDay;
    const cur = new Date(viewYear, viewMonth - 1, d);
    cur.setDate(cur.getDate() + 7);
    setViewYear(cur.getFullYear());
    setViewMonth(cur.getMonth() + 1);
    setSelectedDay(cur.getDate());
  };

  const selectedFortune = useMemo(() => {
    const d = effectiveDay;
    return computeFallbackFortune(new Date(viewYear, viewMonth - 1, d));
  }, [viewYear, viewMonth, effectiveDay]);

  const selectedLunarStr = useMemo(() => {
    const d = effectiveDay;
    try {
      const solar = Solar.fromYmd(viewYear, viewMonth, d);
      const lunar = solar.getLunar();
      const monthCh = lunar.getMonthInChinese();
      const dayCh = lunar.getDayInChinese();
      const term = lunar.getJieQi() || lunar.getPrevJieQi() || lunar.getNextJieQi();
      const termStr = term && typeof term !== 'string' ? term.getName() : '';
      return `农历${monthCh}月${dayCh}${termStr ? ' · ' + termStr : ''}`;
    } catch {
      return '';
    }
  }, [viewYear, viewMonth, selectedDay]);

  // Schedules for selected day
  const selectedDaySchedules = useMemo(() => {
    const d = effectiveDay;
    const ds = `${viewYear}-${String(viewMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    return allSchedules.filter((s) => s.date === ds);
  }, [viewYear, viewMonth, effectiveDay, allSchedules]);

  const goPrevMonth = () => {
    if (viewMonth === 1) { setViewYear(viewYear - 1); setViewMonth(12); }
    else setViewMonth(viewMonth - 1);
    setSelectedDay(null);
  };
  const goNextMonth = () => {
    if (viewMonth === 12) { setViewYear(viewYear + 1); setViewMonth(1); }
    else setViewMonth(viewMonth + 1);
    setSelectedDay(null);
  };

  const handleDayPress = (item: CalendarDay) => {
    if (item.isOtherMonth) {
      if (item.day > 15) goPrevMonth(); else goNextMonth();
      return;
    }
    setSelectedDay(item.day);
  };

  const selectedDate = selectedDay
    ? `${viewYear}年${viewMonth}月${selectedDay}日`
    : '未选择';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Month switch */}
        <View style={styles.monthSwitch}>
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={viewMode === 'month' ? goPrevMonth : goPrevWeek}
              style={styles.navBtn}
            >
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.monthTitle}>
                {viewMode === 'month'
                  ? `${viewYear} 年 ${viewMonth} 月`
                  : (() => {
                      const first = visibleGrid[0];
                      const last = visibleGrid[visibleGrid.length - 1];
                      // Use Date objects to correctly compute month/year for boundary days
                      const d1 = new Date(viewYear, viewMonth - 1, first.day);
                      if (first.isOtherMonth && first.day > 15) d1.setMonth(d1.getMonth() - 1);
                      const d2 = new Date(viewYear, viewMonth - 1, last.day);
                      if (last.isOtherMonth && last.day < 15) d2.setMonth(d2.getMonth() + 1);
                      const y1 = d1.getFullYear(), m1 = d1.getMonth() + 1, dd1 = d1.getDate();
                      const y2 = d2.getFullYear(), m2 = d2.getMonth() + 1, dd2 = d2.getDate();
                      return `${y1}年${m1}月${dd1}日 – ${y2}年${m2}月${dd2}日`;
                    })()}
              </Text>
            </View>
            <TouchableOpacity
              onPress={viewMode === 'month' ? goNextMonth : goNextWeek}
              style={styles.navBtn}
            >
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segBtn, viewMode === 'month' && styles.segBtnActive]}
              onPress={() => setViewMode('month')}
            >
              <Text style={[styles.segText, viewMode === 'month' && styles.segTextActive]}>月</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segBtn, viewMode === 'week' && styles.segBtnActive]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[styles.segText, viewMode === 'week' && styles.segTextActive]}>周</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekday header */}
        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((d) => (
            <Text key={d} style={styles.weekday}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {visibleGrid.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.day,
                item.isOtherMonth && styles.dayOther,
                item.isToday && styles.dayToday,
                item.isSelected && !item.isToday && styles.daySelected,
              ]}
              onPress={() => handleDayPress(item)}
              activeOpacity={0.6}
            >
              <Text style={[
                styles.dayNum,
                item.isToday && styles.dayNumToday,
                item.isSelected && !item.isToday && styles.dayNumSelected,
              ]}>
                {item.day}
              </Text>
              {item.lunar !== '' && (
                <Text style={[
                  styles.dayLunar,
                  item.isToday && styles.dayLunarToday,
                  item.isSelected && !item.isToday && styles.dayLunarSelected,
                ]}>
                  {item.lunar}
                </Text>
              )}
              {item.hasSchedule && <View style={styles.dot} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily panel */}
        <View style={styles.dailyPanel}>
          <View style={styles.dailyPanelTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dailyPanelTitle}>{selectedDate}</Text>
              <Text style={styles.dailyPanelLunar}>
                {selectedLunarStr}
              </Text>
              <Text style={styles.dailyPanelDesc}>
                运势 {selectedFortune.overallScore} · {selectedFortune.keyword}
              </Text>
            </View>
            <View style={styles.smallScore}>
              <Text style={styles.smallScoreText}>{selectedFortune.overallScore}</Text>
            </View>
          </View>
          {/* Schedule list for selected day */}
          {selectedDaySchedules.length > 0 && (
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleSectionTitle}>日程</Text>
              {selectedDaySchedules.map((s) => (
                <View key={s.id} style={styles.scheduleItem}>
                  <Text style={styles.scheduleItemTime}>{s.time}</Text>
                  <Text style={styles.scheduleItemTitle}>{s.title}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {/* FAB — add schedule for selected day */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => {
          const d = effectiveDay;
          const ds = `${viewYear}-${String(viewMonth).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          navigation.navigate('AddSchedule', { date: ds } as any);
        }}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const PROTO = {
  surface: '#fffaf1',
  ink: '#24211c',
  muted: '#756d61',
  line: '#dfd1bd',
  jade: '#2f7d63',
  cinnabar: '#a8422d',
  gold: '#b8872d',
  cinnabarSoft: '#f0d9d1',
  goldSoft: '#efe0bd',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e8' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 86 },
  monthSwitch: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 13,
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navBtn: {
    width: 30, height: 30, borderRadius: 8,
    borderWidth: 1, borderColor: PROTO.line,
    backgroundColor: 'rgba(255, 250, 241, 0.68)',
    alignItems: 'center', justifyContent: 'center',
  },
  navBtnText: { fontSize: 18, color: PROTO.muted, lineHeight: 20 },
  monthTitle: { fontSize: 20, fontWeight: '700', color: PROTO.ink },
  segmented: {
    flexDirection: 'row', padding: 3,
    borderWidth: 1, borderColor: PROTO.line, borderRadius: 8,
    backgroundColor: 'rgba(255, 250, 241, 0.74)',
  },
  segBtn: { width: 42, paddingVertical: 5, alignItems: 'center', borderRadius: 6 },
  segBtnActive: { backgroundColor: PROTO.goldSoft },
  segText: { fontSize: 11, color: PROTO.muted },
  segTextActive: { color: PROTO.ink, fontWeight: '700' },
  weekdayRow: { flexDirection: 'row', marginVertical: 8 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, color: PROTO.muted },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  day: {
    width: '13.2%', aspectRatio: 0.85, borderWidth: 1,
    borderColor: 'transparent', borderRadius: 8,
    padding: 6, paddingHorizontal: 5,
    backgroundColor: 'rgba(255, 250, 241, 0.54)',
  },
  dayOther: { opacity: 0.38 },
  dayToday: { borderColor: 'rgba(168, 66, 45, 0.38)', backgroundColor: PROTO.cinnabar },
  daySelected: { borderColor: PROTO.jade, backgroundColor: 'rgba(47, 125, 99, 0.12)' },
  dayNum: { fontSize: 14, fontWeight: '600', color: PROTO.ink },
  dayNumToday: { color: PROTO.surface },
  dayNumSelected: { color: PROTO.jade },
  dayLunar: { fontSize: 9, color: PROTO.muted, marginTop: 2 },
  dayLunarToday: { color: 'rgba(255, 250, 241, 0.78)' },
  dayLunarSelected: { color: PROTO.jade },
  dot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: PROTO.cinnabar, alignSelf: 'center',
    marginTop: 4,
  },
  dailyPanel: {
    marginTop: 13, borderWidth: 1, borderColor: PROTO.line,
    borderRadius: 8, padding: 12,
    backgroundColor: 'rgba(255, 250, 241, 0.78)',
  },
  dailyPanelTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    gap: 12, marginBottom: 4,
  },
  dailyPanelTitle: { fontSize: 15, fontWeight: '700', color: PROTO.ink },
  dailyPanelLunar: { fontSize: 12, color: PROTO.muted, marginTop: 2 },
  dailyPanelDesc: { fontSize: 12, color: PROTO.muted, lineHeight: 18, marginTop: 4 },
  smallScore: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: PROTO.cinnabarSoft, alignItems: 'center', justifyContent: 'center',
  },
  smallScoreText: { color: PROTO.cinnabar, fontWeight: '800', fontSize: 16 },
  scheduleSection: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: PROTO.line,
  },
  scheduleSectionTitle: {
    fontSize: 11, fontWeight: '700', color: PROTO.muted,
    marginBottom: 8,
  },
  scheduleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 6,
  },
  scheduleItemTime: { fontSize: 12, color: PROTO.cinnabar, fontWeight: '600', width: 40 },
  scheduleItemTitle: { fontSize: 13, color: PROTO.ink, flex: 1 },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: PROTO.cinnabar,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6,
  },
  fabText: { fontSize: 24, color: '#fff', lineHeight: 28, fontWeight: '300' },
});
