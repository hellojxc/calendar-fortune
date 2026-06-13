import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import ElementBar from '../components/ElementBar';
import { TODAY_FORTUNE } from '../data/fixtures';
import { loadBirthData } from '../storage/profile';
import { computeDailyFortune, computeFallbackFortune } from '../services/fortune';
import type { DailyFortune, BirthData } from '../types';
import type { FortuneStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<FortuneStackParamList, 'FortuneMain'>;

export default function FortuneScreen() {
  const navigation = useNavigation<Nav>();
  const [fortune, setFortune] = useState<DailyFortune>(TODAY_FORTUNE);
  const [hasBirthData, setHasBirthData] = useState(false);

  // Reload fortune every time screen is focused (after BirthData form edits)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const birth = await loadBirthData();
        if (!cancelled && birth) {
          const computed = computeDailyFortune(birth);
          setFortune(computed);
          setHasBirthData(true);
        } else if (!cancelled) {
          setFortune(computeFallbackFortune());
          setHasBirthData(false);
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.appTop}>
          <View>
            <Text style={styles.subTitle}>
              {fortune.date} · {fortune.stemBranch}
            </Text>
            <Text style={styles.pageTitle}>今日运势</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('BirthData')}
          >
            <Text style={styles.iconBtnText}>{hasBirthData ? '✎' : '＋'}</Text>
          </TouchableOpacity>
        </View>

        {/* Fortune Hero */}
        <View style={styles.fortuneHero}>
          <View style={styles.keyword}>
            <View style={{ flex: 1 }}>
              <Text style={styles.keywordLabel}>今日关键词</Text>
              <Text style={styles.keywordText}>{fortune.keyword}</Text>
            </View>
            <Text style={styles.bigScore}>{fortune.overallScore}</Text>
          </View>
          <Text style={styles.fortuneDesc}>{fortune.description}</Text>
          <View style={styles.elementList}>
            {fortune.elements.map((el) => (
              <ElementBar
                key={el.element}
                label={el.element}
                value={el.value}
                color={
                  el.element === '木' ? Colors.wood :
                  el.element === '火' ? Colors.fire :
                  el.element === '土' ? Colors.earth :
                  el.element === '金' ? Colors.metal :
                  Colors.water
                }
              />
            ))}
          </View>
        </View>

        {/* Aspect cards */}
        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionTitle}>分项提醒</Text>
            <Text style={styles.sectionSub}>生活建议</Text>
          </View>
          <View style={styles.aspectGrid}>
            {fortune.aspects.map((a) => (
              <View key={a.label} style={styles.aspectCard}>
                <Text style={styles.aspectLabel}>{a.label}</Text>
                <Text style={styles.aspectScore}>{a.score}</Text>
                <Text style={styles.aspectDesc}>{a.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Advice */}
        <View style={[styles.adviceCard, { marginTop: 14 }]}>
          <Text style={styles.adviceTitle}>今日提醒</Text>
          <Text style={styles.adviceText}>{fortune.advice}</Text>
        </View>
        <View style={[styles.adviceCard, { marginTop: 10 }]}>
          <Text style={styles.adviceTitle}>适合安排</Text>
          <Text style={styles.adviceText}>{fortune.suitable}</Text>
        </View>

        {/* CTA — prompt new users */}
        {!hasBirthData && (
          <TouchableOpacity
            style={styles.ctaBanner}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('BirthData')}
          >
            <Text style={styles.ctaBannerText}>
              ✦ 设置生辰八字，生成专属运势
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          结果仅作传统文化和生活提醒参考，不作为医疗、投资、法律等决策依据。
        </Text>
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
  jadeSoft: '#dcebe2',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e8' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 86 },
  appTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  subTitle: { fontSize: 11, color: PROTO.muted },
  pageTitle: { fontSize: 17, fontWeight: '800', color: PROTO.ink },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
    borderWidth: 1, borderColor: PROTO.line,
    backgroundColor: 'rgba(255, 250, 241, 0.68)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 18, color: PROTO.muted, marginTop: -1 },
  fortuneHero: {
    borderWidth: 1, borderColor: 'rgba(47, 125, 99, 0.26)',
    borderRadius: 8, padding: 14,
    backgroundColor: PROTO.surface,
  },
  keyword: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'baseline', gap: 12,
  },
  keywordLabel: { fontSize: 11, color: PROTO.muted },
  keywordText: { fontSize: 26, fontWeight: '700', color: PROTO.ink, lineHeight: 30 },
  bigScore: { fontSize: 34, fontWeight: '900', color: PROTO.jade },
  fortuneDesc: { fontSize: 12, color: PROTO.muted, lineHeight: 20, marginTop: 10 },
  elementList: { gap: 9, marginTop: 13 },
  section: { marginTop: 14 },
  sectionLabel: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: PROTO.ink },
  sectionSub: { fontSize: 11, color: PROTO.muted },
  aspectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aspectCard: {
    width: '48%', borderWidth: 1, borderColor: PROTO.line,
    borderRadius: 8, padding: 11,
    backgroundColor: 'rgba(255, 250, 241, 0.78)',
  },
  aspectLabel: { fontSize: 11, color: PROTO.muted },
  aspectScore: { fontSize: 21, fontWeight: '700', color: PROTO.ink, marginTop: 5 },
  aspectDesc: { fontSize: 11, color: PROTO.muted, lineHeight: 16, marginTop: 6 },
  adviceCard: {
    borderWidth: 1, borderColor: 'rgba(184, 135, 45, 0.32)',
    borderRadius: 8, padding: 12,
    backgroundColor: 'rgba(239, 224, 189, 0.48)',
  },
  adviceTitle: { fontSize: 14, fontWeight: '700', color: PROTO.ink, marginBottom: 7 },
  adviceText: { fontSize: 12, color: PROTO.muted, lineHeight: 20 },
  disclaimer: {
    fontSize: 10, color: PROTO.muted, lineHeight: 15,
    marginTop: 12, textAlign: 'center',
  },
  ctaBanner: {
    marginTop: 14, paddingVertical: 14, paddingHorizontal: 20,
    borderWidth: 1, borderColor: PROTO.jade, borderRadius: 8,
    backgroundColor: PROTO.jadeSoft, borderStyle: 'dashed',
    alignItems: 'center',
  },
  ctaBannerText: { fontSize: 13, color: PROTO.jade, fontWeight: '700' },
});
