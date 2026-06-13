import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PERMISSION_KEY = '@fortune/notify_permission';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PermissionStatus = 'undetermined' | 'granted' | 'denied' | 'unsupported';

/** Check current notification permission status */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (!Device.isDevice) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return (status as PermissionStatus) ?? 'undetermined';
}

/** Request notification permission. Returns final status. */
export async function requestPermission(): Promise<PermissionStatus> {
  if (!Device.isDevice) {
    await AsyncStorage.setItem(PERMISSION_KEY, 'unsupported');
    return 'unsupported';
  }
  const { status } = await Notifications.requestPermissionsAsync();
  await AsyncStorage.setItem(PERMISSION_KEY, status);
  return status as PermissionStatus;
}

/** Schedule the daily fortune reminder at HH:MM */
export async function scheduleDailyReminder(timeStr: string): Promise<void> {
  // Cancel existing
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return;

  const trigger = new Date();
  trigger.setHours(h, m, 0, 0);
  // If time already passed today, schedule for tomorrow
  if (trigger.getTime() <= Date.now()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '时序日历',
      body: '🍃 今日运势已更新，点击查看五行指引',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: h,
      minute: m,
    },
  });
}

/** Remove all scheduled notifications */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.setItem(PERMISSION_KEY, 'denied');
}
