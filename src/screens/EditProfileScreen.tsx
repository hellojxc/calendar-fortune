import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { loadProfile, saveProfile } from '../storage/profile';
import type { UserProfile } from '../types';
import type { MeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<MeStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      setName(p.name);
      setAvatar(p.avatar);
      setReminderTime(p.reminderTime);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('请输入姓名'); return; }
    const profile: UserProfile = {
      name: name.trim(),
      avatar: avatar.trim() || name.trim().charAt(0),
      reminderTime: /^\d{2}:\d{2}$/.test(reminderTime) ? reminderTime : '08:00',
      hasFortuneEnabled: true,
    };
    await saveProfile(profile);
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

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>姓名</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="姓名"
            placeholderTextColor={Colors.muted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>头像文字（单字）</Text>
          <TextInput
            style={styles.input}
            value={avatar}
            onChangeText={setAvatar}
            placeholder="姓"
            placeholderTextColor={Colors.muted}
            maxLength={1}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>每日提醒时间</Text>
          <TextInput
            style={styles.input}
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="08:00"
            placeholderTextColor={Colors.muted}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
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
  loading: { textAlign: 'center', marginTop: 100, fontSize: 16, color: PROTO.muted },
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
});
