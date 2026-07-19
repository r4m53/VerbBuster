import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { expandCurriculum } from '../js/expanded-curriculum.js';

const base = JSON.parse(await readFile(new URL('../data/verbs.json', import.meta.url), 'utf8'));
const curriculum = expandCurriculum(base);

const villainLines = [
  ["The night is my playground, Verb Buster. Show me you can master these eight moves before the moon disappears!", "Not bad, Verb Buster. Now prove those forms belong to you in the Battle!"],
  ["Moon power makes everything tricky. Can your verb skills shine brighter than my lunar tricks?", "You survived my moonlit challenge. Take that confidence into the Battle!"],
  ["My newest invention scrambles verbs! Let us see whether your brain can put every form back in order.", "Impossible! You solved my verb machine. The Battle will be your final test!"],
  ["No pups can save you from my challenge. Earn every verb before I claim the victory!", "You may have beaten this round, but the Battle is waiting for you!"],
  ["A royal challenge deserves a royal champion. Show me whether you are worthy of these eight verbs!", "You handled my royal test. Now win the Battle like a true champion!"],
  ["I can copy every move you make. Can you remember the forms when I mix them all together?", "Your verb skills are harder to copy than I expected. Finish the job in the Battle!"],
  ["Discipline wins every fight. Control these eight verbs, or my challenge will stop your advance!", "You held your ground. Carry that discipline into the Battle!"],
  ["One mistake is all I need. Keep your focus and master every form, Verb Buster.", "You stayed focused under pressure. Now face the Battle!"],
  ["Power is earned through mastery. Prove that your command of verbs is strong enough to continue.", "Your training has made you stronger. Let the Battle decide the rest!"],
  ["Think you know these spells—I mean verbs? I doubt you can master all eight without making a mistake.", "You were luckier than I expected. Try that confidence in the Battle!"],
  ["These verbs will twist and change like dark magic. Keep up, if you can!", "You escaped my challenge, but the Battle may still catch you!"],
  ["Every word carries power. Master these forms, or your journey ends here.", "You have learned the forms. Now prove your power in the Battle!"],
  ["Strength alone will crush your little word game. Show me these verbs can stand against me!", "Your verbs were stronger than they looked. Take them into the Battle!"],
  ["Fear can break concentration. Keep your courage while these eight verbs change before you.", "You faced the challenge without fear. The Battle is your next test!"],
  ["Even heroes tremble before the final darkness. Master every form if you wish to pass.", "You resisted the darkness. Now claim victory in the Battle!"],
  ["My strength can split mountains. Can your memory hold together through all eight verbs?", "You endured my strength. Now charge into the Battle!"],
  ["This is only the beginning of my plan. Master the verbs now, before the real Battle begins!", "You interrupted my plan, but the Battle is still ahead!"],
  ["All challenges bend before supreme power. Let us see whether your verb mastery can resist me.", "Your knowledge held firm. Complete your trial in the Battle!"],
  ["Welcome to the battlefield. If these eight verbs slow you down, you will never reach the next level!", "You survived the first attack. The Battle will test your true power!"],
  ["Your training means nothing against perfect power. Master these forms before time runs out!", "You exceeded my expectations. Now test that power in the Battle!"],
  ["I turn order into chaos! Keep every verb form straight, or this lesson becomes mine!", "You brought order back to the verbs. Finish with the Battle!"],
];

const outputDir = new URL('../docs/video-scripts/', import.meta.url);
await mkdir(outputDir, { recursive: true });

const videoContent = [];
for (const [index, unit] of curriculum.units.entries()) {
  const verbs = unit.verbIds.map((id) => curriculum.verbs.find((verb) => verb.id === id));
  const [openingChallenge, closingChallenge] = villainLines[index];
  const number = String(unit.number).padStart(2, '0');
  const rows = verbs.map((verb, verbIndex) => `### ${verbIndex + 1}. ${verb.base.toUpperCase()} — ${verb.past.toUpperCase()} — ${verb.participle.toUpperCase()}

- **BASE · blue:** ${verb.examples.base}
- **PAST · coral:** ${verb.examples.past}
- **PARTICIPLE · lime:** ${verb.examples.participle}
- Narration: “${verb.base}, ${verb.past}, ${verb.participle}.”
`).join('\n');
  const markdown = `# Lesson ${number} — ${unit.title}

## Production guide

- Theme: ${unit.themeLabel}
- Rival: ${unit.villain}
- BASE forms: blue
- SIMPLE PAST forms: coral
- PAST PARTICIPLE forms: lime
- Keep the highlighted verb on screen while its sentence is narrated.

## Scene 1 — Rival entrance

**${unit.villain}:** “${openingChallenge}”

## Scene 2 — Today’s roster

${verbs.map((verb) => `${verb.base} — ${verb.past} — ${verb.participle}`).join('\n\n')}

## Scenes 3–10 — Verb training

${rows}
## Scene 11 — Rival’s final challenge

**${unit.villain}:** “${closingChallenge}”

`;
  await writeFile(new URL(`unit-${number}.md`, outputDir), markdown, 'utf8');
  videoContent.push({ ...unit, openingChallenge, closingChallenge, verbs });
}

await writeFile(new URL('../data/video-content.json', import.meta.url), JSON.stringify({ version: 1, units: videoContent }, null, 2), 'utf8');
console.log(`Generated ${videoContent.length} scripts and data/video-content.json`);
