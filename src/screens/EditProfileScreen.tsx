import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Solar, Lunar } from 'lunar-typescript';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { HOUR_CHIPS } from '../data/fixtures';
import { loadProfile, saveProfile } from '../storage/profile';
import { getPermissionStatus, scheduleDailyReminder } from '../services/notifications';
import { isValidDate } from '../services/fortune';
import type { UserProfile } from '../types';
import type { MeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MeStackParamList, 'EditProfile'>;

/** Chinese hour index → representative solar hour */
const HOUR_TO_SOLAR: number[] = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21];

function formatLunarDate(y: number, m: number, d: number, hourIdx: number | null): string {
  try {
    const solar = hourIdx !== null
      ? Solar.fromYmdHms(y, m, d, HOUR_TO_SOLAR[hourIdx], 0, 0)
      : Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    const bz = lunar.getEightChar();
    const parts = [
      `农历${lunar.getYearInChinese()}年`,
      `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      '',
    ];
    if (hourIdx !== null) {
      parts[2] = `${HOUR_CHIPS[hourIdx].label}时 (${bz.getTime()})`;
    }
    return parts.filter(Boolean).join(' ');
  } catch {
    return '';
  }
}

export default function EditProfileScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [birthY, setBirthY] = useState('');
  const [birthM, setBirthM] = useState('');
  const [birthD, setBirthD] = useState('');
  const [selectedHour, setSelectedHour] = useState(3); // 卯
  const [unknownHour, setUnknownHour] = useState(false);
  const [birthplace, setBirthplace] = useState('');
  const [isLunar, setIsLunar] = useState(false);  // 公历/农历切换
  const [lunarYear, setLunarYear] = useState('');  // 农历年输入
  const [lunarMonth, setLunarMonth] = useState(''); // 农历月
  const [lunarDay, setLunarDay] = useState('');     // 农历日
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setName(p.name);
      setAvatar(p.avatar);
      setReminderTime(p.reminderTime);
      setBirthY(p.birthYear?.toString() ?? '');
      setBirthM(p.birthMonth?.toString() ?? '');
      setBirthD(p.birthDay?.toString() ?? '');
      setSelectedHour(p.birthHour ?? 3);
      setUnknownHour(p.birthHour === null && (p.birthYear != null));
      setBirthplace(p.birthplace ?? '');
      setLoading(false);
    })();
  }, []);

  const lunarPreview = useMemo(() => {
    const y = parseInt(birthY, 10);
    const m = parseInt(birthM, 10);
    const d = parseInt(birthD, 10);
    if (!isValidDate(y, m, d)) return '';
    return formatLunarDate(y, m, d, unknownHour ? null : selectedHour);
  }, [birthY, birthM, birthD, selectedHour, unknownHour]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('请输入姓名'); return; }

    let saveY: number | undefined;
    let saveM: number | undefined;
    let saveD: number | undefined;
    let hasBirth = false;

    if (isLunar) {
      const ly = parseInt(lunarYear, 10);
      const lm = parseInt(lunarMonth, 10);
      const ld = parseInt(lunarDay, 10);
      const anyLunarFilled = lunarYear !== '' || lunarMonth !== '' || lunarDay !== '';
      if (anyLunarFilled) {
        if (!isNaN(ly) && !isNaN(lm) && !isNaN(ld) && lm >= 1 && lm <= 12 && ld >= 1 && ld <= 30) {
          try {
            const solar = (Lunar as any).fromYmd(ly, lm, ld, isLeapMonth).getSolar();
            saveY = solar.getYear();
            saveM = solar.getMonth();
            saveD = solar.getDay();
            hasBirth = true;
          } catch {
            Alert.alert('农历转换失败', '请确认农历日期有效');
            return;
          }
        } else {
          Alert.alert('日期不完整', '请填写完整的农历日期');
          return;
        }
      }
      // Fallback: lunar fields empty → keep existing solar fields
      if (!hasBirth) {
        const y = parseInt(birthY, 10);
        const m = parseInt(birthM, 10);
        const d = parseInt(birthD, 10);
        hasBirth = birthY !== '' || birthM !== '' || birthD !== '';
        if (hasBirth && !isValidDate(y, m, d)) {
          Alert.alert('日期有误', '请输入真实存在的日期');
          return;
        }
        if (hasBirth) { saveY = y; saveM = m; saveD = d; }
      }
    } else {
      const y = parseInt(birthY, 10);
      const m = parseInt(birthM, 10);
      const d = parseInt(birthD, 10);
      hasBirth = birthY !== '' || birthM !== '' || birthD !== '';
      if (hasBirth && !isValidDate(y, m, d)) {
        Alert.alert('日期有误', '请输入真实存在的日期（如 2 月无 31 日）');
        return;
      }
      if (hasBirth) { saveY = y; saveM = m; saveD = d; }
    }

    const profile: UserProfile = {
      name: name.trim(),
      avatar: avatar.trim() || name.trim().charAt(0),
      reminderTime: /^\d{2}:\d{2}$/.test(reminderTime) ? reminderTime : '08:00',
      hasFortuneEnabled: true,
      ...(hasBirth ? { birthYear: saveY, birthMonth: saveM, birthDay: saveD } : {}),
      birthHour: unknownHour ? null : selectedHour,
      birthplace: birthplace.trim() || undefined,
    };
    await saveProfile(profile);
    // Re-schedule notification if permission granted
    const perm = await getPermissionStatus();
    if (perm === 'granted') {
      await scheduleDailyReminder(profile.reminderTime);
    }
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.loading}>加载中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.appTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>编辑资料</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>保存</Text>
          </TouchableOpacity>
        </View>

        {/* ── Personal info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>姓名</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="姓名" placeholderTextColor={Colors.muted} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>头像文字</Text>
            <TextInput style={styles.input} value={avatar} onChangeText={setAvatar} placeholder="姓" placeholderTextColor={Colors.muted} maxLength={1} />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>每日提醒时间</Text>
            <TextInput style={styles.input} value={reminderTime} onChangeText={setReminderTime} placeholder="08:00" placeholderTextColor={Colors.muted} keyboardType="numbers-and-punctuation" maxLength={5} />
          </View>
        </View>

        {/* ── Birth date ── */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionTitle}>出生日期</Text>
            <TouchableOpacity
              style={styles.calendarToggle}
              onPress={() => {
                const next = !isLunar;
                setIsLunar(next);
                // Pre-fill lunar fields when switching to lunar mode
                if (next && birthY && birthM && birthD) {
                  const y = parseInt(birthY, 10);
                  const m = parseInt(birthM, 10);
                  const d = parseInt(birthD, 10);
                  if (!isNaN(y) && !isNaN(m) && !isNaN(d) && isValidDate(y, m, d)) {
                    try {
                      const lunar = Solar.fromYmd(y, m, d).getLunar();
                      setLunarYear(String(lunar.getYear()));
                      setLunarMonth(String(lunar.getMonth()));
                      setLunarDay(String(lunar.getDay()));
                    } catch { /* ignore conversion errors */ }
                  }
                }
              }}
            >
              <Text style={styles.calendarToggleText}>
                {isLunar ? '农历 → 公历' : '公历 → 农历'}
              </Text>
            </TouchableOpacity>
          </View>

          {!isLunar ? (
            <>
              <View style={styles.dateRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.fieldLabel}>年</Text>
                  <TextInput style={styles.input} value={birthY} onChangeText={setBirthY} placeholder="1996" placeholderTextColor={Colors.muted} keyboardType="number-pad" maxLength={4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>月</Text>
                  <TextInput style={styles.input} value={birthM} onChangeText={setBirthM} placeholder="8" placeholderTextColor={Colors.muted} keyboardType="number-pad" maxLength={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>日</Text>
                  <TextInput style={styles.input} value={birthD} onChangeText={setBirthD} placeholder="18" placeholderTextColor={Colors.muted} keyboardType="number-pad" maxLength={2} />
                </View>
              </View>
              {/* Lunar preview from solar */}
              {lunarPreview !== '' && (
                <View style={styles.lunarPreview}>
                  <Text style={styles.lunarPreviewIcon}>🌙</Text>
                  <Text style={styles.lunarPreviewText}>{lunarPreview}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.dateRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.fieldLabel}>农历年</Text>
                  <TextInput style={styles.input} value={lunarYear} onChangeText={setLunarYear} placeholder="一九九六" placeholderTextColor={Colors.muted} keyboardType="number-pad" maxLength={4} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>月</Text>
                  <TextInput style={styles.input} value={lunarMonth} onChangeText={setLunarMonth} placeholder="7" placeholderTextColor={Colors.muted} keyboardType="number-pad" maxLength={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>日</Text>
                  <TextInput style={styles.input} value={lunarDay} onChangeText={setLunarDay} placeholder="5" placeholderTextColor={Colors.muted} keyboardType="number-pad" maxLength={2} />
                </View>
              </View>
              {/* 闰月 toggle */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>闰月</Text>
                <Switch
                  value={isLeapMonth}
                  onValueChange={setIsLeapMonth}
                  trackColor={{ false: Colors.muted, true: '#2f7d63' }}
                />
              </View>
              {/* Solar preview from lunar */}
              {(() => {
                const ly = parseInt(lunarYear, 10);
                const lm = parseInt(lunarMonth, 10);
                const ld = parseInt(lunarDay, 10);
                if (!isNaN(ly) && !isNaN(lm) && !isNaN(ld) && lm >= 1 && lm <= 12 && ld >= 1 && ld <= 30) {
                  try {
                    const solar = Lunar.fromYmd(ly, lm, ld).getSolar();
                    const s = solar.toFullString();
                    return (
                      <View style={styles.lunarPreview}>
                        <Text style={styles.lunarPreviewIcon}>☀</Text>
                        <Text style={styles.lunarPreviewText}>公历 {s}</Text>
                      </View>
                    );
                  } catch {
                    return null;
                  }
                }
                return null;
              })()}
            </>
          )}
        </View>

        {/* ── Birth time ── */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Text style={styles.sectionTitle}>出生时辰</Text>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>不确定</Text>
              <Switch
                value={unknownHour}
                onValueChange={setUnknownHour}
                trackColor={{ false: Colors.muted, true: PROTO.cinnabar }}
              />
            </View>
          </View>

          {!unknownHour && (
            <View style={styles.chipList}>
              {HOUR_CHIPS.map((chip, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, i === selectedHour && styles.chipActive]}
                  onPress={() => setSelectedHour(i)}
                >
                  <Text style={[styles.chipText, i === selectedHour && styles.chipTextActive]}>
                    {chip.label}
                  </Text>
                  <Text style={[styles.chipTime, i === selectedHour && styles.chipTimeActive]}>
                    {chip.time}时
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Birthplace ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>出生地</Text>
          <TextInput style={styles.input} value={birthplace} onChangeText={setBirthplace} placeholder="上海市" placeholderTextColor={Colors.muted} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PROTO = {
  ink: '#24211c', muted: '#756d61', line: '#dfd1bd',
  surface: '#fffaf1', cinnabar: '#a8422d', jade: '#2f7d63',
  gold: '#b8872d',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e8' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 60 },
  loading: { textAlign: 'center', marginTop: 100, fontSize: 16, color: PROTO.muted },
  appTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  cancelText: { fontSize: 16, color: PROTO.muted },
  pageTitle: { fontSize: 17, fontWeight: '800', color: PROTO.ink },
  saveText: { fontSize: 16, fontWeight: '700', color: PROTO.cinnabar },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: PROTO.ink, marginBottom: 10 },
  sectionLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: PROTO.muted, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: PROTO.line, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: PROTO.surface, fontSize: 15, color: PROTO.ink,
  },
  dateRow: { flexDirection: 'row', gap: 8 },
  lunarPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, padding: 10, borderRadius: 8,
    backgroundColor: 'rgba(47, 125, 99, 0.08)',
    borderWidth: 1, borderColor: 'rgba(47, 125, 99, 0.18)',
  },
  lunarPreviewIcon: { fontSize: 18, marginRight: 8 },
  lunarPreviewText: { fontSize: 14, color: '#5a7d4b', fontWeight: '600' },
  calendarToggle: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6, borderWidth: 1, borderColor: '#b8872d',
  },
  calendarToggleText: { fontSize: 11, color: '#b8872d', fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  switchLabel: { fontSize: 12, color: PROTO.muted },
  chipList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    width: '23%', paddingVertical: 8, paddingHorizontal: 4,
    borderWidth: 1, borderColor: PROTO.line, borderRadius: 8,
    backgroundColor: PROTO.surface, alignItems: 'center',
  },
  chipActive: { borderColor: PROTO.cinnabar, backgroundColor: '#f0d9d1' },
  chipText: { fontSize: 13, fontWeight: '700', color: PROTO.ink },
  chipTextActive: { color: PROTO.cinnabar },
  chipTime: { fontSize: 10, color: PROTO.muted, marginTop: 2 },
  chipTimeActive: { color: PROTO.cinnabar },
});
