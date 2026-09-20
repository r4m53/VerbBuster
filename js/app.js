import { loadContent, getUnitWithVerbs } from './data.js';
import { renderVideoCard, activateVideoFallback } from './video-player.js';
import { generateBattle, generateAdaptiveBattle, isCorrectAnswer } from './question-generator.js';
import { loadProgress, recordBattle, progressSummary, resetProgress, isUnitUnlocked, hasCompletedLeague } from './progress.js';
import { loadWeeklyPoints, awardQuestion, recordWeeklyBattle, weeklyPercent, resetWeeklyPoints, ensureWeeklyReviewUnits } from './weekly-points.js';
import { loadProfile, saveProfile, avatarSvg } from './profile.js';
import { loadCertificateDefinitions, loadCertificates, refreshAwardDefinitions, ensureWeeklyCertificate, syncCurrentAwardProfile, resetCertificates } from './certificates.js';
import { downloadCertificate } from './certificate-image.js';
import { playAwardFanfare } from './award-sound.js';

const app = document.querySelector('#app');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('#main-nav');
const parentPreview = new URLSearchParams(location.search).get('preview') === '1';
let battle = null;
let progress = loadProgress();
let weekly = loadWeeklyPoints();
let playerProfile = loadProfile();
let certificateCollection = loadCertificates();
let certificateDefinitions = null;
let pendingAward = null;
let welcomeShown = false;

const UNIT_THEMES = {
  'pj-masks': { label: 'PJ Masks', character: 'Gekko', image: 'assets/certificate-characters/01-pj-masks-gekko.png', color: '#62b44b' },
  'paw-patrol': { label: 'Paw Patrol', character: 'Marshall', image: 'assets/certificate-characters/04-paw-patrol-marshall.png', color: '#e83f38' },
  avatar: { label: 'Avatar', character: 'Aang', image: 'assets/certificate-characters/09-avatar-aang.png', color: '#f2b63d' },
  'harry-potter': { label: 'Harry Potter', character: 'Harry', image: 'assets/certificate-characters/12-harry-potter-harry.png', color: '#244d41' },
  'dragon-ball': { label: 'Dragon Ball', character: 'Goku', image: 'assets/certificate-characters/21-dragon-ball-goku.png', color: '#f1842b' }
};

function unitTheme(unit) {
  if (unit.villainImage) return { label: unit.themeLabel, character: unit.villain, image: unit.villainImage, color: unit.themeColor };
  return UNIT_THEMES[unit.theme] || UNIT_THEMES['pj-masks'];
}

navToggle.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  nav.classList.toggle('is-open', !expanded);
});
window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', renderRoute);
app.addEventListener('click', handleBattleClick);
app.addEventListener('submit', handleBattleSubmit);

async function renderRoute() {
  const [route = 'home', requestedUnitId] = (location.hash.replace('#', '') || 'home').split('/');
  nav.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
  document.querySelectorAll('[data-route-link]').forEach((link) => {
    const active = link.dataset.routeLink === route || (link.dataset.routeLink === 'training' && ['battle', 'personal'].includes(route));
    link.classList.toggle('active', active);
    active ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current');
  });
  try {
    const data = await loadContent();
    const weeklyReviewActive = hasCompletedLeague(progress, data.units);
    if (weeklyReviewActive) weekly = ensureWeeklyReviewUnits(weekly, data.units.map((unit) => unit.id));
    const unitIsUnlocked = (index) => isUnitUnlocked(progress, data.units, index, weeklyReviewActive ? weekly.reviewUnitIds : []);
    certificateDefinitions ||= await loadCertificateDefinitions();
    certificateCollection = refreshAwardDefinitions(certificateCollection, certificateDefinitions);
    const certificateCheck = ensureWeeklyCertificate(certificateCollection, weekly, playerProfile, certificateDefinitions);
    certificateCollection = certificateCheck.collection;
    pendingAward ||= certificateCheck.award;
    const unitId = requestedUnitId || data.units[0].id;
    const unitIndex = data.units.findIndex((item) => item.id === unitId);
    const unit = getUnitWithVerbs(data, unitId) || getUnitWithVerbs(data, data.units[0].id);
    const unlocked = unitIsUnlocked(Math.max(0, unitIndex));
    if (route === 'training' && !requestedUnitId) {
      const availableUnits = data.units
        .map((item, index) => ({ ...getUnitWithVerbs(data, item.id), unlocked: parentPreview || unitIsUnlocked(index) }))
        .filter((item) => item.unlocked);
      app.innerHTML = trainingHubView(availableUnits, parentPreview, weeklyReviewActive);
    }
    else if (route === 'training') app.innerHTML = (unlocked || parentPreview) ? trainingView(unit, parentPreview) : weeklyReviewActive ? weeklyReplayLockedView(unit) : lockedUnitView(unit, data.units[unitIndex - 1]);
    else if (route === 'battle' || route === 'personal') {
      if (route !== 'personal' && !unlocked) app.innerHTML = weeklyReviewActive ? weeklyReplayLockedView(unit) : lockedUnitView(unit, data.units[unitIndex - 1]);
      else {
        if (!battle || battle.unitId !== unit.id) battle = createBattleState(unit, route === 'personal' ? 'personal' : 'standard', data);
        app.innerHTML = battleView(battle);
      }
    } else if (route === 'scoreboard') app.innerHTML = scoreboardView(progress, data.verbs, data.units, weeklyReviewActive ? weekly.reviewUnitIds : []);
    else if (route === 'profile') app.innerHTML = profileView(playerProfile);
    else if (route === 'trophy') app.innerHTML = trophyRoomView(certificateCollection, certificateDefinitions);
    else if (route === 'certificate') app.innerHTML = certificateDetailView(certificateCollection.awards.find((award) => award.id === requestedUnitId));
    else {
      app.innerHTML = homeView(data.units.map((item, index) => ({ ...getUnitWithVerbs(data, item.id), unlocked: unitIsUnlocked(index) })), weeklyReviewActive);
      showWelcomeBack();
    }
    if (pendingAward) app.insertAdjacentHTML('beforeend', celebrationView(pendingAward));
    activateVideoFallback(app);
    const titles = { training: 'Training Zone', battle: 'Verb Battle', personal: 'Personal Training', scoreboard: 'Scoreboard', trophy: 'Trophy Room', profile: 'Player', certificate: 'Certificate', home: 'League HQ' };
    document.title = `${titles[route] || titles.home} · Verb Buster League`;
    app.focus({ preventScroll: true });
  } catch (error) {
    app.innerHTML = `<section class="error-state"><h1>Timeout on the field</h1><p>${error.message}</p><button onclick="location.reload()">Try again</button></section>`;
  }
}

function homeView(units, weeklyReviewActive = false) {
  const unit = [...units].reverse().find((item) => item.unlocked) || units[0];
  return `<section class="hero shell"><div class="hero-copy"><span class="season-tag">Season 01 · Rookie Camp</span>
    <div class="hero-callout"><span>${escapeHtml(playerProfile.nickname)}, become a</span><h1>Verb Buster!</h1></div><p>Meet the verbs. Learn their moves. Build a streak that’s all yours.</p>
    <div class="button-row"><a class="button button-primary" href="#training/${unit.id}">Enter Training Zone <span aria-hidden="true">→</span></a><a class="text-link" href="#training/${unit.id}">View Unit ${unit.number}</a></div></div>
    <div class="hero-player-card"><span class="hero-player-label">League player</span>${avatarSvg(playerProfile, 300)}<h2>${escapeHtml(playerProfile.nickname)}</h2><p>Your avatar leads every training mission.</p><a href="#profile">Customize avatar</a></div></section>
    ${weeklyMissionView()}
    <section class="home-grid shell" aria-labelledby="today-heading"><div><span class="eyebrow">Your next move</span><h2 id="today-heading">${weeklyReviewActive ? 'This week’s replay missions' : 'Season lineup'}</h2>
    <div class="unit-list">${units.map(unitCard).join('')}</div></div>
    <aside class="coach-note"><span class="coach-icon" aria-hidden="true">⚑</span><span class="eyebrow">Coach’s note</span><h2>No pressure. Just practice.</h2>
    <p>Mistakes tell you what to train next. This first visit is all about meeting the team.</p></aside></section>`;
}

function showWelcomeBack() {
  if (welcomeShown) return;
  welcomeShown = true;
  document.body.insertAdjacentHTML('beforeend', `<div class="welcome-back" role="status" aria-live="polite"><div><span>Welcome back</span><strong>${escapeHtml(playerProfile.nickname)}</strong><small>Verb Buster League</small></div></div>`);
  const welcome = document.querySelector('.welcome-back');
  window.setTimeout(() => welcome?.classList.add('is-leaving'), 1250);
  window.setTimeout(() => welcome?.remove(), 1850);
}

function unitCard(unit) {
  const href = unit.unlocked ? `#training/${unit.id}` : '#home';
  const theme = unitTheme(unit);
  return `<article class="unit-card ${unit.unlocked ? '' : 'is-locked'}" style="--unit-theme:${theme.color}"><div class="unit-number">${String(unit.number).padStart(2, '0')}</div><div>
    <span class="unit-theme-chip"><img src="${theme.image}" alt="">${theme.label} · VS ${theme.character}</span><span class="card-label">${unit.unlocked ? 'Open training' : 'Locked level'}</span><h3>${unit.title}</h3><p>${unit.description}</p>
    <div class="mini-roster">${unit.verbs.map((verb) => `<span>${verb.base}</span>`).join('')}</div></div>
    <a class="round-link" href="${href}" aria-label="${unit.unlocked ? `Open ${unit.title}` : `${unit.title} is locked`}">${unit.unlocked ? '→' : '×'}</a></article>`;
}

function trainingHubView(units, preview = false, weeklyReviewActive = false) {
  const newest = units.at(-1) || units[0];
  return `<section class="training-hub shell"><header><span class="season-tag">Training Zone</span><h1>Choose your lesson</h1>
    ${preview ? '<p class="preview-note">Parent Preview · All lessons visible · Progress rules remain unchanged</p>' : ''}
    <p>${preview ? 'Choose any lesson to review its video and training material.' : weeklyReviewActive ? 'Your two replay missions stay active from Monday through Sunday. A new pair arrives next Monday.' : 'These are your active lessons. Score at least <strong>17/20</strong> in the newest challenge to unlock the next one.'}</p></header>
    <div class="training-hub-grid">${units.map(unitCard).join('')}</div>
    ${newest ? `<section class="personal-card"><div><span class="eyebrow">Smart review</span><h2>Train older trouble verbs</h2><p>Personal Training chooses practiced verbs that need more work.</p></div>
      <a class="button button-primary" href="#personal/${newest.id}" data-start-battle data-mode="personal" data-unit="${newest.id}">Personal Training →</a></section>` : ''}</section>`;
}

function trainingView(unit, preview = false) {
  const theme = unitTheme(unit);
  return `${preview ? '<div class="preview-strip">Parent Preview · This lesson may still be locked for the player</div>' : ''}<section class="page-banner"><div class="shell banner-inner"><div><span class="season-tag dark">Training Zone · Unit ${String(unit.number).padStart(2, '0')}</span>
    <span class="training-theme-name">${theme.label} challenge · VS ${theme.character}</span><h1>${unit.title}</h1><p>${unit.description}</p></div><div class="training-character" style="--unit-theme:${theme.color}"><img src="${theme.image}" alt="${theme.character}"><strong>${theme.character}</strong></div></div></section>
    <div class="shell training-content">${renderVideoCard(unit.video)}
    <section id="verb-roster" class="roster" aria-labelledby="roster-title"><div class="section-heading"><div><span class="eyebrow">Team roster</span><h2 id="roster-title">Meet your eight verbs</h2></div>
    <p>Tap a card to see each verb in action.</p></div><div class="verb-grid">${unit.verbs.map(verbCard).join('')}</div></section>
    <section class="coming-next"><span class="eyebrow">Coming next</span><h2>Your first Verb Battle</h2><p>Soon, these eight verbs will face you in a 20-question match. For now, learn their forms and examples.</p>
    <div class="button-row"><a class="button button-primary" href="#battle/${unit.id}" data-start-battle data-mode="standard" data-unit="${unit.id}">Start Verb Battle →</a>
    <a class="button button-secondary" href="#personal/${unit.id}" data-start-battle data-mode="personal" data-unit="${unit.id}">Personal Training</a></div></section></div>`;
}

function verbCard(verb, index) {
  return `<details class="verb-card"><summary><span class="jersey">${String(index + 1).padStart(2, '0')}</span><span class="verb-forms"><strong>${verb.base}</strong><span>${verb.past} · ${verb.participle}</span></span><span class="card-chevron" aria-hidden="true">+</span></summary>
    <div class="verb-details"><p class="meaning">${verb.meaning}</p><dl><div><dt>Base</dt><dd>${verb.examples.base}</dd></div><div><dt>Past</dt><dd>${verb.examples.past}</dd></div>
    <div><dt>Participle</dt><dd>${verb.examples.participle}</dd></div></dl>${verb.note ? `<p class="language-note">${verb.note}</p>` : ''}</div></details>`;
}

function createBattleState(unit, mode = 'standard', data = null) {
  let battleVerbs = unit.verbs;
  let reviewVerbs = [];
  if (mode === 'personal' && data) {
    const practicedVerbs = data.verbs.filter((verb) => progress.verbs?.[verb.id]);
    battleVerbs = practicedVerbs.length ? practicedVerbs : unit.verbs;
  } else if (unit.boss && data) {
    const priorUnits = data.units.slice(Math.max(0, unit.number - 3), unit.number - 1);
    const reviewIds = priorUnits.flatMap((item) => item.verbIds.slice(-2));
    reviewVerbs = reviewIds.map((id) => data.verbs.find((verb) => verb.id === id)).filter(Boolean);
    battleVerbs = [...unit.verbs, ...reviewVerbs];
  }
  const questions = mode === 'personal'
    ? generateAdaptiveBattle(battleVerbs, (verbId, skill) => progress.verbs?.[verbId]?.skills?.[skill])
    : reviewVerbs.length
      ? [...generateBattle(unit.verbs).slice(0, 16), ...generateBattle(reviewVerbs).sort(() => Math.random() - 0.5).slice(0, 4)].sort(() => Math.random() - 0.5)
      : generateBattle(unit.verbs);
  return { questions, mode, unitId: unit.id, unitNumber: unit.number, unitTitle: unit.title, index: 0, answers: [], feedback: null, finished: false, recorded: false, pointsEarned: 0 };
}

function battleView(state) {
  if (state.finished) return resultsView(state);
  const question = state.questions[state.index];
  const progress = Math.round((state.index / state.questions.length) * 100);
  return `<section class="battle-page"><div class="shell battle-shell">
    <header class="battle-header"><div><span class="season-tag">${state.mode === 'personal' ? 'Personal Training' : 'Verb Battle'} · Unit ${String(state.unitNumber).padStart(2, '0')}</span><h1>Match in progress</h1></div>
    <a href="#training/${state.unitId}" class="exit-link">Exit battle</a></header>
    <div class="battle-progress"><div class="progress-copy"><span>Question ${state.index + 1} of ${state.questions.length}</span><span>${progress}%</span></div>
    <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="20" aria-valuenow="${state.index}"><span style="width:${progress}%"></span></div></div>
    <article class="question-card" aria-labelledby="question-title"><span class="eyebrow">${question.kicker}</span><h2 id="question-title">${question.prompt}</h2>
    <p class="question-context">${question.context}</p>${answerControl(question, state.feedback)}${state.feedback ? feedbackPanel(question, state.feedback) : ''}</article>
  </div></section>`;
}

function answerControl(question, feedback) {
  if (question.kind === 'choice') {
    return `<div class="answer-options" role="group" aria-label="Answer choices">${question.options.map((option, index) =>
      `<button class="answer-option" type="button" data-answer="${option}" ${feedback ? 'disabled' : ''}><span>${String.fromCharCode(65 + index)}</span>${option}</button>`).join('')}</div>`;
  }
  return `<form class="write-answer"><label for="written-answer">Your answer</label><div><input id="written-answer" name="answer" autocomplete="off" autocapitalize="none" spellcheck="false" required ${feedback ? 'disabled' : ''}>
    <button class="button button-primary" type="submit" ${feedback ? 'disabled' : ''}>Check answer</button></div></form>`;
}

function feedbackPanel(question, feedback) {
  const heading = feedback.correct ? 'Busted!' : 'Tricky verb spotted';
  const message = feedback.correct ? 'That’s the right form.' : `Your answer: ${escapeHtml(feedback.value || 'No answer')} · Correct answer: ${question.answer}`;
  return `<section class="answer-feedback ${feedback.correct ? 'is-correct' : 'is-wrong'}" aria-live="polite"><span class="feedback-icon" aria-hidden="true">${feedback.correct ? '✓' : '!'}</span>
    <div><h3>${heading}</h3><p>${message}</p>${feedback.correct ? `<p class="points-callout">${feedback.awarded ? `+${feedback.awarded} League Points` : 'Practice complete · 0 new points'}</p>` : ''}<p class="form-line"><strong>${question.forms[0]}</strong><span>→</span><strong>${question.forms[1]}</strong><span>→</span><strong>${question.forms[2]}</strong></p>
    ${feedback.correct ? '' : '<p>Irregular verbs change form instead of simply adding <strong>-ed</strong>.</p>'}</div>
    <button class="button button-secondary" type="button" data-next-question>${stateNextLabel()}</button></section>`;
}

function stateNextLabel() {
  return battle.index === battle.questions.length - 1 ? 'See results →' : 'Next play →';
}

function handleBattleClick(event) {
  const start = event.target.closest('[data-start-battle]');
  if (start) {
    battle = null;
    const destination = `#${start.dataset.mode === 'personal' ? 'personal' : 'battle'}/${start.dataset.unit || 'everyday-actions'}`;
    if (location.hash === destination) {
      event.preventDefault();
      renderRoute();
      return;
    }
  }
  const option = event.target.closest('[data-answer]');
  if (option && battle && !battle.feedback) checkAnswer(option.dataset.answer);
  if (event.target.closest('[data-next-question]')) advanceBattle();
  const reveal = event.target.closest('[data-reveal-award]');
  if (reveal) {
    reveal.disabled = true;
    reveal.textContent = 'Revealing…';
    playAwardFanfare(pendingAward?.definition?.tier).finally(() => {
      reveal.closest('.award-celebration')?.classList.add('is-revealed');
    });
  }
  const replayFanfare = event.target.closest('[data-play-award-sound]');
  if (replayFanfare) {
    replayFanfare.textContent = 'Playing…';
    playAwardFanfare(replayFanfare.dataset.awardTier).finally(() => {
      window.setTimeout(() => { replayFanfare.textContent = 'Play fanfare'; }, 3600);
    });
  }
  if (event.target.closest('[data-close-celebration]')) {
    pendingAward = null;
    event.target.closest('.award-celebration')?.remove();
  }
  const download = event.target.closest('[data-download-certificate]');
  if (download) {
    const award = certificateCollection.awards.find((item) => item.id === download.dataset.downloadCertificate);
    if (award) downloadCertificate(award);
  }
  if (event.target.closest('[data-reset-progress]')) {
    if (!window.confirm('Reset all saved Verb Buster progress on this device?')) return;
    progress = resetProgress();
    weekly = resetWeeklyPoints();
    certificateCollection = resetCertificates();
    renderRoute();
  }
}

function handleBattleSubmit(event) {
  if (event.target.matches('.profile-form')) {
    event.preventDefault();
    const form = new FormData(event.target);
    playerProfile = saveProfile({ nickname: form.get('nickname'), avatar: { skin: form.get('skin'), hair: form.get('hair'), jersey: form.get('jersey'), number: form.get('number'), accessory: form.get('accessory') } });
    certificateCollection = syncCurrentAwardProfile(certificateCollection, weekly, playerProfile);
    app.innerHTML = profileView(playerProfile, true);
    return;
  }
  if (!event.target.matches('.write-answer')) return;
  event.preventDefault();
  checkAnswer(new FormData(event.target).get('answer'));
}

function checkAnswer(value) {
  const question = battle.questions[battle.index];
  const correct = isCorrectAnswer(question, String(value || ''));
  const award = awardQuestion(weekly, question.id, correct);
  weekly = award.weekly;
  battle.pointsEarned += award.awarded;
  battle.feedback = { value: String(value || ''), correct, awarded: award.awarded };
  battle.answers.push({ question, value: String(value || ''), correct, awarded: award.awarded });
  app.innerHTML = battleView(battle);
}

function advanceBattle() {
  if (battle.index === battle.questions.length - 1) {
    battle.finished = true;
    if (!battle.recorded) {
      progress = recordBattle(progress, battle.answers, globalThis.localStorage, battle.unitId, battle.mode !== 'personal');
      weekly = recordWeeklyBattle(weekly);
      const certificateCheck = ensureWeeklyCertificate(certificateCollection, weekly, playerProfile, certificateDefinitions);
      certificateCollection = certificateCheck.collection;
      pendingAward ||= certificateCheck.award;
      battle.recorded = true;
    }
  }
  else { battle.index += 1; battle.feedback = null; }
  app.innerHTML = battleView(battle);
  if (pendingAward) app.insertAdjacentHTML('beforeend', celebrationView(pendingAward));
}

function resultsView(state) {
  const correct = state.answers.filter((answer) => answer.correct).length;
  const missed = state.answers.filter((answer) => !answer.correct);
  return `<section class="results-page shell"><span class="season-tag">Final whistle</span><h1>Battle complete!</h1>
    <div class="result-score"><strong>${correct}</strong><span>out of 20<br>correct</span></div>
    <p class="session-points"><strong>+${state.pointsEarned}</strong> League Points this Battle · Weekly total: ${weekly.points} / 1,000</p>
    <p>${correct >= 16 ? 'Strong match! Your verb forms are taking shape.' : 'Good training. Every mistake shows what to practice next.'}</p>
    ${missed.length ? `<section class="review-list"><span class="eyebrow">Review lineup</span><h2>Verbs to train again</h2><div>${[...new Set(missed.map((item) => item.question.verbId))].map((id) => `<span>${id}</span>`).join('')}</div></section>` : '<p class="perfect-result">Clean sweep — all twenty answers were correct!</p>'}
    ${battleReport(state.answers)}
    <div class="button-row"><a class="button button-primary" href="#scoreboard">View Scoreboard</a>
    <a class="text-link" href="#${state.mode === 'personal' ? 'personal' : 'battle'}/${state.unitId}" data-start-battle data-mode="${state.mode}" data-unit="${state.unitId}">Play another battle</a></div></section>`;
}

function scoreboardView(savedProgress, verbs, units, reviewUnitIds = []) {
  const summary = progressSummary(savedProgress, verbs);
  return `<section class="scoreboard-page"><div class="shell"><header class="scoreboard-heading"><div><span class="season-tag">Player progress</span><h1>Scoreboard</h1>
    <p>Your practice stays on this device and helps choose what to train next.</p></div><div class="rank-badge"><small>LEVEL</small>${leagueLevel(summary.mastered)}</div></header>
    ${weeklyMissionView(true)}
    <div class="stat-grid"><article><strong>${savedProgress.battlesCompleted}</strong><span>Battles completed</span></article>
    <article><strong>${summary.accuracy}%</strong><span>Overall accuracy</span></article><article><strong>${summary.mastered}</strong><span>Mastered verbs</span></article></div>
    ${savedProgress.battlesCompleted === 0 ? `<section class="empty-progress"><h2>Your scoreboard is ready</h2><p>Complete a Verb Battle to reveal strengths and Trouble Verbs.</p><a class="button button-primary" href="#battle/${units[0].id}" data-start-battle data-mode="standard" data-unit="${units[0].id}">Start first battle</a></section>` : `
    <section class="progress-panel"><div class="section-heading"><div><span class="eyebrow">Verb mastery</span><h2>Team development</h2></div><p>Mastery combines accuracy, repetition and current streak.</p></div>
    <div class="mastery-list">${summary.rows.map((row) => `<article><div><strong>${row.base}</strong><span>${row.past} · ${row.participle}</span></div>
      <div class="mastery-meter"><span style="width:${row.mastery}%"></span></div><b>${row.mastery}%</b><em class="status-${row.status.toLowerCase().replaceAll(' ', '-')}">${row.status}</em></article>`).join('')}</div></section>
    ${savedProgress.lastBattle ? `<section class="last-battle"><div><span class="eyebrow">Most recent result</span><h2>Last Verb Battle</h2><p>${savedProgress.lastBattle.correct} of ${savedProgress.lastBattle.total} correct · ${Math.round(savedProgress.lastBattle.correct / savedProgress.lastBattle.total * 100)}%</p></div>
      <details><summary>Review all answers</summary>${battleReport(savedProgress.lastBattle.answers, true)}</details></section>` : ''}
    <section class="personal-card"><div><span class="eyebrow">Recommended next move</span><h2>${summary.trouble.length ? 'Train your Trouble Verbs' : 'Build stronger streaks'}</h2>
    <p>${summary.trouble.length ? summary.trouble.map((verb) => verb.base).join(' · ') : 'The coach will prioritize your lowest mastery skills.'}</p></div>
    <a class="button button-primary" href="#personal/${units[0].id}" data-start-battle data-mode="personal" data-unit="${units[0].id}">Start Personal Training →</a></section>`}
    ${levelProgressView(savedProgress, units, reviewUnitIds)}
    ${weeklyHistoryView()}
    <button class="reset-progress" type="button" data-reset-progress>Reset saved progress</button></div></section>`;
}

function leagueLevel(mastered) {
  if (mastered >= 6) return '03';
  if (mastered >= 3) return '02';
  return '01';
}

function levelProgressView(savedProgress, units, reviewUnitIds = []) {
  const weeklyReviewActive = reviewUnitIds.length > 0;
  return `<section class="level-progress"><span class="eyebrow">Season levels</span><h2>Training map</h2><div>${units.map((unit, index) => {
    const unlocked = isUnitUnlocked(savedProgress, units, index, reviewUnitIds);
    const stats = savedProgress.units?.[unit.id];
    return `<article class="${unlocked ? 'is-unlocked' : 'is-locked'}"><span>${String(unit.number).padStart(2, '0')}</span><div><strong>${unit.title}</strong>
      <small>${unlocked ? `${weeklyReviewActive ? 'Weekly replay · ' : ''}${stats?.battlesCompleted || 0} Battles · Best ${stats?.bestScore || 0}/20` : weeklyReviewActive ? 'Completed · Resting this week' : `Score 17/20 in Unit ${String(index).padStart(2, '0')} to unlock`}</small></div>
      <a href="${unlocked ? `#training/${unit.id}` : '#scoreboard'}" aria-label="${unlocked ? `Open ${unit.title}` : `${unit.title} locked`}">${unlocked ? 'Open' : 'Locked'}</a></article>`;
  }).join('')}</div></section>`;
}

function lockedUnitView(unit, previousUnit) {
  return `<section class="locked-page shell"><span class="season-tag">Level locked</span><div class="lock-symbol" aria-hidden="true">×</div><h1>${unit.title}</h1>
    <p>Score at least <strong>17/20</strong> in <strong>${previousUnit?.title || 'the previous unit'}</strong> to unlock this training level.</p>
    <a class="button button-primary" href="#training/${previousUnit?.id || 'everyday-actions'}">Return to previous level</a></section>`;
}

function weeklyReplayLockedView(unit) {
  return `<section class="locked-page shell"><span class="season-tag">Replay mission resting</span><div class="lock-symbol" aria-hidden="true">↻</div><h1>${unit.title}</h1>
    <p>This completed lesson is resting this week. Two different replay missions are active until Sunday.</p>
    <a class="button button-primary" href="#training">View this week’s missions</a></section>`;
}

function battleReport(answers, stored = false) {
  return `<section class="battle-report"><span class="eyebrow">Full match report</span><h2>Your 20 answers</h2><div class="report-table">${answers.map((item, index) => {
    const question = stored ? item : item.question;
    const value = item.value || 'No answer';
    const answer = stored ? item.answer : item.question.answer;
    return `<article class="${item.correct ? 'report-correct' : 'report-wrong'}"><span class="report-number">${index + 1}</span><div><strong>${question.verbId || item.verbId} · ${question.skill || item.skill}</strong>
      <p>Your answer: <b>${escapeHtml(value)}</b>${item.correct ? '' : ` · Correct: <b>${answer}</b>`}</p></div><span class="report-mark" aria-label="${item.correct ? 'Correct' : 'Incorrect'}">${item.correct ? '✓' : '!'}</span></article>`;
  }).join('')}</div></section>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function weeklyMissionView(compact = false) {
  const percent = weeklyPercent(weekly);
  return `<section class="weekly-mission ${compact ? 'is-compact' : 'shell'}"><div><span class="eyebrow">Monday–Sunday</span><h2>Weekly Mission</h2>
    <p><strong>${weekly.points}</strong> / 1,000 League Points</p></div><div class="weekly-progress"><div role="progressbar" aria-label="Weekly points" aria-valuemin="0" aria-valuemax="1000" aria-valuenow="${weekly.points}"><span style="width:${percent}%"></span></div>
    <small>${Math.max(0, 1000 - weekly.points)} points to the Weekly Award</small></div></section>`;
}

function weeklyHistoryView() {
  if (!weekly.history?.length) return '';
  return `<section class="weekly-history"><span class="eyebrow">Previous weeks</span><h2>Weekly History</h2><div>${[...weekly.history].reverse().map((week) => `<article><strong>Week of ${week.weekKey}</strong><span>${week.points} points</span><small>${week.battlesCompleted} Battles · ${week.questionsPracticed} questions</small></article>`).join('')}</div></section>`;
}

function profileView(profile, saved = false) {
  return `<section class="profile-page shell"><header><span class="season-tag">Player profile</span><h1>Avatar Locker</h1><p>Build the player who will appear on your certificates.</p></header>
    <div class="profile-layout"><div class="avatar-preview">${avatarSvg(profile, 260)}<strong>${escapeHtml(profile.nickname)}</strong>${saved ? '<p class="saved-message">Player saved!</p>' : ''}</div>
    <form class="profile-form"><label>Player nickname<input name="nickname" maxlength="24" value="${escapeHtml(profile.nickname)}" required></label>
      ${selectControl('skin', 'Skin tone', [['#f5c9a5','Light'],['#dca078','Warm'],['#c9855b','Medium'],['#8b563c','Deep']], profile.avatar.skin)}
      ${selectControl('hair', 'Hair color', [['#e5ba67','Blond'],['#8a552d','Brown'],['#3b2418','Dark brown'],['#151515','Black']], profile.avatar.hair)}
      ${selectControl('jersey', 'Jersey color', [['#14213d','League navy'],['#2878d0','Blue'],['#d92f60','Pink'],['#62b44b','Green'],['#f1842b','Orange']], profile.avatar.jersey)}
      <label>Jersey number<input name="number" inputmode="numeric" maxlength="2" value="${escapeHtml(profile.avatar.number)}"></label>
      ${selectControl('accessory', 'Accessory', [['none','None'],['glasses','Glasses'],['headband','Headband']], profile.avatar.accessory)}
      <button class="button button-primary" type="submit">Save player</button></form></div></section>`;
}

function selectControl(name, label, options, current) {
  return `<label>${label}<select name="${name}">${options.map(([value, text]) => `<option value="${value}" ${value === current ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
}

function trophyRoomView(collection, definitions) {
  return `<section class="trophy-page shell"><header><span class="season-tag">Certificate collection</span><h1>Trophy Room</h1><p>Complete the Weekly Mission to unlock one new character award each week.</p></header>
    <div class="trophy-grid">${definitions.map((definition, index) => {
      const award = collection.awards[index];
      return award ? certificateCard(award) : `<article class="trophy-card is-locked"><span class="certificate-number">${String(index + 1).padStart(2, '0')}</span><div class="character-medal" style="--award:${definition.primary};--award-dark:${definition.secondary}">?</div>
        <h2>${definition.tier} ${definition.rank}</h2><p>Character locked</p></article>`;
    }).join('')}</div></section>`;
}

function certificateCard(award) {
  const theme = award.definition;
  return `<article class="trophy-card is-earned" style="--award:${theme.primary};--award-dark:${theme.secondary}"><span class="certificate-number">${String(award.number).padStart(2, '0')}</span>
    <div class="character-medal">${characterArtwork(theme)}</div><span class="eyebrow">${theme.theme}</span><h2>${theme.character}</h2><p>${theme.tier} ${theme.rank}</p>
    <a class="button button-secondary" href="#certificate/${award.id}">View award</a></article>`;
}

function characterArtwork(theme) {
  return theme.image ? `<img src="${theme.image}" alt="${escapeHtml(theme.character)}">` : `<span>${theme.character.charAt(0)}</span>`;
}

function certificateDetailView(award) {
  if (!award) return `<section class="locked-page shell"><h1>Certificate not found</h1><a href="#trophy">Return to Trophy Room</a></section>`;
  const theme = award.definition;
  const profileSnapshot = { nickname: award.nickname, avatar: award.avatar };
  return `<section class="certificate-page shell"><div class="certificate-preview mission-poster" style="--award:${theme.primary};--award-dark:${theme.secondary}">
    <span class="poster-series">Certificate ${String(award.number).padStart(2, '0')} · ${theme.tier} ${theme.rank}</span><span class="poster-league">Verb Buster League</span>
    <div class="poster-title"><small>Weekly mission</small><strong>Complete!</strong></div>
    <div class="poster-player">${avatarSvg(profileSnapshot, 205)}<div><small>New ${theme.tier} Verb Buster</small><h1>${escapeHtml(award.nickname)}</h1></div></div>
    <div class="poster-character"><div class="character-burst">${characterArtwork(theme)}</div><strong>${theme.character}</strong><small>${theme.theme}</small></div>
    <blockquote>“${theme.message}”</blockquote>
    <div class="poster-stats"><span><b>${award.points}</b>League Points</span><span><b>${award.battlesCompleted}</b>Battles</span><span><b>${award.questionsMastered || '—'}</b>Questions mastered</span></div>
    <footer>Week of ${award.weekKey}</footer></div>
    <div class="button-row"><button class="button button-primary" data-play-award-sound data-award-tier="${theme.tier}">Play fanfare</button><button class="button button-secondary" data-download-certificate="${award.id}">Save image</button><a class="text-link" href="#trophy">Back to Trophy Room</a></div></section>`;
}

function celebrationView(award) {
  const theme = award.definition;
  return `<section class="award-celebration" role="dialog" aria-modal="true" aria-labelledby="award-title" style="--award:${theme.primary};--award-dark:${theme.secondary}">
    <div class="reveal-intro"><span class="mission-seal" aria-hidden="true">★</span><span class="eyebrow">Weekly Mission complete</span><h2 id="award-title">A new award is waiting!</h2>
      <p>Turn up your device sound.</p><button class="button button-primary reveal-button" data-reveal-award>Reveal Award</button></div>
    <div class="confetti" aria-hidden="true">★ ◆ ● ★ ◆ ● ★</div><div class="celebration-card reveal-content"><span class="eyebrow">Character message unlocked</span>
    <div class="celebration-character"><div class="character-burst">${characterArtwork(theme)}</div><strong>${theme.character}</strong></div>
    <h2>${theme.character} congratulates you!</h2><blockquote>“${theme.message}”</blockquote>
    <strong>${theme.tier.toUpperCase()} ${theme.rank} UNLOCKED</strong><div class="button-row"><a class="button button-primary" href="#certificate/${award.id}" data-close-celebration>View Mission Poster</a>
    <a class="text-link" href="#profile" data-close-celebration>Customize avatar</a><button class="text-button" data-close-celebration>Continue</button></div></div></section>`;
}
