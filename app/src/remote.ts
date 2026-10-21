import supabase from './supabaseClient';
import type { DayRecord, ProgramState } from './types';
import { calculateDayNumber, isDayComplete } from './logic';

export async function loadRemoteState(userId: string): Promise<ProgramState | null> {
  const { data, error } = await supabase
    .from('challenge_progress')
    .select('state, start_date')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    console.warn('loadRemoteState error', error);
    return null;
  }
  if (!data || !data.state || Object.keys(data.state).length === 0) {
    return null;
  }
  return data.state as ProgramState;
}

export async function saveRemoteState(userId: string, state: ProgramState): Promise<void> {
  const today = new Date();
  const currentDay = calculateDayNumber(state, today);
  const payload = {
    user_id: userId,
    start_date: state.startDate ?? null,
    current_day: currentDay || null,
    state,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('challenge_progress').upsert(payload, { onConflict: 'user_id' });
  if (error) {
    console.warn('saveRemoteState error', error);
  }
}

export async function upsertDailyLog(userId: string, dateKey: string, day: DayRecord, dayNumber: number) {
  const payload = {
    user_id: userId,
    log_date: dateKey,
    day_number: dayNumber || null,
    tasks: day, // store entire record for fidelity
    power_tasks: day.powerTasks,
    gratitude: '', // no dedicated free-text gratitude field in UI
    day_review: day.evening.reviewNotes ?? '',
    completed: isDayComplete(day),
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('daily_logs').upsert(payload, { onConflict: 'user_id,log_date' });
  if (error) console.warn('upsertDailyLog error', error);
}

export async function getUserSettings(userId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase.from('user_settings').select('settings').eq('user_id', userId).maybeSingle();
  if (error || !data) return {};
  return (data.settings as Record<string, unknown>) ?? {};
}

export async function updateUserSettings(userId: string, settings: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) console.warn('updateUserSettings error', error);
}

export async function getDisplayName(userId: string): Promise<string | undefined> {
  const { data, error } = await supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle();
  if (error) return undefined;
  return data?.display_name ?? undefined;
}

export async function setDisplayName(userId: string, displayName: string): Promise<void> {
  const { error } = await supabase.from('profiles').update({ display_name: displayName, updated_at: new Date().toISOString() }).eq('id', userId);
  if (error) console.warn('setDisplayName error', error);
}

