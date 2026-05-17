import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, BucketColors, FORMAT_LABELS } from '../constants/theme';
import type { DayContent } from '../constants/types';
import type { BucketId } from '../constants/theme';

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  day: DayContent | null;
  dayNumber: number;
  bucketId: BucketId;
  isToday: boolean;
  isUnlocked: boolean;
  onPress?: () => void;
}

export function DayCard({ day, dayNumber, bucketId, isToday, isUnlocked, onPress }: Props) {
  const accent   = BucketColors[bucketId] ?? Colors.textSecondary;
  const complete = !!day?.completed_at;
  const locked   = !isUnlocked;

  return (
    <Pressable
      onPress={!locked && onPress ? onPress : undefined}
      style={({ pressed }) => [
        styles.card,
        isToday && !complete && { borderColor: accent, borderWidth: 1.5 },
        complete && styles.cardDone,
        pressed && !locked && { opacity: 0.85 },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.dayName, isToday && !complete && { color: accent }]}>
          {DAY_NAMES[dayNumber]}
        </Text>
        {complete && <Text style={[styles.check, { color: accent }]}>✓</Text>}
        {locked    && <Text style={styles.lock}>🔒</Text>}
      </View>

      {day && !locked ? (
        <>
          <Text style={[styles.format, complete && styles.textDone]} numberOfLines={1}>
            {FORMAT_LABELS[day.format] ?? day.format}
          </Text>
          <Text style={[styles.title, complete && styles.textDone]} numberOfLines={2}>
            {day.title}
          </Text>
        </>
      ) : (
        <Text style={styles.pending}>{locked ? 'Unlocks at 6 AM' : 'Generating…'}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
  },
  cardDone: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: { ...Typography.label, color: Colors.textMuted },
  check:   { fontSize: 14, fontWeight: '700' },
  lock:    { fontSize: 12 },
  format: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title:   { ...Typography.body, color: Colors.text, fontSize: 14, lineHeight: 20 },
  pending: { ...Typography.caption, color: Colors.textMuted, marginTop: 8 },
  textDone: { color: Colors.textMuted },
});
