import { useEffect, useMemo, useState } from 'react';
import type { AttemptSummary, DayRecord, ProgramState, RuleKey } from './types';
import {
  applyResetIfNeeded,
  calculateDayNumber,
  dateFromKey,
  dateKeyFromDate,
  ensureDay,
  isDayComplete,
  markCompletionTimestampIfDone,
  seedTodayFromYesterdayIfEmpty,
  startNewProgram,
} from './logic';
import { loadState, saveState } from './storage';
import './index.css';

type Tab = 'today' | 'evening' | 'history' | 'settings';

function useProgramState(): [ProgramState, (updater: (s: ProgramState) => void) => void] {
  const [state, setState] = useState<ProgramState>(() => loadState());
  const update = (updater: (s: ProgramState) => void) => {
    setState((prev) => {
      const clone: ProgramState = JSON.parse(JSON.stringify(prev));
      updater(clone);
      saveState(clone);
      return clone;
    });
  };
  return [state, update];
}

function Header({ dayNumber }: { dayNumber: number }) {
  const pct = Math.min(100, Math.max(0, Math.round((dayNumber / 60) * 100)));
  return (
    <header className="app-header">
      <h1>Day {dayNumber || 0} of 60</h1>
      <div className="progress">
        <div className="bar" style={{ width: `${pct}%` }} aria-valuenow={pct} />
      </div>
    </header>
  );
}

function BigToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className={`big-toggle ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="box">{checked ? '✓' : ''}</span>
      <span className="label">{label}</span>
    </button>
  );
}

function PowerTasks({
  day,
  onChange,
}: {
  day: DayRecord;
  onChange: (next: DayRecord) => void;
}) {
  const updateTask = (index: number, prop: 'text' | 'done', value: string | boolean) => {
    const next: DayRecord = { ...day, powerTasks: day.powerTasks.map((t) => ({ ...t })) };
    if (prop === 'text') {
      next.powerTasks[index].text = String(value);
    } else {
      next.powerTasks[index].done = Boolean(value);
    }
    next.rules.power = next.powerTasks.every((t) => t.done);
    onChange(next);
  };

  return (
    <div className="card">
      <h3>Power Tasks (3)</h3>
      <p className="help">
        Plan the night before. They must advance goals — not chores or current habits.
      </p>
      <div className="power-list">
        {day.powerTasks.map((t, i) => (
          <div className="power-row" key={i}>
            <input
              type="text"
              placeholder={`Task ${i + 1}`}
              value={t.text}
              onChange={(e) => updateTask(i, 'text', e.target.value)}
              inputMode="text"
              autoComplete="off"
            />
            <label className="check">
              <input
                type="checkbox"
                checked={t.done}
                onChange={(e) => updateTask(i, 'done', e.target.checked)}
              />
              <span>Done</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodayTab({
  today,
  updateDay,
}: {
  today: DayRecord;
  updateDay: (d: DayRecord) => void;
}) {
  const toggles: { key: RuleKey; label: string }[] = [
    { key: 'workout', label: 'One 45-minute workout' },
    { key: 'diet', label: 'Strict diet: no alcohol, no cheat meals' },
    { key: 'gratitude', label: 'Gratitude routine' },
    { key: 'visualization', label: 'Ten minutes of visualization' },
    { key: 'coldShower', label: 'Five-minute cold shower (coldest setting)' },
  ];
  return (
    <div className="screen">
      <PowerTasks day={today} onChange={updateDay} />
      <div className="card">
        <h3>Daily Rules (6)</h3>
        <div className="toggles">
          {toggles.map((t) => (
            <BigToggle
              key={t.key}
              label={t.label}
              checked={today.rules[t.key]}
              onChange={(v) => updateDay({ ...today, rules: { ...today.rules, [t.key]: v } })}
            />
          ))}
        </div>
      </div>
      <div className="note info">
        Rule "Power Tasks" counts when all three are checked above.
      </div>
    </div>
  );
}

function EveningTab({
  day,
  updateDay,
  onCopyToTomorrow,
}: {
  day: DayRecord;
  updateDay: (d: DayRecord) => void;
  onCopyToTomorrow: () => void;
}) {
  const setPlanned = (index: number, value: string) => {
    const planned = day.plannedTomorrowPowerTasks.slice();
    planned[index] = value;
    const allFilled = planned.every((t) => t.trim().length > 0);
    updateDay({
      ...day,
      plannedTomorrowPowerTasks: planned,
      evening: { ...day.evening, writeTomorrowPowerTasks: allFilled },
    });
  };
  return (
    <div className="screen">
      <div className="card">
        <h3>Evening Checklist</h3>
        <div className="toggles">
          <BigToggle
            label="Gratitude"
            checked={day.evening.gratitude}
            onChange={(v) => updateDay({ ...day, evening: { ...day.evening, gratitude: v } })}
          />
          <div className="field">
            <label>Balance / review of the day</label>
            <textarea
              placeholder="Short notes..."
              value={day.evening.reviewNotes}
              onChange={(e) => updateDay({ ...day, evening: { ...day.evening, reviewNotes: e.target.value } })}
              rows={3}
            />
          </div>
          <div className="field">
            <label>Write tomorrow’s 3 Power Tasks</label>
            <div className="power-list">
              {day.plannedTomorrowPowerTasks.map((t, i) => (
                <div className="power-row" key={i}>
                  <input
                    type="text"
                    placeholder={`Task ${i + 1} for tomorrow`}
                    value={t}
                    onChange={(e) => setPlanned(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div className="row">
              <BigToggle
                label="Screens off, lights down for sleep"
                checked={day.evening.screensOff}
                onChange={(v) => updateDay({ ...day, evening: { ...day.evening, screensOff: v } })}
              />
              <button className="secondary" onClick={onCopyToTomorrow}>Copy to tomorrow</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryTab({
  state,
  currentStartKey,
  todayKey,
}: {
  state: ProgramState;
  currentStartKey?: string;
  todayKey: string;
}) {
  const rows: { dateKey: string; status: 'done' | 'missed' | 'today' | 'pending' }[] = [];
  if (currentStartKey) {
    const startDate = dateFromKey(currentStartKey);
    const today = dateFromKey(todayKey);
    const daysBetween = Math.max(0, Math.round((+today - +startDate) / 86400000));
    for (let i = 0; i <= daysBetween; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const key = dateKeyFromDate(d);
      const rec = state.days[key];
      const status =
        key === todayKey ? 'today' : rec ? (isDayComplete(rec) ? 'done' : 'missed') : 'pending';
      rows.push({ dateKey: key, status });
    }
  }
  return (
    <div className="screen">
      <div className="card">
        <h3>History (current attempt)</h3>
        <ul className="history-list">
          {rows.map((r) => (
            <li key={r.dateKey} className={r.status}>
              <span className="date">{r.dateKey}</span>
              <span className="status">{r.status}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h3>Attempts</h3>
        {state.attempts.length === 0 ? (
          <p>No past attempts yet.</p>
        ) : (
          <ul className="attempts">
            {state.attempts.map((a, i) => (
              <li key={i}>
                <div>
                  <strong>{a.success ? 'Completed' : 'Reset'}</strong> — {a.durationDays} days
                </div>
                <div>
                  {a.startDate} → {a.endDate ?? '-'}
                </div>
                {a.message && <div className="muted">{a.message}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SettingsTab({
  onReset,
}: {
  onReset: () => void;
}) {
  return (
    <div className="screen">
      <div className="card">
        <h3>Settings</h3>
        <button className="danger" onClick={onReset}>Reset program</button>
        <p className="muted">This clears the current streak and starts Day 1 today. Past attempts history is kept.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [state, update] = useProgramState();
  const [tab, setTab] = useState<Tab>('today');
  const [resetMessage, setResetMessage] = useState<string | undefined>();
  const todayKey = useMemo(() => dateKeyFromDate(new Date()), []);

  // Initialize or check resets and seeding
  useEffect(() => {
    update((s) => {
      // Detect day rollover
      const nowKey = todayKey;
      if (s.lastSeenDateKey !== nowKey) {
        s.lastSeenDateKey = nowKey;
      }
      if (!s.started) return;
      seedTodayFromYesterdayIfEmpty(s, nowKey);
      const { resetMessage } = applyResetIfNeeded(s, nowKey);
      if (resetMessage) {
        setResetMessage(resetMessage);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayNumber = calculateDayNumber(state, new Date());
  const today = ensureDay(state, todayKey);

  const handleStart = () => {
    update((s) => {
      const started = startNewProgram(todayKey);
      Object.assign(s, started);
    });
  };

  const updateToday = (next: DayRecord) => {
    update((s) => {
      s.days[todayKey] = next;
      next.rules.power = next.powerTasks.every((t) => t.done);
      markCompletionTimestampIfDone(next);
      // Celebration on Day 60
      const num = calculateDayNumber(s, new Date());
      if (num === 60 && isDayComplete(next) && s.celebrationShownFor !== todayKey) {
        s.celebrationShownFor = todayKey;
        alert('🎉 60-day program complete! Congratulations!');
      }
    });
  };

  const copyEveningToTomorrow = () => {
    update((s) => {
      const tomorrow = dateKeyFromDate(new Date(new Date(todayKey).getTime() + 86400000));
      const t = ensureDay(s, tomorrow);
      t.powerTasks = today.plannedTomorrowPowerTasks.map((text) => ({ text, done: false }));
    });
    alert("Tomorrow's Power Tasks populated.");
  };

  const manualReset = () => {
    if (!state.started) return;
    const ok = confirm('Reset program and start Day 1 today?');
    if (!ok) return;
    update((s) => {
      if (s.startDate) {
        const duration = Math.max(1, Math.round((+new Date() - +dateFromKey(s.startDate)) / 86400000) + 1);
        const attempt: AttemptSummary = {
          startDate: s.startDate,
          endDate: todayKey,
          success: false,
          durationDays: duration,
          message: 'Manual reset',
        };
        s.attempts.unshift(attempt);
      }
      s.started = true;
      s.startDate = todayKey;
    });
    setResetMessage('Program manually reset to Day 1 today.');
    setTab('today');
  };

  if (!state.started) {
    return (
      <div className="start-screen">
        <h1>60-Day Mental Toughness</h1>
        <p>Tap Start to begin Day 1. Progress advances by calendar date.</p>
        <button className="primary big" onClick={handleStart}>Start Day 1</button>
        <p className="muted small">No accounts. Your progress stays on this device (localStorage).</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Header dayNumber={dayNumber} />
      <nav className="tabs">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
          Today
        </button>
        <button className={tab === 'evening' ? 'active' : ''} onClick={() => setTab('evening')}>
          Evening
        </button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
          History
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          Settings
        </button>
      </nav>

      {tab === 'today' && <TodayTab today={today} updateDay={updateToday} />}
      {tab === 'evening' && (
        <EveningTab day={today} updateDay={updateToday} onCopyToTomorrow={copyEveningToTomorrow} />
      )}
      {tab === 'history' && (
        <HistoryTab state={state} currentStartKey={state.startDate} todayKey={todayKey} />
      )}
      {tab === 'settings' && <SettingsTab onReset={manualReset} />}

      {resetMessage && (
        <div className="toast" role="alert" onClick={() => setResetMessage(undefined)}>
          {resetMessage}
        </div>
      )}
    </div>
  );
}
