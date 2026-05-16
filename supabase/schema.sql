-- Nova — Supabase schema
-- Run this in the Supabase SQL editor once.

-- ─── weeks ────────────────────────────────────────────────────────────────────
create table if not exists weeks (
  id                   uuid primary key default gen_random_uuid(),
  week_number          int  not null,
  year                 int  not null,
  -- Main topic
  bucket_id            text not null,
  topic_title          text not null,
  topic_tagline        text not null,
  -- Backup topic (pre-generated so skip is instant)
  backup_bucket_id     text not null,
  backup_topic_title   text not null,
  backup_topic_tagline text not null,
  -- State
  is_backup_active     bool not null default false,
  skip_used            bool not null default false,
  created_at           timestamptz not null default now(),
  unique (week_number, year)
);

-- ─── day_content ──────────────────────────────────────────────────────────────
create table if not exists day_content (
  id           uuid primary key default gen_random_uuid(),
  week_id      uuid not null references weeks(id) on delete cascade,
  day_number   int  not null check (day_number between 1 and 7),
  is_backup    bool not null default false,
  format       text not null,   -- read | puzzle | prompt | debate | book_summary | case_study | thought_experiment
  title        text not null,
  body         text not null,
  generated_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (week_id, day_number, is_backup)
);

-- ─── topic_rotation ────────────────────────────────────────────────────────────
-- Tracks which bucket was last used so the AI avoids recent repeats.
create table if not exists topic_rotation (
  bucket_id    text primary key,
  last_used_at timestamptz
);

-- Seed all 15 buckets with null last_used_at (never used yet)
insert into topic_rotation (bucket_id)
values
  ('philosophy'), ('history'),   ('science'),    ('mathematics'), ('psychology'),
  ('economics'),  ('technology'), ('theology'),   ('business'),    ('geopolitics'),
  ('art_culture'),('linguistics'),('health'),     ('logic_puzzles'),('ideas')
on conflict do nothing;

-- ─── RLS off (single-user personal app) ─────────────────────────────────────
alter table weeks         disable row level security;
alter table day_content   disable row level security;
alter table topic_rotation disable row level security;
