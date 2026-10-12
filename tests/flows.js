// Flow test for 2.0: tour → Pad → square → session → Lees → Grote Markt → Gebruik → Woorden/Kaarten
// → Naslag search → backup / restore (a 1.5 backup too) → saved across reload. Fails on any page error.
// Screenshots go to $SHOTS when it is set.
const {openApp} = require('./page');
const fs = require('fs'); const path = require('path');
const SHOTS = process.env.SHOTS; if (SHOTS) fs.mkdirSync(SHOTS, {recursive: true});
const fails = []; const ok = (cond, msg) => { if (!cond) fails.push(msg); console.log((cond ? '  ok   ' : '  FAIL ') + msg); };
(async () => {
  const {p, errs, close} = await openApp();
  const shot = async (n, pg = p) => { if (SHOTS) await pg.screenshot({path: path.join(SHOTS, n + '.png')}); };
  ok(await p.evaluate(() => typeof window.claude === 'undefined' && !document.documentElement.outerHTML.includes('window.claude')), 'no window.claude in the page');

  // first run: the welcome screen (restore or start new), then the tour, then Pad
  ok(!!(await p.$('#welcome #mig-go')) && !(await p.$('#tour')), 'first run offers "Zet je back-up uit de oude app terug"'); await shot('00_welcome');
  await p.click('#mig-new'); await p.waitForTimeout(150);
  ok(!!(await p.$('#tour')), '"Ik begin nieuw" starts the tour'); await shot('01_tour');
  await p.click('[data-act=tour-end]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => TAB === 'pad' && !!document.querySelector('#world')), 'Pad with the world map'); await shot('02_pad');

  // Documenten voor Claude: the generator writes exactly praten-project/*.md (no own words yet)
  const docs = await p.evaluate(() => Object.fromEntries(Object.keys(DOCS).map(n => [n, DOCS[n]()])));
  // Woorden.md in the repo also lists the imported set "Mijn woorden 1" (report.js checks that part)
  const docFile = n => { const t = fs.readFileSync(path.join(require('./page').ROOT, 'praten-project', n), 'utf8'); return n === 'Woorden.md' ? t.split('\n## Set ·')[0].replace(/\n*$/, '\n') : t; };
  for (const n of Object.keys(docs)) ok(docs[n] === docFile(n), `${n} generated from the app matches praten-project/${n}`);

  // the maps: no road crosses another, none runs over a square, every road meets a square at the middle of a side
  const mp = await p.evaluate(() => {
    const check = (roads, sqs) => { const inSq = (x, y, m) => sqs.some(q => { const [cx, cy] = sqCenter(q); return Math.abs(x - cx) < q.h * TS - m && Math.abs(y - cy) < q.h * TS - m; });
      const own = roads.map(pts => new Set(pts.filter(([x, y]) => !sqs.some(q => { const [cx, cy] = sqCenter(q); return Math.abs(x - cx) < q.h * TS + 8 && Math.abs(y - cy) < q.h * TS + 8; })).map(([x, y]) => Math.round(x / 4) + ',' + Math.round(y / 4))));
      let cross = 0; for (let i = 0; i < own.length; i++) for (let j = i + 1; j < own.length; j++) cross += [...own[i]].filter(k => own[j].has(k)).length;
      return {cross, over: roads.reduce((a, pts) => a + pts.filter(([x, y]) => inSq(x, y, 2)).length, 0)}; };
    if (!WORLD) buildWorld(); const w = check(WORLD.roads, WORLD.squares);
    const towns = UNITS.filter(u => u.built).map(u => { const t = buildTown(u.id); return check(t.roads, t.squares); });
    const ends = WROADS.every((r, k) => { const a = WORLD.roads[k][0], b = WORLD.roads[k][WORLD.roads[k].length - 1], A = sqSide(WSQ[r.from], r.out), B = sqSide(WSQ[r.to], r.in); return Math.hypot(a[0] - A[0], a[1] - A[1]) < 1 && Math.hypot(b[0] - B[0], b[1] - B[1]) < 1; });
    return {w, towns, ends, kinds: [...new Set(WROADS.map(r => r.kind))].sort().join(',')}; });
  ok(mp.w.cross === 0 && mp.w.over === 0 && mp.towns.every(t => t.cross === 0 && t.over === 0) && mp.ends, 'maps: no road crosses another or runs over a square; roads meet squares at the middle of a side');
  ok(mp.kinds === 'L,curve,line', 'world map mixes straight roads, 90° turns and curves');
  const rideT = await p.evaluate(async () => { PAD.lvl = 'arc'; render(); await new Promise(r => setTimeout(r, 100)); const t0 = performance.now(); const seen = new Set();
    const pr = ride(WORLD.legs[3].slice()); const iv = setInterval(() => seen.add(/scale\(-/.test($('#hero').getAttribute('transform')) ? 'left' : 'right'), 50); await pr; clearInterval(iv); return {ms: Math.round(performance.now() - t0), seen: [...seen].sort().join(',')}; });
  ok(rideT.seen.includes('left') && rideT.ms < 1800, `the cyclist faces left when riding left, and rides a road in ${rideT.ms} ms`);

  // reload: opens in Scroll by default, state saved in edz.v2 (800 ms debounce, flushed on pagehide)
  await p.waitForTimeout(900);
  ok(await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('edz.v2') || 'null'); return !!(s && s.v === 3 && s.coach.tour); }), 'state saved in localStorage edz.v2 with v 3');
  await p.reload(); await p.waitForTimeout(700);
  ok(!!(await p.$('#feed')) && !(await p.$('#tour')), 'second start opens Scroll, no tour');
  await p.evaluate(() => closeFeed());

  // a square: Ontdek → Oefen session, answering everything correctly
  await p.evaluate(() => { S.settings.test = true; S.coach = {tour: 1, pad: 1, town: 1, square: 1, lees: 1, markt: 1, plan: 1, woorden: 1, naslag: 1, cards: 1, ontdek: 1}; TAB = 'pad'; PAD.lvl = 'sq'; PAD.q = 'u1q1'; PAD.u = 'u1'; render(); });
  await shot('03_square');
  await p.evaluate(() => startStep('u1q1', 'ontdek')); await p.waitForTimeout(200);
  ok(!!(await p.$('#lesson')), 'Ontdek lesson opens'); await shot('04_lesson');
  await p.click('[data-act="lesson-done"]'); await p.waitForTimeout(200);
  const answerAll = () => p.evaluate(() => { for (let i = 0; i < 200; i++) { if (!SES || SES.finished) break; const st = SES.steps[SES.i]; if (!st) { sesRender(); break; } if (st.intro) { sesNext(); continue; } const ex = SES.ex; if (ex.type === 'order') ex.type = 'type'; submitAnswer(ex.answer); sesNext(); } return SES && SES.finished; });
  ok(await answerAll(), 'Oefen session runs to the end'); await shot('05_session_end');
  ok(await p.evaluate(() => (S.sq.u1q1.steps.oefen || 0) >= 80), 'Oefen checkpoint stored');
  await p.evaluate(() => closeSession());

  // Lees
  await p.evaluate(() => { PAD.lvl = 'sq'; PAD.q = 'u7q1'; PAD.u = 'u7'; render(); startStep('u7q1', 'lees'); }); await p.waitForTimeout(200);
  if (await p.evaluate(() => !!READ.u7q1)) {
    await p.evaluate(() => READ.u7q1.qs.forEach((q, i) => readAnswer(i, q.a))); await shot('06_read');
    ok(await p.evaluate(() => S.sq.u7q1.steps.lees === 100), 'Lees: three right answers mark the house done');
    await p.click('[data-act=read-close]');
  }

  // Grote Markt review + Gebruik sheet (no tutor any more)
  await p.evaluate(() => { PAD.lvl = 'markt'; PAD.u = 'u7'; render(); }); await shot('07_markt');
  ok(!(await p.$('[data-act=talk-start]')) && !(await p.$('[data-act=markt-write]')), 'Grote Markt has no in-app tutor or writing lines');
  await p.click('[data-act=markt-review]'); await p.waitForTimeout(200);
  ok(await answerAll(), 'Grote Markt review runs'); ok(await p.evaluate(() => S.markt.u7 >= 80), 'Grote Markt score stored');
  await p.evaluate(() => closeSession());
  await p.evaluate(() => startStep('u7q1', 'gebruik')); await p.waitForTimeout(150);
  ok(!!(await p.$('#sheetback')), 'Gebruik opens a sheet'); await shot('08_gebruik'); await p.evaluate(() => closeSheet());

  // Woorden, word card, Kaarten with a swipe
  await p.click('#tabs [data-tab=woorden]'); await p.waitForTimeout(150); await shot('09_woorden');
  await p.evaluate(() => showWord('nemen')); await p.waitForTimeout(100);
  ok(!(await p.$('[data-act=zeg]')), 'word card has no Zeg het anders'); await shot('10_word'); await p.evaluate(() => closeSheet());
  await p.click('[data-act=wview][data-v=soort]'); await p.click('[data-act=cards][data-set="g:soort:v"]'); await p.waitForTimeout(100);
  ok(await p.inputValue('#cd-deck') === 'g:soort:v', 'Kaarten on the Werkwoorden group opens the cards with that group'); await p.click('#cd-go'); await p.waitForTimeout(150);
  const box = await (await p.$('#fcard')).boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + 100); await p.mouse.down(); await p.mouse.move(box.x + box.width / 2 + 160, box.y + 110, {steps: 8}); await p.mouse.up(); await p.waitForTimeout(400);
  ok(await p.evaluate(() => CARDS.known.length === 1), 'swipe right counts as known'); await p.evaluate(() => closeOverlay('cards'));

  // quick add a word from a lesson sentence (no Claude draft button)
  await p.evaluate(() => { TAB = 'pad'; render(); openLesson('u7q1', true); }); await p.waitForTimeout(150);
  const nw = await p.$('#lesson .rw.new');
  if (nw) await nw.click(); else await p.evaluate(() => { closeOverlay('lesson'); quickAdd('ambetant'); });
  await p.waitForTimeout(100); await p.click('#qa-go'); await p.waitForTimeout(100);
  ok(!(await p.$('#nw-draft')), 'word form has no Claude draft'); await p.fill('#nw-d', 'test uitleg'); await p.click('#wform button[type=submit]');
  ok(await p.evaluate(() => Object.keys(S.custom).length >= 1), 'own word saved'); await p.evaluate(() => closeOverlay('lesson'));

  // Naslag search
  await p.click('#tabs [data-tab=naslag]'); await p.waitForTimeout(200);
  await p.fill('#nsearch', 'verkleinwoord'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => $$('#ncur details.nsq:not([hidden])').length > 0), 'Naslag search finds squares'); await shot('11_naslag');

  // Ik: backup buttons, no usage meter
  await p.click('#tabs [data-tab=ik]'); await p.waitForTimeout(150); await shot('12_ik');
  ok(!(await p.$('[data-en="Claude usage this week"]')), 'Ik has no Claude usage meter');
  const [dl] = await Promise.all([p.waitForEvent('download', {timeout: 3000}).catch(() => null), p.click('[data-act=export]')]);
  let backup = null; if (dl) backup = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  ok(backup && backup.v === 3 && backup.items && /^elkedagzin-backup-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()), 'Bewaar back-up downloads a 2.0 backup');
  ok(await p.evaluate(() => S.settings.lastBackup > 0), 'last backup time stored');
  await p.click('[data-act=export-text]'); await p.waitForTimeout(100); ok(await p.evaluate(() => JSON.parse($('#exp-t').value).v === 3), 'Kopieer als tekst shows the backup'); await p.evaluate(() => closeSheet());

  // Documenten voor Claude screen: Woorden.md now carries the own word
  await p.click('[data-act=docs]'); await p.waitForTimeout(150); await shot('12b_docs');
  const [dd] = await Promise.all([p.waitForEvent('download', {timeout: 3000}).catch(() => null), p.click('[data-act=doc-save][data-id="Woorden.md"]')]);
  const wtxt = dd ? fs.readFileSync(await dd.path(), 'utf8') : '';
  const ownW = await p.evaluate(() => Object.values(S.custom)[0].w);
  ok(dd && dd.suggestedFilename() === 'Woorden.md' && wtxt.includes('## Eigen woorden') && wtxt.split('## Eigen woorden')[1].includes(ownW), 'Woorden.md downloads with the own words');
  await p.evaluate(() => closeOverlay('docs'));

  // backup reminder on Pad after 14 days
  await p.evaluate(() => { S.settings.lastBackup = Date.now() - 15 * 864e5; TAB = 'pad'; PAD.lvl = 'arc'; render(); });
  ok(await p.evaluate(() => !!document.querySelector('#main [data-act=export]')), 'backup reminder on Pad after 14 days'); await shot('13_reminder');
  await p.evaluate(() => { S.settings.lastBackup = Date.now(); render(); });
  ok(await p.evaluate(() => !document.querySelector('#main [data-act=export]')), 'no reminder right after a backup');

  // restore a 1.5 backup (v 2, the 1.5 shape: no seenAt, imports or praten settings)
  const old = {v: 2, savedAt: 1760000000000, items: {'w:station:rec': {d: 20000, i: 3, e: 2.5, r: 2, l: 0, s: 19990}}, sq: {u1q1: {steps: {ontdek: 1, oefen: 90, luister: 85}}, u1q2: {steps: {ontdek: 1}}}, cur: 'u1q2', seen: {station: 1}, activity: {'2026-10-01': {n: 12, m: 4}},
    sets: [{id: 's-1', name: 'Uit de les – week 40', ids: ['u-1']}], custom: {'u-1': {id: 'u-1', custom: true, u: 0, w: 'ambetant', p: 'adj', d: 'vervelend', s: '', en: 'annoying', plan: 'u7q1'}},
    coach: {tour: 1}, settings: {rate: 0.85, cap: 90, voice: '', autoAudio: false, test: false, talkAudio: true, startView: 'pad'}, mission: {}, log: [{id: 'l1', date: '2026-09-20', mode: 'reflect', source: 'les', text: 'Ik heb geleerd...', status: 'done'}],
    talks: [{id: 't1', date: '2026-09-21', sc: 'sc-free', msgs: [{who: 'me', text: 'Hallo'}]}], fix: {f1: {wrong: 'omdat het is oud', right: 'omdat het oud is', why: 'verb last', type: 'word order', src: 'talk', date: '2026-09-21', plan: 'u7q1'}},
    extras: [], sic: {}, markt: {u1: 85}, usage: {'20000': {calls: 3, tok: 100, k: {}}}};
  const f = path.join(require('os').tmpdir(), 'edz-old-backup.json'); fs.writeFileSync(f, JSON.stringify(old));
  await p.evaluate(() => { TAB = 'ik'; render(); });
  await p.setInputFiles('#imp-file', f); await p.waitForTimeout(200); await shot('14_restore_confirm');
  await p.evaluate(() => { const yes = [...document.querySelectorAll('#sheetback button')].find(x => x.textContent.trim() === 'Vervang'); yes.click(); }); await p.waitForTimeout(300);
  const after = await p.evaluate(() => ({v: S.v, oefen: S.sq.u1q1.steps.oefen, cur: S.cur, item: !!S.items['w:station:rec'], custom: S.custom['u-1'] && S.custom['u-1'].w, sets: S.sets.length, fix: S.fix.f1 && S.fix.f1.plan, markt: S.markt.u1, cap: S.settings.cap, rate: S.settings.rate, start: S.settings.startView, test: S.settings.test, log: S.log.length, talks: S.talks.length, praten: S.settings.praten && S.settings.praten.mode, imports: Array.isArray(S.imports), seenAt: typeof S.seenAt, usage: !!S.usage}));
  console.log('  restored', JSON.stringify(after));
  ok(after.v === 3 && after.oefen === 90 && after.cur === 'u1q2' && after.item && after.custom === 'ambetant' && after.sets === 1 && after.fix === 'u7q1' && after.markt === 85, '1.5 backup restores progress, review items, own words, sets, corrections with places, Grote Markt');
  ok(after.cap === 90 && after.rate === 0.85 && after.start === 'pad' && after.test === false && after.log === 1 && after.talks === 1 && after.usage, '1.5 backup restores settings, log, talks and keeps usage');
  ok(after.praten === 'onderwerp' && after.imports && after.seenAt === 'object', 'migrate adds the 2.0 fields');

  // a broken file never crashes
  fs.writeFileSync(f, '{not json'); await p.setInputFiles('#imp-file', f); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.custom['u-1'] && !document.querySelector('#sheetback')), 'broken backup file is refused with a message');

  // the restored state survives a reload
  await p.reload(); await p.waitForTimeout(700);
  ok(await p.evaluate(() => S.sq.u1q1.steps.oefen === 90 && S.custom['u-1'] && TAB === 'pad' && !document.querySelector('#feed')), 'restored state survives a reload (start view Pad)');
  await shot('15_after_reload');

  await close();

  // ---- first run with a 1.5 backup (MIGRATION.md §C) ----
  const f2 = path.join(require('os').tmpdir(), 'edz-old-backup-2.json'); fs.writeFileSync(f2, JSON.stringify(old));
  const M = await openApp({wait: 400});
  await M.p.setInputFiles('#mig-file', f2); await M.p.waitForTimeout(300); await shot('17_migrated', M.p);
  const mig = await M.p.evaluate(() => ({h: (document.querySelector('#welcome h1') || {}).textContent, n: $$('#welcome .big-num').map(x => +x.textContent), oefen: S.sq.u1q1 && S.sq.u1q1.steps.oefen, own: S.custom['u-1'] && S.custom['u-1'].w, tour: !!document.querySelector('#tour'), saved: !!localStorage.getItem('edz.v2')}));
  ok(mig.h === 'Je voortgang is hier' && mig.oefen === 90 && mig.own === 'ambetant' && !mig.tour && mig.saved, 'first run: restoring the old backup brings the progress, no tour');
  ok(mig.n.length === 8 && mig.n[0] === 1 && mig.n[3] === 1 && mig.n[5] === 1, 'summary counts: 1 plein klaar, 1 eigen woord, 1 correctie');
  await M.p.click('#welcome [data-act=docs]'); await M.p.waitForTimeout(150);
  ok(!!(await M.p.$('#docs')), 'summary leads to Documenten voor Claude');
  await M.p.reload(); await M.p.waitForTimeout(500);
  ok(await M.p.evaluate(() => !document.querySelector('#welcome') && S.custom['u-1']), 'after the restore the next start goes straight to the app');
  fs.writeFileSync(f, '{"hallo":1}'); const M2 = await openApp({wait: 400});
  await M2.p.setInputFiles('#mig-file', f); await M2.p.waitForTimeout(200);
  ok(/geen back-up/.test(await M2.p.textContent('#mig-out')), 'a wrong file on the welcome screen gets a clear message');
  errs.push(...M.errs, ...M2.errs); await M.close(); await M2.close();

  // ---- Home Screen app: manifest, icons, service worker, offline, update toast ----
  const A = await openApp({sw: true, wait: 300});
  const P = A.p;
  const man = await P.evaluate(async () => { const r = await fetch(document.querySelector('link[rel=manifest]').href); return r.json(); });
  ok(man.name === 'Elke Dag Zin' && man.short_name === 'Dagzin' && man.display === 'standalone' && man.background_color === '#FFFFFF' && man.theme_color === '#FFFFFF', 'manifest: names, standalone, white');
  const sizes = await P.evaluate(async icons => Promise.all(icons.map(i => new Promise(res => { const im = new Image(); im.onload = () => res(i.sizes === im.width + 'x' + im.height); im.onerror = () => res(false); im.src = i.src; }))), man.icons);
  ok(sizes.every(Boolean) && man.icons.some(i => i.purpose === 'maskable') && ['180x180', '192x192', '512x512'].every(z => man.icons.some(i => i.sizes === z)), 'manifest icons 180/192/512 + maskable load at their sizes');
  ok(await P.evaluate(() => { const v = document.querySelector('meta[name=viewport]').content; return v.includes('viewport-fit=cover') && document.querySelector('meta[name=apple-mobile-web-app-capable]').content === 'yes' && !!document.querySelector('link[rel=apple-touch-icon]'); }), 'iOS meta tags and viewport-fit=cover');
  ok(await P.evaluate(() => { const css = document.querySelector('style').textContent; return /#tabs\{[^}]*safe-area-inset-bottom/.test(css) && /#main\{[^}]*safe-area-inset-top/.test(css); }), 'safe areas: top padding on #main, bottom padding on the tab bar');
  await P.evaluate(() => navigator.serviceWorker.ready); await P.reload(); await P.waitForTimeout(500);
  ok(await P.evaluate(() => !!navigator.serviceWorker.controller), 'service worker controls the page');
  await A.ctx.setOffline(true); await P.reload(); await P.waitForTimeout(600);
  ok(await P.evaluate(() => typeof S === 'object' && !!document.querySelector('#tabs')), 'works offline after the first visit');
  await A.ctx.setOffline(false);
  ok(!(await P.$('#update')), 'no update toast without a new version');
  A.server.overrides['/sw.js'] = require('fs').readFileSync(require('path').join(require('./page').ROOT, 'sw.js'), 'utf8').replace(/edz-[0-9a-f]+/, 'edz-test-next');
  await P.evaluate(() => navigator.serviceWorker.getRegistration().then(r => r.update())); await P.waitForTimeout(1200);
  ok(!!(await P.$('#update')), 'update toast "Nieuwe versie · Herlaad" when a new version waits'); await shot('16_update', P);
  await Promise.all([P.waitForEvent('load', {timeout: 5000}).catch(() => null), P.click('#update button')]); await P.waitForTimeout(600);
  ok(await P.evaluate(async () => (await caches.keys()).includes('edz-test-next') && !document.querySelector('#update')), 'Herlaad activates the new version and reloads');
  const cdp = await A.ctx.newCDPSession(P);
  const inst = await cdp.send('Page.getInstallabilityErrors');
  ok(inst.installabilityErrors.length === 0, 'Chrome says the app is installable' + (inst.installabilityErrors.length ? ': ' + JSON.stringify(inst.installabilityErrors) : ''));
  // iPhone with a notch: 47px on top, 34px home indicator
  const pads = await P.evaluate(() => { const st = document.querySelector('style'); st.textContent = st.textContent.replace(/env\(safe-area-inset-top,0px\)/g, '47px').replace(/env\(safe-area-inset-bottom,0px\)/g, '34px');
    const cs = el => getComputedStyle(document.querySelector(el)); const tb = document.querySelector('#tabs').getBoundingClientRect();
    return {main: cs('#main').paddingTop, tabs: cs('#tabs').paddingBottom, tabsBottom: Math.round(tb.bottom), h: innerHeight}; });
  await shot('18_notch', P);
  ok(pads.main === '67px' && pads.tabs === '34px' && pads.tabsBottom === pads.h, 'with a notch: content starts below it, tab bar sits above the home indicator');
  const weight = require('fs').statSync(require('path').join(require('./page').ROOT, 'index.html')).size;
  ok(weight < 1024 * 1024, `page weight ${Math.round(weight / 1024)} KB < 1 MB`);
  errs.push(...A.errs); await A.close();
  if (errs.length) { console.log('PAGE ERRORS', errs); fails.push('page errors'); }
  console.log(fails.length ? `FAIL: ${fails.length}` : 'OK: flows passed, no page errors');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
