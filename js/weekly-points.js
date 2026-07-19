const STORAGE_KEY = 'verb-buster-weekly-points-v1';

export function weekKey(date = new Date()) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function freshWeek(key) {
  return { version: 1, weekKey: key, points: 0, questions: {}, battlesCompleted: 0, history: [] };
}

export function loadWeeklyPoints(storage = globalThis.localStorage, now = new Date()) {
  const currentKey = weekKey(now);
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return freshWeek(currentKey);
    const saved = JSON.parse(raw);
    if (saved?.version !== 1) return freshWeek(currentKey);
    if (saved.weekKey === currentKey) return saved;
    const history = [...(saved.history || []), {
      weekKey: saved.weekKey,
      points: saved.points,
      battlesCompleted: saved.battlesCompleted || 0,
      questionsPracticed: Object.keys(saved.questions || {}).length
    }].slice(-12);
    const next = { ...freshWeek(currentKey), history };
    saveWeeklyPoints(next, storage);
    return next;
  } catch { return freshWeek(currentKey); }
}

export function saveWeeklyPoints(weekly, storage = globalThis.localStorage) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(weekly)); return true; }
  catch { return false; }
}

export function awardQuestion(weekly, questionId, correct, storage = globalThis.localStorage) {
  const updated = structuredClone(weekly);
  const record = updated.questions[questionId] || {
    firstResult: correct ? 'correct' : 'incorrect',
    correctEarned: false,
    reinforcementEarned: false,
    pointsEarned: 0
  };
  let awarded = 0;
  if (correct && !record.correctEarned) {
    awarded = 10;
    record.correctEarned = true;
  } else if (correct && !record.reinforcementEarned) {
    awarded = 3;
    record.reinforcementEarned = true;
  }
  record.pointsEarned += awarded;
  updated.points += awarded;
  updated.questions[questionId] = record;
  saveWeeklyPoints(updated, storage);
  return { weekly: updated, awarded };
}

export function recordWeeklyBattle(weekly, storage = globalThis.localStorage) {
  const updated = { ...weekly, battlesCompleted: (weekly.battlesCompleted || 0) + 1 };
  saveWeeklyPoints(updated, storage);
  return updated;
}

export function weeklyPercent(weekly, goal = 1000) {
  return Math.min(100, Math.round(weekly.points / goal * 100));
}

export function resetWeeklyPoints(storage = globalThis.localStorage, now = new Date()) {
  try { storage?.removeItem(STORAGE_KEY); } catch {}
  return freshWeek(weekKey(now));
}
