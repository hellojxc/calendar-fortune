import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { HOUR_CHIPS, BAZI_PREVIEW } from '../data/fixtures';
import { saveBirthData } from '../storage/birthData';
import { computeBazi, isValidDate } from '../services/fortune';
import type { BirthData } from '../types';
import type { FortuneStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<FortuneStackParamList, 'BirthData'>;

export default function BirthDataScreen({ navigation }: Props) {
  const [year, setYear] = useState('1996');
  const [month, setMonth] = useState('8');
  const [day, setDay] = useState('18');
  const [birthplace, setBirthplace] = useState('上海市');
  const [selectedHour, setSelectedHour] = useState(3); // 卯
  const [unknownHour, setUnknownHour] = useState(false);
  const [showBazi, setShowBazi] = useState(false);
  const [bazi, setBazi] = useState<ReturnType<typeof computeBazi> | null>(null);

  const handleGenerate = useCallback(async () => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    if (!isValidDate(y, m, d)) {
      Alert.alert('日期有误', '请输入真实存在的日期（如 2 月无 31 日）');
      return;
    }

    const birthData: BirthData = {
      year: y,
      month: m,
      day: d,
      hour: unknownHour ? null : selectedHour,
      birthplace: birthplace || '未知',
    };

    try {
      const computed = computeBazi(birthData);
      await saveBirthData(birthData);
      setBazi(computed);
      setShowBazi(true);
      Alert.alert('保存成功', '生辰资料已保存，每日运势将基于您的八字生成。', [
        { text: '好的', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('保存失败', '请稍后重试');
    }
  }, [year, month, day, birthplace, selectedHour, unknownHour, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.appTop}>
          <View>
            <Text style={styles.subTitle}>个性化五行提醒</Text>
            <Text style={styles.pageTitle}>生辰资料</Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>开启每日专属提醒</Text>
          <Text style={styles.formDesc}>
            填写出生日期和时辰后，系统会结合当日干支和五行倾向生成生活建议。
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>出生日期</Text>
            <View style={styles.dateRow}>
              <TextInput
                style={styles.dateInput}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="1996"
                placeholderTextColor={Colors.muted}
              />
              <Text style={styles.dateSep}>年</Text>
              <TextInput
                style={[styles.dateInput, styles.dateInputShort]}
                value={month}
                onChangeText={setMonth}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="8"
                placeholderTextColor={Colors.muted}
              />
              <Text style={styles.dateSep}>月</Text>
              <TextInput
                style={[styles.dateInput, styles.dateInputShort]}
                value={day}
                onChangeText={setDay}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="18"
                placeholderTextColor={Colors.muted}
              />
              <Text style={styles.dateSep}>日</Text>
              <Text style={styles.inputHint}>公历</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>出生时辰</Text>
            <View style={styles.timeGrid}>
              {HOUR_CHIPS.map((chip, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.timeChip, i === selectedHour && !unknownHour && styles.timeChipActive]}
                  onPress={() => { setSelectedHour(i); setUnknownHour(false); }}
                  activeOpacity={0.7}
                  disabled={unknownHour}
                >
                  <Text style={[styles.timeChipText, i === selectedHour && !unknownHour && styles.timeChipTextActive]}>
                    {chip.label} {chip.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>出生地</Text>
            <View style={styles.inputLike}>
              <TextInput
                style={styles.textInput}
                value={birthplace}
                onChangeText={setBirthplace}
                placeholder="上海市"
                placeholderTextColor={Colors.muted}
              />
              <Text style={styles.inputHint}>用于校正时区</Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleLabel}>不知道具体时辰</Text>
              <Text style={styles.toggleHint}>使用日柱生成简化提醒</Text>
            </View>
            <Switch
              value={unknownHour}
              onValueChange={(v) => { setUnknownHour(v); }}
              trackColor={{ false: Colors.line, true: Colors.ink }}
              thumbColor={Colors.surface}
              ios_backgroundColor={Colors.line}
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8} onPress={handleGenerate}>
            <Text style={styles.primaryBtnText}>生成八字资料</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.privacyNote}>
          <View style={styles.privacyIcon}>
            <Text style={styles.privacyIconText}>🛡</Text>
          </View>
          <Text style={styles.privacyText}>
            默认本地计算。用户可随时删除生辰资料，运势结果不公开展示。
          </Text>
        </View>

        {/* Bazi preview — shows after generation, or fixture before */}
        <View style={styles.baziPreview}>
          <Text style={styles.baziLabel}>{showBazi ? '已生成' : '生成后预览'}</Text>
          <View style={styles.pillarGrid}>
            <View style={styles.pillar}>
              <Text style={styles.pillarStem}>{bazi?.year.stem ?? BAZI_PREVIEW.year.stem}{bazi?.year.branch ?? BAZI_PREVIEW.year.branch}</Text>
              <Text style={styles.pillarType}>年柱</Text>
            </View>
            <View style={styles.pillar}>
              <Text style={styles.pillarStem}>{bazi?.month.stem ?? BAZI_PREVIEW.month.stem}{bazi?.month.branch ?? BAZI_PREVIEW.month.branch}</Text>
              <Text style={styles.pillarType}>月柱</Text>
            </View>
            <View style={styles.pillar}>
              <Text style={styles.pillarStem}>{bazi?.day.stem ?? BAZI_PREVIEW.day.stem}{bazi?.day.branch ?? BAZI_PREVIEW.day.branch}</Text>
              <Text style={styles.pillarType}>日柱</Text>
            </View>
            <View style={styles.pillar}>
              <Text style={styles.pillarStem}>
                {(() => {
                  if (bazi?.hour) return `${bazi.hour.stem}${bazi.hour.branch}`;
                  if (unknownHour || bazi?.hour === null) return '未知';
                  if (!showBazi) return `${BAZI_PREVIEW.hour.stem}${BAZI_PREVIEW.hour.branch}`;
                  return '未知';
                })()}
              </Text>
              <Text style={styles.pillarType}>时柱</Text>
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
  jadeSoft: '#dcebe2',
  cinnabar: '#a8422d',
  cinnabarSoft: '#f0d9d1',
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
  closeBtn: { fontSize: 14, color: PROTO.muted },
  formCard: {
    borderWidth: 1, borderColor: PROTO.line,
    borderRadius: 8, padding: 14,
    backgroundColor: 'rgba(255, 250, 241, 0.82)',
  },
  formTitle: { fontSize: 24, fontWeight: '700', color: PROTO.ink, lineHeight: 28 },
  formDesc: { fontSize: 12, color: PROTO.muted, lineHeight: 19, marginTop: 8, marginBottom: 14 },
  field: { marginTop: 11 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: PROTO.muted, marginBottom: 6 },
  inputLike: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    minHeight: 42, borderWidth: 1, borderColor: PROTO.line,
    borderRadius: 8, paddingHorizontal: 11,
    backgroundColor: PROTO.surface,
  },
  inputValue: { fontSize: 14, color: PROTO.ink },
  textInput: { flex: 1, fontSize: 14, color: PROTO.ink, padding: 0 },
  inputHint: { fontSize: 12, color: PROTO.muted },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    minHeight: 42, borderWidth: 1, borderColor: PROTO.line,
    borderRadius: 8, paddingHorizontal: 11,
    backgroundColor: PROTO.surface,
  },
  dateInput: {
    fontSize: 14, color: PROTO.ink, fontWeight: '600',
    padding: 0, minWidth: 32, textAlign: 'center',
  },
  dateInputShort: { minWidth: 24 },
  dateSep: { fontSize: 12, color: PROTO.muted },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  timeChip: {
    width: '23%', borderWidth: 1, borderColor: PROTO.line,
    borderRadius: 8, paddingVertical: 8,
    backgroundColor: PROTO.surface, alignItems: 'center',
  },
  timeChipActive: {
    borderColor: 'rgba(168, 66, 45, 0.42)',
    backgroundColor: PROTO.cinnabarSoft,
  },
  timeChipText: { fontSize: 11, color: PROTO.muted },
  timeChipTextActive: { color: PROTO.cinnabar, fontWeight: '800' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', minHeight: 46,
    marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(223, 209, 189, 0.7)',
    paddingTop: 12,
  },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: PROTO.ink },
  toggleHint: { fontSize: 11, color: PROTO.muted, marginTop: 2 },
  primaryBtn: {
    minHeight: 44, marginTop: 14,
    borderRadius: 8, backgroundColor: '#252119',
    alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: { color: PROTO.surface, fontSize: 14, fontWeight: '800' },
  privacyNote: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    marginTop: 12, borderWidth: 1,
    borderColor: 'rgba(47, 125, 99, 0.22)',
    borderRadius: 8, padding: 10,
    backgroundColor: 'rgba(220, 235, 226, 0.62)',
  },
  privacyIcon: {
    width: 26, height: 26, borderRadius: 6,
    backgroundColor: PROTO.jadeSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  privacyIconText: { fontSize: 14 },
  privacyText: { flex: 1, fontSize: 11, color: PROTO.jade, lineHeight: 17 },
  baziPreview: {
    marginTop: 12, borderWidth: 1,
    borderColor: 'rgba(184, 135, 45, 0.28)',
    borderRadius: 8, padding: 11,
    backgroundColor: 'rgba(239, 224, 189, 0.48)',
  },
  baziLabel: { fontSize: 11, color: PROTO.muted },
  pillarGrid: { flexDirection: 'row', gap: 7, marginTop: 8 },
  pillar: {
    flex: 1, borderWidth: 1,
    borderColor: 'rgba(184, 135, 45, 0.24)',
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 4,
    backgroundColor: PROTO.surface, alignItems: 'center',
  },
  pillarStem: { fontSize: 17, fontWeight: '700', color: PROTO.ink },
  pillarType: { fontSize: 10, color: PROTO.muted, marginTop: 2 },
});
