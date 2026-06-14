import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import { useStore } from '../src/store/useStore';
import { initDatabase } from '../src/database/db';
import { requestNotificationPermission, addNotificationResponseListener } from '../src/services/notifications';
import { LockScreen } from '../src/components/LockScreen';

export default function RootLayout() {
  const { loadItems, loadHistory, loadSettings, settings, isLocked, lock } = useStore();

  useEffect(() => {
    async function init() {
      await initDatabase();
      await loadSettings();
      await loadItems();
      await loadHistory();

      const granted = await requestNotificationPermission();
      if (granted) {
        // Notifications are set up; reschedule happens on data load
      }
    }
    init();
  }, []);

  // Listen for notification taps to navigate to the right item
  useEffect(() => {
    const sub = addNotificationResponseListener((itemId) => {
      // Expo Router navigation from outside component is handled via global router
      // The user will land on the dashboard and can navigate; full deep-link support requires
      // expo-router's useRouter which can't be used here — handled in screens instead
    });
    return () => sub.remove();
  }, []);

  // Auto-lock on background (if PIN enabled)
  useEffect(() => {
    const handler = (nextState: AppStateStatus) => {
      if (nextState === 'background' && settings.pinEnabled) {
        lock();
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [settings.pinEnabled]);

  if (isLocked && (settings.pinEnabled || settings.biometricEnabled)) {
    return <LockScreen />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="item/add"
          options={{
            presentation: 'modal',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="item/[id]"
          options={{
            presentation: 'card',
            headerShown: true,
          }}
        />
      </Stack>
    </>
  );
}
