import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FortuneRing from '../components/FortuneRing';
import { TODAY_FORTUNE } from '../data/fixtures';
import { loadBirthData, hasBirthData } from '../storage/profile';
import { loadSchedule, deleteSchedule } from '../storage/schedule';
import { computeDailyFortune, computeFallbackFortune } from '../services/fortune';
import type { DailyFortune, ScheduleItem } from '../types';
import type { TodayStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<TodayStackParamList, 'TodayMain'>;

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatTodayChinese(): { dateStr: string; weekday: string } {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const w = now.getDay();
  return { dateStr: `${m}月${d}日`, weekday: WEEKDAY_NAMES[w] };
}

export default function TodayScreen() {
  const navigation = useNavigation<Nav>();
  const [fortune, setFortune] = useState<DailyFortune>(TODAY_FORTUNE);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [hasBirthData, setHasBirthData] = useState(false);
  const today = useMemo(() => formatTodayChinese(), []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const birth = await loadBirthData();
        const items = await loadSchedule();
        const todayDateStr = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`;
        if (!cancelled) {
          if (birth) {
            setFortune(computeDailyFortune(birth));
            setHasBirthData(true);
          } else {
            setFortune(computeFallbackFortune());
            setHasBirthData(false);
          }
          setSchedule(items.filter((s) => s.date === todayDateStr));
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const handleDeleteItem = (item: ScheduleItem) => {
    Alert.alert('删除日程', `确定删除「${item.title}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          await deleteSchedule(item.id);
          setSchedule((prev) => prev.filter((s) => s.id !== item.id));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.appTop}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>序</Text>
            </View>
            <View>
              <Text style={styles.brandName}>时序</Text>
              <Text style={styles.brandSub}>日历 · 农历 · 五行提醒</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('通知', '暂无新通知')}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Date Hero */}
        <View style={styles.dateHero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateText}>{today.dateStr}</Text>
            <Text style={styles.dateDay}>{today.weekday}</Text>
            <Text style={styles.lunarText}>
              农历{fortune.lunarDate} · {fortune.stemBranch}
            </Text>
          </View>
          <View style={styles.solarTerm}>
            <Text style={styles.solarTermName}>{fortune.solarTerm}</Text>
            <Text style={styles.solarTermDay}>第 {fortune.solarTermDay} 天</Text>
          </View>
        </View>

        {/* Quick Tiles */}
        <View style={styles.quickGrid}>
          <View style={styles.quickTile}>
            <Text style={styles.quickLabel}>今日宜</Text>
            <Text style={styles.quickValue}>整理计划</Text>
          </View>
          <View style={styles.quickTile}>
            <Text style={styles.quickLabel}>今日忌</Text>
            <Text style={styles.quickValue}>仓促决定</Text>
          </View>
        </View>

        {/* Fortune Card */}
        <View style={styles.fortuneCard}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionTitle}>今日五行提醒</Text>
            <Text style={styles.sectionSub}>
              {hasBirthData ? '基于您的八字' : '传统文化参考'}
            </Text>
          </View>
          <View style={styles.fortuneMain}>
            <FortuneRing score={fortune.overallScore} size={104} />
            <View style={styles.fortuneText}>
              <Text style={styles.fortuneKeyword}>{fortune.keyword}</Text>
              <Text style={styles.fortuneDesc}>{fortune.description}</Text>
            </View>
          </View>
          <View style={styles.chipRow}>
            <View style={[styles.chip, styles.chipJade]}>
              <Text style={styles.chipTextJade}>幸运色 {fortune.luckyColor}</Text>
            </View>
            <View style={[styles.chip, styles.chipGold]}>
              <Text style={styles.chipTextGold}>吉时 {fortune.luckyTime}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>今日势 {fortune.trend}</Text>
            </View>
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionTitle}>今日日程</Text>
            <Text style={styles.sectionSub}>{schedule.length} 项</Text>
          </View>
          <View style={styles.scheduleList}>
            {schedule.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.scheduleItem}
                onLongPress={() => handleDeleteItem(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.scheduleTime}>
                  {item.date === `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(new Date().getDate()).padStart(2,'0')}`
                    ? item.time
                    : item.date + ' ' + item.time}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleTitle}>{item.title}</Text>
                  <Text style={styles.scheduleHint}>{item.hint}</Text>
                </View>
                <View style={[styles.dot, item.type === 'health' ? styles.dotRed : styles.dotGreen]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 72 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => navigation.navigate('AddSchedule')}>
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
  jadeSoft: '#dcebe2',
  cinnabar: '#a8422d',
  gold: '#b8872d',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e8' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 86 },
  appTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#252119', alignItems: 'center', justifyContent: 'center',
  },
  brandMarkText: { color: PROTO.surface, fontSize: 15, fontWeight: '800' },
  brandName: { fontSize: 17, fontWeight: '800', color: PROTO.ink },
  brandSub: { fontSize: 11, color: PROTO.muted, marginTop: 4 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
    borderWidth: 1, borderColor: PROTO.line,
    backgroundColor: 'rgba(255, 250, 241, 0.68)',
    alignItems: 'center', justifyContent: 'center',
  },
  bellIcon: { fontSize: 16 },
  dateHero: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 14, gap: 14,
  },
  dateText: { fontSize: 32, fontWeight: '700', color: PROTO.ink, lineHeight: 36 },
  dateDay: { fontSize: 32, fontWeight: '400', color: PROTO.ink, lineHeight: 36 },
  lunarText: { fontSize: 13, color: PROTO.muted, marginTop: 8 },
  solarTerm: {
    borderWidth: 1, borderColor: 'rgba(47,125,99,0.36)',
    borderRadius: 8, padding: 8, paddingHorizontal: 9,
    backgroundColor: PROTO.jadeSoft, alignItems: 'center', minWidth: 58,
  },
  solarTermName: { fontSize: 15, fontWeight: '700', color: PROTO.jade },
  solarTermDay: { fontSize: 10, color: PROTO.jade, marginTop: 2 },
  quickGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickTile: {
    flex: 1, borderWidth: 1, borderColor: PROTO.line,
    borderRadius: 8, padding: 10, paddingHorizontal: 11,
    backgroundColor: 'rgba(255, 250, 241, 0.78)',
  },
  quickLabel: { fontSize: 11, color: PROTO.muted },
  quickValue: { fontSize: 14, fontWeight: '700', color: PROTO.ink, marginTop: 4 },
  fortuneCard: {
    borderWidth: 1, borderColor: 'rgba(168,66,45,0.26)',
    borderRadius: 8, padding: 14, backgroundColor: PROTO.surface,
  },
  sectionLabel: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: PROTO.ink },
  sectionSub: { fontSize: 11, color: PROTO.muted },
  fortuneMain: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  fortuneText: { flex: 1 },
  fortuneKeyword: { fontSize: 20, fontWeight: '700', color: PROTO.ink, marginBottom: 5 },
  fortuneDesc: { fontSize: 12, color: PROTO.muted, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  chip: {
    borderWidth: 1, borderColor: PROTO.line,
    borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5,
    backgroundColor: 'rgba(255, 250, 241, 0.74)',
  },
  chipJade: { borderColor: 'rgba(47,125,99,0.3)', backgroundColor: 'rgba(220,235,226,0.74)' },
  chipGold: { borderColor: 'rgba(184,135,45,0.28)', backgroundColor: 'rgba(239,224,189,0.76)' },
  chipText: { fontSize: 11, color: PROTO.ink },
  chipTextJade: { fontSize: 11, color: PROTO.jade },
  chipTextGold: { fontSize: 11, color: PROTO.gold },
  section: { marginTop: 14 },
  scheduleList: { gap: 8 },
  scheduleItem: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderColor: PROTO.line, borderRadius: 8,
    padding: 10, backgroundColor: 'rgba(255, 250, 241, 0.78)',
  },
  scheduleTime: { fontSize: 13, fontWeight: '800', color: PROTO.cinnabar, width: 40 },
  scheduleTitle: { fontSize: 13, fontWeight: '600', color: PROTO.ink },
  scheduleHint: { fontSize: 11, color: PROTO.muted, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: PROTO.jade },
  dotRed: { backgroundColor: PROTO.cinnabar },
  fab: {
    position: 'absolute', right: 22, bottom: 88,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#252119', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#252119', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24, shadowRadius: 12, elevation: 12,
  },
  fabText: { color: PROTO.surface, fontSize: 24, fontWeight: '300', marginTop: -2 },
});
