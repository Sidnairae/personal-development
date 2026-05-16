import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Pressable, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BucketColors, Colors, Typography, BUCKETS } from '../constants/theme';
import type { BucketId } from '../constants/theme';
import { BucketBadge } from './BucketBadge';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  bucketId: BucketId;
  topicTitle: string;
  topicTagline: string;
  onDismiss: () => void;
}

export function RevealCard({ bucketId, topicTitle, topicTagline, onDismiss }: Props) {
  const opacity  = useRef(new Animated.Value(0)).current;
  const scale    = useRef(new Animated.Value(0.88)).current;
  const titleY   = useRef(new Animated.Value(24)).current;

  const color = BucketColors[bucketId] ?? '#666';

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1,   duration: 400, useNativeDriver: true }),
        Animated.spring(scale,   { toValue: 1,   friction: 7,   useNativeDriver: true }),
      ]),
      Animated.timing(titleY, { toValue: 0, duration: 350, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <LinearGradient
        colors={[color + 'EE', color + 'BB', '#FAF7F2']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.weekLabel}>THIS WEEK</Text>

        <BucketBadge bucketId={bucketId} />

        <Animated.Text
          style={[styles.topic, { transform: [{ translateY: titleY }] }]}
        >
          {topicTitle}
        </Animated.Text>

        <Text style={styles.tagline}>{topicTagline}</Text>

        <Pressable
          style={[styles.btn, { backgroundColor: color }]}
          onPress={onDismiss}
        >
          <Text style={styles.btnText}>Let's go →</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    width: SCREEN_W * 0.85,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'flex-start',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  weekLabel: {
    ...Typography.label,
    color: Colors.textMuted,
  },
  topic: {
    ...Typography.displayLarge,
    color: Colors.text,
    marginTop: 4,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  btn: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  btnText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFF',
  },
});
