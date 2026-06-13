import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { SETTINGS_ITEMS } from '../data/fixtures';
import { loadProfile, clearBirthData } from '../storage/profile';
import { getPermissionStatus, requestPermission, scheduleDailyReminder, cancelAllReminders } from '../services/notifications';
import type { PermissionStatus } from '../services/notifications';
import type { UserProfile } from '../types';
import type { MeStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<MeStackParamList, 'MeMain'>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const [birthDataSet, setBirthDataSet] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState<PermissionStatus>('undetermined');
  const [profile, setProfile] = useState<UserProfile>({
    name: '', avatar: '', reminderTime: '08:00', hasFortuneEnabled: true,
    birthHour: null,
  });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const p = await loadProfile();
        const exists = p.birthYear != null && p.birthMonth != null && p.birthDay != null;
        if (!cancelled) {
          setProfile(p);
          setBirthDataSet(exists);
          setNotifyStatus(await getPermissionStatus());
        }
      })();
      return () => { cancelled = true; };
    }, [])
  );

  const handleDelete = () => {
    Alert.alert('确认删除', '清除生辰八字和本地画像后，运势将恢复为通用参考。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await clearBirthData();
          setBirthDataSet(false);
          setProfile((prev) => ({ ...prev, birthYear: undefined, birthMonth: undefined, birthDay: undefined, birthHour: null, birthplace: undefined }));
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHead}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.avatar}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileStatus}>
              {birthDataSet
                ? `已开启每日五行提醒 · 每日 ${profile.reminderTime} 更新`
                : '尚未设置生辰资料'}
            </Text>
          </View>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('EditProfile')}>
            <Text style={styles.iconBtnText}>✎</Text>
          </TouchableOpacity>
        </View>

        {/* Birth data card (when set) */}
        {birthDataSet && profile.birthYear != null && (
          <View style={styles.birthCard}>
            <View style={styles.sectionLabel}>
              <Text style={styles.sectionTitle}>生辰资料</Text>
            </View>
            <Text style={styles.birthText}>
              公历 {profile.birthYear}年{profile.birthMonth}月{profile.birthDay}日{' '}
              {profile.birthHour != null
                ? `${['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][profile.birthHour]}时`
                : '时辰未知'}
            </Text>
            {profile.birthplace && (
              <Text style={styles.birthPlace}>出生地 · {profile.birthplace}</Text>
            )}
            <TouchableOpacity style={styles.clearBirthBtn} onPress={handleDelete}>
              <Text style={styles.clearBirthText}>清除生辰资料</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.fortuneCard}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionTitle}>提醒设置</Text>
            <Text style={styles.sectionSub}>每日 {profile.reminderTime} 更新</Text>
          </View>
          <Text style={styles.reminderDesc}>
            运势提醒偏好：每天更新今日关键词与五行分布，建议聚焦方向。
          </Text>
          <View style={styles.chipRow}>
            <View style={[styles.chip, styles.chipJade]}>
              <Text style={styles.chipTextJade}>五行运势</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>当日关键词</Text>
            </View>
            <View style={[styles.chip, styles.chipGold]}>
              <Text style={styles.chipTextGold}>节气提示</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionTitle}>设置</Text>
            <Text style={styles.sectionSub}>本地优先</Text>
          </View>
          <View style={styles.settingsList}>
            {SETTINGS_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.settingItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.id === 'delete_data') handleDelete();
                  else if (item.id === 'privacy') Alert.alert('隐私与数据', '所有资料仅存本机。可在下方清除或导出。');
                  else if (item.id === 'fortune_model') Alert.alert('运势模型', '基于 lunar-typescript 天文精度八字引擎，五行加权计算每日运势');
                  else if (item.id === 'lunar') Alert.alert('农历与节气', '使用天文算法实时计算，精确到节气时刻');
                  else Alert.alert(item.title, item.desc);
                }}
              >
                <View style={[styles.miniIcon, { backgroundColor: item.iconBg }]}>
                  <Text style={[styles.miniIconText, { color: item.iconColor }]}>{item.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingName}>{item.title}</Text>
                  <Text style={styles.settingDesc}>{item.desc}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionLabel}>
            <Text style={styles.sectionTitle}>主题</Text>
            <Text style={styles.sectionSub}>五行色</Text>
          </View>
          <View style={styles.themeRow}>
            {[{ color: Colors.fire, bg: Colors.surface, label: '纸色+朱砂' },
              { color: Colors.wood, bg: '#e9f0e4', label: '玉绿' },
              { color: Colors.water, bg: '#ecf2f3', label: '靛蓝' },
              { color: Colors.gold, bg: '#f5ebd6', label: '金色' },
            ].map((t, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => Alert.alert(t.label, '主题切换将在后续版本支持')}
              >
                <View style={[styles.swatch, { backgroundColor: t.color }]}>
                  <View style={[styles.swatchHalf, { backgroundColor: t.bg }]} />
                </View>
              </TouchableOpacity>
            ))}
        </View>
        </View>

        {/* Privacy & data */}
            <View style={[styles.section, { marginTop: 20 }]}>
            <View style={styles.sectionLabel}>
              <Text style={styles.sectionTitle}>隐私与数据</Text>
            </View>
            <Text style={styles.privacyNote}>✦ 所有生辰资料仅保存在本机，不上传任何服务器</Text>
            <TouchableOpacity
              style={styles.notifyRow}
              activeOpacity={0.7}
              onPress={async () => {
                const status = notifyStatus === 'granted'
                  ? (await cancelAllReminders(), 'denied')
                  : await requestPermission();
                if (status === 'granted') {
                  await scheduleDailyReminder(profile.reminderTime);
                }
                setNotifyStatus(status as PermissionStatus);
              }}
            >
              <Text style={styles.notifyLabel}>每日运势提醒</Text>
              <Text style={[
                styles.notifyStatus,
                { color: notifyStatus === 'granted' ? '#2f7d63' : notifyStatus === 'denied' ? '#a8422d' : '#756d61' }
              ]}>
                {notifyStatus === 'granted' ? '已开启'
                  : notifyStatus === 'denied' ? '已关闭'
                  : notifyStatus === 'unsupported' ? '设备不支持'
                  : '点击开启'}
              </Text>
            </TouchableOpacity>
            <View style={styles.privacyActions}>
              {/* Export hidden until functional */}
              {false && (
              <TouchableOpacity
                style={styles.privacyBtn}
                activeOpacity={0.7}
                onPress={() => Alert.alert('导出备份', '将生辰资料以文本形式复制到剪贴板')}
              >
                <Text style={styles.privacyBtnText}>导出备份</Text>
              </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.privacyBtn, { borderColor: PROTO.cinnabar }]}
                activeOpacity={0.7}
                onPress={handleDelete}
              >
                <Text style={[styles.privacyBtnText, { color: PROTO.cinnabar }]}>清除数据</Text>
              </TouchableOpacity>
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
  gold: '#b8872d',
  cinnabar: '#a8422d',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f2e8' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 86 },
  profileHead: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    marginBottom: 13,
  },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: '#252119', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: PROTO.surface, fontSize: 20, fontWeight: '800' },
  profileName: { fontSize: 19, fontWeight: '700', color: PROTO.ink },
  profileStatus: { fontSize: 12, color: PROTO.muted, marginTop: 4 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
    borderWidth: 1, borderColor: PROTO.line,
    backgroundColor: 'rgba(255, 250, 241, 0.68)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 16, color: PROTO.muted },
  fortuneCard: {
    borderWidth: 1, borderColor: 'rgba(168,66,45,0.26)',
    borderRadius: 8, padding: 14, backgroundColor: PROTO.surface,
  },
  sectionLabel: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: PROTO.ink },
  sectionSub: { fontSize: 11, color: PROTO.muted },
  reminderDesc: { fontSize: 10, color: PROTO.muted, lineHeight: 16, marginBottom: 10 },
  birthCard: {
    borderWidth: 1, borderColor: PROTO.line, borderRadius: 8,
    padding: 12, backgroundColor: PROTO.surface,
    marginBottom: 12,
  },
  birthText: { fontSize: 13, color: PROTO.ink, marginTop: 6, fontWeight: '600' },
  birthPlace: { fontSize: 11, color: PROTO.muted, marginTop: 4 },
  clearBirthBtn: {
    marginTop: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#e8c0b8', borderRadius: 6,
    backgroundColor: '#fef5f2', alignItems: 'center',
  },
  clearBirthText: { fontSize: 11, color: '#a8422d', fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
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
  settingsList: { gap: 9 },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: PROTO.line,
    borderRadius: 8, padding: 10,
    backgroundColor: 'rgba(255, 250, 241, 0.78)',
  },
  miniIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  miniIconText: { fontSize: 14 },
  settingName: { fontSize: 13, fontWeight: '600', color: PROTO.ink },
  settingDesc: { fontSize: 11, color: PROTO.muted, marginTop: 2 },
  chevron: { fontSize: 20, color: PROTO.muted },
  themeRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  swatch: {
    flex: 1, height: 42, borderRadius: 8,
    borderWidth: 1, borderColor: PROTO.line, overflow: 'hidden',
    flexDirection: 'row',
  },
  swatchHalf: { width: '50%', height: '100%' },
  privacyNote: { fontSize: 12, color: PROTO.muted, marginBottom: 10, lineHeight: 18 },
  privacyActions: { flexDirection: 'row', gap: 10 },
  privacyBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: PROTO.line, alignItems: 'center',
  },
  privacyBtnText: { fontSize: 12, fontWeight: '600', color: PROTO.ink },
  notifyRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: PROTO.line,
    marginBottom: 10,
  },
  notifyLabel: { fontSize: 13, color: PROTO.ink },
  notifyStatus: { fontSize: 12, fontWeight: '600' },
});
