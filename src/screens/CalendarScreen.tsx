import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Solar } from 'lunar-typescript';
import { Colors } from '../theme';
import { WEEKDAY_LABELS } from '../data/fixtures';
import { computeFallbackFortune } from '../services/fortune';

interface CalendarDay {
  day: number;
  lunar: string;
  isToday: boolean;
  isOtherMonth: boolean;
  isSelected: boolean;
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
function buildCalendarGrid(year: number, month: number, today: Date, selectedDay: number | null): CalendarDay[] {
  const days: CalendarDay[] = [];
  const totalDays = daysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0=Sun→offset to Mon
  const offset = (firstDayOfWeek + 6) % 7; // Mon=0 ... Sun=6

  // Previous month tail
  const prevMonthDays = daysInMonth(year, month - 1);
  for (let i = offset - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      lunar: '',
      isToday: false,
      isOtherMonth: true,
      isSelected: false,
    });
  }

  // Current month
  for (let d = 1; d <= totalDays; d++) {
    days.push({
      day: d,
      lunar: getLunarDay(year, month, d),
      isToday:
        d === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear(),
      isOtherMonth: false,
      isSelected: selectedDay === d,
    });
  }

  // Next month head
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, lunar: '', isToday: false, isOtherMonth: true, isSelected: false });
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
  const grid = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth, today, selectedDay),
    [viewYear, viewMonth, selectedDay]
  );

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

  // Week nav: move by 7 days
  const goPrevWeek = () => {
    const d = selectedDay ?? today.getDate();
    const newDay = d - 7;
    if (newDay < 1) goPrevMonth();
    else setSelectedDay(newDay);
  };
  const goNextWeek = () => {
    const d = selectedDay ?? today.getDate();
    const daysInCur = daysInMonth(viewYear, viewMonth);
    const newDay = d + 7;
    if (newDay > daysInCur) goNextMonth();
    else setSelectedDay(newDay);
  };

  const selectedFortune = useMemo(() => {
    const d = selectedDay ?? today.getDate();
    return computeFallbackFortune(new Date(viewYear, viewMonth - 1, d));
  }, [viewYear, viewMonth, selectedDay]);

  const selectedLunarStr = useMemo(() => {
    const d = selectedDay ?? today.getDate();
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
                      const m1 = viewMonth - (first.isOtherMonth && first.day > 15 ? 1 : 0);
                      const m2 = viewMonth + (last.isOtherMonth && last.day < 15 ? 1 : 0);
                      return `${viewYear}年${m1}月${first.day}日 – ${m2}月${last.day}日`;
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
        </View>
      </ScrollView>
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
});
