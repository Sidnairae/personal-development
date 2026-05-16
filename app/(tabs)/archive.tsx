import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Colors, Typography, BucketColors, BUCKETS } from '../../constants/theme';
import { BucketBadge } from '../../components/BucketBadge';
import { loadArchive } from '../../lib/content';
import type { Week } from '../../constants/types';
import type { BucketId } from '../../constants/theme';

function WeekRow({ week }: { week: Week }) {
  const bucketId    = (week.is_backup_active ? week.backup_bucket_id : week.bucket_id) as BucketId;
  const topicTitle  = week.is_backup_active ? week.backup_topic_title : week.topic_title;
  const accentColor = BucketColors[bucketId] ?? Colors.textSecondary;

  return (
    <View style={[styles.row, { borderLeftColor: accentColor }]}>
      <View style={styles.rowMeta}>
        <Text style={styles.rowWeek}>W{week.week_number} · {week.year}</Text>
        {week.skip_used && <Text style={styles.skippedBadge}>skipped</Text>}
      </View>
      <BucketBadge bucketId={bucketId} size="sm" />
      <Text style={styles.rowTitle} numberOfLines={2}>{topicTitle}</Text>
    </View>
  );
}

export default function ArchiveScreen() {
  const [weeks,   setWeeks]   = useState<Week[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArchive().then(w => { setWeeks(w); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.textSecondary} />
      </View>
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
          <Text style={styles.emptyBody}>Past weeks will appear here once you've completed them.</Text>
        </View>
      ) : (
        <FlatList
          data={weeks}
          keyExtractor={w => w.id}
          renderItem={({ item }) => <WeekRow week={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  emptyBody:  { ...Typography.body,  color: Colors.textSecondary, textAlign: 'center' },
});
