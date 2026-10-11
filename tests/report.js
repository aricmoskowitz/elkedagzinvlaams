// Report import and start block. Runs the parser on every fixture in tests/reports/, imports the
// FORMATS.md example through the real review screen, and checks EDZ-START v1 for all four modes.
const {openApp} = require('./page');
const fs = require('fs'); const path = require('path');
const DIR = path.join(__dirname, 'reports');
const fx = n => fs.readFileSync(path.join(DIR, n), 'utf8');
const fails = []; const ok = (cond, msg) => { if (!cond) fails.push(msg); console.log((cond ? '  ok   ' : '  FAIL ') + msg); };
(async () => {
  const {p, errs, close} = await openApp();
  await p.evaluate(() => { closeOverlay('tour'); S.coach = {tour: 1, pad: 1, praten: 1, plan: 1}; render(); });
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
  await p.evaluate(() => { closeFeed && FEED && closeFeed(); closeOverlay('tour'); startStep('u7q1', 'gebruik'); }); await p.waitForTimeout(150);
  ok((await p.inputValue('#pr-block')).includes('modus: opdracht') && (await p.inputValue('#pr-block')).includes('(u7q1)'), 'Gebruik house opens the start block in opdracht for its square');

  await close();
  if (errs.length) { console.log('PAGE ERRORS', errs); fails.push('page errors'); }
  console.log(fails.length ? `FAIL: ${fails.length}` : 'OK: report import and start block');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
