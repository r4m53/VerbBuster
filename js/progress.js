const STORAGE_KEY = 'verb-buster-progress-v1';

function emptyProgress() {
  return { version: 1, battlesCompleted: 0, totalAnswers: 0, correctAnswers: 0, verbs: {}, units: {}, lastBattle: null, updatedAt: null };
}

export function loadProgress(storage = globalThis.localStorage) {
  try {
    const saved = storage?.getItem(STORAGE_KEY);
    if (!saved) return emptyProgress();
    const parsed = JSON.parse(saved);
    if (parsed?.version !== 1 || !parsed.verbs) return emptyProgress();
    parsed.units ||= {};
    if (parsed.battlesCompleted > 0 && !parsed.units['everyday-actions']) {
      parsed.units['everyday-actions'] = {
        battlesCompleted: parsed.battlesCompleted,
        bestScore: parsed.lastBattle?.correct || 0
      };
      saveProgress(parsed, storage);
    }
    return parsed;
  } catch { return emptyProgress(); }
}

export function saveProgress(progress, storage = globalThis.localStorage) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}

function skillRecord(progress, verbId, skill) {
  progress.verbs[verbId] ||= { skills: {} };
  progress.verbs[verbId].skills[skill] ||= { attempts: 0, correct: 0, streak: 0, mastery: 0, lastPracticed: null };
  return progress.verbs[verbId].skills[skill];
}

export function recordBattle(progress, answers, storage = globalThis.localStorage, unitId = 'everyday-actions', advancesLeague = true) {
  const updated = structuredClone(progress);
  updated.units ||= {};
  for (const answer of answers) {
    const record = skillRecord(updated, answer.question.verbId, answer.question.skill);
    record.attempts += 1;
    record.lastPracticed = new Date().toISOString();
    if (answer.correct) {
      record.correct += 1;
      record.streak += 1;
      record.mastery = Math.min(100, record.mastery + 16 + Math.min(record.streak, 4));
      updated.correctAnswers += 1;
    } else {
      record.streak = 0;
      record.mastery = Math.max(0, record.mastery - 12);
    }
    updated.totalAnswers += 1;
  }
  updated.battlesCompleted += 1;
  if (advancesLeague) {
    const unit = updated.units[unitId] || { battlesCompleted: 0, bestScore: 0 };
    unit.battlesCompleted += 1;
    unit.standardBattlesCompleted = (unit.standardBattlesCompleted || 0) + 1;
    unit.bestScore = Math.max(unit.bestScore, answers.filter((answer) => answer.correct).length);
    updated.units[unitId] = unit;
  }
  updated.lastBattle = {
    completedAt: new Date().toISOString(),
    correct: answers.filter((answer) => answer.correct).length,
    total: answers.length,
    answers: answers.map((answer) => ({
      verbId: answer.question.verbId,
      skill: answer.question.skill,
      prompt: answer.question.prompt,
      value: answer.value,
      answer: answer.question.answer,
      correct: answer.correct
    }))
  };
  updated.updatedAt = new Date().toISOString();
  saveProgress(updated, storage);
  return updated;
}

export function hasCompletedLeague(progress, units) {
  return units.length > 0 && units.every((unit) => (progress.units?.[unit.id]?.bestScore || 0) >= 17);
}

export function isUnitUnlocked(progress, units, unitIndex, reviewUnitIds = []) {
  if (hasCompletedLeague(progress, units) && reviewUnitIds.length) {
    return reviewUnitIds.includes(units[unitIndex]?.id);
  }
  const qualified = (index) => {
    const unitProgress = progress.units?.[units[index]?.id];
    return (unitProgress?.bestScore || 0) >= 17;
  };
  let latestQualified = -1;
  for (let index = 0; index < units.length && qualified(index); index += 1) latestQualified = index;
  const newestAvailable = Math.min(units.length - 1, latestQualified + 1);
  const oldestAvailable = Math.max(0, newestAvailable - 1);
  return unitIndex >= oldestAvailable && unitIndex <= newestAvailable;
}

export function masteryFor(progress, verbId, skill) {
  return progress.verbs?.[verbId]?.skills?.[skill]?.mastery ?? 0;
}

export function verbMastery(progress, verbId) {
  const skills = Object.values(progress.verbs?.[verbId]?.skills || {});
  if (!skills.length) return 0;
  return Math.round(skills.reduce((sum, item) => sum + item.mastery, 0) / skills.length);
}

export function masteryStatus(value, attempts = 1) {
  if (!attempts) return 'New';
  if (value >= 80) return 'Mastered';
  if (value >= 55) return 'Improving';
  if (value >= 25) return 'Learning';
  return 'Needs training';
}

export function progressSummary(progress, verbs) {
  const rows = verbs.map((verb) => {
    const mastery = verbMastery(progress, verb.id);
    const skills = Object.values(progress.verbs?.[verb.id]?.skills || {});
    const attempts = skills.reduce((sum, item) => sum + item.attempts, 0);
    return { ...verb, mastery, attempts, status: masteryStatus(mastery, attempts) };
  });
  const practiced = rows.filter((row) => row.attempts > 0);
  return {
    rows,
    accuracy: progress.totalAnswers ? Math.round(progress.correctAnswers / progress.totalAnswers * 100) : 0,
    mastered: rows.filter((row) => row.mastery >= 80).length,
    trouble: practiced.filter((row) => row.mastery < 55).sort((a, b) => a.mastery - b.mastery).slice(0, 4)
  };
}

export function resetProgress(storage = globalThis.localStorage) {
  try { storage?.removeItem(STORAGE_KEY); } catch {}
  return emptyProgress();
}
