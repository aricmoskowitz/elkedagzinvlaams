/* ===== 2.13: het Speelfort — a star fort with mini games, the same in every boog =====
   Like the forts in the ring around Antwerp: a five-pointed star with a moat, earth walls and a brick wall. It stands
   on free grass on the Pad (never on a road or a square); tap it to go inside. Each of its five bastions holds one mini
   game: the first is Vervoeg, the other four are kept for later (GAMES). The fort is always open.
   Vervoeg: "hij · nu · wandelen" → type "wandelt". Five tenses: nu, verleden, voltooid, toekomst (zal + infinitief),
   bevel (gebiedende wijs). Progress: one review item per verb per tense (v:<word id>:<tense>) in S.items, with the
   persons you got wrong in it.px so they come back first. v: items stay out of Herhalen (keyValid rejects them);
   the Ik meter Vervoegen counts them together with the conjugation cards. */
const FORT = {name: 'Speelfort', en: 'Play fort: mini games'};
const GAMES = [
  {id: 'vervoeg', name: 'Vervoeg', en: 'Conjugate', sub: 'Persoon, tijd en werkwoord: typ de juiste vorm'},
  null, null, null, null, // room for four more mini games, one per bastion
];

/* ---------- the star fort as pixel art: n × n pixels, layer by distance to the star's edge ---------- */
const FORT_COL = {W: '#79B2E3', K: '#2A2620', L: '#5E9E4E', D: '#3F7A38', B: '#B5563F', S: '#E8D9B0', G: '#8C877E', Y: '#F2C14E', N: '#2A2620'};
const starPts = (cx, cy, R, r) => Array.from({length: 10}, (_, k) => { const a = (-90 + 36 * k) * Math.PI / 180, rr = k % 2 ? r : R; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; });
// how far a point is towards the star's edge: 0 in the middle, 1 on the edge
function starVal(px, py, cx, cy, pts) {
  const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy); if (d < 1e-6) return 0;
  let best = Infinity;
  for (let k = 0; k < pts.length; k++) { const [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % pts.length];
    const ex = bx - ax, ey = by - ay, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue;
    const t = ((ax - cx) * ey - (ay - cy) * ex) / den, u = ((ax - cx) * dy - (ay - cy) * dx) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t); }
  return best === Infinity ? 99 : 1 / best;
}
const FORT_ART = {};
function fortArt(n) {
  if (FORT_ART[n]) return FORT_ART[n];
  const c = (n - 1) / 2, pts = starPts(c, c + n * .04, n * .5, n * .3), rows = [];
  for (let y = 0; y < n; y++) { let row = '';
    for (let x = 0; x < n; x++) { const v = starVal(x, y, c, c + n * .04, pts);
      row += v > 1 ? '.' : v > .86 ? 'W' : v > .8 ? 'K' : v > .62 ? (((x + y) % 5) ? 'L' : 'D') : v > .55 ? 'B' : 'S'; }
    rows.push(row.split('')); }
  // the barracks in the middle, with a flag on top
  const bw = Math.max(4, Math.round(n * .16)), bh = Math.max(3, Math.round(n * .1)), bx = Math.round(c - bw / 2), by = Math.round(c - bh / 2 + n * .06);
  for (let y = by; y < by + bh; y++) for (let x = bx; x < bx + bw; x++) rows[y][x] = (y === by || x === bx || x === bx + bw - 1) ? 'K' : 'G';
  rows[by + bh - 1][Math.round(c)] = 'N';
  const fh = Math.max(3, Math.round(n * .12)), fx = Math.round(c);
  for (let y = by - fh; y < by; y++) rows[y][fx] = 'K';
  for (let y = by - fh; y < by - fh + Math.max(2, Math.round(fh / 2)); y++) for (let x = fx + 1; x <= fx + Math.max(2, Math.round(n * .07)); x++) rows[y][x] = 'Y';
  return (FORT_ART[n] = rows);
}
// one rect per run of the same colour in a row keeps the SVG small
function fortSVG(n, x, y, s) {
  let r = ''; fortArt(n).forEach((row, j) => { let i = 0; while (i < n) { const ch = row[i]; let k = i; while (k < n && row[k] === ch) k++; if (FORT_COL[ch]) r += `<rect x="${i}" y="${j}" width="${k - i}" height="1.05" fill="${FORT_COL[ch]}"/>`; i = k; } });
  return `<g transform="translate(${x},${y}) scale(${s})" shape-rendering="crispEdges">${r}</g>`;
}
// where the bastions point (the fort view puts the game numbers there)
const bastionAt = (n, k) => { const c = (n - 1) / 2, a = (-90 + 72 * k) * Math.PI / 180, R = n * .5 * .74; return [c + R * Math.cos(a), c + n * .04 + R * Math.sin(a)]; };

/* ---------- on the Pad: a free block of grass, away from roads, squares and the names ---------- */
const FORT_CELLS = 7, FORT_PX = FORT_CELLS * TS;
const _buildWorldFort = buildWorld; // wrapped on purpose: the fort is placed once the towns, roads and houses are there
buildWorld = function () {
  _buildWorldFort();
  const g = WORLD.g, n = FORT_CELLS, hard = t => ['road', 'house', 'plaza', 'path', 'bridge', 'water', 'deep', 'mtn', 'sand'].includes(t);
  const ok = (x, y) => { for (let dy = -1; dy <= n; dy++) for (let dx = -1; dx <= n; dx++) { const t = g[y + dy] && g[y + dy][x + dx]; if (t === undefined || hard(t)) return false; } return true; };
  const clearOfSquares = (x, y) => WSQ.every(({t: [sx, sy]}) => x + n <= sx - 5 || x >= sx + 5 || y + n <= sy - 5 || y >= sy + 6);
  let best = null; // the top-right corner of the boog, where no road goes
  for (let y = 1; y + n < g.length - 1; y++) for (let x = 1; x + n < g[0].length - 1; x++) {
    if (!ok(x, y) || !clearOfSquares(x, y)) continue; const sc = Math.hypot(x + n / 2 - 40, y + n / 2 - 2); if (!best || sc < best.sc) best = {x, y, sc}; }
  if (best) for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) g[best.y + dy][best.x + dx] = 'house'; // names and trees keep off it
  WORLD.fort = best && {x: best.x * TS, y: best.y * TS};
};
function fortSign() {
  const F = WORLD.fort; if (!F) return null;
  // the name stands right under the fort, centred (pulled in at the edge of the map)
  const w = signW(FORT.name), W2 = WORLD.g[0].length * TS; const x = Math.max(w / 2 + 3, Math.min(W2 - w / 2 - 3, F.x + FORT_PX / 2)), y = F.y + FORT_PX + 3;
  return {x, y, r: [x - w / 2, y, w, 17], a: [x, y, 0, 0]};
}
const _worldOverlayFort = worldOverlay; // wrapped on purpose: the fort goes under the names, its own name on top
worldOverlay = function () {
  if (!WORLD) buildWorld();
  const F = WORLD.fort; const rest = _worldOverlayFort(); if (!F) return rest;
  const n = fortSign();
  return `<g data-act="fort" role="button" tabindex="0" aria-label="${esc(FORT.name)}: minispelletjes, zoals Vervoeg" style="cursor:pointer"><rect x="${F.x - 4}" y="${F.y - 4}" width="${FORT_PX + 8}" height="${FORT_PX + 8}" fill="transparent"/>${fortSVG(40, F.x, F.y, FORT_PX / 40)}</g>`
    + rest + (n ? `<g data-act="fort" style="cursor:pointer">${sign(n.x, n.y, FORT.name)}</g>` : '');
};

/* ---------- inside the fort ---------- */
const _viewPadFort = viewPad; // wrapped on purpose: one more level on the Pad
viewPad = function () { return PAD.lvl === 'fort' ? viewFort() : _viewPadFort(); };
function viewFort() {
  const N = 72, vb = N; const st = vvStats();
  const marks = GAMES.map((gm, k) => { const [x, y] = bastionAt(N, k);
    return `<g ${gm ? `data-act="game" data-g="${gm.id}" role="button" tabindex="0" aria-label="${esc(gm.name)}"` : 'aria-hidden="true"'} style="cursor:${gm ? 'pointer' : 'default'}"><circle cx="${x}" cy="${y}" r="5.2" fill="${gm ? 'var(--go)' : '#DAD5CC'}" stroke="#fff" stroke-width="1"/><text x="${x}" y="${y + 2.3}" text-anchor="middle" font-size="6.4" font-weight="700" fill="${gm ? '#fff' : '#8C877E'}">${gm ? k + 1 : '?'}</text></g>`; }).join('');
  const rows = GAMES.map((gm, k) => gm
    ? `<button class="tapline" data-act="game" data-g="${gm.id}"><div class="t"><div style="font-weight:600" data-en="${esc(gm.en)}">${k + 1} · ${esc(gm.name)}${gm.id === 'vervoeg' && st.total ? ` <span class="small">· ${st.known} van ${st.total} gekend</span>` : ''}</div><div class="small">${esc(gm.sub)}</div></div><span class="chev">›</span></button>`
    : `<button class="tapline" aria-disabled="true" disabled><div class="t"><div style="font-weight:600;color:var(--faint)">${k + 1} · Nog leeg</div><div class="small">Hier komt later een nieuw spel.</div></div></button>`).join('');
  return `<div class="stack">
    <button class="back" data-act="pad-up">‹ Pad</button>
    <div><div class="eyebrow">Boog ${arcOf(SQ[nextSquare()].u).n} · Minispelletjes</div><h1 data-en="${esc(FORT.en)}">${esc(FORT.name)}</h1><div class="small" style="margin-top:2px">Vijf bastions, vijf spelletjes. Altijd open: speel wanneer je wilt.</div></div>
    <div class="fortmap"><svg viewBox="0 0 ${vb} ${vb}" role="img" aria-label="${esc(FORT.name)}: een stervormig fort met vijf bastions">${fortSVG(N, 0, 0, 1)}${marks}</svg></div>
    <div class="list">${rows}</div>
  </div>`;
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act;
  if (a === 'fort') { closeSheet(); TAB = 'pad'; PAD.lvl = 'fort'; render(); $('#main').scrollTop = 0; }
  else if (a === 'game') { if (el.dataset.g === 'vervoeg') openVervoeg(); }
  else if (a === 'vv-t') { const v = vvSet(); const t = el.dataset.v; v.tenses = v.tenses.includes(t) ? v.tenses.filter(x => x !== t) : VV_TENSES.map(x => x[0]).filter(x => x === t || v.tenses.includes(x)); if (!v.tenses.length) v.tenses = [t]; Store.mark('state'); openVervoeg(); }
  else if (a === 'vv-p') { vvSet().pool = el.dataset.v; Store.mark('state'); openVervoeg(); }
  else if (a === 'vv-go') { const keys = vvKeys(); closeSheet(); if (!keys.length) return toast('Geen werkwoorden om te vervoegen'); startSession({keys, intros: false, fort: 'vervoeg'}); }
});

/* ---------- Vervoeg ---------- */
const VV_TENSES = [['nu', 'Nu', 'tegenwoordige tijd', 'Present'], ['verl', 'Verleden', 'verleden tijd', 'Past'], ['volt', 'Voltooid', 'voltooide tijd', 'Present perfect'], ['toek', 'Toekomst', 'zal + infinitief', 'Future'], ['bevel', 'Bevel', 'gebiedende wijs', 'Imperative']];
const VV_TN = Object.fromEntries(VV_TENSES.map(t => [t[0], t]));
const VV_ROUND = 15;
const MODALS = new Set(['kunnen', 'mogen', 'moeten', 'zullen', 'willen']);
const vvSet = () => { S.settings.vervoeg = S.settings.vervoeg || {tenses: VV_TENSES.map(t => t[0]), pool: 'mijn'}; return S.settings.vervoeg; };
const vvApplies = (l, t) => { const f = vForms(l); if (!f) return false; if (t === 'volt') return !!f.pp && f.pp !== '—'; if (t === 'toek') return l.w !== 'zullen'; if (t === 'bevel') return !MODALS.has(l.w); return true; };
const vvVerbs = pool => { const all = allWords().filter(l => l.v && l.v.st && l.v.im && vForms(l));
  return pool === 'alle' ? all : all.filter(l => l.custom || S.seen[l.id] || S.items['w:' + l.id + ':rec']); };
// the persons asked: the slot gives the form (hij, zij and het share one; wij, jullie and zij share the plural)
const VV_PERS = [['ik', 'ik'], ['jij', 'jij'], ['u', 'u'], ['hij', 'hij'], ['zij', 'hij'], ['het', 'hij'], ['wij', 'pl'], ['jullie', 'pl'], ['zij (mv)', 'pl']];
const AUX = {h: {ik: 'heb', jij: 'hebt', u: 'hebt', hij: 'heeft', pl: 'hebben'}, z: {ik: 'ben', jij: 'bent', u: 'bent', hij: 'is', pl: 'zijn'}};
const ZAL = {ik: 'zal', jij: 'zult', u: 'zult', hij: 'zal', pl: 'zullen'};
// the answer for a verb, a tense and a slot, and every form that is also right
function vvAnswer(l, t, slot) {
  const f = vForms(l), sep = f.sep, s2 = x => sep ? x + ' ' + sep : x; let ans, also = [];
  if (t === 'nu') { ans = s2(f[slot]); also = ((l.v.alt && l.v.alt[slot]) || []).map(s2); if (slot === 'u') also.push(s2(f.hij)); }
  else if (t === 'verl') ans = s2(slot === 'pl' ? f.im[1] : f.im[0]);
  else if (t === 'volt') { const part = sep + f.pp; const auxs = f.aux === 'hz' ? ['h', 'z'] : [f.aux === 'z' ? 'z' : 'h'];
    ans = AUX[auxs[0]][slot] + ' ' + part; also = auxs.slice(1).map(a => AUX[a][slot] + ' ' + part); if (slot === 'u') auxs.forEach(a => also.push(AUX[a].hij + ' ' + part)); }
  else if (t === 'toek') { ans = ZAL[slot] + ' ' + l.w; if (slot === 'jij' || slot === 'u') also.push('zal ' + l.w); }
  else ans = s2(f.imp);
  return {ans, accept: uniq([ans, ...also].map(norm))};
}
// the whole tense in one line, for the feedback
function vvLine(l, t) {
  if (t === 'bevel') return `<i>${esc(vvAnswer(l, t, 'jij').ans)}!</i>`;
  return [['ik', 'ik'], ['jij', 'jij'], ['hij', 'hij'], ['wij', 'pl']].map(([p, s]) => `${p} <i>${esc(vvAnswer(l, t, s).ans)}</i>`).join(' · ');
}
const VV_RULE = {
  nu: 'Present: <i>ik</i> takes the stem, <i>jij/u/hij</i> stem + <b>t</b>, the plural the infinitive.',
  verl: 'Past: one form for <i>ik/jij/u/hij</i>, one for the plural.',
  volt: 'Present perfect: <i>hebben</i> or <i>zijn</i> + the participle. Movement to a place or a change of state takes <i>zijn</i>.',
  toek: 'Future: <i>zal/zult/zullen</i> + the infinitive at the end. <i>jij zal</i> and <i>u zal</i> are fine too.',
  bevel: 'Imperative: just the stem (<i>wandel!</i>); a separable prefix goes to the end (<i>bel op!</i>).',
};
function vervoegEx(key) {
  const [, id, t] = key.split(':'); const l = LX(id); const it = S.items[key] || {}; const px = it.px || {};
  SES.vx = SES.vx || {};
  let pers = SES.vx[key];
  if (!pers) { // the persons you got wrong come back first
    const opts = t === 'bevel' ? [['jij', 'jij']] : VV_PERS; const w = opts.map(([, s]) => 1 + 3 * (px[s] || 0)); let r = Math.random() * w.reduce((a, b) => a + b, 0);
    pers = opts.find((_, i) => (r -= w[i]) < 0) || opts[0]; SES.vx[key] = pers; }
  const [plab, slot] = pers; const {ans, accept} = vvAnswer(l, t, slot); const T = VV_TN[t]; const f = vForms(l);
  const who = t === 'bevel' ? '(<b>jij</b>)' : `<b>${esc(plab)}</b>`;
  const hint = t === 'volt' ? 'Typ het hulpwerkwoord en het deelwoord, bv. <i>heeft gewandeld</i>' : t === 'toek' ? 'Typ <i>zal/zult/zullen</i> + het werkwoord' : f.sep ? `Typ beide delen, bv. <i>bel op</i>` : '';
  const why = `${VV_RULE[t]} ${t === 'nu' || t === 'bevel' ? stemNote(l) : kofschip(l) || (l.v.t === 's' ? 'Strong verb: the vowel changes; learn it by heart.' : '')}<div class="small" style="margin-top:6px"><b>${esc(T[1])}</b> · ${vvLine(l, t)}</div>`;
  return {type: 'type', key, lex: l, label: 'vv', vv: slot, prompt: `<span class="nl">${who} · ${esc(T[1].toLowerCase())} · <i class="verbword">${esc(l.w)}</i></span>`,
    sub: `<span class="small">${esc(T[2])}${hint ? ' · ' + hint : ''}</span>`, answer: ans, accept, why, say: null, conjP: t === 'nu' ? slot : undefined};
}
const _makeExFort = makeEx; // wrapped on purpose: v: keys are Vervoeg cards
makeEx = function (key, ctx) { return key.startsWith('v:') ? vervoegEx(key) : _makeExFort(key, ctx); };
Object.assign(DAYWORD, {vv: 'Vervoeg'}); Object.assign(DAYWORD_EN, {vv: 'Conjugate'});
HOWTO.vv = ['Typ de vorm die past bij de persoon en de tijd.', 'Voorbeeld: <b>hij</b> · nu · <i>wandelen</i> → <b class="verbword">wandelt</b>. Bij voltooid typ je ook <i>heeft</i> of <i>is</i>.'];
// a wrong person is remembered on the item (it.px), a right one counts it down
const _submitAnswerFort = submitAnswer; // wrapped on purpose
submitAnswer = function (val) {
  const ex = SES && SES.ex, st = SES && SES.steps[SES.i], before = SES ? SES.correct : 0, was = SES && SES.answered;
  _submitAnswerFort(val);
  if (ex && ex.vv && !was && SES && SES.answered && st && !st.retry) { const it = S.items[ex.key]; if (it) { it.px = it.px || {}; const ok = SES.correct > before; it.px[ex.vv] = ok ? Math.max(0, (it.px[ex.vv] || 0) - 1) : (it.px[ex.vv] || 0) + 1; } }
};
// a round: due cards first, then weak ones, then new verbs, then the rest; never the same verb twice in a row
function vvKeys() {
  const v = vvSet(); let verbs = vvVerbs(v.pool); if (verbs.length < 5) verbs = vvVerbs('alle');
  const all = []; verbs.forEach(l => v.tenses.forEach(t => { if (vvApplies(l, t)) all.push('v:' + l.id + ':' + t); }));
  const due = shuffle(all.filter(k => isDue(k))), weak = shuffle(all.filter(k => S.items[k] && !isDue(k) && !known(k))), fresh = shuffle(all.filter(k => !S.items[k])), rest = shuffle(all.filter(k => S.items[k] && known(k) && !isDue(k)));
  const pick = [], verbOf = k => k.split(':')[1];
  for (const k of [...due, ...weak, ...fresh, ...rest]) { if (pick.length >= VV_ROUND) break; if (!pick.includes(k)) pick.push(k); }
  for (let i = 1; i < pick.length; i++) if (verbOf(pick[i]) === verbOf(pick[i - 1])) { const j = pick.findIndex((k, n) => n > i && verbOf(k) !== verbOf(pick[i - 1])); if (j > 0) [pick[i], pick[j]] = [pick[j], pick[i]]; }
  return pick;
}
// progress: known verb × tense cards over everything built (the Ik meter counts these with the conjugation cards)
function vvStats() {
  const built = LEX.filter(l => l.v && UNIT['u' + l.u] && UNIT['u' + l.u].built && vForms(l)); // a word's u is the town number
  const keys = []; built.forEach(l => VV_TENSES.forEach(([t]) => { if (vvApplies(l, t)) keys.push('v:' + l.id + ':' + t); }));
  return {total: keys.length, known: keys.filter(known).length, keys};
}
function vervoegStat() {
  const conj = []; UNITS.filter(u => u.built).forEach(u => unitKeys(u.id).filter(k => k.endsWith(':conj')).forEach(k => conj.push(k)));
  const vv = vvStats().keys; const all = conj.concat(vv);
  return all.length ? all.filter(known).length / all.length : 0;
}
function openVervoeg() {
  const v = vvSet(); const mine = vvVerbs('mijn').length, alle = vvVerbs('alle').length; const st = vvStats();
  const chip = (act, val, on, lab, en) => `<button class="chip${on ? ' on' : ''}" data-act="${act}" data-v="${val}" aria-pressed="${on}"${en ? ` data-en="${esc(en)}"` : ''}>${lab}</button>`;
  openSheet(`<div class="stack">
    <h2 data-en="Conjugate">Vervoeg</h2>
    <div class="small">Je ziet een persoon, een tijd en een werkwoord, bv. <b>hij</b> · nu · <i>wandelen</i>. Typ de juiste vorm: <b>wandelt</b>. Wat je fout had, komt terug, met de persoon die je lastig vond.</div>
    <div class="eyebrow" data-en="Tenses">Tijden</div>
    <div class="row wrap">${VV_TENSES.map(t => chip('vv-t', t[0], v.tenses.includes(t[0]), t[1], t[3] + ' · ' + t[2])).join('')}</div>
    <div class="eyebrow" data-en="Verbs">Werkwoorden</div>
    <div class="row wrap">${chip('vv-p', 'mijn', v.pool !== 'alle', `Mijn werkwoorden (${mine})`, 'Verbs you have met')}${chip('vv-p', 'alle', v.pool === 'alle', `Alle (${alle})`, 'Every verb in the app and your own')}</div>
    ${v.pool !== 'alle' && mine < 5 ? '<div class="small">Je kent nog weinig werkwoorden; je oefent nu met alle werkwoorden.</div>' : ''}
    <div class="small">Gekend: <b>${st.known}</b> van ${st.total} vervoegingen (werkwoord × tijd) uit de steden. Dit telt mee voor <b>Vervoegen</b> bij Ik.</div>
    <button class="btn block" data-act="vv-go">Start · ${VV_ROUND} kaarten</button>
  </div>`);
}
// the end of a round: what you know now
const _sesEndFort = sesEnd; // wrapped on purpose
sesEnd = function () {
  const fort = SES && SES.fort; _sesEndFort();
  if (fort === 'vervoeg') { const st = vvStats(); const b = $('#ses-body .stack'); if (b) b.querySelector('.btn').insertAdjacentHTML('beforebegin', `<div class="card soft">Vervoeg: je kent nu <b>${st.known}</b> van ${st.total} vervoegingen. <button class="link" data-act="vv-again">Nog een ronde ›</button></div>`); }
};
document.addEventListener('click', e => { const el = e.target.closest('[data-act="vv-again"]'); if (!el) return; closeSession(); const keys = vvKeys(); if (keys.length) startSession({keys, intros: false, fort: 'vervoeg'}); });
