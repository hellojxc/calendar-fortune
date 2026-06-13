import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Switch, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Solar, Lunar } from 'lunar-typescript';
import { HOUR_CHIPS } from '../data/fixtures';
import { saveProfile } from '../storage/profile';
import { setOnboardingDone } from '../storage/onboarding';
import { isValidDate } from '../services/fortune';
import { Colors } from '../theme';
import type { UserProfile } from '../types';

type Step = 'type' | 'date' | 'time' | 'done';

const toLunarMonth = (m: number, isLeap: boolean) => isLeap ? -Math.abs(m) : Math.abs(m);

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<Step>('type');
  const [isLunar, setIsLunar] = useState(false);

  // Step 2: date
  const [solarY, setSolarY] = useState(String(new Date().getFullYear() - 28));
  const [solarM, setSolarM] = useState('6');
  const [solarD, setSolarD] = useState('15');
  const [lunarY, setLunarY] = useState(String(new Date().getFullYear() - 28));
  const [lunarM, setLunarM] = useState('5');
  const [lunarD, setLunarD] = useState('8');
  const [isLeapMonth, setIsLeapMonth] = useState(false);  // 闰月

  // Step 3: time
  const [selectedHour, setSelectedHour] = useState(3);
  const [unknownHour, setUnknownHour] = useState(false);

  const handleFinish = async () => {
    // Convert and save
    let birthY: number, birthM: number, birthD: number;
    if (isLunar) {
      try {
        const solar = Lunar.fromYmd(
          parseInt(lunarY, 10),
          toLunarMonth(parseInt(lunarM, 10), isLeapMonth),
          parseInt(lunarD, 10)
        ).getSolar();
        birthY = solar.getYear();
        birthM = solar.getMonth();
        birthD = solar.getDay();
      } catch {
        Alert.alert('日期有误', '请检查农历日期');
        return;
      }
    } else {
      birthY = parseInt(solarY, 10);
      birthM = parseInt(solarM, 10);
      birthD = parseInt(solarD, 10);
      if (!isValidDate(birthY, birthM, birthD)) {
        Alert.alert('日期有误', '请输入真实的日期');
        return;
      }
    }

    const profile: UserProfile = {
      name: '未命名',
      avatar: '未',
      reminderTime: '08:00',
      hasFortuneEnabled: true,
      birthYear: birthY,
      birthMonth: birthM,
      birthDay: birthD,
      birthHour: unknownHour ? null : selectedHour,
    };
    await saveProfile(profile);
    await setOnboardingDone();
    (navigation as any).reset({ index: 0, routes: [{ name: 'MainApp' }] });
  };

  const handleSkip = async () => {
    await saveProfile({
      name: '未命名', avatar: '未', reminderTime: '08:00',
      hasFortuneEnabled: true, birthHour: null,
    });
    await setOnboardingDone();
    (navigation as any).reset({ index: 0, routes: [{ name: 'MainApp' }] });
  };

  const canAdvance = useMemo(() => {
    switch (step) {
      case 'type': return true;
      case 'date':
        if (isLunar) return lunarY !== '' && lunarM !== '' && lunarD !== '';
        return solarY !== '' && solarM !== '' && solarD !== '';
      case 'time': return true;
      default: return true;
    }
  }, [step, isLunar, solarY, solarM, solarD, lunarY, lunarM, lunarD]);

  const PROTO = {
    surface: '#fffaf1', line: '#dfd1bd', muted: '#756d61',
    ink: '#24211c', jade: '#2f7d63', cinnabar: '#a8422d', gold: '#b8872d',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, {
          width: step === 'type' ? '25%' : step === 'date' ? '50%' : step === 'time' ? '75%' : '100%'
        }]} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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
              <Text style={styles.bigCardDesc}>身份证上的日期，如 1996-08-18</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bigCard, isLunar && styles.bigCardActive]}
              onPress={() => { setIsLunar(true); setStep('date'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.bigCardIcon}>🌙</Text>
              <Text style={styles.bigCardTitle}>农历生日</Text>
              <Text style={styles.bigCardDesc}>传统农历日期，如 七月 初五</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipLink} onPress={handleSkip} activeOpacity={0.6}>
              <Text style={styles.skipLinkText}>稍后设置</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'date' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {isLunar ? '农历出生日期' : '公历出生日期'}
            </Text>
            <Text style={styles.stepDesc}>
              {isLunar ? '输入你的农历出生年、月、日' : '输入你的公历出生年、月、日'}
            </Text>

            <View style={styles.dateRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.fieldLabel}>年</Text>
                <TextInput
                  style={styles.input}
                  value={isLunar ? lunarY : solarY}
                  onChangeText={isLunar ? setLunarY : setSolarY}
                  placeholder="1996"
                  placeholderTextColor={Colors.muted}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>月</Text>
                <TextInput
                  style={styles.input}
                  value={isLunar ? lunarM : solarM}
                  onChangeText={isLunar ? setLunarM : setSolarM}
                  placeholder="8"
                  placeholderTextColor={Colors.muted}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>日</Text>
                <TextInput
                  style={styles.input}
                  value={isLunar ? lunarD : solarD}
                  onChangeText={isLunar ? setLunarD : setSolarD}
                  placeholder="18"
                  placeholderTextColor={Colors.muted}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>

            {isLunar && (
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>闰月</Text>
                <Switch
                  value={isLeapMonth}
                  onValueChange={setIsLeapMonth}
                  trackColor={{ false: '#dfd1bd', true: '#2f7d63' }}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.switchTypeBtn}
              onPress={() => { setIsLunar(!isLunar); }}
            >
              <Text style={styles.switchTypeBtnText}>
                切换到{isLunar ? '公历' : '农历'}输入
              </Text>
            </TouchableOpacity>

            {!isLunar && solarY && solarM && solarD && !isNaN(parseInt(solarY)) && !isNaN(parseInt(solarM)) && !isNaN(parseInt(solarD)) && (
              <View style={styles.lunarPreview}>
                <Text style={styles.lunarPreviewIcon}>🌙</Text>
                <Text style={styles.lunarPreviewText}>
                  {(() => {
                    try {
                      const l = Solar.fromYmd(parseInt(solarY), parseInt(solarM), parseInt(solarD)).getLunar();
                      return `农历${l.getYearInChinese()}${l.getMonthInChinese()}${l.getDayInChinese()}`;
                    } catch { return ''; }
                  })()}
                </Text>
              </View>
            )}

            {isLunar && lunarY && lunarM && lunarD && !isNaN(parseInt(lunarY)) && !isNaN(parseInt(lunarM)) && !isNaN(parseInt(lunarD)) && (
              <View style={styles.lunarPreview}>
                <Text style={styles.lunarPreviewIcon}>☀</Text>
                <Text style={styles.lunarPreviewText}>
                  {(() => {
                    try {
                      const s = Lunar.fromYmd(
                        parseInt(lunarY),
                        toLunarMonth(parseInt(lunarM), isLeapMonth),
                        parseInt(lunarD)
                      ).getSolar();
                      return `公历 ${s.toFullString()}`;
                    } catch { return ''; }
                  })()}
                </Text>
              </View>
            )}
          </View>
        )}

        {step === 'time' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>出生时辰</Text>
            <Text style={styles.stepDesc}>选择出生时辰，带来更精确的运势分析</Text>

            <View style={styles.chipList}>
              {HOUR_CHIPS.map((chip, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.chip,
                    selectedHour === i && styles.chipActive,
                    unknownHour && styles.chipDisabled,
                  ]}
                  onPress={() => {
                    if (!unknownHour) setSelectedHour(i);
                  }}
                  activeOpacity={0.7}
                  disabled={unknownHour}
                >
                  <Text style={[
                    styles.chipText,
                    selectedHour === i && styles.chipTextActive,
                    unknownHour && styles.chipTextDisabled,
                  ]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>不确定出生时辰</Text>
              <Switch
                value={unknownHour}
                onValueChange={setUnknownHour}
                trackColor={{ false: '#dfd1bd', true: '#a8422d' }}
              />
            </View>
          </View>
        )}

        {step === 'done' && (
          <View style={styles.stepContent}>
            <Text style={styles.doneIcon}>🎉</Text>
            <Text style={styles.stepTitle}>设置完成！</Text>
            <Text style={styles.stepDesc}>
              已根据你的生辰生成专属运势。随时可在「我的」页修改。
            </Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleFinish}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>查看今日运势</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom nav */}{step !== 'done' && (
        <View style={styles.bottomNav}>
          {step !== 'type' && (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => {
                if (step === 'date') setStep('type');
                else if (step === 'time') setStep('date');
              }}
            >
              <Text style={styles.navBtnText}>← 上一步</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {step !== 'type' && (
            <TouchableOpacity
              style={[styles.navBtn, styles.navBtnPrimary, !canAdvance && styles.navBtnDisabled]}
              onPress={() => {
                if (step === 'date') setStep('time');
                else if (step === 'time') setStep('done');
              }}
              disabled={!canAdvance}
              activeOpacity={0.7}
            >
              <Text style={[styles.navBtnText, styles.navBtnTextPrimary]}>
                {step === 'time' ? '完成' : '下一步 →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e8' },
  progressBar: { height: 3, backgroundColor: '#dfd1bd', marginHorizontal: 0 },
  progressFill: { height: 3, backgroundColor: '#2f7d63' },
  body: { padding: 24, paddingTop: 40, flexGrow: 1 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 24, fontWeight: '800', color: '#24211c', marginBottom: 8 },
  stepDesc: { fontSize: 14, color: '#756d61', lineHeight: 22, marginBottom: 24 },
  // Big cards for type selection
  bigCard: {
    padding: 24, borderRadius: 12, borderWidth: 1.5,
    borderColor: '#dfd1bd', marginBottom: 14,
    backgroundColor: '#fffaf1',
  },
  bigCardActive: { borderColor: '#2f7d63', backgroundColor: '#e8f2eb' },
  bigCardIcon: { fontSize: 28, marginBottom: 8 },
  bigCardTitle: { fontSize: 18, fontWeight: '700', color: '#24211c', marginBottom: 4 },
  bigCardDesc: { fontSize: 13, color: '#756d61' },
  // Date inputs
  dateRow: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 12, color: '#756d61', marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#dfd1bd', borderRadius: 8,
    padding: 12, fontSize: 16, textAlign: 'center',
    backgroundColor: '#fffaf1', color: '#24211c',
  },
  switchTypeBtn: { alignSelf: 'center', marginTop: 16 },
  switchTypeBtnText: { fontSize: 13, color: '#b8872d', fontWeight: '600' },
  lunarPreview: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 16, padding: 12,
    backgroundColor: '#e8f2eb', borderRadius: 8,
  },
  lunarPreviewIcon: { fontSize: 18, marginRight: 8 },
  lunarPreviewText: { fontSize: 14, color: '#2f7d63', fontWeight: '600' },
  // Time chips
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: '#dfd1bd',
    backgroundColor: '#fffaf1',
  },
  chipActive: { borderColor: '#a8422d', backgroundColor: '#fdf0e8' },
  chipDisabled: { opacity: 0.4 },
  chipText: { fontSize: 14, color: '#24211c' },
  chipTextActive: { color: '#a8422d', fontWeight: '700' },
  chipTextDisabled: { color: '#bbb' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginTop: 12 },
  switchLabel: { fontSize: 14, color: '#756d61' },
  // Done step
  doneIcon: { fontSize: 48, textAlign: 'center', marginBottom: 16 },
  doneBtn: {
    marginTop: 24, paddingVertical: 14, borderRadius: 10,
    backgroundColor: '#2f7d63', alignItems: 'center',
  },
  doneBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },
  skipLink: { alignSelf: 'center', marginTop: 20, padding: 8 },
  skipLinkText: { fontSize: 13, color: '#756d61', textDecorationLine: 'underline' },
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
