import { describe, expect, it } from 'vitest';
import { calculateDayNumber, ensureDay, findFirstMissedPastDay, startNewProgram } from './logic';
import type { ProgramState } from './types';

// helpers
// function advanceDays(key: string, n: number): string {
//   const d = dateFromKey(key);
//   const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
//   return dateKeyFromDate(x);
// }

describe('date/day math', () => {
  it('calculates day number from start date', () => {
    const today = new Date(2024, 0, 5); // Jan 5
    const state = startNewProgram('2024-01-03'); // Day 1: Jan 3
    expect(calculateDayNumber(state, today)).toBe(3); // 3rd day
  });
});

describe('reset logic', () => {
  it('detects missed past day and returns its key', () => {
    const s: ProgramState = startNewProgram('2024-01-01');
    // Jan 1 complete, Jan 2 incomplete, today Jan 3
    const d1 = ensureDay(s, '2024-01-01');
    d1.rules.workout = d1.rules.diet = d1.rules.gratitude = d1.rules.visualization = d1.rules.coldShower = true;
    d1.powerTasks = [{ text: 'A', done: true }, { text: 'B', done: true }, { text: 'C', done: true }];
    d1.rules.power = true;

    const missed = findFirstMissedPastDay(s, '2024-01-03');
    expect(missed).toBe('2024-01-02');
  });

  it('no reset when all past days complete', () => {
    const s: ProgramState = startNewProgram('2024-01-01');
    const d1 = ensureDay(s, '2024-01-01');
    d1.rules.workout = d1.rules.diet = d1.rules.gratitude = d1.rules.visualization = d1.rules.coldShower = true;
    d1.powerTasks = [{ text: 'A', done: true }, { text: 'B', done: true }, { text: 'C', done: true }];
    d1.rules.power = true;
    const d2 = ensureDay(s, '2024-01-02');
    d2.rules.workout = d2.rules.diet = d2.rules.gratitude = d2.rules.visualization = d2.rules.coldShower = true;
    d2.powerTasks = [{ text: 'A', done: true }, { text: 'B', done: true }, { text: 'C', done: true }];
    d2.rules.power = true;

    const missed = findFirstMissedPastDay(s, '2024-01-03');
    expect(missed).toBeNull();
  });
});
