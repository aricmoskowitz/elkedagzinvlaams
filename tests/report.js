// Report import and start block. Runs the parser on every fixture in tests/reports/, imports the
// FORMATS.md example through the real review screen, and checks EDZ-START v1 for all four modes.
const {openApp} = require('./page');
const fs = require('fs'); const path = require('path');
const DIR = path.join(__dirname, 'reports');
const fx = n => fs.readFileSync(path.join(DIR, n), 'utf8');
const fails = []; const ok = (cond, msg) => { if (!cond) fails.push(msg); console.log((cond ? '  ok   ' : '  FAIL ') + msg); };
(async () => {
  const {p, errs, close} = await openApp();
  await p.evaluate(() => { closeOverlay('welcome'); closeOverlay('tour'); S.coach = {tour: 1, pad: 1, praten: 1, plan: 1}; render(); });
  const parse = t => p.evaluate(t => { const r = parseReport(t); return r.error ? {error: r.error, hint: r.hint} : {hash: r.hash, d: r.data}; }, t);

  // ---- parser on the fixtures ----
  const valid = await parse(fx('valid.txt'));
  ok(valid.d && valid.d.modus === 'opdracht' && valid.d.plein === 'u7q2' && valid.d.corrections.length === 3 && valid.d.words.length === 1 && valid.d.goed.length === 1, 'valid: text around the block is ignored, all fields read');
  const smart = await parse(fx('smart-quotes.txt'));
  ok(smart.d && smart.d.corrections.length === 3 && smart.d.samenvatting.startsWith('Je vertelde'), 'smart quotes are straightened');
  const noEnd = await parse(fx('no-end-marker.txt'));
  ok(noEnd.d ? noEnd.d.corrections.length === 3 : /einde|EDZ-EINDE/i.test(noEnd.error), 'missing end marker: read when the JSON is complete, else a clear message');
  const unk = await parse(fx('unknown-ids.txt'));
  ok(unk.d && unk.d.corrections[0].plan === null && unk.d.corrections[1].plan === null && unk.d.goed[0].plan === null && unk.d.corrections[2].newTopic && unk.d.corrections[2].newTopic.town === 'u4', 'unknown square ids become null (Algemeen), newTopic kept');
  const broken = await parse(fx('broken-json.txt'));
  ok(broken.error && /JSON/.test(broken.error) && /geef het verslag opnieuw als geldige JSON/.test(broken.hint), 'invalid JSON: friendly error that says what to ask Claude');
  const wk = await parse(fx('words-known.txt'));
  ok(wk.d && wk.d.words.map(w => w.w).join(',') === 'ambetant,kraam' && wk.d.words[1].g === 'de' && wk.d.wordsKnown.length === 3, 'words already in the app are dropped (also plurals and verb forms); "de kraam" → kraam (de)');
  const fenced = await parse(fx('dagboek-fenced.txt'));
  ok(fenced.d && fenced.d.modus === 'dagboek' && fenced.d.tekst.startsWith('Vandaag') && fenced.d.samenvatting.includes('‘omdat’'), 'code fences stripped; curly apostrophes inside text survive');
  const foto = await parse(fx('foto.txt'));
  ok(foto.d && foto.d.modus === 'foto' && foto.d.bron && foto.d.words[0].w === 'whiteboard' && foto.d.words[0].g === 'het', 'foto report: bron, tekst, words');
  const none = await parse(fx('no-report.txt'));
  ok(none.error && /geen verslag/.test(none.error), 'no report in the text: friendly error');
  for (const junk of ['', 'EDZ-VERSLAG v1', 'EDZ-VERSLAG v1\n[1,2]\nEDZ-EINDE', 'EDZ-VERSLAG v1\n{"corrections":"x","words":{"a":1},"goed":null}\nEDZ-EINDE', 'EDZ-VERSLAG v1\n{"corrections":[null,1,{"wrong":5}],"plein":{"x":1}}\nEDZ-EINDE', '\u0000'.repeat(10)]) {
    const r = await p.evaluate(t => { try { const x = importReport(t); closeOverlay('proc'); return x.error ? 'error' : 'ok'; } catch (e) { return 'THROW ' + e.message; } }, junk);
    ok(!r.startsWith('THROW'), 'never crashes on ' + JSON.stringify(junk.slice(0, 40)) + ' → ' + r);
  }

  // ---- the FORMATS.md example through the real screen (acceptance 5) ----
  const before = await p.evaluate(() => ({fix: Object.keys(S.fix).length, custom: Object.keys(S.custom).length, extras: S.extras.length, geb: stepDone('u7q2', 'gebruik')}));
  await p.click('[data-act=verslag]'); await p.waitForTimeout(150);
  await p.fill('#rep-t', fx('valid.txt')); await p.click('#rep-go'); await p.waitForTimeout(250);
  ok(!!(await p.$('#proc')), 'Verwerk opens the review screen');
  const cards = await p.evaluate(() => $$('#proc .placecard .loc').map(x => x.textContent.trim()));
  console.log('  places:', JSON.stringify(cards));
  ok(cards.length >= 4 && cards.some(c => c.includes('Boog 1 · Stad 7')) && cards.some(c => /nieuw in je plan/.test(c)), 'review screen groups items by place (Boog · Stad · Plein), the new topic marked');
  if (process.env.SHOTS) await p.screenshot({path: path.join(process.env.SHOTS, 'r1_review.png')});
  await p.click('#proc-save'); await p.waitForTimeout(200);
  const after = await p.evaluate(() => { const fx = Object.values(S.fix); const nx = S.extras[S.extras.length - 1];
    return {fix: fx.length, custom: Object.keys(S.custom).length, extras: S.extras.length, geb: stepDone('u7q2', 'gebruik'), plans: fx.map(f => f.plan), newTopicPlan: nx && fx.some(f => f.plan === nx.id), nx: nx && nx.title + ' / ' + nx.town,
      set: (S.sets.find(s => /^Uit Claude – week \d+$/.test(s.name)) || {}).ids, talk: S.talks[0], imports: S.imports.length, sic: Object.keys(S.sic), srcs: fx.map(f => f.src)}; });
  console.log('  saved:', JSON.stringify(after));
  ok(after.fix - before.fix === 3 && after.newTopicPlan && after.extras - before.extras === 1, 'saving adds 3 corrections, one under a new topic');
  ok(after.custom - before.custom === 1 && after.set && after.set.length === 1, 'saving adds 1 word, in set "Uit Claude – week N"');
  ok(!before.geb && after.geb, 'saving marks the Gebruik house of u7q2 done');
  ok(after.talk && after.talk.src === 'claude' && after.talk.good.startsWith('Je vertelde') && after.imports === 1 && after.srcs.every(s => s === 'opdracht'), 'samenvatting in the history, import hash stored, corrections tagged with the mode');
  // duplicate
  await p.click('[data-act=verslag]'); await p.waitForTimeout(100); await p.fill('#rep-t', fx('valid.txt')); await p.click('#rep-go'); await p.waitForTimeout(150);
  ok(!(await p.$('#proc')) && /al verwerkt/.test(await p.textContent('#rep-err')), 'the same report twice is refused');
  // broken report in the sheet
  await p.fill('#rep-t', fx('broken-json.txt')); await p.click('#rep-go'); await p.waitForTimeout(100);
  ok(/geldige JSON/.test(await p.textContent('#rep-err')), 'broken report shows the message in the sheet'); if (process.env.SHOTS) await p.screenshot({path: path.join(process.env.SHOTS, 'r2_error.png')});
  await p.evaluate(() => closeSheet());
  // dagboek → log entry, foto → log entry with bron
  for (const f of ['dagboek-fenced.txt', 'foto.txt']) { await p.evaluate(t => importReport(t), fx(f)); await p.click('#proc-save'); await p.waitForTimeout(100); }
  ok(await p.evaluate(() => S.log[0].mode === 'foto' && S.log[0].bron && S.log[1].mode === 'dagboek' && S.log[1].text.startsWith('Vandaag')), 'tekst of dagboek and foto reports goes to the history');
  // the review card for the fixes
  ok(await p.evaluate(() => { const id = Object.keys(S.fix).find(k => S.fix[k].src === 'opdracht'); const ex = makeEx('c:' + id + ':fix'); return check(ex, ex.answer).ok && /opdracht met Claude/.test(ex.sub); }), 'imported corrections become review cards');

  // ---- EDZ-START v1 for all four modes (acceptance 4) ----
  await p.evaluate(() => { S.seen.omdat = 1; S.seenAt.omdat = today(); S.seen.tram = 1; S.seenAt.tram = today() - 30; });
  const blocks = await p.evaluate(() => MODES.map(m => startBlock({mode: m[0]})).concat([startBlock({mode: 'opdracht', q: 'u7q2'}), startBlock({mode: 'opdracht', u: 'u7'})]));
  const need = {all: ['modus', 'datum', 'niveau', 'focus', 'taak', 'instellingen'], opdracht: ['scène', 'doel']};
  blocks.forEach((b, i) => {
    const L = b.split('\n'); const f = Object.fromEntries(L.slice(1, -1).map(l => [l.slice(0, l.indexOf(':')), l.slice(l.indexOf(':') + 1).trim()]));
    const mode = f.modus; const fields = need.all.concat(mode === 'opdracht' ? need.opdracht : []);
    const good = L[0] === 'EDZ-START v1' && L[L.length - 1] === 'EDZ-EINDE' && fields.every(k => f[k]) && (mode === 'opdracht' || (!f['scène'] && !f.doel)) && /^A2 · Boog \d+ · Stad \d+ \S+ \(u\d+\) · (Plein \d+ \S+|Grote Markt) \(u\d+q\d+\)$/.test(f.niveau) && /^vertaling (ja|nee) · verbeteren (per beurt|op het einde) · beurten \S+$/.test(f.instellingen);
    ok(good, `start block ${i}: ${mode}${i > 3 ? ' (' + f.niveau.split(' · ').pop() + ')' : ''}`);
    if (i === 0) console.log(b.replace(/^/gm, '      '));
  });
  ok(blocks[4].includes('(u7q2)') && blocks[4].includes('scène: sc-u7') && blocks[5].includes('Grote Markt (u7q4)'), 'opdracht from a square and from a Grote Markt');
  ok(/recent: .*omdat/.test(blocks[0]) && !/recent: .*\btram\b/.test(blocks[0]) && /recent: .*trappenhal/.test(blocks[0]), 'recent: words seen in the last 14 days plus own words');
  ok(/zwak: .*u1q2 inversie \(1×\)/.test(blocks[0]), 'zwak: open corrections grouped by square with counts');

  // ---- the sheet: settings remembered, copy, project link ----
  await p.evaluate(() => { TAB = 'pad'; PAD.lvl = 'arc'; render(); });
  await p.click('[data-act=praten]'); await p.waitForTimeout(150);
  await p.click('[data-pr=mode][data-v=dagboek]'); await p.click('[data-pr=vertaling][data-v=nee]'); await p.click('[data-pr=beurten][data-v="12–15"]'); await p.click('[data-pr=verbeteren][data-v=einde]');
  const txt = await p.inputValue('#pr-block');
  ok(txt.includes('modus: dagboek') && txt.includes('vertaling nee · verbeteren op het einde · beurten 12–15'), 'sheet: mode and settings change the block');
  await p.fill('#pr-url', 'geen link'); await p.click('#pr-url-save'); ok(await p.isVisible('#pr-url-err'), 'project link: a bad link is refused');
  await p.fill('#pr-url', 'https://claude.ai/project/abc'); await p.click('#pr-url-save'); await p.waitForTimeout(100);
  ok((await p.getAttribute('#pr-open', 'href')) === 'https://claude.ai/project/abc', 'project link stored, Open Claude links to it');
  if (process.env.SHOTS) await p.screenshot({path: path.join(process.env.SHOTS, 'r3_praten.png')});
  await p.evaluate(() => closeSheet()); await p.waitForTimeout(900); await p.reload(); await p.waitForTimeout(500);
  ok(await p.evaluate(() => S.settings.praten.mode === 'dagboek' && S.settings.praten.vertaling === false && S.settings.praten.beurten === '12–15' && S.settings.projectUrl.endsWith('/abc')), 'settings remembered after a reload');
  // Gebruik house opens the sheet in opdracht for that square
  await p.evaluate(() => { closeFeed && FEED && closeFeed(); closeOverlay('welcome'); closeOverlay('tour'); startStep('u7q1', 'gebruik'); }); await p.waitForTimeout(150);
  ok((await p.inputValue('#pr-block')).includes('modus: opdracht') && (await p.inputValue('#pr-block')).includes('(u7q1)'), 'Gebruik house opens the start block in opdracht for its square');

  await close();

  // ---- 2026-10-12 brief: moved words, gap words, new squares, EDZ-WOORDEN v1 ----
  const W = await openApp({wait: 400}); const q = W.p; errs.push(...W.errs);
  await q.evaluate(() => { closeOverlay('welcome'); closeOverlay('tour'); S.coach = {tour: 1, pad: 1, woorden: 1, cards: 1, sets: 1}; render(); });
  // 1. moves keep their review history (progress is stored per word id)
  await q.evaluate(() => { ['huis', 'verkoper', 'regenen'].forEach(id => { S.items['w:' + id + ':rec'] = {d: today() + 3, i: 3, e: 2.6, r: 2, l: 1, s: today()}; }); S.settings.startView = 'pad'; Store.flush(); });
  await q.reload(); await q.waitForTimeout(500);
  const mv = await q.evaluate(() => ({huis: SQ_OF_WORD.huis, verkoper: SQ_OF_WORD.verkoper, regenen: SQ_OF_WORD.regenen, oldGone: !SQ.u3q2.words.includes('huis') && !SQ.u2q2.words.includes('verkoper') && !SQ.u7q1.words.includes('regenen'),
    hist: ['huis', 'verkoper', 'regenen'].every(id => { const it = S.items['w:' + id + ':rec']; return it && it.r === 2 && it.l === 1 && it.i === 3; }), keys: squareKeys('u6q1').includes('w:huis:rec') && squareKeys('u2q1').includes('w:verkoper:rec') && squareKeys('u7q3').includes('w:regenen:conj')}));
  ok(mv.huis === 'u6q1' && mv.verkoper === 'u2q1' && mv.regenen === 'u7q3' && mv.oldGone, 'het huis → u6q1, de verkoper → u2q1, regenen → u7q3');
  ok(mv.hist && mv.keys, 'moved words keep their review history and count for their new square');
  // 2. the 15 gap words: in their squares or Algemeen, and they come up in drills
  const gap = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tests', 'gap-words.json'), 'utf8'));
  const gp = await q.evaluate(gap => gap.map(g => { const l = LEX.find(x => x.w === g.w); if (!l) return g.w + ': missing';
    const where = SQ_OF_WORD[l.id] || (ALGEMEEN_WORDS.includes(l.id) ? null : 'nowhere'); if (where !== g.plan) return g.w + ': in ' + where + ', wanted ' + g.plan;
    if ((l.g || null) !== (g.g || null) || l.d !== g.d || l.s !== g.s || l.en !== g.en) return g.w + ': fields differ';
    for (const k of lexKeys(l)) { for (let i = 0; i < 4; i++) { const ex = makeEx(k, i % 2 ? 'feed' : 'drill'); if (!check(ex, ex.answer).ok) return k + ' does not accept its answer'; } }
    return 'ok'; }), gap);
  ok(gp.every(x => x === 'ok'), '15 gap words in their squares (11) or Algemeen (4), same fields, every exercise accepts its answer' + (gp.every(x => x === 'ok') ? '' : ': ' + gp.filter(x => x !== 'ok').join('; ')));
  const drills = await q.evaluate(() => { S.items = {}; const out = [];
    ['u1q1', 'u1q2', 'u1q3', 'u4q2', 'u5q1', 'u7q1', 'u7q2', 'u7q3'].forEach(q => { for (let r = 0; r < 4; r++) { practiceKeys(q).forEach(k => introduce(k)); } out.push(q + ':' + SQ[q].words.filter(id => S.items['w:' + id + ':rec']).length + '/' + SQ[q].words.length); });
    const alg = []; reviewSet('alg'); SES.keys.forEach(k => alg.push(k.split(':')[1])); closeSession(); return {out, alg: uniq(alg).sort().join(',')}; });
  ok(drills.out.every(x => { const [a, b] = x.split(':')[1].split('/'); return a === b; }) && drills.alg === 'leren,les,nederlands,taal', 'gap words come up in Oefen; Algemeen words in "Herhaal: Algemeen · basiswoorden"');
  // 3. the two new squares
  const sq = await q.evaluate(() => ({a: PSQ.u12q4 && PSQ.u12q4.name + '/' + !!PSQ.u12q4.review, b: PSQ.u13q4 && PSQ.u13q4.name + '/' + !!PSQ.u13q4.review, m: marktId('u12') + ' ' + marktId('u13'), built: UNITS.filter(u => u.built).every(u => marktId(u.id) === u.id + 'q4'),
    rep: (() => { const r = parseReport('EDZ-VERSLAG v1\n{"v":1,"modus":"onderwerp","corrections":[{"wrong":"Ik weet hem.","right":"Ik ken hem.","why":"kennen for people","plan":"u12q4"}],"words":[{"w":"sleutel","p":"n","g":"de","d":"x","plan":"u13q4"}]}\nEDZ-EINDE'); return r.data.corrections[0].plan + ' ' + r.data.words[0].plan; })()}));
  ok(sq.a === 'Kennenplein/false' && sq.b === 'Hangplein/false' && sq.m === 'u12q5 u13q5' && sq.built, 'u12q4 Kennenplein and u13q4 Hangplein exist; only these unbuilt Grote Markten moved to q5');
  ok(sq.rep === 'u12q4 u13q4', 'a report item with "plan":"u12q4" no longer lands in Algemeen');
  // adjective forms for own words
  const adj = await q.evaluate(() => ['breed', 'zwaar', 'klaar', 'gewoon', 'voorspelbaar', 'scherp', 'gevaarlijk'].map(w => w + ':' + adjForms({w, p: 'adj'}).join('/')).join(' '));
  ok(adj === 'breed:breder/breedst zwaar:zwaarder/zwaarst klaar:klaarder/klaarst gewoon:gewoner/gewoonst voorspelbaar:voorspelbaarder/voorspelbaarst scherp:scherper/scherpst gevaarlijk:gevaarlijker/gevaarlijkst', 'adjective forms of own words follow the spelling rules: ' + adj);
  // 4. EDZ-WOORDEN v1: Mijn woorden 1
  await q.evaluate(() => { TAB = 'pad'; PAD.lvl = 'arc'; render(); });
  await q.click('[data-act=verslag]'); await q.waitForTimeout(100); await q.fill('#rep-t', fx('mijn-woorden-1.txt')); await q.click('#rep-go'); await q.waitForTimeout(250);
  const sum1 = (await q.textContent('#wi-sum')).replace(/\s+/g, ' ').trim();
  ok(sum1 === '94 nieuwe woorden · 0 al in de app · 63 naar Algemeen' && !(await q.$('#wi-rej')), 'preview of mijn-woorden-1.txt: ' + sum1);
  if (process.env.SHOTS) await q.screenshot({path: path.join(process.env.SHOTS, 'w1_preview.png')});
  await q.click('#wi-go'); await q.waitForTimeout(200);
  const after1 = await q.evaluate(() => { const s = S.sets.find(x => x.name === 'Mijn woorden 1'); const c = Object.values(S.custom);
    return {n: s && s.ids.length, custom: c.length, alg: c.filter(l => !l.plan).length, plans: c.filter(l => l.plan).length, kennen: (c.find(l => l.w === 'kennen') || {}).plan, onSquare: mineFor('u12q4').words.map(l => l.w).join(','), inHerhalen: s.ids.filter(id => S.items['w:' + id + ':rec']).length, waiting: S.drip.ids.length, maar: (c.find(l => l.w === 'maar') || {}).p, recent: startBlock({mode: 'onderwerp'}).includes('recent: ')}; });
  console.log('  imported:', JSON.stringify(after1));
  ok(after1.n === 94 && after1.custom === 94 && after1.alg === 63 && after1.plans === 31 && after1.kennen === 'u12q4' && after1.onSquare === 'kennen' && after1.maar === 'conj', 'after import, set "Mijn woorden 1" has 94 words; 31 on their square, 63 in Algemeen');
  ok(after1.inHerhalen === 12 && after1.waiting === 82, 'new words enter Herhalen 12 a day: 12 now, 82 waiting');
  const woordenMd = await q.evaluate(() => DOCS['Woorden.md']());
  ok(woordenMd === fs.readFileSync(path.join(__dirname, '..', 'praten-project', 'Woorden.md'), 'utf8'), 'Woorden.md generated after the import is the shared Woorden.md, set included');
  const snap = await q.evaluate(() => JSON.stringify([S.sets, S.custom, S.drip]));
  await q.click('[data-act=verslag]'); await q.waitForTimeout(100); await q.fill('#rep-t', fx('mijn-woorden-1.txt')); await q.click('#rep-go'); await q.waitForTimeout(250);
  const sum2 = (await q.textContent('#wi-sum')).replace(/\s+/g, ' ').trim();
  await q.click('#wi-go'); await q.waitForTimeout(150);
  ok(sum2.startsWith('0 nieuwe woorden · 94 al in de app') && snap === await q.evaluate(() => JSON.stringify([S.sets, S.custom, S.drip])), 'pasting it again changes nothing (' + sum2 + ')');
  // the next day 12 more; drilling the set releases them at once
  const drip = await q.evaluate(() => { S.drip.day = today() - 1; const a = dripRelease(); const w = S.drip.ids.length; reviewSet(S.sets.find(x => x.name === 'Mijn woorden 1').id); const k = SES.keys.length; const intro = SES.steps.filter(x => x.intro).length; closeSession(); return {a, w, after: S.drip.ids.length, k, intro}; });
  ok(drip.a === 12 && drip.w === 70 && drip.k === 15 && drip.after < 70 && drip.intro > 0, `next day 12 more (70 waiting); "Herhaal" on the set drills 15 and pulls waiting words in (${drip.after} left)`);
  // ---- 2.1: the Woorden tab by Soort · Stad · Thema · Set ----
  await q.click('#tabs [data-tab=woorden]'); await q.waitForTimeout(150);
  ok(!(await q.$('#main .btn:not(.line)')) && !(await q.$('[data-act=wseg]')) && !(await q.$('[data-act=wfilter]')), 'Woorden tab: no filled-green button, no old segments or filter chips');
  const views = await q.evaluate(() => { const n = allWords().length; const out = {n};
    ['soort', 'stad', 'thema', 'set'].forEach(v => { const gs = groupDefs(v); out[v] = gs.map(g => g.name + ':' + g.ids.length); out[v + 'Sum'] = gs.reduce((a, g) => a + g.ids.length, 0); });
    out.untagged = allWords().filter(l => !themeOf(l)).map(l => l.w); return out; });
  console.log('  views:', JSON.stringify({soort: views.soort, thema: views.thema, set: views.set, stad: views.stad.length + ' groups'}));
  ok(views.soortSum === views.n && views.stadSum === views.n && views.thema.length >= 15 && views.untagged.length === 0, `every word is in exactly one group per view (${views.n} words), and every word has a theme`);
  ok(views.stad.some(x => x.startsWith('Algemeen:')) && views.stad.some(x => /^Kennenplein|^Hemhaarhof/.test(x)) && views.set.some(x => x.startsWith('Mijn woorden 1:94')), 'Stad follows the curriculum (built and planned towns, Algemeen); Set lists your sets');
  await q.click('[data-act=wview][data-v=soort]'); await q.click('[data-act=wgroup][data-id="g:soort:n"]'); await q.waitForTimeout(100);
  const nn = await q.evaluate(() => $$('#wlist .wbody .li').length); await q.click('[data-act=wng][data-g=het]'); await q.waitForTimeout(100);
  ok(await q.evaluate(n => { const rows = $$('#wlist .wbody .li'); return rows.length < n && rows.every(r => r.querySelector('.art.het')); }, nn), 'opening the nouns shows them, and de/het filters only inside that group');
  if (process.env.SHOTS) await q.screenshot({path: path.join(process.env.SHOTS, 'w3_soort.png')});
  await q.click('[data-act=wview][data-v=thema]'); await q.waitForTimeout(100);
  if (process.env.SHOTS) await q.screenshot({path: path.join(process.env.SHOTS, 'w4_thema.png')});
  await q.click('[data-act=set-review][data-id="g:thema:eten"]'); await q.waitForTimeout(150);
  ok(await q.evaluate(() => SES && SES.keys.length > 0 && SES.keys.every(k => themeOf(LX(k.split(':')[1])) === 'eten')), 'Herhaal on the theme "Eten en drinken" drills only those words');
  await q.evaluate(() => closeSession());
  await q.click('[data-act=wview][data-v=set]'); await q.waitForTimeout(100);
  ok(await q.evaluate(() => { const g = [...document.querySelectorAll('.wgroup')].find(r => r.textContent.includes('Mijn woorden 1')); return !!g && /94 woorden · eigen lijst · 2026-10-12 · \d+ wachten/.test(g.textContent) && !!g.querySelector('[data-act=set-review]') && !!g.querySelector('.btn.line[data-act=cards]'); }), 'Set view shows "Mijn woorden 1" with Herhaal and Kaarten (both outlined)');
  if (process.env.SHOTS) await q.screenshot({path: path.join(process.env.SHOTS, 'w2_sets.png')});
  // the set page: rename, export, re-import
  const setId = await q.evaluate(() => S.sets.find(x => x.name === 'Mijn woorden 1').id);
  await q.click(`[data-act=set-edit][data-id="${setId}"]`); await q.waitForTimeout(150);
  if (process.env.SHOTS) await q.screenshot({path: path.join(process.env.SHOTS, 'w5_setpage.png')});
  await q.evaluate(() => { S.sets.push({id: 's-andere', name: 'Andere set', ids: []}); }); await q.click('[data-act=set-rename]'); await q.waitForTimeout(100); await q.fill('#rn-name', 'andere SET'); await q.click('#rn-form button[type=submit]'); await q.waitForTimeout(100);
  ok(/al een set met die naam/.test(await q.textContent('#rn-err')), 'rename: a name that is already used is refused');
  await q.fill('#rn-name', 'Woorden oktober 2026'); await q.click('#rn-form button[type=submit]'); await q.waitForTimeout(150);
  ok(await q.evaluate(id => S.sets.find(x => x.id === id).name === 'Woorden oktober 2026' && document.querySelector('#sp-name').textContent === 'Woorden oktober 2026', setId) && /## Set · Woorden oktober 2026 · eigen lijst/.test(await q.evaluate(() => DOCS['Woorden.md']())), 'rename a set; Woorden.md follows the new name');
  await q.click('[data-act=set-export]'); await q.waitForTimeout(100);
  const block = await q.inputValue('#ex-w'); await q.evaluate(() => closeSheet());
  const parsed = await q.evaluate(t => { const r = parseWords(t); return r.data ? {n: r.data.fresh.length, e: r.data.existing.length, rej: r.data.rejected.length, set: r.data.set} : r; }, block);
  ok(block.startsWith('EDZ-WOORDEN v1\n{"v":1,"set":"Woorden oktober 2026"') && block.trim().endsWith('EDZ-EINDE') && parsed.n === 0 && parsed.e === 94 && parsed.rej === 0, 'Deel als woordenlijst gives a valid EDZ-WOORDEN v1 block with all 94 words');
  // import under Ik, with a new name for the set
  await q.evaluate(() => closeOverlay('setpage')); await q.click('#tabs [data-tab=ik]'); await q.waitForTimeout(100);
  ok(await q.evaluate(() => { const b = document.querySelector('[data-act=word-import]'); const bk = [...document.querySelectorAll('.eyebrow')].find(e => e.textContent === 'Back-up'); return !!b && !!bk && b.closest('.stack').nextElementSibling === bk.closest('.stack'); }), 'Ik: "Importeer woordenlijst" sits right above Back-up');
  await q.click('[data-act=word-import]'); await q.waitForTimeout(100); await q.fill('#wim-t', block); await q.click('#wim-go'); await q.waitForTimeout(200);
  ok(await q.evaluate(() => $('#wi-name').value === 'Woorden oktober 2026' && !!$('input[name="wi-mode"][value=add]:checked')), 'same name as an existing set: preview offers "voeg toe" (default) or a new set');
  await q.fill('#wi-name', 'Week 41'); await q.waitForTimeout(50);
  if (process.env.SHOTS) await q.screenshot({path: path.join(process.env.SHOTS, 'w6_import_name.png')});
  await q.click('#wi-go'); await q.waitForTimeout(150);
  const w41 = await q.evaluate(() => { const s = S.sets.find(x => x.name === 'Week 41'); return {n: s && s.ids.length, custom: Object.keys(S.custom).length}; });
  ok(w41.n === 94 && w41.custom === after1.custom, 'import under a new name: set "Week 41" links the same 94 words, no new copies');
  // a word list with themes; a word's theme can be changed on its card
  await q.evaluate(() => importWords('EDZ-WOORDEN v1\n{"v":1,"set":"Dieren","datum":"2026-10-12","words":[{"w":"egel","p":"n","g":"de","d":"een klein dier met stekels","s":"In de tuin woont een egel.","en":"hedgehog","plan":null,"thema":"Natuur en dieren"},{"w":"spin","p":"n","g":"de","d":"een klein dier met acht poten","s":"Er zit een spin in de hoek.","en":"spider","plan":null,"thema":"onzin"}]}\nEDZ-EINDE'));
  await q.click('#wi-go'); await q.waitForTimeout(100);
  ok(await q.evaluate(() => { const c = Object.values(S.custom); return themeOf(c.find(l => l.w === 'egel')) === 'natuur' && themeOf(c.find(l => l.w === 'spin')) === ''; }), '"thema" in a word list is read (by name or id); an unknown theme leaves the word "Zonder thema"');
  await q.evaluate(() => showWord('tram')); await q.click('[data-act=theme-pick]'); await q.waitForTimeout(100); await q.click('[data-act=theme-set][data-t=stad]'); await q.waitForTimeout(100);
  ok(await q.evaluate(() => S.themes.tram === 'stad' && groupDefs('thema').find(g => g.key === 'g:thema:stad').ids.includes('tram') && document.querySelector('#sheetback .wc-word') !== null), 'change a word\'s theme on its card');
  await q.evaluate(() => closeSheet());
  // delete a set: words stay
  await q.evaluate(() => { TAB = 'woorden'; render(); openSetPage(S.sets.find(x => x.name === 'Week 41').id); }); await q.click('#setpage [data-act=set-delete]'); await q.waitForTimeout(100);
  await q.evaluate(() => { [...document.querySelectorAll('#sheetback button')].find(x => x.textContent.trim() === 'Verwijder').click(); }); await q.waitForTimeout(100);
  ok(await q.evaluate(() => !S.sets.some(x => x.name === 'Week 41') && Object.values(S.custom).some(l => l.w === 'kennen') && !document.querySelector('#setpage')), 'delete a set: the set goes, its words stay');
  ok(await q.evaluate(() => { const l = Object.values(S.custom).find(x => x.w === 'breed'); showWord(l.id); const t = document.querySelector('.facts').textContent; closeSheet(); return t.includes('breder'); }), 'word card of breed shows breder');
  // 6. a block with broken entries imports the rest and lists the broken ones (smart quotes, article in w, file picker)
  await q.evaluate(() => { TAB = 'pad'; render(); }); await q.click('[data-act=verslag]'); await q.waitForTimeout(100);
  await q.setInputFiles('#rep-f', path.join(DIR, 'woorden-broken.txt')); await q.waitForTimeout(300);
  const sum3 = (await q.textContent('#wi-sum')).replace(/\s+/g, ' ').trim(); const rej = (await q.textContent('#wi-rej')).replace(/\s+/g, ' ');
  console.log('  broken block:', sum3, '|', rej);
  ok(sum3 === '3 nieuwe woorden · 2 al in de app · 1 naar Algemeen' && /3 niet ingelezen/.test(rej) && /zonder zin: ontbreekt: s/.test(rej) && /bureau: zelfstandig naamwoord zonder de\/het/.test(rej) && /Vliegen: staat twee keer/.test(rej), 'broken entries are listed, the rest is ready to import (.txt file picker)');
  await q.click('#wi-go'); await q.waitForTimeout(150);
  ok(await q.evaluate(() => { const s = S.sets.find(x => x.name === 'Testset'); const k = Object.values(S.custom).find(l => l.w === 'kraanvogel'); return s.ids.length === 5 && k && k.g === 'de' && k.plan === 'u2q3' && s.ids.includes('tram') && !S.custom.tram; }), 'imported: kraanvogel (de, from "de kraanvogel"), vliegen, onder + linked tram and want, nothing overwritten');
  for (const bad of ['EDZ-WOORDEN v1\n{"set":"x","words":[]}\nEDZ-EINDE', 'EDZ-WOORDEN v1\n{"words":[{"w":"a"}]}\nEDZ-EINDE', 'EDZ-WOORDEN v1\n{kapot\nEDZ-EINDE', 'EDZ-WOORDEN v1\n{"set":"x","words":[null,5,"x",{"w":{}}]}\nEDZ-EINDE']) {
    const r = await q.evaluate(t => { try { const x = importWords(t); closeOverlay('wimport'); return x.error || 'preview'; } catch (e) { return 'THROW ' + e.message; } }, bad);
    ok(!r.startsWith('THROW'), 'word list never crashes: ' + r);
  }
  // 7. a report still works exactly as before in the same box
  await q.click('[data-act=verslag]'); await q.waitForTimeout(100); await q.fill('#rep-t', fx('valid.txt')); await q.click('#rep-go'); await q.waitForTimeout(250);
  ok(!!(await q.$('#proc #proc-save')) && !(await q.$('#wimport')), 'pasting an EDZ-VERSLAG v1 block still opens the report review');
  await W.close();
  if (errs.length) { console.log('PAGE ERRORS', errs); fails.push('page errors'); }
  console.log(fails.length ? `FAIL: ${fails.length}` : 'OK: report import and start block');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
