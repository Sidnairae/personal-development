import { supabase } from './supabase';
import type { Week, DayContent } from '../constants/types';

/**
 * Returns the ISO week number for a given date.
 */
function getISOWeek(d: Date): { week: number; year: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week, year: date.getUTCFullYear() };
}

/**
 * Day number within the current week (Mon=1 … Sun=7).
 */
function getWeekDay(d: Date): number {
  return d.getDay() === 0 ? 7 : d.getDay();
}

/**
 * Returns true if the 6am unlock has passed for the given day.
 */
function isUnlocked(dayNumber: number): boolean {
  const now = new Date();
  const currentDay = getWeekDay(now);
  if (currentDay > dayNumber) return true;
  if (currentDay < dayNumber) return false;
  return now.getHours() >= 6;
}

export async function loadCurrentWeek(): Promise<Week | null> {
  const { week, year } = getISOWeek(new Date());
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('week_number', week)
    .eq('year', year)
    .single();
  if (error || !data) return null;
  return data as Week;
}

export async function loadDayContent(weekId: string, dayNumber: number, isBackup: boolean): Promise<DayContent | null> {
  const { data, error } = await supabase
    .from('day_content')
    .select('*')
    .eq('week_id', weekId)
    .eq('day_number', dayNumber)
    .eq('is_backup', isBackup)
    .single();
  if (error || !data) return null;
  return data as DayContent;
}

export async function loadWeekDays(weekId: string, isBackup: boolean): Promise<DayContent[]> {
  const { data, error } = await supabase
    .from('day_content')
    .select('*')
    .eq('week_id', weekId)
    .eq('is_backup', isBackup)
    .order('day_number');
  if (error || !data) return [];
  return data as DayContent[];
}

export async function markComplete(contentId: string): Promise<void> {
  await supabase
    .from('day_content')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', contentId);
}

export async function triggerSkip(weekId: string): Promise<boolean> {
  const { data: week, error } = await supabase
    .from('weeks')
    .select('skip_used')
    .eq('id', weekId)
    .single();
  if (error || !week || week.skip_used) return false;

  await supabase
    .from('weeks')
    .update({ skip_used: true, is_backup_active: true })
    .eq('id', weekId);
  return true;
}

export async function loadArchive(): Promise<Week[]> {
  const { week, year } = getISOWeek(new Date());
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .or(`year.lt.${year},and(year.eq.${year},week_number.lt.${week})`)
    .order('year', { ascending: false })
    .order('week_number', { ascending: false })
    .limit(52);
  if (error || !data) return [];
  return data as Week[];
}

export { getWeekDay, isUnlocked, getISOWeek };
