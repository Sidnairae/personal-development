# Nova

> *A personal knowledge curator that surprises you every Monday.*

Nova picks a topic you've never thought deeply about, breaks it across seven days, and serves you one piece of content each morning at 6 AM — a deep read, a puzzle, a thought experiment, a debate — whatever format fits the idea best. You don't choose. Nova chooses. The goal is to make you incrementally smarter across 15 domains without it feeling like homework.

---

## What it does

Every **Monday at 6 AM**, Nova reveals a new topic — full-screen, with a colour burst tied to the knowledge domain. You get a punchy title and one sentence that sells it. Then you tap *Let's go* and Day 1 is waiting for you.

Each **day at 6 AM** a new piece unlocks. You finish it, mark it done, and the next day opens. Miss a day? It stays. The content doesn't disappear — it just waits for you. You must finish the previous day before the next one unlocks, so you can't skip ahead.

Don't connect with a topic? You get **one skip per week**. Nova instantly swaps to a pre-generated backup topic in a different domain — no loading, no waiting, it's already there.

Past weeks live in the **Archive** tab, a growing record of everything you've explored.

---

## The 15 domains

| Domain | | Domain | | Domain |
|---|---|---|---|---|
| 🏛️ Philosophy | | 📜 History | | 🔭 Science |
| ∑ Mathematics | | 🧠 Psychology | | 📈 Economics |
| ⚡ Technology | | ✦ Theology | | 💡 Business |
| 🌍 Geopolitics | | 🎨 Art & Culture | | 🗣️ Linguistics |
| 🌿 Health & Body | | ♟️ Logic & Puzzles | | 💫 Big Ideas |

Nova rotates through all 15 and avoids using the same domain twice in a row. Skipped topics re-enter the rotation — nothing is dropped permanently.

---

## Content formats

Nova picks the format that best suits the topic. You never choose — that's the point.

| Format | What you get |
|---|---|
| **Deep Read** | 400–600 words with headings and a closing question |
| **Puzzle** | An original puzzle + solution with explanation |
| **Think On This** | A single reflective prompt with 3 sub-questions |
| **Two Sides** | A steel-manned debate on a genuinely contested idea |
| **Book in Brief** | Executive summary: thesis, 3 ideas, one thing to do |
| **Case Study** | A real-world situation, what happened, why it matters |
| **Thought Experiment** | A vivid setup + 2–3 implications to sit with |

---

## How it works (technical)

```
Sunday 22:00 UTC   setup-week edge function runs
  ↓ picks two domains (least recently used)
  ↓ Claude generates: topic title + tagline for both
  ↓ Claude generates: Day 1 content for main + backup track
  ↓ inserts into Supabase → week ready for Monday

Every night 22:00 UTC   generate-content edge function runs
  ↓ figures out tomorrow's day number
  ↓ Claude generates tomorrow's content (main + backup track)
  ↓ inserts into Supabase → waiting before 6 AM unlock
```

The app is pure Expo React Native — it reads from Supabase, marks days complete, and handles the skip flow. No AI calls happen on the device. All generation is done in Supabase Edge Functions running server-side.

---

## Stack

| Layer | Tech |
|---|---|
| App | Expo ~52, expo-router ~4 |
| Language | TypeScript |
| Backend / DB | Supabase (PostgreSQL) |
| AI | Claude claude-sonnet-4-6 via Anthropic API |
| Scheduling | Supabase Edge Functions + Cron |
| Styling | React Native StyleSheet, warm cream theme |

---

## Setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Open the SQL editor and run `supabase/schema.sql`
3. Copy your **Project URL** and **anon key** from *Settings → API*
4. Add the Anthropic API key as an Edge Function secret:
   ```
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```

### 2. Environment

```bash
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Install and run

```bash
npm install
npx expo start
# Scan the QR code with Expo Go on your iPhone
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy setup-week
supabase functions deploy generate-content
```

### 5. Schedule the cron jobs

In the Supabase Dashboard → **Edge Functions** → **Cron**, add:

| Name | Schedule | Function |
|---|---|---|
| nova-setup-week | `0 22 * * 0` | setup-week |
| nova-generate-content | `0 22 * * *` | generate-content |

### 6. Trigger the first week manually

```bash
supabase functions invoke setup-week
```

---

## Project structure

```
nova/
├── app/
│   ├── _layout.tsx              Root layout (gesture handler, status bar)
│   └── (tabs)/
│       ├── _layout.tsx          Tab bar (Today / Week / Archive)
│       ├── index.tsx            Today screen — content + Monday reveal
│       ├── week.tsx             Week overview + skip button
│       └── archive.tsx          Past weeks list
├── components/
│   ├── RevealCard.tsx           Monday full-screen animated reveal
│   ├── ContentView.tsx          Markdown content + complete button
│   ├── BucketBadge.tsx          Domain badge with colour accent
│   └── DayCard.tsx              Day tile for the week grid
├── constants/
│   ├── theme.ts                 Colors, bucket definitions, typography
│   └── types.ts                 TypeScript interfaces
├── lib/
│   ├── supabase.ts              Supabase client
│   └── content.ts               Data fetching, week logic, unlock rules
└── supabase/
    ├── schema.sql               DB schema (weeks, day_content, topic_rotation)
    └── functions/
        ├── setup-week/          Sunday night: pick topics, generate Day 1
        └── generate-content/    Nightly: generate tomorrow's content
```

---

## Philosophy

Nova doesn't track your streaks. It doesn't send you notifications. It doesn't gamify your learning. It just shows up every Monday with something worth knowing, and trusts you to show up too.

The constraint is the point — one topic, seven days, no skipping ahead. Depth over breadth.

---

*Built for one person. Made to last.*
