/**
 * generate-content — runs every night at 22:00 UTC via Supabase cron.
 *
 * For the current week:
 *   - Figures out what tomorrow's day number is.
 *   - Generates content for that day on both main + backup tracks (if not
 *     already generated).
 *   - Inserts the content rows into `day_content`.
 *
 * This means by 6 AM each morning the content is already sitting in the DB —
 * no on-demand generation, no waiting.
 *
 * Schedule:
 *   0 22 * * *   (every day at 22:00 UTC)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

async function generateContent(
  bucketId: string,
  topicTitle: string,
  dayNumber: number,
  previousTitles: string[],
): Promise<{ format: string; title: string; body: string; action: string; quiz: object; watch: object; listen: object }> {
  const format = FORMATS[Math.floor(Math.random() * FORMATS.length)];

  const formatInstructions: Record<string, string> = {
    read: `Write a 400–600 word deep read. Use clear headings (##), concrete examples, end with a thought-provoking question.`,
    puzzle: `Create an original puzzle related to the topic. State the puzzle clearly, then after a separator (---), give the answer with explanation.`,
    prompt: `Write a single reflective prompt (2–3 sentences) that invites deep personal thinking. Provide 3 sub-questions to explore further.`,
    debate: `Present two genuinely compelling sides of a debate on this topic. Give each side 150–200 words. Steel-man both.`,
    book_summary: `Write a 350–500 word executive summary of an important book in this domain. Core thesis, 3 key ideas, one idea to act on.`,
    case_study: `Describe a fascinating real-world case study in 400–500 words. Situation, what happened, why it matters.`,
    thought_experiment: `Set up a thought experiment vividly (150 words), then explore 2–3 implications (200 words).`,
  };

  const prevContext = previousTitles.length > 0
    ? `\nPrevious days this week covered: ${previousTitles.map(t => `"${t}"`).join(', ')}. Do NOT repeat or closely overlap those angles.`
    : '';

  const raw = await claude(
    `You are Nova, a personal knowledge curator. The week's topic is "${topicTitle}" in the "${bucketId}" domain. This is Day ${dayNumber} of 7.${prevContext}

${formatInstructions[format]}

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

  const cleaned = raw.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
  const parsed = JSON.parse(cleaned);
  return { format, ...parsed };
}

Deno.serve(async () => {
  try {
    // Tomorrow's date
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const { week, year } = getISOWeek(tomorrow);

    // Tomorrow's day-of-week (Mon=1 … Sun=7)
    const tomorrowDay = tomorrow.getUTCDay() === 0 ? 7 : tomorrow.getUTCDay();

    // Load current week
    const { data: weekRow, error: weekErr } = await supabase
      .from('weeks')
      .select('*')
      .eq('week_number', week)
      .eq('year', year)
      .maybeSingle();

    if (weekErr || !weekRow) {
      return new Response(
        JSON.stringify({ ok: false, note: 'No week found — setup-week may not have run yet' }),
        { status: 200 }
      );
    }

    // Load existing day content to avoid duplicates + build previous-titles list
    const { data: existingRows } = await supabase
      .from('day_content')
      .select('day_number, is_backup, title')
      .eq('week_id', weekRow.id);

    const existing = new Set(
      (existingRows ?? []).map((r: any) => `${r.day_number}-${r.is_backup}`)
    );

    const mainPrevTitles   = (existingRows ?? [])
      .filter((r: any) => !r.is_backup && r.day_number < tomorrowDay)
      .map((r: any) => r.title as string);
    const backupPrevTitles = (existingRows ?? [])
      .filter((r: any) => r.is_backup && r.day_number < tomorrowDay)
      .map((r: any) => r.title as string);

    const toInsert: any[] = [];

    // Generate main + backup in parallel
    const [mainContent, backupContent] = await Promise.all([
      existing.has(`${tomorrowDay}-false`)
        ? Promise.resolve(null)
        : generateContent(weekRow.bucket_id, weekRow.topic_title, tomorrowDay, mainPrevTitles),
      existing.has(`${tomorrowDay}-true`)
        ? Promise.resolve(null)
        : generateContent(weekRow.backup_bucket_id, weekRow.backup_topic_title, tomorrowDay, backupPrevTitles),
    ]);

    if (mainContent)   toInsert.push({ week_id: weekRow.id, day_number: tomorrowDay, is_backup: false, ...mainContent });
    if (backupContent) toInsert.push({ week_id: weekRow.id, day_number: tomorrowDay, is_backup: true,  ...backupContent });

    if (toInsert.length > 0) {
      await supabase.from('day_content').insert(toInsert);
    }

    return new Response(
      JSON.stringify({ ok: true, week, year, day: tomorrowDay, generated: toInsert.length }),
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
