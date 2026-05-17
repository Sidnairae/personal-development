import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DAILY_NOTIF_ID = 'nova-daily-8am';

async function scheduleDaily() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  if (existing.some(n => n.identifier === DAILY_NOTIF_ID)) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_NOTIF_ID,
    content: {
      title: 'Nova',
      body: "Today's piece is ready — open to read it.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });
}

export default function RootLayout() {
  useEffect(() => { scheduleDaily(); }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
