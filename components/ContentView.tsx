import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Share, Linking, RefreshControl } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, FORMAT_LABELS, BucketColors } from '../constants/theme';
import type { DayContent } from '../constants/types';
import type { BucketId } from '../constants/theme';

interface Props {
  content: DayContent;
  bucketId: BucketId;
  isComplete: boolean;
  onComplete: () => void;
  onRefresh?: () => Promise<void>;
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

export function ContentView({ content, bucketId, isComplete, onComplete, onRefresh }: Props) {
  const accentColor = BucketColors[bucketId] ?? Colors.textSecondary;
  const formatLabel = FORMAT_LABELS[content.format] ?? content.format;
  const [showQuiz, setShowQuiz] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const handleShare = async () => {
    const preview = content.body.replace(/[#*`>_\[\]()]/g, '').trim().slice(0, 300);
    await Share.share({ title: content.title, message: `${content.title}\n\n${preview}…\n\n— Nova` });
  };

  const openYouTube = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = encodeURIComponent(content.watch!.query);
    Linking.openURL(`youtube://results?search_query=${q}`)
      .catch(() => Linking.openURL(`https://www.youtube.com/results?search_query=${q}`));
  };

  const openPodcast = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q = encodeURIComponent(content.listen!.query);
    Linking.openURL(`spotify:search:${q}`)
      .catch(() => Linking.openURL(`https://open.spotify.com/search/${encodeURIComponent(content.listen!.query)}`));
  };

  const handleCompletePress = () => {
    if (content.quiz && selected === null) {
      setShowQuiz(true);
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      onComplete();
    }
  };

  const handleAnswer = (idx: number) => {
    setSelected(idx);
    timerRef.current = setTimeout(() => onComplete(), 1400);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.inner}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh
          ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.textMuted} />
          : undefined
      }
    >
      {/* Format chip + share */}
      <View style={styles.topRow}>
        <View style={[styles.formatChip, { borderColor: accentColor, backgroundColor: accentColor + '18' }]}>
          <Text style={[styles.formatLabel, { color: accentColor }]}>{formatLabel.toUpperCase()}</Text>
        </View>
        <Pressable onPress={handleShare} hitSlop={12} style={styles.shareBtn}>
          <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <Text style={styles.title}>{content.title}</Text>
      <View style={[styles.divider, { backgroundColor: accentColor }]} />
      <Markdown style={markdownStyles as any}>{content.body}</Markdown>

      {/* Do this today */}
      {content.action ? (
        <View style={[styles.actionCard, { borderLeftColor: accentColor }]}>
          <Text style={[styles.actionLabel, { color: accentColor }]}>DO THIS TODAY</Text>
          <Text style={styles.actionText}>{content.action}</Text>
        </View>
      ) : null}

      {/* Watch */}
      {content.watch ? (
        <Pressable style={styles.mediaCard} onPress={openYouTube}>
          <Ionicons name="logo-youtube" size={22} color="#FF0000" />
          <View style={styles.mediaInfo}>
            <Text style={styles.mediaLabel}>WATCH</Text>
            <Text style={styles.mediaTitle} numberOfLines={2}>{content.watch.title}</Text>
            <Text style={styles.mediaChannel}>{content.watch.channel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>
      ) : null}

      {/* Listen */}
      {content.listen ? (
        <Pressable style={styles.mediaCard} onPress={openPodcast}>
          <Ionicons name="headset" size={22} color="#1DB954" />
          <View style={styles.mediaInfo}>
            <Text style={styles.mediaLabel}>LISTEN</Text>
            <Text style={styles.mediaTitle} numberOfLines={2}>{content.listen.title}</Text>
            <Text style={styles.mediaChannel}>{content.listen.show}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Pressable>
      ) : null}

      {/* Quiz */}
      {showQuiz && content.quiz && !isComplete ? (
        <View style={styles.quizCard}>
          <Text style={[styles.quizLabel, { color: accentColor }]}>QUICK CHECK</Text>
          <Text style={styles.quizQuestion}>{content.quiz.question}</Text>
          {content.quiz.options.map((opt, idx) => {
            const answered = selected !== null;
            const isThis   = selected === idx;
            const correct  = idx === content.quiz!.answer;
            const bg =
              answered && correct   ? '#E8F5E9' :
              answered && isThis    ? '#FDECEA' :
              Colors.surfaceAlt;
            const textColor =
              answered && correct   ? '#2E7D32' :
              answered && isThis    ? '#C62828' :
              Colors.text;
            return (
              <Pressable
                key={idx}
                style={[styles.quizOption, { backgroundColor: bg }]}
                onPress={() => !answered && handleAnswer(idx)}
                disabled={answered}
              >
                <Text style={[styles.quizOptionText, { color: textColor }]}>{opt}</Text>
                {answered && correct && (
                  <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                )}
                {answered && isThis && !correct && (
                  <Ionicons name="close-circle" size={18} color="#C62828" />
                )}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* Complete button */}
      <View style={styles.completeBtnWrap}>
        {isComplete ? (
          <View style={[styles.doneTag, { borderColor: accentColor }]}>
            <Text style={[styles.doneText, { color: accentColor }]}>✓  Done for today</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.completeBtn, { backgroundColor: accentColor }]}
            onPress={handleCompletePress}
          >
            <Text style={styles.completeBtnText}>
              {showQuiz && selected === null ? 'Answer above to finish  ↑' : 'Mark as done  ✓'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  inner:  { padding: 24, paddingTop: 16 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  shareBtn: { padding: 4 },
  formatChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  formatLabel: { ...Typography.label, fontSize: 10 },

  title:   { ...Typography.displaySmall, color: Colors.text, marginBottom: 16 },
  divider: { height: 2, width: 40, borderRadius: 2, marginBottom: 20 },

  actionCard: {
    borderLeftWidth: 3,
    paddingLeft: 14,
    paddingVertical: 12,
    marginTop: 24,
    marginBottom: 4,
  },
  actionLabel: { ...Typography.label, fontSize: 10, marginBottom: 6 },
  actionText:  { ...Typography.body, color: Colors.text, lineHeight: 22 },

  mediaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  mediaInfo:    { flex: 1, gap: 2 },
  mediaLabel:   { ...Typography.label, fontSize: 9, color: Colors.textMuted },
  mediaTitle:   { ...Typography.body, color: Colors.text, fontSize: 14, lineHeight: 19 },
  mediaChannel: { ...Typography.caption, color: Colors.textMuted },

  quizCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  quizLabel:      { ...Typography.label, fontSize: 10 },
  quizQuestion:   { ...Typography.body, color: Colors.text, fontWeight: '600', lineHeight: 22 },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 8,
  },
  quizOptionText: { ...Typography.body, fontSize: 15, flex: 1 },

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
