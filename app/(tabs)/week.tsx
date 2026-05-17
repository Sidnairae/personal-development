import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Alert, ActivityIndicator, SafeAreaView, Modal, RefreshControl,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, BucketColors } from '../../constants/theme';
import { BucketBadge } from '../../components/BucketBadge';
import { DayCard } from '../../components/DayCard';
import { ContentView } from '../../components/ContentView';
import {
  loadCurrentWeek, loadWeekDays, triggerSkip, markComplete,
  getWeekDay, isUnlocked,
} from '../../lib/content';
import type { Week, DayContent } from '../../constants/types';
import type { BucketId } from '../../constants/theme';

export default function WeekScreen() {
  const [week,        setWeek]        = useState<Week | null>(null);
  const [days,        setDays]        = useState<(DayContent | null)[]>(Array(7).fill(null));
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [skipping,    setSkipping]    = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayContent | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    const w = await loadCurrentWeek();
    setWeek(w);
    if (w) {
      const fetched = await loadWeekDays(w.id, w.is_backup_active);
      const mapped: (DayContent | null)[] = Array(7).fill(null);
      for (const d of fetched) mapped[d.day_number - 1] = d;
      setDays(mapped);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const handleSkip = useCallback(async () => {
    if (!week || week.skip_used) return;
    Alert.alert(
      'Skip this week?',
      `You'll switch to the backup topic: "${week.backup_topic_title}". You only get one skip per week.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          style: 'destructive',
          onPress: async () => {
            setSkipping(true);
            const ok = await triggerSkip(week.id);
            if (ok) await load();
            setSkipping(false);
          },
        },
      ]
    );
  }, [week, load]);

  const handleDayComplete = useCallback(async () => {
    if (!selectedDay) return;
    await markComplete(selectedDay.id);
    const completed_at = new Date().toISOString();
    setSelectedDay(prev => prev ? { ...prev, completed_at } : prev);
    setDays(prev => prev.map(d => d?.id === selectedDay.id ? { ...d, completed_at } : d));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setSelectedDay(null), 1400);
  }, [selectedDay]);

  const currentDay = getWeekDay(new Date());
  const bucketId   = (week?.is_backup_active ? week.backup_bucket_id : week?.bucket_id) as BucketId | undefined;
  const topicTitle = week ? (week.is_backup_active ? week.backup_topic_title : week.topic_title) : '';
  const accentColor = bucketId ? BucketColors[bucketId] : Colors.textSecondary;

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!week) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>No active week</Text>
          <Text style={styles.emptyBody}>Your first week starts Monday at 6 AM.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.textMuted} />
        }
      >
        {/* Week header */}
        <View style={styles.weekHeader}>
          <Text style={styles.weekLabel}>WEEK {week.week_number}</Text>
          {bucketId && <BucketBadge bucketId={bucketId} />}
          <Text style={styles.topicTitle}>{topicTitle}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          <View style={[styles.progressTrack]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: accentColor,
                  width: `${(days.filter(d => d?.completed_at).length / 7) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {days.filter(d => d?.completed_at).length} / 7 done
          </Text>
        </View>

        {/* Skip button */}
        {!week.skip_used ? (
          <Pressable
            style={[styles.skipBtn, skipping && { opacity: 0.5 }]}
            onPress={handleSkip}
            disabled={skipping}
          >
            <Text style={styles.skipText}>
              {skipping ? 'Switching…' : 'Skip this topic  →'}
            </Text>
            <Text style={styles.skipSub}>One skip per week · backup ready</Text>
          </Pressable>
        ) : (
          <View style={styles.skipUsed}>
            <Text style={styles.skipUsedText}>Skip used this week</Text>
          </View>
        )}

        {/* Day grid */}
        <View style={styles.grid}>
          {days.map((day, i) => {
            const dayNum   = i + 1;
            const unlocked = isUnlocked(dayNum) && (dayNum === 1 || !!days[i - 1]?.completed_at);
            return (
              <DayCard
                key={dayNum}
                day={day}
                dayNumber={dayNum}
                bucketId={bucketId!}
                isToday={dayNum === currentDay}
                isUnlocked={unlocked}
                onPress={day && unlocked ? () => setSelectedDay(day) : undefined}
              />
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Day content modal */}
      <Modal
        visible={!!selectedDay}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedDay(null)}
      >
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSelectedDay(null)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Done</Text>
            </Pressable>
          </View>
          {selectedDay && bucketId && (
            <ContentView
              key={selectedDay.id}
              content={selectedDay}
              bucketId={bucketId}
              isComplete={!!selectedDay.completed_at}
              onComplete={handleDayComplete}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  inner:  { padding: 24, gap: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyEmoji: { fontSize: 40, marginBottom: 16 },
  emptyTitle: { ...Typography.title, color: Colors.text, textAlign: 'center', marginBottom: 8 },
  emptyBody:  { ...Typography.body,  color: Colors.textSecondary, textAlign: 'center' },

  weekHeader: { gap: 10 },
  weekLabel:  { ...Typography.label, color: Colors.textMuted },
  topicTitle: { ...Typography.displaySmall, color: Colors.text },

  progressWrap:  { gap: 6 },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  progressLabel: { ...Typography.caption, color: Colors.textMuted },

  grid: { gap: 12 },

  skipBtn: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    gap: 4,
  },
  skipText: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  skipSub:  { ...Typography.caption, color: Colors.textMuted },
  skipUsed: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
  },
  skipUsedText: { ...Typography.caption, color: Colors.textMuted },

  modalRoot:   { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeBtn:  { paddingHorizontal: 8, paddingVertical: 4 },
  closeText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
});
