import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { addSchedule } from '../storage/schedule';
import type { ScheduleItem } from '../types';
import type { TodayStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<TodayStackParamList, 'AddSchedule'>;

const TYPE_OPTIONS: { key: ScheduleItem['type']; label: string }[] = [
  { key: 'meeting', label: '会议' },
  { key: 'personal', label: '个人' },
  { key: 'health', label: '健康' },
  { key: 'other', label: '其他' },
];

export default function AddScheduleScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [hint, setHint] = useState('');
  const [type, setType] = useState<ScheduleItem['type']>('meeting');

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('请输入标题');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      Alert.alert('时间格式有误', '请输入 HH:MM 格式（如 09:30）');
      return;
    }
    await addSchedule({ title: title.trim(), time, hint: hint.trim(), type });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.appTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>新增日程</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>保存</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>标题</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="日程标题"
            placeholderTextColor={Colors.muted}
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>时间</Text>
          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="09:00"
            placeholderTextColor={Colors.muted}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>备注</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={hint}
            onChangeText={setHint}
            placeholder="可选备注"
            placeholderTextColor={Colors.muted}
            multiline
          />
        </View>

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
  surface: '#fffaf1', cinnabar: '#a8422d',
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
  input: {
    borderWidth: 1, borderColor: PROTO.line, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: PROTO.surface, fontSize: 15, color: PROTO.ink,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
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
