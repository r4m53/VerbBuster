const rows = [
['begin','began','begun','empezar'],['break','broke','broken','romper'],['build','built','built','construir'],['catch','caught','caught','atrapar'],['draw','drew','drawn','dibujar'],['grow','grew','grown','crecer'],['learn','learned','learned','aprender'],['meet','met','met','conocer / reunirse'],
['sing','sang','sung','cantar'],['ring','rang','rung','sonar'],['sit','sat','sat','sentarse'],['sleep','slept','slept','dormir'],['stand','stood','stood','estar de pie'],['wake','woke','woken','despertar'],['wear','wore','worn','vestir'],['win','won','won','ganar'],
['blow','blew','blown','soplar'],['bite','bit','bitten','morder'],['hide','hid','hidden','esconder'],['shake','shook','shaken','sacudir'],['show','showed','shown','mostrar'],['throw','threw','thrown','lanzar'],['tear','tore','torn','rasgar'],['steal','stole','stolen','robar'],
['bend','bent','bent','doblar'],['bleed','bled','bled','sangrar'],['burn','burned','burned','quemar'],['cost','cost','cost','costar'],['dig','dug','dug','cavar'],['dream','dreamed','dreamed','soñar'],['fight','fought','fought','luchar'],['hang','hung','hung','colgar'],
['lead','led','led','liderar'],['lend','lent','lent','prestar'],['light','lit','lit','encender'],['lose','lost','lost','perder'],['mean','meant','meant','significar'],['send','sent','sent','enviar'],['spend','spent','spent','gastar / pasar'],['sell','sold','sold','vender'],
['set','set','set','colocar'],['shut','shut','shut','cerrar'],['hit','hit','hit','golpear'],['hurt','hurt','hurt','lastimar'],['let','let','let','permitir'],['put','put','put','poner'],['spread','spread','spread','extender'],['split','split','split','dividir'],
['rise','rose','risen','elevarse'],['seek','sought','sought','buscar'],['slide','slid','slid','deslizar'],['smell','smelled','smelled','oler'],['speed','sped','sped','acelerar'],['spell','spelled','spelled','deletrear'],['spin','spun','spun','girar'],['spring','sprang','sprung','saltar / brotar'],
['stick','stuck','stuck','pegar'],['sting','stung','stung','picar'],['stink','stank','stunk','apestar'],['strike','struck','struck','golpear'],['sweep','swept','swept','barrer'],['swing','swung','swung','balancearse'],['weep','wept','wept','llorar'],['wind','wound','wound','enrollar'],
['bind','bound','bound','atar'],['breed','bred','bred','criar'],['creep','crept','crept','arrastrarse'],['deal','dealt','dealt','tratar / repartir'],['flee','fled','fled','huir'],['forgive','forgave','forgiven','perdonar'],['freeze','froze','frozen','congelar'],['grind','ground','ground','moler'],
['kneel','knelt','knelt','arrodillarse'],['lean','leaned','leaned','inclinarse'],['leap','leapt','leapt','saltar'],['prove','proved','proven','demostrar'],['quit','quit','quit','dejar / renunciar'],['shine','shone','shone','brillar'],['shoot','shot','shot','disparar'],['shrink','shrank','shrunk','encogerse'],
['sink','sank','sunk','hundirse'],['spill','spilled','spilled','derramar'],['spit','spat','spat','escupir'],['spoil','spoiled','spoiled','arruinar'],['swear','swore','sworn','jurar'],['sow','sowed','sown','sembrar'],['stride','strode','stridden','andar a grandes pasos'],['strive','strove','striven','esforzarse'],
['arise','arose','arisen','surgir'],['awake','awoke','awoken','despertar'],['bear','bore','borne','soportar'],['beat','beat','beaten','vencer / golpear'],['behold','beheld','beheld','contemplar'],['bet','bet','bet','apostar'],['bid','bid','bid','ofertar'],['burst','burst','burst','estallar'],
['cling','clung','clung','aferrarse'],['dwell','dwelt','dwelt','habitar'],['fling','flung','flung','arrojar'],['forbid','forbade','forbidden','prohibir'],['lay','laid','laid','colocar'],['lie','lay','lain','recostarse'],['mistake','mistook','mistaken','confundir'],['overcome','overcame','overcome','superar'],
['overtake','overtook','overtaken','alcanzar / rebasar'],['redo','redid','redone','rehacer'],['repay','repaid','repaid','devolver dinero'],['retake','retook','retaken','retomar'],['rewrite','rewrote','rewritten','reescribir'],['undergo','underwent','undergone','atravesar'],['undertake','undertook','undertaken','emprender'],['upset','upset','upset','alterar / molestar'],
['weave','wove','woven','tejer'],['withdraw','withdrew','withdrawn','retirar'],['withstand','withstood','withstood','resistir'],['foresee','foresaw','foreseen','prever'],['foretell','foretold','foretold','predecir'],['mislead','misled','misled','engañar'],['misunderstand','misunderstood','misunderstood','malinterpretar'],['outgrow','outgrew','outgrown','superar al crecer'],
['overthrow','overthrew','overthrown','derrocar'],['oversleep','overslept','overslept','dormirse de más'],['overdo','overdid','overdone','exagerar'],['offset','offset','offset','compensar'],['partake','partook','partaken','participar'],['preset','preset','preset','preconfigurar'],['rebuild','rebuilt','rebuilt','reconstruir'],['remake','remade','remade','volver a hacer']
];

const ids = rows.map(([base]) => base);
const groups = [
['go','come','do','make','get','have','take','give'],
['say','tell','know','think','see','hear','find','feel'],
['eat','drink','buy','bring','cut','feed','pay','keep'],
['read','write','speak','teach','choose','forget','understand','hold'],
['run','ride','drive','fly','swim','fall','leave','become'],
...Array.from({ length: 16 }, (_, index) => ids.slice(index * 8, index * 8 + 8))
];

const worlds = [
['PJ Masks','Night Ninja','01-pj-masks-night-ninja.png','#283b83'],['PJ Masks','Luna Girl','02-pj-masks-luna-girl.png','#64648c'],['PJ Masks','Romeo','03-pj-masks-romeo.png','#4e9b55'],
['Paw Patrol','Mayor Humdinger','04-paw-patrol-mayor-humdinger.png','#7246a8'],['Paw Patrol','Sweetie','05-paw-patrol-sweetie.png','#a75bd0'],['Paw Patrol','Copycat','06-paw-patrol-copycat.png','#e87828'],
['Avatar','Admiral Zhao','07-avatar-admiral-zhao.png','#9e3828'],['Avatar','Azula','08-avatar-azula.png','#b52e2e'],['Avatar','Fire Lord Ozai','09-avatar-fire-lord-ozai.png','#6f1f18'],
['Harry Potter','Draco Malfoy','10-harry-potter-draco-malfoy.png','#66815c'],['Harry Potter','Bellatrix Lestrange','11-harry-potter-bellatrix-lestrange.png','#513b68'],['Harry Potter','Voldemort','12-harry-potter-voldemort.png','#3c4b45'],
['Zodiac Knights','Cassios','13-zodiac-knights-cassios.png','#8d563d'],['Zodiac Knights','Cancer Deathmask','14-zodiac-knights-deathmask.png','#593c91'],['Zodiac Knights','Hades','15-zodiac-knights-hades.png','#322553'],
['Dragon Quest: Dai','Crocodine','16-dragon-quest-crocodine.png','#357c53'],['Dragon Quest: Dai','Hadlar','17-dragon-quest-hadlar.png','#a72f2f'],['Dragon Quest: Dai','Vearn','18-dragon-quest-vearn.png','#563585'],
['Dragon Ball','Raditz','19-dragon-ball-raditz.png','#557c39'],['Dragon Ball','Frieza','20-dragon-ball-frieza.png','#7651ad'],['Dragon Ball','Majin Buu','21-dragon-ball-majin-buu.png','#d95391']
];

const preservedIds = ['everyday-actions','school-day','food-and-drinks','movement-adventure','senses-and-ideas'];
const videoLinks = {
  1: 'https://www.dropbox.com/scl/fi/8wkgpiihocvazylqxqiqk/lesson-01-night-ninja.mp4?rlkey=n116b2h1eaqmlrvuuhtluv45a&st=5ix1o33m&dl=0',
  2: 'https://www.dropbox.com/scl/fi/ify172hbvi008zvn5b6qe/lesson-02-luna-girl.mp4?rlkey=9yshs5ogx376yzd21aljbis2v&st=6rff255c&dl=0',
  3: 'https://www.dropbox.com/scl/fi/dwzyllefz5p6i7rdj424g/lesson-03-romeo.mp4?rlkey=j4i2lv43dmurfj42ixkhe40ov&st=1etf7qqc&dl=0',
  4: 'https://www.dropbox.com/scl/fi/7f1pjaa0vbvom1nraxyn0/lesson-04-mayor-humdinger.mp4?rlkey=62wbm3d5hfqy4izmpugieeoh0&dl=0',
  5: 'https://www.dropbox.com/scl/fi/kxdt6dyqymf8tznkqgrro/lesson-05-sweetie.mp4?rlkey=836x9yh8zzuifd31tww5q3wx5&dl=0',
  6: 'https://www.dropbox.com/scl/fi/0bbj9w7hhhj37tsgctucc/lesson-06-copycat.mp4?rlkey=fw0hkhs2ktv36omdaho1xsb1x&dl=0',
  7: 'https://www.dropbox.com/scl/fi/nkgcgudnpiux01bue84e1/lesson-07-admiral-zhao.mp4?rlkey=y6bzp3uhro3yd7n8amg1sifk0&dl=0',
  8: 'https://www.dropbox.com/scl/fi/l8y7ikmf6l8jdvc5omqco/lesson-08-azula.mp4?rlkey=brnpguvo32swgjva6s36s6zf3&dl=0',
  9: 'https://www.dropbox.com/scl/fi/bec8rkcitfygkflwx1o53/lesson-09-fire-lord-ozai.mp4?rlkey=sym3tb2sb4qmhdnkv6l6soo3a&dl=0',
  10: 'https://www.dropbox.com/scl/fi/zxyw4ub6zok6jzhk3yvzs/lesson-10-draco-malfoy.mp4?rlkey=4w7i0lz3vaonvallqrww6mhos&dl=0',
  11: 'https://www.dropbox.com/scl/fi/81g1b8ghr684zlhmdf2jx/lesson-11-bellatrix-lestrange.mp4?rlkey=vp81d5z369ozlbwoqz4w47yim&dl=0',
  12: 'https://www.dropbox.com/scl/fi/dm7j7vmnrvnf2gv66b04i/lesson-12-voldemort.mp4?rlkey=2s8tjnzs4a78u2xnaviysv2jp&dl=0',
  13: 'https://www.dropbox.com/scl/fi/737o8cjtp11eqpyo0odzn/lesson-13-cassios.mp4?rlkey=x9x7pn61vm51eok1vy4q5uptv&dl=0',
  14: 'https://www.dropbox.com/scl/fi/dcmm0cgspsr9qsrr23779/lesson-14-cancer-deathmask.mp4?rlkey=1x78mwqflfq787tj5h9wxna0y&dl=0',
  15: 'https://www.dropbox.com/scl/fi/r68zjd6ja4ff4w1hg20km/lesson-15-hades.mp4?rlkey=9hwd5zktspvu55dc8ts7kvm8u&dl=0',
  16: 'https://www.dropbox.com/scl/fi/2p4zytkc7up6p9tg93e4v/lesson-16-crocodine.mp4?rlkey=z1dygkodrcc05ghhpu84c6g8p&dl=0',
  17: 'https://www.dropbox.com/scl/fi/ykmje1cq2noe0iobjl7at/lesson-17-hadlar.mp4?rlkey=ulk7x97vh9afgl7zor8abp5pt&dl=0',
  18: 'https://www.dropbox.com/scl/fi/3xpmkeuqsik2o4mrfj0ki/lesson-18-vearn.mp4?rlkey=0qlyn66wdzi20hhalr96ifa48&dl=0',
  19: 'https://www.dropbox.com/scl/fi/m4m1v9tp9fekwu9oq4qnh/lesson-19-raditz.mp4?rlkey=ynvyxpc6dmpyvapn9ni0ik0na&dl=0',
  20: 'https://www.dropbox.com/scl/fi/8j8ztnz27v84jpadkvu0l/lesson-20-frieza.mp4?rlkey=so4uqwk03bglc6lry5neg3erh&dl=0',
  21: 'https://www.dropbox.com/scl/fi/ornuxurqd5g5sy3lgi0if/lesson-21-majin-buu.mp4?rlkey=4dduw3yc6l8xz2szailel6oxl&dl=0'
};

const contexts = {
  begin:'the game after lunch',break:'a chocolate bar into pieces',build:'models with wooden blocks',catch:'the ball with both hands',draw:'comic heroes in our notebooks',grow:'tomatoes in the school garden',learn:'new words through stories',meet:'our teammates at the library',
  sing:'our favorite song together',ring:'the bell at the front desk',sit:'near the window on the bus',sleep:'under warm blankets',stand:'in line before class',wake:'before sunrise on camping trips',wear:'helmets when we ride',win:'close matches with teamwork',
  blow:'bubbles in the backyard',bite:'crisp apples at snack time',hide:'treasure under the old tree',shake:'the bottle before opening it',show:'our projects to the class',throw:'paper planes across the room',tear:'old paper for the collage',steal:'bases in our baseball games',
  bend:'the wire into a circle',bleed:'when a deep cut needs attention',burn:'dry leaves only with adult supervision',cost:'less when we shop carefully',dig:'holes for new plants',dream:'about exploring distant planets',fight:'for what is fair',hang:'our jackets beside the door',
  lead:'the team through each challenge',lend:'books to classmates who need them',light:'candles for special celebrations',lose:'points when we rush',mean:'exactly what we say',send:'messages to our cousins',spend:'time reading after dinner',sell:'lemonade at the school fair',
  set:'the table before dinner',shut:'the windows when it rains',hit:'the target with a foam ball',hurt:'our knees when we fall',let:'our friends choose the next game',put:'our supplies in the cabinet',spread:'a blanket across the grass',split:'the work into equal parts',
  rise:'early for important adventures',seek:'answers in trusted books',slide:'down the snowy hill',smell:'fresh bread from the kitchen',speed:'along the track on our bikes',spell:'difficult words one letter at a time',spin:'the wheel to choose a challenge',spring:'into action when the whistle blows',
  stick:'notes onto the classroom board',sting:'only when they feel threatened',stink:'after sitting in the sun too long',strike:'the drum with a soft mallet',sweep:'the floor after the activity',swing:'across the playground bars',weep:'during the saddest part of the story',wind:'the string around the spool',
  bind:'the pages into a small book',breed:'healthy animals on responsible farms',creep:'quietly through the pretend jungle',deal:'cards for the next round',flee:'from danger as quickly as possible',forgive:'friends after honest apologies',freeze:'fruit juice into ice pops',grind:'corn into flour',
  kneel:'beside the garden bed',lean:'against the wall while we wait',leap:'over small puddles',prove:'our ideas with clear evidence',quit:'games when they stop being safe',shine:'brightly after being polished',shoot:'foam arrows at the target',shrink:'wool sweaters in hot water',
  sink:'slowly when they fill with water',spill:'juice when cups tip over',spit:'toothpaste into the sink',spoil:'surprises by revealing them early',swear:'to tell the truth',sow:'seeds in straight rows',stride:'confidently onto the field',strive:'to improve a little every day',
  arise:'to face unexpected challenges',awake:'before the alarm on exciting mornings',bear:'the responsibility together',beat:'the other team through smart play',behold:'the stars from the hilltop',bet:'tokens during friendly games',bid:'on donated items at the fundraiser',burst:'with excitement after good news',
  cling:'to the railing in strong wind',dwell:'on mistakes for too long',fling:'soft rings toward the target',forbid:'dangerous behavior in the laboratory',lay:'the maps across the table',lie:'on the grass and watch the clouds',mistake:'one twin for the other',overcome:'difficult problems with patience',
  overtake:'slower runners near the finish',redo:'work that needs careful correction',repay:'borrowed money on time',retake:'photos when the first ones blur',rewrite:'paragraphs to make them clearer',undergo:'regular safety inspections',undertake:'projects that help our community',upset:'people when we ignore their feelings',
  weave:'colorful strips into baskets',withdraw:'money only with permission',withstand:'heavy rain and strong wind',foresee:'problems before they grow',foretell:'events in imaginative stories',mislead:'readers with incomplete information',misunderstand:'directions when we do not listen',outgrow:'clothes as we get taller',
  overthrow:'unfair rulers in history stories',oversleep:'when alarms are turned off',overdo:'exercise when we ignore our limits',offset:'costs by saving energy',partake:'in the celebration together',preset:'the timer before baking',rebuild:'structures after the storm',remake:'old objects into something useful'
};

function examples(base, past, participle, index) {
  const context = contexts[base];
  const subjects = [
    ['I','Yesterday, I','I have'],
    ['We','Last week, we','We have'],
    ['They','Earlier, they','They have'],
    ['My friends','Yesterday, my friends','My friends have']
  ];
  const [presentSubject, pastSubject, participleSubject] = subjects[index % subjects.length];
  return {
    base: `${presentSubject} ${base} ${context}.`,
    past: `${pastSubject} ${past} ${context}.`,
    participle: `${participleSubject} ${participle} ${context}.`
  };
}

export function expandCurriculum(data) {
  const existing = new Map(data.verbs.map((verb) => [verb.id, verb]));
  rows.forEach(([base, past, participle, meaning], index) => existing.set(base, { id: base, base, past, participle, meaning, difficulty: Math.min(7, 2 + Math.floor(index / 24)), examples: examples(base, past, participle, index) }));
  const units = groups.map((verbIds, index) => {
    const [theme, villain, filename, color] = worlds[index];
    const number = index + 1; const boss = number % 3 === 0;
    return {
      id: preservedIds[index] || `lesson-${String(number).padStart(2, '0')}`,
      number,
      title: boss ? `${villain}'s Boss Challenge` : `${villain}'s Challenge`,
      description: `Master eight ${number < 7 ? 'high-frequency' : number < 13 ? 'intermediate' : 'advanced'} irregular verbs and outsmart ${villain}.`,
      theme: theme.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), themeLabel: theme, villain, villainImage: `assets/lesson-villains/${filename}`, themeColor: color, boss,
      video: { provider: 'dropbox', title: `Lesson ${String(number).padStart(2, '0')}: Training Film`, description: `Meet the eight verbs before facing ${villain}.`, shareUrl: videoLinks[number] || '', posterPath: `assets/video-posters/unit-${String(number).padStart(2, '0')}.png`, transcriptPath: `docs/video-scripts/unit-${String(number).padStart(2, '0')}.md` }, verbIds
    };
  });
  return { ...data, schemaVersion: 2, units, verbs: [...existing.values()] };
}
