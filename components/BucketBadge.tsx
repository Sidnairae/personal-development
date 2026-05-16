import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BUCKETS, BucketColors, Colors, Typography } from '../constants/theme';
import type { BucketId } from '../constants/theme';

interface Props {
  bucketId: BucketId;
  size?: 'sm' | 'md';
}

export function BucketBadge({ bucketId, size = 'md' }: Props) {
  const bucket = BUCKETS.find(b => b.id === bucketId);
  const color  = BucketColors[bucketId] ?? Colors.textSecondary;
  const small  = size === 'sm';

  return (
    <View style={[styles.badge, { borderColor: color, backgroundColor: color + '18' }, small && styles.badgeSm]}>
      <Text style={[styles.emoji, small && styles.emojiSm]}>{bucket?.emoji}</Text>
      <Text style={[styles.label, { color }, small && styles.labelSm]}>
        {bucket?.label?.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  emoji: { fontSize: 14 },
  emojiSm: { fontSize: 11 },
  label: {
    ...Typography.label,
    fontSize: 11,
  },
  labelSm: {
    fontSize: 9,
  },
});
