import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors, Typography, BucketColors } from '../constants/theme';
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
        isToday && { borderColor: accent, borderWidth: 1.5 },
        pressed && !locked && { opacity: 0.85 },
      ]}
    >
      {/* Day label */}
      <View style={styles.header}>
        <Text style={[styles.dayName, isToday && { color: accent }]}>
          {DAY_NAMES[dayNumber]}
        </Text>
        {complete && <Text style={[styles.check, { color: accent }]}>✓</Text>}
        {locked   && <Text style={styles.lock}>🔒</Text>}
      </View>

      {/* Format pill */}
      {day && !locked ? (
        <>
          <Text style={styles.format} numberOfLines={1}>
            {day.format.replace('_', ' ')}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
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
});
