import type { BucketId } from './theme';

export type ContentFormat =
  | 'read'
  | 'puzzle'
  | 'prompt'
  | 'debate'
  | 'book_summary'
  | 'case_study'
  | 'thought_experiment';

export interface Week {
  id: string;
  week_number: number;
  year: number;
  bucket_id: BucketId;
  topic_title: string;
  topic_tagline: string;
  backup_bucket_id: BucketId;
  backup_topic_title: string;
  backup_topic_tagline: string;
  is_backup_active: boolean;
  skip_used: boolean;
  created_at: string;
}

export interface DayContent {
  id: string;
  week_id: string;
  day_number: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  is_backup: boolean;
  format: ContentFormat;
  title: string;
  body: string;
  generated_at: string;
  completed_at: string | null;
}

export interface AppState {
  currentWeek: Week | null;
  todayContent: DayContent | null;
  todayDay: number;
  isUnlocked: boolean;
}
