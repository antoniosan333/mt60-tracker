export type RuleKey =
  | 'workout'
  | 'diet'
  | 'power'
  | 'gratitude'
  | 'visualization'
  | 'coldShower';

export interface PowerTask {
  text: string;
  done: boolean;
}

export interface DayRecord {
  dateKey: string; // 'YYYY-MM-DD' in local time
  rules: Record<RuleKey, boolean>;
  powerTasks: PowerTask[]; // length 3
  plannedTomorrowPowerTasks: string[]; // length 3, used to seed next day
  evening: {
    gratitude: boolean;
    reviewNotes: string;
    writeTomorrowPowerTasks: boolean;
    screensOff: boolean;
  };
  completedAt?: string; // ISO timestamp when all 6 rules done
}

export interface AttemptSummary {
  startDate: string; // dateKey
  endDate?: string; // dateKey
  success: boolean;
  missedDay?: string; // dateKey when failure
  message?: string;
  durationDays: number;
}

export interface ProgramState {
  version: 1;
  started: boolean;
  startDate?: string; // dateKey of current attempt
  days: Record<string, DayRecord>; // key = dateKey
  attempts: AttemptSummary[];
  celebrationShownFor?: string; // dateKey where celebration was shown
  lastSeenDateKey?: string; // to detect day rollover
}
