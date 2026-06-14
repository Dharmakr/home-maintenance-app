import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { subDays, parseISO, isFuture, startOfDay } from 'date-fns';
import { MaintenanceItem } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('maintenance-reminders', {
      name: 'Maintenance Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1B4F72',
      description: 'Alerts for upcoming home maintenance tasks',
    });
    await Notifications.setNotificationChannelAsync('maintenance-overdue', {
      name: 'Overdue Maintenance',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: '#E74C3C',
      description: 'Alerts for overdue home maintenance tasks',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Schedule a local notification for a single item
export async function scheduleItemNotification(
  item: MaintenanceItem,
  daysBefore: number
): Promise<string | null> {
  if (!item.nextDueDate) return null;

  try {
    const dueDate = parseISO(item.nextDueDate);
    const triggerDate = subDays(startOfDay(dueDate), daysBefore);

    if (!isFuture(triggerDate)) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔧 Maintenance Due in ${daysBefore} day${daysBefore === 1 ? '' : 's'}`,
        body: `${item.name} is due on ${dueDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`,
        data: { itemId: item.id },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: item.color,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: 'maintenance-reminders',
      },
    });

    return id;
  } catch (error) {
    console.error(`Failed to schedule notification for ${item.name}:`, error);
    return null;
  }
}

// Schedule overdue notification (fires on the due date itself)
export async function scheduleOverdueNotification(item: MaintenanceItem): Promise<string | null> {
  if (!item.nextDueDate) return null;

  try {
    const dueDate = startOfDay(parseISO(item.nextDueDate));
    if (!isFuture(dueDate)) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Maintenance Due Today',
        body: `${item.name} is due today. Don\'t forget to take care of it!`,
        data: { itemId: item.id },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#E74C3C',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dueDate,
        channelId: 'maintenance-overdue',
      },
    });

    return id;
  } catch (error) {
    console.error(`Failed to schedule overdue notification for ${item.name}:`, error);
    return null;
  }
}

// Cancel all scheduled notifications for a given item (by matching data.itemId)
// expo-notifications doesn't support querying by data, so we cancel all and reschedule
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Reschedule notifications for all active items
export async function rescheduleAllNotifications(
  items: MaintenanceItem[],
  defaultDaysBefore: number,
  enabled: boolean
): Promise<void> {
  await cancelAllNotifications();
  if (!enabled) return;

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  for (const item of items) {
    if (!item.nextDueDate || !item.isActive) continue;
    await scheduleItemNotification(item, item.notificationDaysBefore || defaultDaysBefore);
    await scheduleOverdueNotification(item);
  }
}

export function addNotificationResponseListener(
  handler: (itemId: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const itemId = response.notification.request.content.data?.itemId as string | undefined;
    if (itemId) handler(itemId);
  });
}
