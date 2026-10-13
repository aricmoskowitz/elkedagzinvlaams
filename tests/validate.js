// Every generated exercise must accept its own answer; every reorder variant must contain the original.
// 2.5: plus the content rules from CLAUDE.md (Writing content): Lees questions, inversion on Vertaal, the English cue,
// listening choices, the step order and enough choices on every card, also for the user's own words.
const fs = require('fs');
const {openApp} = require('./page');
(async () => {
  const {p, errs, close} = await openApp();
  const fixture = require('fs').readFileSync(require('path').join(__dirname, 'reports', 'mijn-woorden-1.txt'), 'utf8');
  await p.evaluate(t => { window.WOORDEN_FIXTURE = t; }, fixture);
  await p.evaluate(() => loadDict());
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
        if (ex.options && ex.options.length < 3) bad.push(k + ' fewer than 3 options ' + ex.options);
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
    // 2.5 (the user's review): the rules below keep these mistakes out of every new town and plein
    const built = UNITS.filter(u => u.built).flatMap(u => squaresOf(u.id));
    // Lees: five questions about the text, three different choices each, never a grammar quiz
    const GRAMMAR_Q = /werkwoord|plaats \d|onderwerp|meervoud|deelwoord|bijvoeglijk|lidwoord|de-woord|het-woord|\bde of het\b|kofschip|inversie|infinitief|\bsterk\b|\bzwak\b|…\s*$|\bstaat “|een bevel|een vraag\b|een belofte/i;
    let nq = 0;
    built.forEach(q => { const R = READ[q.id];
      if (!R) { bad.push(q.id + ' Lees: no text'); return; }
      if (R.qs.length !== 5) bad.push(q.id + ' Lees: ' + R.qs.length + ' questions, not 5');
      R.qs.forEach((x, i) => { nq++;
        if (x.o.length !== 3 || new Set(x.o.map(norm)).size !== 3 || !(x.a >= 0 && x.a < 3)) bad.push(q.id + ' Lees q' + (i + 1) + ' options/answer');
        if (GRAMMAR_Q.test(x.q) || x.o.some(o => GRAMMAR_Q.test(o))) bad.push(q.id + ' Lees q' + (i + 1) + ' is about grammar, not the text: ' + x.q); });
      const pos = [0, 1, 2].map(a => R.qs.filter(x => x.a === a).length); if (Math.max(...pos) > 3) bad.push(q.id + ' Lees: the right answer is too often in the same place ' + pos); });
    // the next guild house follows the plein's order: after Oefen comes Lees (where there is a text), then Luister
    const q0 = built[0].id; S.sq[q0] = {steps: {ontdek: 1, oefen: 100}};
    if (nextStep(q0) !== 'lees') bad.push('nextStep after Oefen is ' + nextStep(q0) + ', not lees');
    S.sq[q0].steps.lees = 100; if (nextStep(q0) !== 'luister') bad.push('nextStep after Lees is ' + nextStep(q0));
    S.sq[q0].steps.luister = 100; if (nextStep(q0) !== 'gebruik') bad.push('nextStep after Luister is ' + nextStep(q0)); delete S.sq[q0];
    // Vertaal: a sentence with inversion asks for it and accepts only that order; the others accept every correct order
    let nt = 0;
    SENT.filter(s => UNITS.some(u => u.built && u.n === s.u)).forEach(s => { nt++; const ex = makeEx('s:' + s.id + ':tr'); const inv = !s.q && !['s', '2'].includes(s.ch[0].sl);
      if (inv && (!/Begin (met|<b>zoals)/.test(ex.sub) || ex.accept.length !== 1)) bad.push(s.id + ' tr: inversion not asked for');
      if (inv && s.ch[0].t.toLowerCase().split(/\s+/).some(w => w.length > 2 && ex.sub.replace(/<[^>]+>/g, ' ').toLowerCase().split(/[^\p{L}]+/u).includes(w))) bad.push(s.id + ' tr: the prompt gives slot 1 away: ' + ex.sub);
      if (!inv && /Begin (met|<b>zoals)/.test(ex.sub)) bad.push(s.id + ' tr: asks for an order it does not need');
      if (!check(ex, ex.answer).ok) bad.push(s.id + ' tr: own answer'); });
    // Kies het woord: the English word for the gap is marked in the English sentence (EN_ALSO in app18 adds other words)
    let ne = 0;
    LEX.forEach(l => (lexSent[l.id] || []).forEach(o => { ne++; if (!enSpot(o.s.en, l)) bad.push(l.id + ' no English cue in: ' + o.s.en + ' (gloss ' + l.en + '; add it to EN_ALSO)'); }));
    // Scroll Luister: three different meanings to choose from, one of them right
    let nl = 0;
    SENT.forEach(s => { nl++; const o = lisOptions(s); if (o.length !== 3 || !o.includes(s.en) || new Set(o.map(norm)).size !== 3) bad.push(s.id + ' listen options ' + o); });
    // map names: no name covers a house, the flag row above a house, a road or another name (it may stand on a square),
    // and each stays close to its own square (Pad and every town map)
    const signBad = (g, list, centres, where) => { const rs = list.map(x => x.r), as = list.map(x => x.a); const G = g.map(row => row.map(t => ['house', 'road'].includes(t) ? t : 'grass'));
      rs.forEach((r, i) => { const others = rs.concat(as).filter((_, k) => k !== i && k !== i + rs.length);
        const hit = signCost(G, r, others) + signCost(G, as[i], others); // the name and the arrow on top of it
        if (hit > 0) bad.push(where + ': a name or its arrow covers a house, a flag, a road or another name (' + hit + ')');
        const [cx, cy, hp] = centres[i]; const gx = Math.max(0, r[0] - (cx + hp), (cx - hp) - (r[0] + r[2])), gy = Math.max(0, r[1] - (cy + hp), (cy - hp) - (r[1] + r[3]));
        if (Math.hypot(gx, gy) > 16) bad.push(where + ': a name stands ' + Math.round(Math.hypot(gx, gy)) + ' px from the edge of its square'); }); };
    signBad(WORLD ? WORLD.g : (buildWorld(), WORLD.g), worldSigns(), UNITS.map((u, i) => townPx(i).concat(40)), 'Pad'); // on the Pad a town is its square plus the ring of houses and bunting
    [0, 100].forEach(m => UNITS.filter(u => u.built).forEach(u => { S.markt = S.markt || {}; S.markt[u.id] = m; const t = townSigns(u.id); signBad(buildTown(u.id).g, [...t, t.markt], TSQ.map(q => sqCenter(q).concat(q.h * TS)), u.id + ' map (Grote Markt ' + m + '%)'); }));
    // 2.6 woordenboek: every entry complete and consistent (see src/woordenboek/README.md)
    let nd2 = 0; const seenW = new Set(); const lexW = new Set(LEX.map(l => norm(l.w) + '|' + l.p));
    const PS = ['n', 'v', 'adj', 'adv', 'prep', 'pron', 'conj', 'num', 'int', 'q'];
    (DICT || []).forEach(l => { nd2++; const k = norm(l.w) + '|' + l.p; const why = m => bad.push('woordenboek ' + l.w + ' (' + l.p + '): ' + m);
      if (seenW.has(k)) why('twice'); seenW.add(k); if (lexW.has(k)) why('already in the app (LEX)');
      if (!PS.includes(l.p)) why('unknown part of speech');
      ['w', 'd', 'en', 's', 'se'].forEach(f => { if (!l[f] || typeof l[f] !== 'string' || !l[f].trim()) why('no ' + f); });
      if (l.p === 'n' && !['de', 'het'].includes(l.g)) why('noun without de/het');
      if (l.p === 'n' && (l.pl === undefined || l.dim === undefined)) why('noun without pl/dim (null if none)');
      if (l.p === 'adj' && l.e === undefined) why('adjective without e (null if it never changes)');
      if (l.p === 'v') { const v = l.v || {};
        if (!['w', 's', 'o'].includes(v.t) || !v.st || !Array.isArray(v.im) || v.im.length !== 2 || !v.pp || !['h', 'z', 'hz'].includes(v.aux)) why('verb forms incomplete');
        if (v.sep && !l.w.startsWith(v.sep)) why('separable prefix is not the start of the verb'); }
      if (l.s && l.s.split(/\s+/).length > 14) why('example longer than 14 words');
      const forms = new Set([l.w, l.pl, l.dim, l.e].concat(l.f || []).filter(Boolean).map(norm).concat(l.v ? allForms(l) : []));
      if (l.s && !norm(l.s).split(' ').some(t => forms.has(t)) && !forms.has(norm(l.s))) why('example does not contain the word: ' + l.s);
      if (['n', 'v', 'adj'].includes(l.p) && l.d && norm(l.d).split(' ').includes(norm(l.w))) why('the Dutch explanation uses the word itself'); });
    if (nd2 < 1000) bad.push('woordenboek has ' + nd2 + ' words, fewer than 1000');
    // every word in the app's own texts has a card: an app word, or a woordenboek word (names and articles aside)
    const noCard = new Set(); const NAMES = new Set(WB_NAMES);
    Object.values(READ).map(R => R.text).concat(SENT.map(s => s.nl), LEX.map(l => l.s || '')).forEach(t => t.split(/\s+/).forEach((tok, i) => {
      const core = tok.replace(/^[^\p{L}’']+|[^\p{L}’']+$/gu, ''); if (!core || core.length < 2 || (i > 0 && /^\p{Lu}/u.test(core))) return;
      const n = norm(core); if (FORM_IX[n] || dictFind(n) || NAMES.has(n) || ['de', 'het', 'een', "'s"].includes(n)) return; noCard.add(n); }));
    if (noCard.size) bad.push('words in the app texts without a card: ' + [...noCard].join(', '));
    // underline means "tap for the word card" only: the subject is bold, verbs are gold
    if (/<u>/.test(frameHTML(SENT[0]))) bad.push('frameHTML underlines the subject');
    // synonym/antonym/definition cards for the user's own words too (an own pronoun like iemand once had a single choice)
    saveWords(parseWords(WOORDEN_FIXTURE).data);
    let nw = 0;
    Object.values(S.custom).forEach(l => { const r = relOf(l);
      if (r.syn.length || r.ant.length) for (let i = 0; i < 4; i++) { nw++; const ex = relEx(l); if (ex.options.length < 4 || !ex.options.includes(ex.answer) || new Set(ex.options.map(norm)).size !== ex.options.length) bad.push(l.w + ' (own word) rel ' + ex.options); }
      if (l.d) { nw++; const ex = defEx(l); if (ex.options.length < 3 || !ex.options.includes(ex.answer)) bad.push(l.w + ' (own word) def ' + ex.options); } });
    n += nq + nt + ne + nl + nw + nd2;
    S = blankState(); return {n, nbad: bad.length, bad: bad.slice(0, 40), w1: w1.kind, w2: w2.kind, conjSentence: nc, relation: nr, definition: nd, leesQuestions: nq, translate: nt, englishCue: ne, listen: nl, ownWords: nw, woordenboek: nd2};
  });
  // underline is for tappable words only: no <u> in any source part
  fs.readdirSync(require('path').join(__dirname, '..', 'src')).filter(f => f.endsWith('.js')).forEach(f => { if (/<u>/.test(fs.readFileSync(require('path').join(__dirname, '..', 'src', f), 'utf8'))) { r.nbad++; r.bad.push('src/' + f + ' uses <u>: underline is only for tappable words'); } });
  console.log(JSON.stringify(r, null, 1));
  await close();
  const fail = r.nbad > 0 || errs.length > 0;
  if (errs.length) console.log('ERRORS', errs);
  console.log(fail ? 'FAIL' : `OK: ${r.n} exercises, 0 failures`);
  process.exit(fail ? 1 : 0);
})();
