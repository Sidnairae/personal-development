import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, BucketColors } from '../../constants/theme';
import { RevealCard } from '../../components/RevealCard';
import { ContentView } from '../../components/ContentView';
import { BucketBadge } from '../../components/BucketBadge';
import {
  loadCurrentWeek, loadDayContent, markComplete,
  getWeekDay, isUnlocked,
} from '../../lib/content';
import type { Week, DayContent } from '../../constants/types';
import type { BucketId } from '../../constants/theme';

type State = 'loading' | 'no_week' | 'locked' | 'reveal' | 'content';

export default function TodayScreen() {
  const [week,       setWeek]       = useState<Week | null>(null);
  const [content,    setContent]    = useState<DayContent | null>(null);
  const [screenState, setScreenState] = useState<State>('loading');
  const [showReveal,  setShowReveal]  = useState(false);

  const load = useCallback(async () => {
    setScreenState('loading');
    const w = await loadCurrentWeek();
    if (!w) { setScreenState('no_week'); return; }
    setWeek(w);

    const dayNum   = getWeekDay(new Date());
    const unlocked = isUnlocked(dayNum);
    if (!unlocked) { setScreenState('locked'); return; }

    const isBackup = w.is_backup_active;
    const c = await loadDayContent(w.id, dayNum, isBackup);
    setContent(c);

    // Show reveal card on Monday (day 1) if not already completed
    const isMonday   = dayNum === 1;
    const noPrevDone = !c?.completed_at;
    if (isMonday && noPrevDone) {
      setShowReveal(true);
      setScreenState('reveal');
    } else {
      setScreenState('content');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = useCallback(async () => {
    if (!content) return;
    await markComplete(content.id);
    setContent(prev => prev ? { ...prev, completed_at: new Date().toISOString() } : prev);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [content]);

  const handleDismissReveal = useCallback(() => {
    setShowReveal(false);
    setScreenState('content');
  }, []);

  const bucketId = (week?.is_backup_active ? week.backup_bucket_id : week?.bucket_id) as BucketId | undefined;
  const accentColor = bucketId ? BucketColors[bucketId] : Colors.textSecondary;

  if (screenState === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.textSecondary} />
      </View>
    );
  }

  if (screenState === 'no_week') {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🌙</Text>
          <Text style={styles.emptyTitle}>Nothing yet</Text>
          <Text style={styles.emptyBody}>
            Your first week of Nova will arrive on Monday morning at 6 AM.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (screenState === 'locked') {
    const dayNum = getWeekDay(new Date());
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyTitle}>Day {dayNum} unlocks at 6 AM</Text>
          <Text style={styles.emptyBody}>Come back in the morning.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>TODAY</Text>
          {bucketId && <BucketBadge bucketId={bucketId} size="sm" />}
        </View>
        <View style={[styles.dot, { backgroundColor: accentColor }]} />
      </View>

      {/* Content */}
      {content ? (
        <ContentView
          content={content}
          bucketId={bucketId!}
          isComplete={!!content.completed_at}
          onComplete={handleComplete}
        />
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={accentColor} />
          <Text style={[styles.emptyBody, { marginTop: 12 }]}>Generating today's content…</Text>
        </View>
      )}

      {/* Monday reveal overlay */}
      {showReveal && week && bucketId && (
        <RevealCard
          bucketId={bucketId}
          topicTitle={week.is_backup_active ? week.backup_topic_title : week.topic_title}
          topicTagline={week.is_backup_active ? week.backup_topic_tagline : week.topic_tagline}
          onDismiss={handleDismissReveal}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLabel: { ...Typography.label, color: Colors.textMuted, marginBottom: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  emptyEmoji: { fontSize: 40, marginBottom: 16 },
  emptyTitle: { ...Typography.title, color: Colors.text, textAlign: 'center', marginBottom: 8 },
  emptyBody:  { ...Typography.body,  color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
