import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { rescheduleAllNotifications } from '../services/notifications';

// Called once after items and settings are loaded to sync notifications
export function useNotificationSync() {
  const { items, settings } = useStore();

  useEffect(() => {
    if (items.length === 0) return;
    rescheduleAllNotifications(items, settings.defaultNotificationDays, settings.notificationsEnabled);
  }, [items.length]);
}
