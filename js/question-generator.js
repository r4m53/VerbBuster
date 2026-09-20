function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapWith]] = [copy[swapWith], copy[index]];
  }
  return copy;
}

function optionsFor(verb, answer) {
  const regularMistake = verb.base.endsWith('e') ? `${verb.base}d` : `${verb.base}ed`;
  const forms = [...new Set([verb.base, verb.past, verb.participle])];
  if (forms.length < 3 && !forms.includes(regularMistake)) forms.push(regularMistake);
  for (const fallback of [`${verb.base}s`, `${verb.base}ing`]) {
    if (forms.length < 3 && !forms.includes(fallback)) forms.push(fallback);
  }
  return shuffle(forms.slice(0, 3).includes(answer) ? forms.slice(0, 3) : [answer, ...forms].slice(0, 3));
}

function missingWord(sentence, word) {
  const expression = new RegExp(`\\b${word}\\b`, 'i');
  return sentence.replace(expression, '_____');
}

export function generateQuestionPool(verbs) {
  const questions = [];
  verbs.forEach((verb) => {
    questions.push({
      id: `${verb.id}-past-choice`, verbId: verb.id, kind: 'choice', skill: 'simple past',
      kicker: 'Past tense play', prompt: `What is the simple past of “${verb.base}”?`,
      context: missingWord(verb.examples.past, verb.past), answer: verb.past,
      options: optionsFor(verb, verb.past), forms: [verb.base, verb.past, verb.participle]
    });
    questions.push({
      id: `${verb.id}-participle-choice`, verbId: verb.id, kind: 'choice', skill: 'past participle',
      kicker: 'Third-form challenge', prompt: `Choose the past participle of “${verb.base}”.`,
      context: missingWord(verb.examples.participle, verb.participle), answer: verb.participle,
      accepted: verb.acceptedParticiples || [], options: optionsFor(verb, verb.participle),
      forms: [verb.base, verb.past, verb.participle]
    });
  });
  verbs.forEach((verb) => {
    questions.push({
      id: `${verb.id}-past-write`, verbId: verb.id, kind: 'write', skill: 'past spelling',
      kicker: 'Spelling sprint', prompt: `Type the simple past of “${verb.base}”.`,
      context: missingWord(verb.examples.past, verb.past), answer: verb.past,
      forms: [verb.base, verb.past, verb.participle]
    });
    questions.push({
      id: `${verb.id}-participle-write`, verbId: verb.id, kind: 'write', skill: 'participle spelling',
      kicker: 'Third-form spelling', prompt: `Type the past participle of “${verb.base}”.`,
      context: missingWord(verb.examples.participle, verb.participle), answer: verb.participle,
      accepted: verb.acceptedParticiples || [], forms: [verb.base, verb.past, verb.participle]
    });
  });
  return questions;
}

export function generateBattle(verbs) {
  const pool = generateQuestionPool(verbs);
  const choices = pool.filter((question) => question.kind === 'choice');
  const writing = shuffle(pool.filter((question) => question.skill === 'past spelling')).slice(0, 4);
  return shuffle([...choices, ...writing]);
}

function takeVaried(candidates, count, selectedIds, maxPerVerb) {
  const picked = [];
  const perVerb = new Map();
  const available = candidates.filter(({ question }) => !selectedIds.has(question.id));
  for (const candidate of available) {
    if (picked.length >= count) break;
    const uses = perVerb.get(candidate.question.verbId) || 0;
    if (uses >= maxPerVerb) continue;
    picked.push(candidate);
    perVerb.set(candidate.question.verbId, uses + 1);
    selectedIds.add(candidate.question.id);
  }
  if (picked.length < count) {
    for (const candidate of available) {
      if (picked.length >= count) break;
      if (selectedIds.has(candidate.question.id)) continue;
      picked.push(candidate);
      selectedIds.add(candidate.question.id);
    }
  }
  return picked;
}

export function generateAdaptiveBattle(verbs, progressLookup) {
  const candidates = generateQuestionPool(verbs).map((question) => {
    const record = progressLookup(question.verbId, question.skill) || {};
    const attempts = record.attempts || 0;
    const correct = record.correct || 0;
    return {
      question,
      attempts,
      mistakes: Math.max(0, attempts - correct),
      errorRate: attempts ? Math.max(0, attempts - correct) / attempts : 0,
      mastery: record.mastery || 0,
      lastPracticed: record.lastPracticed ? Date.parse(record.lastPracticed) || 0 : 0,
      tieBreaker: Math.random()
    };
  });
  const selectedIds = new Set();
  const verbLastPracticed = new Map();
  candidates.forEach((candidate) => {
    verbLastPracticed.set(candidate.question.verbId, Math.max(
      verbLastPracticed.get(candidate.question.verbId) || 0,
      candidate.lastPracticed
    ));
  });

  const weaknessOrder = [...candidates].sort((a, b) =>
    b.mistakes - a.mistakes
    || b.errorRate - a.errorRate
    || a.mastery - b.mastery
    || b.attempts - a.attempts
    || b.tieBreaker - a.tieBreaker
  );
  const weak = takeVaried(weaknessOrder, 10, selectedIds, 2)
    .map(({ question }) => ({ ...question, trainingReason: 'weakness' }));

  const staleOrder = [...candidates].sort((a, b) =>
    verbLastPracticed.get(a.question.verbId) - verbLastPracticed.get(b.question.verbId)
    || a.lastPracticed - b.lastPracticed
    || a.mastery - b.mastery
    || b.tieBreaker - a.tieBreaker
  );
  const stale = takeVaried(staleOrder, 6, selectedIds, 1)
    .map(({ question }) => ({ ...question, trainingReason: 'stale' }));

  const randomOrder = shuffle(candidates.filter(({ question }) => !selectedIds.has(question.id)));
  const random = takeVaried(randomOrder, 4, selectedIds, 1)
    .map(({ question }) => ({ ...question, trainingReason: 'random' }));

  return shuffle([...weak, ...stale, ...random]);
}

export function isCorrectAnswer(question, value) {
  const normalized = value.trim().toLocaleLowerCase('en-US');
  return [question.answer, ...(question.accepted || [])]
    .some((answer) => answer.toLocaleLowerCase('en-US') === normalized);
}
