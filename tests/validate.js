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
    // 2.17 Luister en zet in volgorde: every word of the sentence is in the bank plus three that don't belong;
    // tapping the sentence's own words in order is right, with an extra word it is wrong
    SENT.forEach(s => { n++; const ex = lisOrdEx('s:' + s.id + ':lis'); const own = ex.tokens.filter(t => t.i < ex.tokens.length - LIS_EXTRA).sort((a, b) => a.i - b.i);
      const extra = ex.tokens.filter(t => t.i >= ex.tokens.length - LIS_EXTRA), val = cap1(own.map(t => t.t).join(' ')) + ex.punct;
      if (extra.length !== LIS_EXTRA || extra.some(t => norm(s.nl).split(' ').includes(norm(t.t)))) bad.push(s.id + ' lisOrd extras ' + extra.map(t => t.t));
      if (!check(ex, val).ok) bad.push(s.id + ' lisOrd own words "' + val + '"');
      if (check(ex, cap1(own.map(t => t.t).concat(extra[0].t).join(' ')) + ex.punct).ok) bad.push(s.id + ' lisOrd accepts an extra word'); });
    SENT.forEach(s => { const v = orderVariants(s).map(norm); if (!v.includes(norm(s.nl))) bad.push(s.id + ' variant0 ' + v[0]); });
    // 2.8: every other accepted order can be shown as the learner's own sentence, with the verb still in slot 2
    SENT.forEach(s => orderVariants(s).slice(1).forEach(v => { const o = ownOrder(s, v); if (!o || norm(o.nl) !== norm(v) || frameCols(o)[2].join(' ') !== s.ch.find(x => x.sl === '2').t) bad.push(s.id + ' own order ' + v); }));
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
    // 2.11: every built town has a theme sign in the middle of each square (Pad and town map), beside the cyclist and inside the square,
    // with no name on it; the town map has more of them on free grass (never a road, a square or a house)
    const ov = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
    const midBad = (rects, centres, hp, signs, where) => rects.forEach((r, k) => { const [cx, cy] = centres[k];
      if (r[0] < cx - hp || r[0] + r[2] > cx + hp || r[1] < cy - hp || r[1] + r[3] > cy + hp) bad.push(where + ': the theme sign sticks out of its square');
      if (ov(r, heroRect(cx, cy))) bad.push(where + ': the theme sign is under the waiting cyclist');
      if (signs.some(n => ov(r, n.r) || ov(r, n.a))) bad.push(where + ': a name covers the theme sign'); });
    UNITS.filter(u => u.built).forEach(u => { if (!TOWN_LANDMARK[u.id]) return bad.push(u.id + ': no theme sign in TOWN_LANDMARK (app21.js)'); });
    { const pr = lmRects('pad'); midBad(pr, UNITS.filter(u => TOWN_LANDMARK[u.id]).map(u => townPx(UNIT[u.id].n - 1)), WSQ[0].h * TS, worldSigns(), 'Pad'); }
    UNITS.filter(u => u.built).forEach(u => { const T = buildTown(u.id); const t = townSigns(u.id); const signs = [...t, t.markt];
      midBad(lmRects('town', u.id), squaresOf(u.id).map((q, j) => sqCenter(TSQ[j])), TSQ[0].h * TS, signs, u.id + ' map');
      if (T.scatter.length < 4) bad.push(u.id + ' map: only ' + T.scatter.length + ' theme signs on the grass');
      T.scatter.forEach(L => { const r = [L.x, L.y, LM_W, lmH(L.key)];
        if (TSQ.some(q => { const [cx, cy] = sqCenter(q), hp = q.h * TS + 2; return ov(r, [cx - hp, cy - hp, 2 * hp, 2 * hp]); })) bad.push(u.id + ' map: a theme sign on the grass stands on a square');
        if (T.roads.some(rd => rd.some(([x, y]) => ov(r, [x - RW / 2, y - RW / 2, RW, RW])))) bad.push(u.id + ' map: a theme sign on the grass stands on a road');
        if (T.houses.concat(...T.guild).some(h => ov(r, [h.x * TS, h.y * TS - 10, 2 * TS, 2 * TS + 10]))) bad.push(u.id + ' map: a theme sign on the grass covers a house or its flag');
        if (signs.some(n => ov(r, n.r) || ov(r, n.a))) bad.push(u.id + ' map: a name covers a theme sign on the grass'); }); });
    { const before = JSON.stringify(S.sq); const g0 = townRonde3('u1'); squaresOf('u1').forEach(q => { S.sq[q.id] = {steps: {oefen: 100}, rounds: {oefen: 3}}; });
      const g1 = townRonde3('u1'), svg = landmarkSVG('tram', 0, 0, 1, lmMode('u1'), 'x'); S.sq = JSON.parse(before);
      const q1 = squaresOf('u1')[0].id; S.sq[q1] = {steps: {oefen: 100}, rounds: {oefen: 3}}; const one = (townOverlay('u1').match(/class="landmark gold"/g) || []).length; S.sq = JSON.parse(before);
      if (g0 || !g1 || !/#D9A12A|#EFC447/.test(svg) || !/sparkle/.test(svg)) bad.push('landmark: not gold after Ronde 3 on every plein');
      if (one !== 1) bad.push('landmark: after Ronde 3 on one plein, only its own sign should be gold (' + one + ')'); }
    // definition cards: the choices are other words, never another form of the answer (hakken: not hak, hakten)
    LEX.filter(l => l.d).forEach(l => { const e = defEx(l); const forms = new Set([l.pl, l.dim, l.e].concat(l.v ? allForms(l) : []).filter(Boolean).map(norm));
      if (e.options.length < 3 || !e.options.includes(l.w)) bad.push('definition card ' + l.w + ': ' + e.options.join('/'));
      e.options.filter(o => o !== l.w && forms.has(norm(o))).forEach(o => bad.push('definition card ' + l.w + ': ' + o + ' is a form of the answer')); });
    // 2.12: every built plein has its own Gebruik scene, and the Grote Markt one combines the town's goals (the most parts)
    UNITS.filter(u => u.built).forEach(u => { const qs = squaresOf(u.id).map(q => q.id).concat([marktId(u.id)]);
      qs.forEach(q => { const sc = SCENARIOS.find(s => s.q === q); if (!sc) return bad.push(q + ': no own scene in content10.js');
        ['title', 'role', 'roleEn', 'goal', 'goalEn', 'open', 'doel'].forEach(f => { if (!sc[f]) bad.push(sc.id + ': no ' + f); });
        if (doelParts(sc.doel).length < 2) bad.push(sc.id + ': the doel needs at least 2 parts'); });
      const m = SCENARIOS.find(s => s.q === marktId(u.id)); const most = Math.max(...squaresOf(u.id).map(q => { const sc = SCENARIOS.find(s => s.q === q.id); return sc ? doelParts(sc.doel).length : 0; }));
      if (m && doelParts(m.doel).length < Math.max(4, most + 1)) bad.push(m.id + ': the Grote Markt doel should combine the pleinen (at least 4 parts)'); });
    if (new Set(SCENARIOS.map(s => s.id)).size !== SCENARIOS.length) bad.push('two scenes share an id');
    // 2.12 test-out: 10 questions for a plein, 20 for a stad; a pass (90%) marks only Ontdek and Oefen, yet opens the next plein
    { const before = JSON.stringify(S.sq), tm = S.settings.test; S.settings.test = false; S.sq = {};
      const k1 = testoutKeys(['u1q2']), k3 = testoutKeys(squaresOf('u2').map(q => q.id));
      if (k1.length !== 10 || k3.length !== 20 || new Set(k1).size !== 10) bad.push('test-out: ' + k1.length + ' / ' + k3.length + ' questions (want 10 / 20, no repeats)');
      const closed = !sqOpen('u1q3');
      const run = (qs, correct, total) => { SES = {testout: qs, total, correct, t0: Date.now(), i: total}; document.body.insertAdjacentHTML('beforeend', '<div id="session"><div id="ses-prog"></div><div id="ses-body"></div></div>'); sesEnd(); document.getElementById('session').remove(); SES = null; };
      run(['u1q2'], 8, 10); const failOpen = sqOpen('u1q3'); // 80% is no longer enough
      run(['u1q2'], 9, 10); const st = S.sq.u1q2.steps;
      const ok1 = st.ontdek === 'test' && st.oefen === 'test' && !st.luister && !st.lees && !st.gebruik && sqOpen('u1q3') && !sqComplete('u1q2')
        && houseLevel('u1q2', 'ontdek') === 1 && houseLevel('u1q2', 'oefen') === 1 && houseLevel('u1q2', 'luister') === 0;
      run(squaresOf('u3').map(q => q.id), 18, 20); const ok3 = marktOpen('u3') && sqOpen(squaresOf('u4')[0].id);
      if (!closed || failOpen || !ok1 || !ok3) bad.push('test-out: ' + JSON.stringify({closed, failOpen, ok1, ok3, st}));
      S.sq = JSON.parse(before); S.settings.test = tm; }
    // 2.12 the plein's house on the Pad: a flag only when 4 of the 5 guild houses have one (the star when 4 are at 100%)
    { const pf = lv => padFlag({levels: lv}); const r = [pf([1, 1, 1, 0, 0]), pf([1, 1, 1, 1, 0]), pf([2, 2, 2, 1, 1]), pf([2, 2, 2, 2, 0]), pf([2, 1, 1, 1, 1])];
      if (r.join() !== '0,1,1,2,1') bad.push('Pad flag (4 of 5 rule): ' + r.join()); }
    // 2.13 Speelfort: on free grass on the Pad (no road, no square), its name nearby and clear of the town names;
    // Vervoeg accepts its own answer for every verb, tense and person; its cards stay out of Herhalen
    { const F = WORLD.fort; if (!F) bad.push('Speelfort: no spot on the Pad'); else {
        const r = [F.x, F.y, FORT_PX, FORT_PX], ov = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
        if (WORLD.roads.some(rd => rd.some(([x, y]) => ov(r, [x - RW / 2, y - RW / 2, RW, RW])))) bad.push('Speelfort: on a road');
        if (WSQ.some(q => { const [cx, cy] = sqCenter(q), hp = q.h * TS + 2; return ov(r, [cx - hp, cy - hp, 2 * hp, 2 * hp]); })) bad.push('Speelfort: on a square');
        const n = fortSign(), ws = worldSigns();
        if (!n || ws.some(s => ov(n.r, s.r) || ov(n.r, s.a))) bad.push('Speelfort: its name covers a town name');
        else { const gx = Math.max(0, n.r[0] - (F.x + FORT_PX), F.x - (n.r[0] + n.r[2])), gy = Math.max(0, n.r[1] - (F.y + FORT_PX), F.y - (n.r[1] + n.r[3])); if (Math.hypot(gx, gy) > 16) bad.push('Speelfort: its name is far from the fort'); } }
      const keep = SES; SES = {vx: {}}; let nv = 0;
      allWords().filter(l => l.v && vForms(l)).forEach(l => VV_TENSES.forEach(([t]) => { if (!vvApplies(l, t)) return;
        (t === 'bevel' ? [['jij', 'jij']] : VV_PERS).forEach(pp => { SES.vx = {['v:' + l.id + ':' + t]: pp}; const ex = vervoegEx('v:' + l.id + ':' + t); nv++;
          if (!ex.answer || /undefined|null/.test(ex.answer) || !check(ex, ex.answer).ok) bad.push('Vervoeg ' + l.w + ' ' + t + ' ' + pp[0] + ': ' + ex.answer); }); }));
      SES = keep; if (nv < 1000) bad.push('Vervoeg: only ' + nv + ' cards checked');
      if (keyValid('v:wandelen:nu')) bad.push('Vervoeg cards must stay out of Herhalen');
      const ks = vvKeys(); if (ks.length !== VV_ROUND || !ks.every(k => /^v:[^:]+:(nu|verl|volt|toek|bevel)$/.test(k))) bad.push('Vervoeg round: ' + ks.length + ' cards'); }
    // 2.15 Onthoud: the second game; every text (2.20: a short poem or proverb with a twist) 3–5 lines with a title, a level and English; the gaps grow round by round
    // (each round keeps the gaps of the one before) until round 4 has every word; the score is gold only for five rounds and a perfect round 5
    { if (!GAMES[1] || GAMES[1].id !== 'onthoud' || typeof GAMES[1].open !== 'function') bad.push('Speelfort: game 2 is Onthoud');
      if (new Set(MEMO.map(t => t.id)).size !== MEMO.length) bad.push('Onthoud: duplicate ids');
      MEMO.forEach(t => { const ns = (t.nl.match(/[.!?](\s|$)/g) || []).length, N = memoToks(t).length;
        if (!t.title || !t.en || !MEMO_KIND[t.kind] || !(t.lvl >= 1 && t.lvl <= 5)) bad.push('Onthoud ' + t.id + ': title, kind, lvl 1–5 and en');
        const nl = t.nl.split('\n').length; if (nl < 3 || nl > 5 || N < 8 || N > 40) bad.push('Onthoud ' + t.id + ': ' + nl + ' lines, ' + N + ' words (3–5 lines, 8–40 words)');
        if (memoToks(t).some(x => !/[\p{L}\p{N}]/u.test(x.w))) bad.push('Onthoud ' + t.id + ': a token without a word');
        const g = [0, 1, 2, 3].map(k => memoGaps(t, k));
        if (!g.every((x, k) => !k || (x.length > g[k - 1].length && g[k - 1].every(i => x.includes(i)))) || g[3].length !== N) bad.push('Onthoud ' + t.id + ': gaps ' + g.map(x => x.length));
        const d = memoDiff(memoToks(t).map(x => x.w), t.nl.toUpperCase().replace(/[.,!?;:]/g, '').trim().split(/\s+/)); if (d.errors) bad.push('Onthoud ' + t.id + ': its own text is not perfect'); });
      const keepM = S.memo; S.memo = {m1: {r: [1, 1, 1, 1, 1]}, m2: {r: [.5, .5, .5, .5, 1]}, m3: {r: [1, 1, 1, 1, .96]}, m4: {r: [1, 1, null, null, null]}};
      if (memoScore('m1') !== 100 || memoScore('m2') !== 100 || memoScore('m3') !== 98 || memoScore('m4') !== 30 || memoScore('m5') !== 0) bad.push('Onthoud score: ' + ['m1', 'm2', 'm3', 'm4', 'm5'].map(memoScore));
      S.memo = keepM; }
    // 2.14 the Pad: the town hall and the three plein houses (drawn 1.4×) never overlap, nor sit in the top rows
    UNITS.forEach((u, i) => { const r = worldRoles(i); const bs = [r.hall].concat(r.pleinen).filter(Boolean);
      if (bs.length !== 4) bad.push('Pad ' + u.id + ': ' + bs.length + ' buildings');
      const box = h => { const bx = h.x * TS + TS, by = h.y * TS + 2 * TS, [x0, y0, x1, y1] = h.hall ? [-3, -9, 19, 16] : [0, -9, 20, 16]; const k = h.k || 1; return [bx + (x0 - TS) * k, by + (y0 - 2 * TS) * k, bx + (x1 - TS) * k, by + (y1 - 2 * TS) * k]; };
      bs.forEach((a, k) => { const A = box(a); if (A[1] < 0) bad.push('Pad ' + u.id + ': a building is cut off at the top');
        bs.slice(k + 1).forEach(b => { const B = box(b); if (A[0] < B[2] && B[0] < A[2] && A[1] < B[3] && B[1] < A[3]) bad.push('Pad ' + u.id + ': two buildings overlap'); }); }); });
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
