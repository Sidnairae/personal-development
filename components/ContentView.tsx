import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Colors, Typography, FORMAT_LABELS, BucketColors } from '../constants/theme';
import { BucketBadge } from './BucketBadge';
import type { DayContent } from '../constants/types';
import type { BucketId } from '../constants/theme';

interface Props {
  content: DayContent;
  bucketId: BucketId;
  isComplete: boolean;
  onComplete: () => void;
}

const markdownStyles = {
  body:       { ...Typography.body, color: Colors.text },
  heading1:   { ...Typography.title, color: Colors.text, marginTop: 20, marginBottom: 8 },
  heading2:   { ...Typography.title, fontSize: 18, color: Colors.text, marginTop: 16, marginBottom: 6 },
  paragraph:  { marginBottom: 14, lineHeight: 24 },
  blockquote: {
    backgroundColor: Colors.surfaceAlt,
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
    paddingLeft: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginVertical: 10,
  },
  code_inline: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  bullet_list_icon: { color: Colors.textSecondary },
};

export function ContentView({ content, bucketId, isComplete, onComplete }: Props) {
  const accentColor = BucketColors[bucketId] ?? Colors.textSecondary;
  const formatLabel = FORMAT_LABELS[content.format] ?? content.format;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}
    >
      {/* Format chip */}
      <View style={[styles.formatChip, { borderColor: accentColor, backgroundColor: accentColor + '18' }]}>
        <Text style={[styles.formatLabel, { color: accentColor }]}>{formatLabel.toUpperCase()}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{content.title}</Text>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: accentColor }]} />

      {/* Body */}
      <Markdown style={markdownStyles as any}>{content.body}</Markdown>

      {/* Complete button */}
      <View style={styles.completeBtnWrap}>
        {isComplete ? (
          <View style={[styles.doneTag, { borderColor: accentColor }]}>
            <Text style={[styles.doneText, { color: accentColor }]}>✓  Done for today</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.completeBtn, { backgroundColor: accentColor }]}
            onPress={onComplete}
          >
            <Text style={styles.completeBtnText}>Mark as done  ✓</Text>
          </Pressable>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: Colors.background },
  inner:   { padding: 24, paddingTop: 16 },
  formatChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  formatLabel: { ...Typography.label, fontSize: 10 },
  title: { ...Typography.displaySmall, color: Colors.text, marginBottom: 16 },
  divider: { height: 2, width: 40, borderRadius: 2, marginBottom: 20 },
  completeBtnWrap: { marginTop: 32, alignItems: 'center' },
  completeBtn: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  completeBtnText: { ...Typography.body, fontWeight: '600', color: '#FFF' },
  doneTag: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  doneText: { ...Typography.body, fontWeight: '600' },
});
