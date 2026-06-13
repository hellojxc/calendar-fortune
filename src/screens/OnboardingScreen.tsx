import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Switch, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Solar, Lunar, LunarYear } from 'lunar-typescript';
import { saveProfile } from '../storage/profile';
import { setOnboardingDone } from '../storage/onboarding';
import { Colors } from '../theme';
import type { UserProfile } from '../types';

type Step = 'nickname' | 'type' | 'date' | 'time' | 'done';

const toLunarMonth = (m: number, isLeap: boolean) => isLeap ? -Math.abs(m) : Math.abs(m);

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    return isLeap ? 29 : 28;
  }
  return DAYS_IN_MONTH[month - 1];
}

const TIME_OPTIONS = [
  '23:00','23:30','00:00','00:30','01:00','01:30','02:00','02:30',
  '03:00','03:30','04:00','04:30','05:00','05:30','06:00','06:30',
  '07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30',
  '19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30',
];

const HOUR_CHIPS = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

function timeToHourIdx(time: string): number {
  const h = parseInt(time.split(':')[0], 10);
  if (h === 23 || h === 0) return 0;  // 子
  if (h === 1) return 1;   // 丑
  if (h === 2) return 1;
  if (h === 3 || h === 4) return 2;  // 寅
  if (h === 5 || h === 6) return 3;  // 卯
  if (h === 7 || h === 8) return 4;  // 辰
  if (h === 9 || h === 10) return 5; // 巳
  if (h === 11 || h === 12) return 6; // 午
  if (h === 13 || h === 14) return 7; // 未
  if (h === 15 || h === 16) return 8; // 申
  if (h === 17 || h === 18) return 9; // 酉
  if (h === 19 || h === 20) return 10; // 戌
  return 11; // 亥
}

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<Step>('nickname');
  const [nickname, setNickname] = useState('');

  // Step 1: type
  const [isLunar, setIsLunar] = useState(false);

  // Step 2: date picker
  const now = new Date();
  const [pickYear, setPickYear] = useState(isLunar ? now.getFullYear() : now.getFullYear() - 28);
  const [pickMonth, setPickMonth] = useState(6);
  const [pickDay, setPickDay] = useState<number | null>(null);
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  // Step 3: time picker
  const [pickTime, setPickTime] = useState('08:00');
  const [unknownHour, setUnknownHour] = useState(false);

  const hourIdx = unknownHour ? null : timeToHourIdx(pickTime);

  const handleFinish = async () => {
    const name = nickname.trim() || '未命名';
    let birthY: number | undefined;
    let birthM: number | undefined;
    let birthD: number | undefined;

    if (pickDay !== null) {
      if (isLunar) {
        try {
          const solar = Lunar.fromYmd(pickYear, toLunarMonth(pickMonth, isLeapMonth), pickDay).getSolar();
          birthY = solar.getYear();
          birthM = solar.getMonth();
          birthD = solar.getDay();
        } catch {
          Alert.alert('日期有误', '农历转换失败，请检查日期是否有效');
          return;
        }
      } else {
        birthY = pickYear;
        birthM = pickMonth;
        birthD = pickDay;
      }
    }

    const profile: UserProfile = {
      name,
      avatar: name.charAt(0),
      reminderTime: '08:00',
      hasFortuneEnabled: true,
      ...(birthY != null ? { birthYear: birthY, birthMonth: birthM, birthDay: birthD } : {}),
      birthHour: hourIdx,
    };
    await saveProfile(profile);
    await setOnboardingDone();
    (navigation as any).reset({ index: 0, routes: [{ name: 'MainApp' }] });
  };

  const handleSkip = async () => {
    const name = nickname.trim() || '未命名';
    await saveProfile({
      name, avatar: name.charAt(0), reminderTime: '08:00',
      hasFortuneEnabled: true, birthHour: null,
    });
    await setOnboardingDone();
    (navigation as any).reset({ index: 0, routes: [{ name: 'MainApp' }] });
  };

  const stepIndex = step === 'nickname' ? 0 : step === 'type' ? 1 : step === 'date' ? 2 : step === 'time' ? 3 : 4;
  const totalSteps = 5;

  const monthDays = useMemo(() => {
    if (isLunar) {
      try {
        const lunarMonth = LunarYear.fromYear(pickYear).getMonth(toLunarMonth(pickMonth, isLeapMonth));
        return lunarMonth?.getDayCount() ?? 0;
      } catch {
        return 0;
      }
    }
    return daysInMonth(pickYear, pickMonth);
  }, [pickYear, pickMonth, isLunar, isLeapMonth]);

  const firstDayOfWeek = useMemo(() => {
    if (isLunar) {
      try {
        return Lunar.fromYmd(pickYear, toLunarMonth(pickMonth, isLeapMonth), 1).getSolar().getWeek();
      } catch {
        return 0;
      }
    }
    return new Date(pickYear, pickMonth - 1, 1).getDay();
  }, [pickYear, pickMonth, isLunar, isLeapMonth]);

  useEffect(() => {
    if (pickDay !== null && monthDays > 0 && pickDay > monthDays) {
      setPickDay(monthDays);
    }
  }, [pickDay, monthDays]);

  const canContinueDate = step !== 'date' || (pickDay !== null && monthDays > 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((stepIndex + 1) / totalSteps) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Step 0: Nickname */}
        {step === 'nickname' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>你的昵称？</Text>
            <Text style={styles.stepDesc}>设置一个昵称，用于个性化运势分析</Text>
            <View style={styles.nicknameInputBox}>
              <TextInput
                style={styles.nicknameInput}
                value={nickname}
                onChangeText={setNickname}
                placeholder="点击输入昵称"
                placeholderTextColor="#756d61"
                autoFocus
                maxLength={12}
              />
            </View>
            <TouchableOpacity
              style={styles.nextBigBtn}
              onPress={() => setStep('type')}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBigBtnText}>继续 →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 1: Type */}
        {step === 'type' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>你的生日是？</Text>
            <Text style={styles.stepDesc}>选择你的生日类型，以生成准确的八字运势</Text>
            <TouchableOpacity
              style={[styles.bigCard, !isLunar && styles.bigCardActive]}
              onPress={() => { setIsLunar(false); setStep('date'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.bigCardIcon}>☀</Text>
              <Text style={styles.bigCardTitle}>公历生日</Text>
              <Text style={styles.bigCardDesc}>身份证上的日期</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bigCard, isLunar && styles.bigCardActive]}
              onPress={() => { setIsLunar(true); setStep('date'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.bigCardIcon}>🌙</Text>
              <Text style={styles.bigCardTitle}>农历生日</Text>
              <Text style={styles.bigCardDesc}>传统农历日期</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
              <Text style={styles.skipLinkText}>稍后设置</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Date picker */}
        {step === 'date' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {isLunar ? '农历出生日期' : '公历出生日期'}
            </Text>

            {/* Year/Month selector */}
            <View style={styles.ymSelector}>
              <TouchableOpacity onPress={() => setPickYear(pickYear - 1)}>
                <Text style={styles.ymArrow}>«</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { if (pickMonth === 1) { setPickYear(pickYear - 1); setPickMonth(12); } else setPickMonth(pickMonth - 1); }}>
                <Text style={styles.ymArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.ymLabel}>
                {pickYear}年 {isLunar && isLeapMonth ? '闰' : ''}{pickMonth}月
              </Text>
              <TouchableOpacity onPress={() => { if (pickMonth === 12) { setPickYear(pickYear + 1); setPickMonth(1); } else setPickMonth(pickMonth + 1); }}>
                <Text style={styles.ymArrow}>›</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPickYear(pickYear + 1)}>
                <Text style={styles.ymArrow}>»</Text>
              </TouchableOpacity>
            </View>

            {/* Leap month toggle for lunar */}
            {isLunar && (
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>闰月</Text>
                <Switch value={isLeapMonth} onValueChange={setIsLeapMonth} trackColor={{ false: '#dfd1bd', true: '#2f7d63' }} />
              </View>
            )}

            {/* Day grid */}
            <View style={styles.calendarGrid}>
              {['日','一','二','三','四','五','六'].map(d => (
                <Text key={d} style={styles.weekdayLabel}>{d}</Text>
              ))}
              {[...Array(firstDayOfWeek)].map((_, i) => <View key={`e${i}`} style={styles.dayCell} />)}
              {[...Array(monthDays)].map((_, i) => {
                const day = i + 1;
                const selected = pickDay === day;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCell, selected && styles.dayCellSelected]}
                    onPress={() => setPickDay(day)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {isLunar && isLeapMonth && monthDays === 0 && (
              <View style={styles.lunarPreview}>
                <Text style={styles.lunarPreviewText}>该年没有这个闰月</Text>
              </View>
            )}

            {/* Conversion preview */}
            {pickDay !== null && monthDays > 0 && (() => {
              try {
                const display = isLunar
                  ? (() => {
                      const s = Lunar.fromYmd(pickYear, toLunarMonth(pickMonth, isLeapMonth), pickDay).getSolar();
                      return `公历 ${s.toFullString()}`;
                    })()
                  : (() => {
                      const l = Solar.fromYmd(pickYear, pickMonth, pickDay).getLunar();
                      return `农历 ${l.getYearInChinese()}${l.getMonthInChinese()}${l.getDayInChinese()}`;
                    })();
                return (
                  <View style={styles.lunarPreview}>
                    <Text style={styles.lunarPreviewText}>{display}</Text>
                  </View>
                );
              } catch {
                return null;
              }
            })()}
          </View>
        )}

        {/* Step 3: Time picker */}
        {step === 'time' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>出生时间</Text>
            <Text style={styles.stepDesc}>选择出生时刻，系统自动推算时辰</Text>

            {/* Time grid */}
            <View style={styles.timeGrid}>
              {TIME_OPTIONS.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeSlot, pickTime === t && styles.timeSlotActive]}
                  onPress={() => { setPickTime(t); setUnknownHour(false); }}
                  disabled={unknownHour}
                >
                  <Text style={[styles.timeSlotText, pickTime === t && styles.timeSlotTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Calculated 时辰 */}
            {!unknownHour && (
              <View style={styles.hourResult}>
                <Text style={styles.hourResultLabel}>对应时辰</Text>
                <Text style={styles.hourResultValue}>{HOUR_CHIPS[hourIdx ?? 0]}时</Text>
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>不确定出生时间</Text>
              <Switch value={unknownHour} onValueChange={setUnknownHour} trackColor={{ false: '#dfd1bd', true: '#a8422d' }} />
            </View>
          </View>
        )}

        {/* Step 4: Done */}
        {step === 'done' && (
          <View style={styles.stepContent}>
            <Text style={styles.doneIcon}>🎉</Text>
            <Text style={styles.stepTitle}>设置完成！</Text>
            <Text style={styles.stepDesc}>
              {nickname || '未命名'}，已根据你的生辰生成专属运势。
            </Text>
            <TouchableOpacity style={styles.doneBtn} onPress={handleFinish} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>查看今日运势</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom nav */}
      {step !== 'done' && step !== 'nickname' && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => {
            if (step === 'type') setStep('nickname');
            else if (step === 'date') setStep('type');
            else if (step === 'time') setStep('date');
          }}>
            <Text style={styles.navBtnText}>← 上一步</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrimary, !canContinueDate && styles.navBtnDisabled]}
            onPress={() => {
              if (step === 'date') setStep('time');
              else if (step === 'time') setStep('done');
            }}
            disabled={!canContinueDate}
            activeOpacity={0.7}
          >
            <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>
              {step === 'time' ? '完成' : '下一步 →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e8' },
  progressBar: { height: 3, backgroundColor: '#dfd1bd' },
  progressFill: { height: 3, backgroundColor: '#2f7d63' },
  body: { padding: 24, paddingTop: 40, flexGrow: 1 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: '#24211c', marginBottom: 8 },
  stepDesc: { fontSize: 14, color: '#756d61', lineHeight: 22, marginBottom: 24 },
  // Nickname
  nicknameInputBox: {
    borderWidth: 1, borderColor: '#dfd1bd', borderRadius: 12,
    padding: 20, backgroundColor: '#fffaf1', marginBottom: 24,
  },
  nicknameInput: { fontSize: 22, color: '#24211c', textAlign: 'center' },
  nextBigBtn: {
    paddingVertical: 16, borderRadius: 12,
    backgroundColor: '#2f7d63', alignItems: 'center',
  },
  nextBigBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },
  // Big cards
  bigCard: {
    padding: 24, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#dfd1bd', marginBottom: 14,
    backgroundColor: '#fffaf1',
  },
  bigCardActive: { borderColor: '#2f7d63', backgroundColor: '#e8f2eb' },
  bigCardIcon: { fontSize: 28, marginBottom: 8 },
  bigCardTitle: { fontSize: 18, fontWeight: '700', color: '#24211c', marginBottom: 4 },
  bigCardDesc: { fontSize: 13, color: '#756d61' },
  // Year/Month selector
  ymSelector: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 16, marginBottom: 16,
  },
  ymArrow: { fontSize: 28, color: '#2f7d63', padding: 8 },
  ymLabel: { fontSize: 18, fontWeight: '700', color: '#24211c' },
  // Calendar grid
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
  weekdayLabel: {
    width: '14.28%', textAlign: 'center', fontSize: 11,
    color: '#756d61', marginBottom: 6,
  },
  dayCell: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center',
    justifyContent: 'center', borderRadius: 20,
  },
  dayCellSelected: { backgroundColor: '#2f7d63' },
  dayText: { fontSize: 15, color: '#24211c' },
  dayTextSelected: { color: '#fff', fontWeight: '700' },
  // Time grid
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  timeSlot: {
    width: '18.3%', paddingVertical: 8,
    borderWidth: 1, borderColor: '#dfd1bd', borderRadius: 8,
    backgroundColor: '#fffaf1', alignItems: 'center',
  },
  timeSlotActive: { borderColor: '#a8422d', backgroundColor: '#fdf0e8' },
  timeSlotText: { fontSize: 12, color: '#756d61' },
  timeSlotTextActive: { color: '#a8422d', fontWeight: '700' },
  hourResult: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, marginBottom: 16, padding: 12,
    backgroundColor: '#e8f2eb', borderRadius: 8,
  },
  hourResultLabel: { fontSize: 14, color: '#756d61' },
  hourResultValue: { fontSize: 20, fontWeight: '800', color: '#2f7d63' },
  // Misc
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginTop: 12, marginBottom: 12 },
  switchLabel: { fontSize: 14, color: '#756d61' },
  lunarPreview: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 12, padding: 12,
    backgroundColor: '#e8f2eb', borderRadius: 8,
  },
  lunarPreviewText: { fontSize: 14, color: '#2f7d63', fontWeight: '600' },
  skipLink: { alignSelf: 'center', marginTop: 20, padding: 8 },
  skipLinkText: { fontSize: 13, color: '#756d61', textDecorationLine: 'underline' },
  // Done
  doneIcon: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  doneBtn: {
    marginTop: 24, paddingVertical: 14, borderRadius: 10,
    backgroundColor: '#2f7d63', alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },
  // Bottom nav
  bottomNav: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#dfd1bd',
  },
  navBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  navBtnPrimary: { backgroundColor: '#2f7d63' },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 15, color: '#756d61', fontWeight: '600' },
  navBtnTextPrimary: { color: '#fff' },
});
