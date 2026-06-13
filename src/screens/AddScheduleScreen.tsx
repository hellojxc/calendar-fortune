import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { addSchedule, updateSchedule } from '../storage/schedule';
import { isValidDate } from '../services/fortune';
import type { ScheduleItem } from '../types';
import type { AddScheduleParams } from '../navigation/types';

const TYPE_OPTIONS: { key: ScheduleItem['type']; label: string }[] = [
  { key: 'meeting', label: '会议' },
  { key: 'personal', label: '个人' },
  { key: 'health', label: '健康' },
  { key: 'other', label: '其他' },
];

const TIME_OPTIONS = [
  '06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30',
  '10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30',
  '14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30',
  '22:00',
];

type Nav = NativeStackNavigationProp<any>;

export default function AddScheduleScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute();
  const params = route.params as AddScheduleParams | undefined;
  const editItem = params?.editItem;

  const today = new Date();
  // Pre-fill date from route param (e.g. passed from Calendar) or from edit
  const initDate = params?.date ? new Date(params.date + 'T00:00:00') : (editItem?.date ? new Date(editItem.date + 'T00:00:00') : today);
  const [title, setTitle] = useState(editItem?.title ?? '');
  const [dateY, setDateY] = useState(String(initDate.getFullYear()));
  const [dateM, setDateM] = useState(String(initDate.getMonth() + 1));
  const [dateD, setDateD] = useState(String(initDate.getDate()));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [time, setTime] = useState(editItem?.time ?? params?.prefillTime ?? '09:00');
  const [customTime, setCustomTime] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [hint, setHint] = useState(editItem?.hint ?? '');
  const [type, setType] = useState<ScheduleItem['type']>((editItem?.type as ScheduleItem['type']) ?? 'meeting');

  const dateStr = useMemo(() => {
    const y = dateY.padStart(4, '0');
    const m = dateM.padStart(2, '0');
    const d = dateD.padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [dateY, dateM, dateD]);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('请输入标题'); return; }

    // Validate date
    const y = parseInt(dateY, 10);
    const m = parseInt(dateM, 10);
    const d = parseInt(dateD, 10);
    if (!isValidDate(y, m, d)) {
      Alert.alert('日期有误', '请输入真实存在的日期（如 2 月无 31 日）');
      return;
    }

    // Validate time
    const finalTime = useCustomTime ? customTime : time;
    const timeMatch = /^(\d{2}):(\d{2})$/.exec(finalTime);
    if (!timeMatch) {
      Alert.alert('时间格式有误', '请输入 HH:MM 格式（如 09:30）');
      return;
    }
    const hh = parseInt(timeMatch[1], 10);
    const mm = parseInt(timeMatch[2], 10);
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
      Alert.alert('时间有误', '小时须在 00-23，分钟须在 00-59');
      return;
    }

    if (editItem) {
      await updateSchedule(editItem.id, { date: dateStr, time: finalTime, title: title.trim(), hint: hint.trim(), type });
    } else {
      await addSchedule({ date: dateStr, time: finalTime, title: title.trim(), hint: hint.trim(), type });
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.appTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>{editItem ? '编辑日程' : '新增日程'}</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>保存</Text>
          </TouchableOpacity>
        </View>

        {/* Date */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>日期</Text>
          <View style={styles.dateRow}>
            <View style={{ flex: 2 }}>
              <TextInput
                style={styles.input}
                value={dateY}
                onChangeText={setDateY}
                placeholder="2026"
                placeholderTextColor={PROTO.muted}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <Text style={styles.dateSep}>年</Text>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                value={dateM}
                onChangeText={setDateM}
                placeholder="6"
                placeholderTextColor={PROTO.muted}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <Text style={styles.dateSep}>月</Text>
            <View style={{ flex: 1 }}>
              <TextInput
                style={styles.input}
                value={dateD}
                onChangeText={setDateD}
                placeholder="13"
                placeholderTextColor={PROTO.muted}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <Text style={styles.dateSep}>日</Text>
          </View>
        </View>

        {/* Time */}
        <View style={styles.field}>
          <View style={styles.fieldLabelRow}>
            <Text style={styles.fieldLabel}>时间</Text>
            <TouchableOpacity onPress={() => { setShowTimePicker(!showTimePicker); setUseCustomTime(false); }}>
              <Text style={styles.toggleText}>{showTimePicker ? '收起' : '选择'}</Text>
            </TouchableOpacity>
          </View>

          {/* Current time display */}
          <View style={styles.timeDisplay}>
            <Text style={styles.timeDisplayText}>
              {useCustomTime ? customTime || '--:--' : time}
            </Text>
            <TouchableOpacity
              style={styles.customTimeBtn}
              onPress={() => { setUseCustomTime(true); setShowTimePicker(false); }}
            >
              <Text style={styles.customTimeLabel}>自定义</Text>
            </TouchableOpacity>
          </View>

          {/* Custom time input */}
          {useCustomTime && (
            <TextInput
              style={styles.input}
              value={customTime}
              onChangeText={setCustomTime}
              placeholder="09:30"
              placeholderTextColor={PROTO.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              autoFocus
            />
          )}

          {/* Time picker dropdown */}
          {showTimePicker && (
            <View style={styles.timePicker}>
              {TIME_OPTIONS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.timeSlot, time === t && styles.timeSlotActive]}
                  onPress={() => { setTime(t); setUseCustomTime(false); setShowTimePicker(false); }}
                >
                  <Text style={[styles.timeSlotText, time === t && styles.timeSlotTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>标题</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="日程标题"
            placeholderTextColor={PROTO.muted}
            autoFocus={!showTimePicker}
          />
        </View>

        {/* Hint */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>备注</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={hint}
            onChangeText={setHint}
            placeholder="可选备注"
            placeholderTextColor={PROTO.muted}
            multiline
          />
        </View>

        {/* Type */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>类型</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.typeChip, type === opt.key && styles.typeChipActive]}
                onPress={() => setType(opt.key)}
              >
                <Text style={[styles.typeChipText, type === opt.key && styles.typeChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PROTO = {
  ink: '#24211c', muted: '#756d61', line: '#dfd1bd',
  surface: '#fffaf1', cinnabar: '#a8422d', jade: '#2f7d63',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e8' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  appTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  cancelText: { fontSize: 16, color: PROTO.muted },
  pageTitle: { fontSize: 17, fontWeight: '800', color: PROTO.ink },
  saveText: { fontSize: 16, fontWeight: '700', color: PROTO.cinnabar },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: PROTO.muted, marginBottom: 6 },
  fieldLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  toggleText: { fontSize: 12, color: PROTO.jade, fontWeight: '600' },
  input: {
    borderWidth: 1, borderColor: PROTO.line, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: PROTO.surface, fontSize: 15, color: PROTO.ink,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateSep: { fontSize: 13, color: PROTO.muted, fontWeight: '600' },
  timeDisplay: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: PROTO.line, borderRadius: 8,
    backgroundColor: PROTO.surface, marginBottom: 8,
  },
  timeDisplayText: { fontSize: 18, fontWeight: '700', color: PROTO.ink, flex: 1 },
  customTimeBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 6, backgroundColor: '#f0d9d1',
  },
  customTimeLabel: { fontSize: 12, color: PROTO.cinnabar, fontWeight: '600' },
  timePicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    padding: 10, borderRadius: 8,
    borderWidth: 1, borderColor: PROTO.line,
    backgroundColor: PROTO.surface,
  },
  timeSlot: {
    width: '18%', paddingVertical: 7, paddingHorizontal: 2,
    borderWidth: 1, borderColor: PROTO.line, borderRadius: 6,
    backgroundColor: PROTO.surface, alignItems: 'center',
  },
  timeSlotActive: { borderColor: PROTO.jade, backgroundColor: 'rgba(47,125,99,0.12)' },
  timeSlotText: { fontSize: 11, color: PROTO.muted, fontWeight: '500' },
  timeSlotTextActive: { color: PROTO.jade, fontWeight: '700' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: PROTO.line, borderRadius: 8,
    backgroundColor: PROTO.surface,
  },
  typeChipActive: { borderColor: PROTO.cinnabar, backgroundColor: '#f0d9d1' },
  typeChipText: { fontSize: 13, color: PROTO.muted },
  typeChipTextActive: { color: PROTO.cinnabar, fontWeight: '700' },
});
