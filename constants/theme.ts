export const Colors = {
  background: '#FAF7F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EFE8',
  border: '#E8E2D9',
  text: '#1A1714',
  textSecondary: '#6B6560',
  textMuted: '#A09890',
  shadow: '#C4B8A8',
} as const;

export const BucketColors: Record<string, string> = {
  philosophy:    '#7C6D9E',
  history:       '#B85C38',
  science:       '#2E7D6B',
  mathematics:   '#3D6B99',
  psychology:    '#C17D3E',
  economics:     '#4A7A52',
  technology:    '#2C5F8A',
  theology:      '#8B5E83',
  business:      '#6B7C3E',
  geopolitics:   '#7A4A4A',
  art_culture:   '#B07A5A',
  linguistics:   '#5A7A8A',
  health:        '#4A8A6B',
  logic_puzzles: '#6A5A9E',
  ideas:         '#9E6A4A',
};

export const BUCKETS = [
  { id: 'philosophy',    label: 'Philosophy',      emoji: '🏛️' },
  { id: 'history',       label: 'History',         emoji: '📜' },
  { id: 'science',       label: 'Science',         emoji: '🔭' },
  { id: 'mathematics',   label: 'Mathematics',     emoji: '∑' },
  { id: 'psychology',    label: 'Psychology',      emoji: '🧠' },
  { id: 'economics',     label: 'Economics',       emoji: '📈' },
  { id: 'technology',    label: 'Technology',      emoji: '⚡' },
  { id: 'theology',      label: 'Theology',        emoji: '✦' },
  { id: 'business',      label: 'Business',        emoji: '💡' },
  { id: 'geopolitics',   label: 'Geopolitics',     emoji: '🌍' },
  { id: 'art_culture',   label: 'Art & Culture',   emoji: '🎨' },
  { id: 'linguistics',   label: 'Linguistics',     emoji: '🗣️' },
  { id: 'health',        label: 'Health & Body',   emoji: '🌿' },
  { id: 'logic_puzzles', label: 'Logic & Puzzles', emoji: '♟️' },
  { id: 'ideas',         label: 'Big Ideas',       emoji: '💫' },
] as const;

export type BucketId = typeof BUCKETS[number]['id'];

export const FORMAT_LABELS: Record<string, string> = {
  read:                'Deep Read',
  puzzle:              'Puzzle',
  prompt:              'Think On This',
  debate:              'Two Sides',
  book_summary:        'Book in Brief',
  case_study:          'Case Study',
  thought_experiment:  'Thought Experiment',
};

export const Typography = {
  displayLarge: { fontSize: 32, fontWeight: '700' as const, lineHeight: 38 },
  displaySmall: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  title:        { fontSize: 20, fontWeight: '600' as const, lineHeight: 26 },
  body:         { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption:      { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  label:        { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.8 },
};
