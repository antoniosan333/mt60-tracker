import type { AttemptSummary, DayRecord, PowerTask, ProgramState, RuleKey } from './types';

export const RULE_KEYS: RuleKey[] = [
  'workout',
  'diet',
  'power',
  'gratitude',
  'visualization',
  'coldShower',
];

export function dateKeyFromDate(d: Date): string {
  // Local-date YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key: string): Date {
  const [y, m, d] = key.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function differenceInCalendarDays(a: Date, b: Date): number {
  // a - b in local day count
  const aY = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bY = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const ms = aY.getTime() - bY.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function createDefaultDay(dateKey: string): DayRecord {
  return {
    dateKey,
    rules: {
      workout: false,
      diet: false,
      power: false, // derived from powerTasks but stored for simplicity
      gratitude: false,
      visualization: false,
      coldShower: false,
    },
    powerTasks: [{ text: '', done: false }, { text: '', done: false }, { text: '', done: false }],
    plannedTomorrowPowerTasks: ['', '', ''],
    evening: {
      gratitude: false,
      reviewNotes: '',
      writeTomorrowPowerTasks: false,
      screensOff: false,
    },
  };
}

export function isPowerTasksComplete(powerTasks: PowerTask[]): boolean {
  return powerTasks.length === 3 && powerTasks.every((t) => t.done);
}

export function isDayComplete(day: DayRecord): boolean {
  const power = isPowerTasksComplete(day.powerTasks);
  return (
    day.rules.workout &&
    day.rules.diet &&
    power &&
    day.rules.gratitude &&
    day.rules.visualization &&
    day.rules.coldShower
  );
}

export function ensureDay(state: ProgramState, dateKey: string): DayRecord {
  if (!state.days[dateKey]) {
    state.days[dateKey] = createDefaultDay(dateKey);
  }
  return state.days[dateKey];
}

export function seedTodayFromYesterdayIfEmpty(state: ProgramState, todayKey: string): void {
  const today = ensureDay(state, todayKey);
  const textsAreEmpty = today.powerTasks.every((t) => !t.text.trim());
  if (!textsAreEmpty) return;
  const yKey = dateKeyFromDate(new Date(new Date(todayKey).getTime() - 86400000));
  const yesterday = state.days[yKey];
  if (yesterday && yesterday.plannedTomorrowPowerTasks.some((t) => t.trim().length > 0)) {
    today.powerTasks = yesterday.plannedTomorrowPowerTasks.map((text) => ({
      text,
      done: false,
    }));
  }
}

export function calculateDayNumber(state: ProgramState, today: Date): number {
  if (!state.started || !state.startDate) return 0;
  const start = dateFromKey(state.startDate);
  const diff = differenceInCalendarDays(today, start);
  const dayNum = diff + 1;
  if (dayNum < 1) return 0;
  return Math.min(dayNum, 60);
}

export function findFirstMissedPastDay(state: ProgramState, todayKey: string): string | null {
  if (!state.started || !state.startDate) return null;
  const start = dateFromKey(state.startDate);
  const today = dateFromKey(todayKey);
  const daysBetween = differenceInCalendarDays(today, start);
  for (let i = 0; i < daysBetween; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const key = dateKeyFromDate(d);
    const rec = ensureDay(state, key);
    rec.rules.power = isPowerTasksComplete(rec.powerTasks);
    if (!isDayComplete(rec)) {
      return key;
    }
  }
  return null;
}

export function applyResetIfNeeded(
  state: ProgramState,
  todayKey: string
): { state: ProgramState; resetMessage?: string } {
  const missed = findFirstMissedPastDay(state, todayKey);
  if (!missed) return { state };
  // Close the previous attempt
  if (state.startDate) {
    const startDate = state.startDate;
    const duration = Math.max(1, differenceInCalendarDays(dateFromKey(missed), dateFromKey(startDate)));
    const attempt: AttemptSummary = {
      startDate,
      endDate: missed,
      success: false,
      missedDay: missed,
      message: `You missed a task on Day ${duration} (${missed}) - streak reset to Day 1`,
      durationDays: duration,
    };
    state.attempts.unshift(attempt);
  }
  const message = `You missed a task on Day ${
    1 + differenceInCalendarDays(dateFromKey(missed), dateFromKey(state.startDate!))
  } - streak reset to Day 1`;
  // Start a new attempt today
  state.started = true;
  state.startDate = todayKey;
  // Do not delete day records; they serve history, but current attempt is from today
  return { state, resetMessage: message };
}

export function markCompletionTimestampIfDone(day: DayRecord): void {
  if (isDayComplete(day) && !day.completedAt) {
    day.completedAt = new Date().toISOString();
  }
}

export function startNewProgram(todayKey: string): ProgramState {
  const st: ProgramState = {
    version: 1,
    started: true,
    startDate: todayKey,
    days: {},
    attempts: [],
    lastSeenDateKey: todayKey,
  };
  ensureDay(st, todayKey);
  return st;
}

export function emptyState(): ProgramState {
  return {
    version: 1,
    started: false,
    days: {},
    attempts: [],
  };
}
