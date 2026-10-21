import type { ProgramState } from './types';
import { emptyState } from './logic';
import { loadRemoteState, saveRemoteState } from './remote';

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

// Remote helpers (no-throw)
export async function tryLoadRemoteState(userId: string): Promise<ProgramState | null> {
  try {
    return await loadRemoteState(userId);
  } catch {
    return null;
  }
}

export async function trySaveRemoteState(userId: string, state: ProgramState): Promise<void> {
  try {
    await saveRemoteState(userId, state);
  } catch {
    // ignore
  }
}

export async function migrateLocalToRemoteIfNeeded(userId: string): Promise<ProgramState> {
  const local = loadState();
  if (local && (local.started || Object.keys(local.days).length > 0 || local.attempts.length > 0)) {
    await trySaveRemoteState(userId, local);
    return local;
  }
  return emptyState();
}
