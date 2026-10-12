// Every generated exercise must accept its own answer; every reorder variant must contain the original.
const {openApp} = require('./page');
(async () => {
  const {p, errs, close} = await openApp();
  const r = await p.evaluate(() => {
    const bad = []; let n = 0;
    UNITS.filter(u => u.built).forEach(u => unitKeys(u.id).forEach(k => {
      introduce(k);
      for (let rep = 0; rep < 6; rep++) {
        if (rep == 3) S.items[k].r = 1;
        let ex; try { ex = makeEx(k, rep % 2 ? 'feed' : 'drill'); } catch (e) { bad.push(k + ' make ' + e.message); return; }
        n++; const res = check(ex, ex.answer); if (!res.ok) bad.push(k + ' ' + ex.type + ' ans="' + ex.answer + '" -> ' + res.kind);
        if (ex.options && !ex.options.map(norm).includes(norm(ex.answer))) bad.push(k + ' options missing answer');
        if (ex.options && new Set(ex.options.map(norm)).size !== ex.options.length) bad.push(k + ' dup options ' + ex.options);
      }
    }));
    SENT.forEach(s => { const v = orderVariants(s).map(norm); if (!v.includes(norm(s.nl))) bad.push(s.id + ' variant0 ' + v[0]); });
    const w1 = check(makeEx('s:u1s2:ord'), 'Morgen ik neem de tram.');
    const w2 = check({type: 'type', accept: [norm('Het broodje is nog warm.')], whole: true}, 'De broodje is nog warm');
    // 2.2: conjugation in a sentence (every occurrence, both contexts), synonym/antonym and definition cards
    let nc = 0, nr = 0, nd = 0;
    LEX.filter(l => l.v).forEach(l => conjSentences(l).forEach(o => ['drill', 'feed'].forEach(ctx => { nc++; const ex = conjSentEx('w:' + l.id + ':conj', l, o, ctx);
      if (!check(ex, ex.answer).ok) bad.push(l.id + ' conjS ' + ctx + ' ' + ex.answer);
      if (ex.options && (!ex.options.includes(ex.answer) || new Set(ex.options).size !== ex.options.length || ex.options.length < 3)) bad.push(l.id + ' conjS options ' + ex.options); })));
    allWords().forEach(l => { const r = relOf(l);
      if (r.syn.length || r.ant.length) for (let i = 0; i < 4; i++) { nr++; const ex = relEx(l); if (!ex.options.includes(ex.answer) || new Set(ex.options.map(norm)).size !== ex.options.length || ex.options.length < 3 || ex.options.some(o => o !== ex.answer && (r.syn.includes(o) || r.ant.includes(o)))) bad.push(l.id + ' rel ' + ex.options + ' / ' + ex.answer); }
      if (l.d) { nd++; const ex = defEx(l); if (!ex.options.includes(ex.answer) || new Set(ex.options.map(norm)).size !== ex.options.length || ex.options.length < 3) bad.push(l.id + ' def ' + ex.options); } });
    n += nc + nr + nd;
    S = blankState(); return {n, nbad: bad.length, bad: bad.slice(0, 40), w1: w1.kind, w2: w2.kind, conjSentence: nc, relation: nr, definition: nd};
  });
  console.log(JSON.stringify(r, null, 1));
  await close();
  const fail = r.nbad > 0 || errs.length > 0;
  if (errs.length) console.log('ERRORS', errs);
  console.log(fail ? 'FAIL' : `OK: ${r.n} exercises, 0 failures`);
  process.exit(fail ? 1 : 0);
})();
