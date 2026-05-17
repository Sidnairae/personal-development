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

// One notification per day, Mon–Sun. weekday: 1=Sun, 2=Mon … 7=Sat
const NOTIF_IDS      = ['nova-sun','nova-mon','nova-tue','nova-wed','nova-thu','nova-fri','nova-sat'];
const NOTIF_WEEKDAYS = [1, 2, 3, 4, 5, 6, 7];

async function scheduleDaily() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const existing    = await Notifications.getAllScheduledNotificationsAsync();
  const existingIds = new Set(existing.map(n => n.identifier));
  if (NOTIF_IDS.every(id => existingIds.has(id))) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
  await Promise.all(
    NOTIF_IDS.map((id, i) =>
      Notifications.scheduleNotificationAsync({
        identifier: id,
        content: { title: 'Nova', body: "Today's piece is ready — open to read it." },
        trigger: {
          type:    Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: NOTIF_WEEKDAYS[i],
          hour:    8,
          minute:  0,
        },
      })
    )
  );
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
