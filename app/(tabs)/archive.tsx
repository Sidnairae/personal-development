import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, SafeAreaView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, BucketColors } from '../../constants/theme';
import { BucketBadge } from '../../components/BucketBadge';
import { ContentView } from '../../components/ContentView';
import { loadArchive, loadWeekDays, loadCurrentWeek } from '../../lib/content';
import type { Week, DayContent } from '../../constants/types';
import type { BucketId } from '../../constants/theme';

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FORMAT_SHORT: Record<string, string> = {
  read: 'Read', puzzle: 'Puzzle', prompt: 'Prompt', debate: 'Debate',
  book_summary: 'Book', case_study: 'Case', thought_experiment: 'Thought',
};

function ReadModal({ day, bucketId, onClose }: { day: DayContent | null; bucketId: BucketId | null; onClose: () => void }) {
  return (
    <Modal
      visible={!!day}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }} />
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>
        {day && bucketId && (
          <ContentView
            key={day.id}
            content={day}
            bucketId={bucketId}
            isComplete={true}
            onComplete={() => {}}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function WeekRow({ week, onPress }: { week: Week; onPress: () => void }) {
  const bucketId    = (week.is_backup_active ? week.backup_bucket_id : week.bucket_id) as BucketId;
  const topicTitle  = week.is_backup_active ? week.backup_topic_title : week.topic_title;
  const accentColor = BucketColors[bucketId] ?? Colors.textSecondary;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { borderLeftColor: accentColor }, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={styles.rowMeta}>
        <Text style={styles.rowWeek}>W{week.week_number} · {week.year}</Text>
        {week.skip_used && <Text style={styles.skippedBadge}>skipped</Text>}
      </View>
      <BucketBadge bucketId={bucketId} size="sm" />
      <Text style={styles.rowTitle} numberOfLines={2}>{topicTitle}</Text>
    </Pressable>
  );
}

function DayRow({ day, onPress }: { day: DayContent; onPress: () => void }) {
  const done = !!day.completed_at;
  return (
    <Pressable
      style={({ pressed }) => [styles.dayRow, pressed && { opacity: 0.7 }]}
      onPress={onPress}
    >
      <View style={styles.dayLeft}>
        <Text style={styles.dayName}>{DAY_NAMES[day.day_number]}</Text>
        <Text style={styles.dayFormat}>{FORMAT_SHORT[day.format] ?? day.format}</Text>
      </View>
      <Text style={styles.dayTitle} numberOfLines={2}>{day.title}</Text>
      {done
        ? <Text style={styles.dayCheck}>✓</Text>
        : <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
      }
    </Pressable>
  );
}

export default function ArchiveScreen() {
  const [weeks,          setWeeks]          = useState<Week[]>([]);
  const [currentWeek,    setCurrentWeek]    = useState<Week | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [selectedWeek,   setSelectedWeek]   = useState<Week | null>(null);
  const [weekDays,       setWeekDays]       = useState<DayContent[]>([]);
  const [daysLoading,    setDaysLoading]    = useState(false);
  const [readDay,        setReadDay]        = useState<DayContent | null>(null);

  useEffect(() => {
    Promise.all([loadArchive(), loadCurrentWeek()]).then(([archive, curr]) => {
      setWeeks(archive);
      setCurrentWeek(curr);
      setLoading(false);
    });
  }, []);

  const openWeek = useCallback(async (week: Week) => {
    setSelectedWeek(week);
    setDaysLoading(true);
    const days = await loadWeekDays(week.id, week.is_backup_active);
    setWeekDays(days);
    setDaysLoading(false);
  }, []);


  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.textSecondary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Archive</Text>
        <Text style={styles.headerSub}>{weeks.length} weeks explored</Text>
      </View>

      {weeks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🗄️</Text>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          {currentWeek ? (
            <Text style={styles.emptyBody}>
              You're in Week {currentWeek.week_number} — "{currentWeek.is_backup_active ? currentWeek.backup_topic_title : currentWeek.topic_title}". It'll appear here once the week is over.
            </Text>
          ) : (
            <Text style={styles.emptyBody}>Past weeks will appear here once you've completed them.</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={weeks}
          keyExtractor={w => w.id}
          renderItem={({ item }) => <WeekRow week={item} onPress={() => openWeek(item)} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Week detail modal */}
      <Modal
        visible={!!selectedWeek}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedWeek(null)}
      >
        <SafeAreaView style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalWeekLabel}>
                WEEK {selectedWeek?.week_number} · {selectedWeek?.year}
              </Text>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {selectedWeek?.is_backup_active
                  ? selectedWeek?.backup_topic_title
                  : selectedWeek?.topic_title}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedWeek(null)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Done</Text>
            </Pressable>
          </View>

          {daysLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.textSecondary} />
            </View>
          ) : weekDays.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyBody}>No content saved for this week.</Text>
            </View>
          ) : (
            <FlatList
              data={weekDays}
              keyExtractor={d => d.id}
              renderItem={({ item }) => <DayRow day={item} onPress={() => setReadDay(item)} />}
              contentContainerStyle={styles.dayList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Re-read modal */}
      <ReadModal
        day={readDay}
        bucketId={
          selectedWeek
            ? ((selectedWeek.is_backup_active ? selectedWeek.backup_bucket_id : selectedWeek.bucket_id) as BucketId)
            : null
        }
        onClose={() => setReadDay(null)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  headerTitle: { ...Typography.displaySmall, color: Colors.text },
  headerSub:   { ...Typography.caption, color: Colors.textMuted },

  list: { padding: 20, gap: 14 },

  row: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 3,
    gap: 8,
  },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowWeek: { ...Typography.label, color: Colors.textMuted },
  skippedBadge: {
    ...Typography.caption,
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rowTitle: { ...Typography.body, color: Colors.text, fontWeight: '600', lineHeight: 20 },

  emptyEmoji: { fontSize: 40, marginBottom: 16 },
  emptyTitle: { ...Typography.title, color: Colors.text, textAlign: 'center', marginBottom: 8 },
  emptyBody:  { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },

  modalRoot: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  modalWeekLabel: { ...Typography.label, color: Colors.textMuted, marginBottom: 4 },
  modalTitle:     { ...Typography.title, color: Colors.text, flex: 1 },
  closeBtn:  { paddingHorizontal: 8, paddingVertical: 4 },
  closeText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },

  dayList: { padding: 20, gap: 2 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  dayLeft:   { width: 54, gap: 3 },
  dayName:   { ...Typography.label, color: Colors.textMuted },
  dayFormat: { ...Typography.caption, color: Colors.textMuted },
  dayTitle:  { ...Typography.body, color: Colors.text, flex: 1, lineHeight: 20 },
  dayCheck:  { fontSize: 14, color: Colors.textMuted, fontWeight: '700' },
});
