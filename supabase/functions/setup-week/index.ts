/**
 * setup-week — runs every Sunday at 22:00 UTC via Supabase cron.
 *
 * 1. Picks two buckets (main + backup) from those least recently used.
 * 2. Asks Claude to come up with a compelling topic + tagline for each.
 * 3. Generates Day 1 content for both the main and backup tracks.
 * 4. Inserts a new row into `weeks` and the two Day 1 rows into `day_content`.
 * 5. Updates `topic_rotation` timestamps for both buckets.
 *
 * Schedule (add in Supabase Dashboard → Edge Functions → Cron):
 *   0 22 * * 0   (Sunday 22:00 UTC)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ALL_BUCKETS = [
  'philosophy','history','science','mathematics','psychology',
  'economics','technology','theology','business','geopolitics',
  'art_culture','linguistics','health','logic_puzzles','ideas',
];

const FORMATS = [
  'read','puzzle','prompt','debate',
  'book_summary','case_study','thought_experiment',
];

function getISOWeek(d: Date): { week: number; year: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: date.getUTCFullYear() };
}

function parseClaudeJSON(raw: string): any {
  const cleaned = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '');
  try { return JSON.parse(cleaned); } catch {}
  const first = cleaned.indexOf('{');
  const last  = cleaned.lastIndexOf('}');
  if (first !== -1 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
  }
  throw new Error(`JSON parse failed. Claude returned: ${raw.slice(0, 300)}`);
}

async function claude(prompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-6',
      max_tokens: 2048,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content[0].text as string;
}

async function pickBuckets(): Promise<{ main: string; backup: string }> {
  const { data } = await supabase
    .from('topic_rotation')
    .select('bucket_id, last_used_at')
    .order('last_used_at', { ascending: true, nullsFirst: true });

  const sorted = (data ?? []).map((r: any) => r.bucket_id as string);
  const main   = sorted[0];
  const backup = sorted[1];
  return { main, backup };
}

async function generateTopic(bucketId: string): Promise<{ title: string; tagline: string }> {
  const raw = await claude(
    `You are Nova, a personal knowledge curator. Pick ONE specific, genuinely interesting topic from the "${bucketId}" domain.

Avoid: generic overviews, anything that sounds like a textbook chapter title.
Aim for: a topic that would make someone lean forward and say "I never thought about that."

Respond in this exact JSON format (no markdown fences):
{"title": "Topic title (max 8 words)", "tagline": "One punchy sentence that sells this topic (max 18 words)"}`
  );
  return parseClaudeJSON(raw);
}

async function generateDay1(bucketId: string, topicTitle: string): Promise<{ format: string; title: string; body: string; action: string; quiz: object; watch: object; listen: object }> {
  const format = FORMATS[Math.floor(Math.random() * FORMATS.length)];

  const formatInstructions: Record<string, string> = {
    read: `Write a 400–600 word deep read on the topic. Use clear headings (##), concrete examples, and end with a thought-provoking closing question.`,
    puzzle: `Create an original puzzle or brainteaser related to the topic. State the puzzle clearly, then after a separator (---), give the answer and explain why it works.`,
    prompt: `Write a single reflective prompt (2–3 sentences) that invites deep personal thinking. Then provide 3 sub-questions to explore it further.`,
    debate: `Present two genuinely compelling sides of a debate related to this topic. Give each side 150–200 words. Be steel-man — make both sides shine.`,
    book_summary: `Write a 350–500 word executive summary of an important book in this domain. Include: the core thesis, 3 key ideas, and one idea to act on.`,
    case_study: `Describe a fascinating real-world case study in this domain in 400–500 words. Cover: the situation, what happened, why it matters.`,
    thought_experiment: `Describe a thought experiment related to this topic. Set it up vividly (150 words), then explore 2–3 implications (200 words total).`,
  };

  const raw = await claude(
    `You are Nova, a personal knowledge curator. The week's topic is "${topicTitle}" in the "${bucketId}" domain.

Today is Day 1 (Monday). ${formatInstructions[format]}

Also provide:
- action: One specific, concrete thing to do or observe today that connects this idea to real life. Imperative mood, 1–2 sentences. Make it something a curious 24-year-old could actually do today.
- quiz: One question testing genuine understanding of the content (not a trick). 4 options, exactly one correct. answer is the 0-based index of the correct option.
- watch: A real YouTube video or channel that covers this topic well. Use an actual channel name (e.g. Kurzgesagt, Veritasium, 3Blue1Brown, TED, Einzelgänger). The query field should be specific enough to find it in YouTube search.
- listen: A real podcast episode or show on this topic. Use real show names (e.g. Lex Fridman Podcast, Huberman Lab, Philosophize This!, Hardcore History, Hidden Brain). The query field should work as a Spotify search.

Respond in this exact JSON format (no markdown fences):
{
  "title": "Content title (max 10 words)",
  "body": "Full markdown content here",
  "action": "One concrete thing to do today",
  "quiz": {
    "question": "Question about the content?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": 0
  },
  "watch": {
    "title": "Video title or description",
    "channel": "YouTube channel name",
    "query": "specific youtube search query"
  },
  "listen": {
    "title": "Episode or show description",
    "show": "Podcast name",
    "query": "spotify search query"
  }
}`
  );

  const parsed = parseClaudeJSON(raw);
  return { format, ...parsed };
}

Deno.serve(async () => {
  try {
    // Calculate next week (this runs Sunday, content is for the coming week)
    const nextMonday = new Date();
    nextMonday.setUTCDate(nextMonday.getUTCDate() + 1);
    const { week, year } = getISOWeek(nextMonday);

    // Check if week already set up
    const { data: existing } = await supabase
      .from('weeks')
      .select('id')
      .eq('week_number', week)
      .eq('year', year)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ ok: true, note: 'Week already set up' }), { status: 200 });
    }

    // Pick buckets
    const { main, backup } = await pickBuckets();

    // Generate topics
    const [mainTopic, backupTopic] = await Promise.all([
      generateTopic(main),
      generateTopic(backup),
    ]);

    // Generate Day 1 for both tracks
    const [mainDay1, backupDay1] = await Promise.all([
      generateDay1(main,   mainTopic.title),
      generateDay1(backup, backupTopic.title),
    ]);

    // Insert week
    const { data: weekRow, error: weekErr } = await supabase
      .from('weeks')
      .insert({
        week_number:          week,
        year,
        bucket_id:            main,
        topic_title:          mainTopic.title,
        topic_tagline:        mainTopic.tagline,
        backup_bucket_id:     backup,
        backup_topic_title:   backupTopic.title,
        backup_topic_tagline: backupTopic.tagline,
      })
      .select()
      .single();

    if (weekErr) throw weekErr;

    // Insert Day 1 for main + backup
    await supabase.from('day_content').insert([
      { week_id: weekRow.id, day_number: 1, is_backup: false, ...mainDay1 },
      { week_id: weekRow.id, day_number: 1, is_backup: true,  ...backupDay1 },
    ]);

    // Update rotation timestamps
    const now = new Date().toISOString();
    await supabase.from('topic_rotation').upsert([
      { bucket_id: main,   last_used_at: now },
      { bucket_id: backup, last_used_at: now },
    ]);

    return new Response(
      JSON.stringify({ ok: true, week, year, main: mainTopic.title, backup: backupTopic.title }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
