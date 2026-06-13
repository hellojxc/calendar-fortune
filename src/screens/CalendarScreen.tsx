import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { JUNE_2026_DAYS, WEEKDAY_LABELS } from '../data/fixtures';
import type { CalendarDay } from '../types';

export default function CalendarScreen() {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.monthSwitch}>
          <View>
            <Text style={styles.monthTitle}>2026 年 6 月</Text>
            <Text style={styles.monthLunar}>农历四月廿七至五月廿六</Text>
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

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((d) => (
            <Text key={d} style={styles.weekday}>{d}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {JUNE_2026_DAYS.map((item: CalendarDay, i) => (
            <View
              key={i}
              style={[
                styles.day,
                item.isOtherMonth && styles.dayOther,
                item.isToday && styles.dayToday,
              ]}
            >
              <Text style={[styles.dayNum, item.isToday && styles.dayNumToday]}>{item.day}</Text>
              <Text style={[styles.dayLunar, item.isToday && styles.dayLunarToday]}>{item.lunar}</Text>
              {item.hasEvent && (
                <View style={styles.marks}>
                  <View style={[styles.mark, item.isToday && styles.markToday]} />
                  {(item.eventCount ?? 1) >= 2 && (
                    <View style={[styles.mark, item.isToday && styles.markToday]} />
                  )}
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={styles.dailyPanel}>
          <View style={styles.dailyPanelTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dailyPanelTitle}>6月13日 · 今日</Text>
              <Text style={styles.dailyPanelDesc}>运势 78，木旺土弱。适合整理计划、沟通合作。</Text>
            </View>
            <View style={styles.smallScore}>
              <Text style={styles.smallScoreText}>78</Text>
            </View>
          </View>
          <View style={styles.eventRow}>
            <View style={[styles.dot, { backgroundColor: Colors.wood }]} />
            <Text style={styles.eventText}>09:30 团队周会</Text>
          </View>
          <View style={styles.eventRow}>
            <View style={[styles.dot, { backgroundColor: Colors.fire }]} />
            <Text style={styles.eventText}>14:00 牙医复诊</Text>
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
  cinnabar: '#a8422d',
  cinnabarSoft: '#f0d9d1',
  goldSoft: '#efe0bd',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e8' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 86 },
  monthSwitch: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 13,
  },
  monthTitle: { fontSize: 27, fontWeight: '700', color: PROTO.ink },
  monthLunar: { fontSize: 11, color: PROTO.muted, marginTop: 4 },
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
  dayNum: { fontSize: 14, fontWeight: '600', color: PROTO.ink },
  dayNumToday: { color: PROTO.surface },
  dayLunar: { fontSize: 9, color: PROTO.muted, marginTop: 2 },
  dayLunarToday: { color: 'rgba(255, 250, 241, 0.78)' },
  marks: { position: 'absolute', right: 5, bottom: 5, flexDirection: 'row', gap: 3 },
  mark: { width: 4, height: 4, borderRadius: 2, backgroundColor: PROTO.ink },
  markToday: { backgroundColor: PROTO.surface },
  dailyPanel: {
    marginTop: 13, borderWidth: 1, borderColor: PROTO.line,
    borderRadius: 8, padding: 12,
    backgroundColor: 'rgba(255, 250, 241, 0.78)',
  },
  dailyPanelTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    gap: 12, marginBottom: 9,
  },
  dailyPanelTitle: { fontSize: 15, fontWeight: '700', color: PROTO.ink },
  dailyPanelDesc: { fontSize: 12, color: PROTO.muted, lineHeight: 18, marginTop: 4 },
  smallScore: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: PROTO.cinnabarSoft, alignItems: 'center', justifyContent: 'center',
  },
  smallScoreText: { color: PROTO.cinnabar, fontWeight: '800', fontSize: 16 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eventText: { fontSize: 12, color: PROTO.muted },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
