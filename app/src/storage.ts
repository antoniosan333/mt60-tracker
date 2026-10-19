import type { ProgramState } from './types';
import { emptyState } from './logic';

const STORAGE_KEY = 'mt60-state-v1';

export function loadState(): ProgramState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as ProgramState;
    if (!parsed || typeof parsed !== 'object') return emptyState();
    return parsed;
  } catch {
    return emptyState();
  }
}

export function saveState(state: ProgramState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors in this simple app
  }
}
