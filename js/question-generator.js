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

export function generateAdaptiveBattle(verbs, masteryLookup) {
  const remaining = generateQuestionPool(verbs).map((question) => ({
    question,
    weight: 1 + (100 - masteryLookup(question.verbId, question.skill)) / 18 + Math.random()
  }));
  const selected = [];
  while (selected.length < 20 && remaining.length) {
    remaining.sort((a, b) => b.weight - a.weight);
    const candidates = remaining.slice(0, Math.min(6, remaining.length));
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    selected.push(pick.question);
    remaining.splice(remaining.indexOf(pick), 1);
  }
  return shuffle(selected);
}

export function isCorrectAnswer(question, value) {
  const normalized = value.trim().toLocaleLowerCase('en-US');
  return [question.answer, ...(question.accepted || [])]
    .some((answer) => answer.toLocaleLowerCase('en-US') === normalized);
}
