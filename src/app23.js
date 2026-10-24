/* ===== 2.15: Onthoud — the Speelfort's second game: learn a short text by heart in five rounds =====
   Pick a text (MEMO in content11.js, easiest first). Rounds 1–3: fill the gaps from a word bank, tapping the words in
   the order of the text; each round more words are gone (the key words first, then more). Round 4: every word is gone,
   put the whole bank back in order. Round 5: type the whole text from memory.
   A wrong tap counts as a mistake; after two on the same gap the right word lights up. Round 5 compares word by word
   (case, punctuation, accents and apostrophes don't count).
   Score per text (memoScore): rounds 1–4 give up to 15% each, round 5 up to 40%, each times its best accuracy, at most
   99%. 100% (in gold) only when all five rounds are done and round 5 had no mistakes.
   Progress: S.memo[id] = {r: [best accuracy of round 1..5, null while not done], at}. */
GAMES[1] = {id: 'onthoud', name: 'Onthoud', en: 'Learn by heart', sub: 'Een rijmpje, spreekwoord of gedichtje in vijf rondes uit het hoofd leren',
  open: () => { closeSheet(); TAB = 'pad'; PAD.lvl = 'onthoud'; render(); $('#main').scrollTop = 0; },
  stat: () => { const n = MEMO.filter(t => memoScore(t.id) > 0).length, g = MEMO.filter(t => memoScore(t.id) === 100).length; return n ? `${n} van ${MEMO.length} teksten${g ? ` · ${g} in goud` : ''}` : ''; }};

const MEMO_ROUNDS = [
  {n: 'Sleutelwoorden', en: 'Key words', sub: 'Een paar woorden zijn weg', f: .25},
  {n: 'De helft', en: 'Half', sub: 'De helft van de woorden is weg', f: .5},
  {n: 'Bijna alles', en: 'Almost everything', sub: 'De meeste woorden zijn weg', f: .75},
  {n: 'Alles in volgorde', en: 'Everything in order', sub: 'Alle woorden zijn weg: zet ze terug in volgorde', f: 1},
  {n: 'Uit het hoofd', en: 'From memory', sub: 'Typ de hele tekst zonder hulp'},
];
const MEMO_W = [15, 15, 15, 15, 40];
const MEMO_STOP = new Set('de het een en of maar in op aan van met naar te is zijn ik je jij hij ze zij we wij er dat die dit wat als dan zo om bij uit voor ook nog niet al'.split(' '));
const MX = id => MEMO.find(t => t.id === id);
const memoState = id => { S.memo = S.memo || {}; S.memo[id] = S.memo[id] || {r: [null, null, null, null, null]}; return S.memo[id]; };
function memoScore(id) {
  const m = S.memo && S.memo[id]; if (!m) return 0; const r = m.r;
  if (r.every(x => x != null) && r[4] === 1) return 100;
  return Math.min(99, Math.round(r.reduce((s, x, k) => s + MEMO_W[k] * (x || 0), 0)));
}
const memoOpen = (id, k) => k === 0 || (S.memo && S.memo[id] && S.memo[id].r[k - 1] != null); // rounds open in order
// a word is compared without case, accents, apostrophes or hyphens
const memoKey = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’‘\-]/g, '');
// the text as tokens: what goes before the word (a quote), the word itself, and what follows (punctuation)
// 2.20: a poem keeps its lines: br marks the last word of a line
function memoToks(t) {
  return t.nl.split('\n').flatMap(line => { const ws = line.trim().split(/\s+/);
    return ws.map((w, i) => { const m = w.match(/^([“"(]*)(.+?)([.,!?:;”")]*)$/); return {pre: m[1], w: m[2], post: m[3], br: i === ws.length - 1}; }); });
}
const memoJoin = (toks, f) => toks.map((x, i) => f(x, i) + (x.br ? '<br>' : ' ')).join('');
const memoLines = t => esc(t.nl).replace(/\n/g, '<br>');
// which words go, round by round: key words first (no small words, longer first), the same order every time
function memoRank(t) {
  const toks = memoToks(t); let h = 0; for (const c of t.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const r = i => { const x = Math.sin(h + i * 97.13) * 10000; return x - Math.floor(x); };
  return toks.map((x, i) => ({i, s: (MEMO_STOP.has(memoKey(x.w)) ? 0 : 10) + Math.min(x.w.length, 9) + r(i)})).sort((a, b) => b.s - a.s).map(x => x.i);
}
function memoGaps(t, k) {
  const N = memoToks(t).length, f = MEMO_ROUNDS[k].f;
  const n = f >= 1 ? N : Math.max(k === 0 ? 2 : 3, Math.round(f * N));
  return memoRank(t).slice(0, n).sort((a, b) => a - b);
}

/* ---------- the menu: every text, easiest first ---------- */
const _viewPadMemo = viewPad; // wrapped on purpose: the Onthoud menu is one more level on the Pad, inside the fort
viewPad = function () { return PAD.lvl === 'onthoud' ? viewOnthoud() : _viewPadMemo(); };
const memoBadge = id => { const s = memoScore(id); return `<span class="mg-score${s === 100 ? ' gold' : s ? '' : ' none'}">${s === 100 ? '★ ' : ''}${s}%</span>`; };
const memoDots = id => { const r = (S.memo && S.memo[id] || {r: []}).r; return `<span class="mg-dots" aria-label="${r.filter(x => x != null).length} van 5 rondes">${[0, 1, 2, 3, 4].map(k => `<i class="${r[k] == null ? '' : r[k] === 1 ? 'full' : 'half'}"></i>`).join('')}</span>`; };
function viewOnthoud() {
  const lv = [1, 2, 3, 4, 5].filter(n => MEMO.some(t => t.lvl === n));
  const g = MEMO.filter(t => memoScore(t.id) === 100).length;
  return `<div class="stack">
    <button class="back" data-act="fort">‹ ${esc(FORT.name)}</button>
    <div><div class="eyebrow">${esc(FORT.name)} · Spel 2</div><h1 data-en="Learn by heart">Onthoud</h1>
    <div class="small" style="margin-top:2px">Leer een kort gedichtje of spreekwoord uit het hoofd in vijf rondes, met een kwinkslag op het einde. Eerst vul je een paar woorden in, dan steeds meer, tot je de hele tekst zelf typt. Alle vijf rondes gedaan en ronde 5 zonder fout: <b>100%</b> in goud.</div>
    ${g ? `<div class="small" style="margin-top:4px"><span class="mg-score gold">★ ${g}</span> van ${MEMO.length} teksten in goud</div>` : ''}</div>
    ${lv.map(n => `<div><div class="eyebrow">Niveau ${n} · ${esc(MEMO_LVL[n])}</div><div class="list">${MEMO.filter(t => t.lvl === n).sort((a, b) => memoToks(a).length - memoToks(b).length).map(t =>
      `<button class="tapline" data-act="mg-text" data-id="${t.id}"><div class="t"><div style="font-weight:600">${esc(t.title)}</div><div class="small">${esc(MEMO_KIND[t.kind])} · ${memoToks(t).length} woorden ${memoDots(t.id)}</div></div>${memoBadge(t.id)}<span class="chev">›</span></button>`).join('')}</div></div>`).join('')}
  </div>`;
}

/* ---------- one text: its rounds ---------- */
let MG = null;
function memoOverlay(id) {
  const o = openOverlay('memo', `<button class="iconbtn" data-act="mg-close" aria-label="Sluiten" data-en="Close">✕</button><div class="progress"><div id="mg-prog" style="width:0%"></div></div><span class="small" id="mg-count" style="min-width:48px;text-align:right"></span>`, `<div id="mg-body" class="stack"></div>`);
  MG = {id}; memoIntro(); return o;
}
function memoIntro() {
  const t = MX(MG.id), m = memoState(MG.id), s = memoScore(t.id); MG.k = null;
  const next = [0, 1, 2, 3, 4].find(k => m.r[k] == null); const go = next == null ? 4 : next;
  $('#mg-prog').style.width = (20 * m.r.filter(x => x != null).length) + '%'; $('#mg-count').textContent = m.r.filter(x => x != null).length + ' / 5';
  $('#mg-body').innerHTML = `<div class="eyebrow">${esc(MEMO_KIND[t.kind])} · Niveau ${t.lvl}</div>
    <div class="row" style="justify-content:space-between;align-items:flex-start"><h2>${esc(t.title)}</h2>${memoBadge(t.id)}</div>
    <div class="card"><div class="row" style="align-items:flex-start">${speakBtn(t.nl)}<div class="nl mg-text">${memoLines(t)}</div></div><div class="small" style="margin-top:6px">${esc(t.en)}</div></div>
    ${s === 100 ? '<div class="card mg-goldcard">★ Helemaal uit het hoofd, zonder fout. Deze tekst is van jou.</div>' : ''}
    <div class="list">${MEMO_ROUNDS.map((R, k) => { const open = memoOpen(t.id, k), b = m.r[k];
      return `<button class="tapline" data-act="mg-round" data-k="${k}"${open ? '' : ' disabled aria-disabled="true"'}><div class="t"><div style="font-weight:600${open ? '' : ';color:var(--faint)'}" data-en="Round ${k + 1}: ${esc(R.en)}">Ronde ${k + 1} · ${esc(R.n)}</div><div class="small">${open ? esc(R.sub) : 'Eerst ronde ' + k}</div></div>${b != null ? `<span class="mg-score${k === 4 && b === 1 ? ' gold' : ''}">${Math.round(b * 100)}%</span>` : ''}${open ? '<span class="chev">›</span>' : ''}</button>`; }).join('')}</div>
    <button class="btn block" data-act="mg-round" data-k="${go}">${next == null ? 'Ronde 5 opnieuw' : m.r.some(x => x != null) ? 'Verder · ronde ' + (go + 1) : 'Start · ronde 1'}</button>`;
  $('#memo .obody').scrollTop = 0;
}

/* ---------- rounds 1–4: the word bank ---------- */
function memoStart(k) {
  const t = MX(MG.id); MG.k = k;
  if (k === 4) { MG.typed = null; return memoTypeRender(); }
  const toks = memoToks(t), gaps = memoGaps(t, k);
  Object.assign(MG, {toks, gaps, at: 0, miss: 0, here: 0, firsts: 0, bank: shuffle(gaps.map(i => ({w: toks[i].w, used: false})))});
  memoRender();
}
function memoRender() {
  const t = MX(MG.id), R = MEMO_ROUNDS[MG.k], gapSet = new Set(MG.gaps), cur = MG.gaps[MG.at];
  $('#mg-prog').style.width = Math.round(100 * MG.at / MG.gaps.length) + '%'; $('#mg-count').textContent = MG.at + ' / ' + MG.gaps.length;
  const words = memoJoin(MG.toks, (x, i) => { const filled = gapSet.has(i) && MG.gaps.indexOf(i) < MG.at;
    const w = !gapSet.has(i) ? esc(x.w) : filled ? `<span class="mg-fill">${esc(x.w)}</span>` : `<span class="mg-gap${i === cur ? ' cur' : ''}" style="min-width:${Math.max(2, x.w.length * .55)}em" aria-label="${i === cur ? 'hier' : 'leeg'}"></span>`;
    return esc(x.pre) + w + esc(x.post); });
  const hint = MG.here >= 2 ? memoKey(MG.toks[cur].w) : null; let lit = false;
  $('#mg-body').innerHTML = `${kindLabel('mg', 'ex-label')}
    <div class="row" style="justify-content:space-between"><div class="eyebrow">Ronde ${MG.k + 1} van 5 · ${esc(R.n)}</div>${speakBtn(t.nl)}</div>
    <div class="card"><div class="nl mg-text" aria-live="polite">${words}</div></div>
    <div class="small">Tik de woorden in de volgorde van de tekst.${MG.miss ? ` Fouten: <b>${MG.miss}</b>` : ''}</div>
    <div class="tokens mg-bank">${MG.bank.map((b, j) => { const h = !b.used && !lit && hint && memoKey(b.w) === hint; if (h) lit = true;
      return `<button class="tok${b.used ? ' used' : ''}${h ? ' mg-hint' : ''}" data-act="mg-pick" data-j="${j}"${b.used ? ' disabled' : ''}>${esc(b.w)}</button>`; }).join('')}</div>`;
}
function memoPick(j) {
  const b = MG.bank[j], want = MG.toks[MG.gaps[MG.at]]; if (!b || b.used || !want) return;
  if (memoKey(b.w) === memoKey(want.w)) { b.used = true; if (!MG.here) MG.firsts++; MG.at++; MG.here = 0; if (MG.at >= MG.gaps.length) return memoDone(MG.firsts / MG.gaps.length, MG.miss); memoRender(); }
  else { MG.miss++; MG.here++; memoRender(); const el = $(`#mg-body [data-j="${j}"]`); if (el) { el.classList.add('mg-no'); setTimeout(() => el.classList.remove('mg-no'), 450); } }
}

/* ---------- round 5: type it from memory ---------- */
function memoTypeRender() {
  const t = MX(MG.id); $('#mg-prog').style.width = '0%'; $('#mg-count').textContent = memoToks(t).length + ' woorden';
  $('#mg-body').innerHTML = `${kindLabel('mg', 'ex-label')}
    <div class="eyebrow">Ronde 5 van 5 · Uit het hoofd</div>
    <div class="ex-prompt"><span class="nl">${esc(t.title)}</span></div>
    <div class="small">Typ de hele tekst. Hoofdletters, leestekens en accenten tellen niet mee. Geen fout = 100% in goud.</div>
    <form id="mg-form" class="stack" autocomplete="off"><textarea id="mg-in" class="big" rows="6" lang="nl" autocapitalize="sentences" autocorrect="off" spellcheck="false" aria-label="De tekst uit het hoofd"></textarea>
    <div id="mg-err" class="small" style="color:var(--warn)" hidden>Typ eerst de tekst.</div><button class="btn block" type="submit">Controleer</button></form>`;
  setTimeout(() => { const i = $('#mg-in'); if (i) i.focus(); }, 60);
}
// word-by-word difference: which words of the text were missed or wrong, which typed words were extra or wrong
function memoDiff(target, typed) {
  const a = target.map(memoKey), b = typed.map(memoKey), n = a.length, m = b.length;
  const d = Array.from({length: n + 1}, (_, i) => Array.from({length: m + 1}, (_, j) => i + j));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const badT = new Set(), badY = new Set(); let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) { if (a[i - 1] !== b[j - 1]) { badT.add(i - 1); badY.add(j - 1); } i--; j--; }
    else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { badT.add(i - 1); i--; }
    else { badY.add(j - 1); j--; }
  }
  return {errors: d[n][m], badT, badY};
}
function memoCheck(val) {
  const t = MX(MG.id), toks = memoToks(t);
  const typed = String(val).split(/\s+/).map(w => w.replace(/^[^\p{L}\p{N}'’]+|[^\p{L}\p{N}]+$/gu, '')).filter(Boolean);
  const {errors, badT, badY} = memoDiff(toks.map(x => x.w), typed);
  const acc = Math.max(0, 1 - errors / toks.length);
  MG.check = {typed, badT, badY, errors};
  memoDone(acc, errors);
}

/* ---------- the end of a round ---------- */
function memoDone(acc, miss) {
  const t = MX(MG.id), m = memoState(MG.id), k = MG.k, before = memoScore(t.id);
  m.r[k] = Math.max(m.r[k] == null ? 0 : m.r[k], acc); m.at = Date.now(); Store.mark('state');
  const s = memoScore(t.id), gold = s === 100 && before < 100, toks = memoToks(t);
  const a = S.activity[dateKey()] = S.activity[dateKey()] || {n: 0, m: 0}; a.n = (a.n || 0) + 1;
  $('#mg-prog').style.width = '100%';
  const ck = k === 4 && MG.check;
  const shown = ck ? `<div class="card"><div class="nl mg-text">${memoJoin(toks, (x, i) => esc(x.pre) + (ck.badT.has(i) ? `<span class="mg-miss">${esc(x.w)}</span>` : esc(x.w)) + esc(x.post))}</div>
      ${ck.errors ? `<div class="small yours" style="margin-top:6px">Jij: <span class="nl">${ck.typed.map((w, i) => ck.badY.has(i) ? `<s class="d">${esc(w)}</s>` : esc(w)).join(' ')}</span></div>` : ''}</div>`
    : `<div class="card"><div class="nl mg-text">${memoLines(t)}</div></div>`;
  const head = k === 4 ? (miss ? `${miss} ${miss === 1 ? 'fout' : 'fouten'}` : 'Zonder fout!') : miss ? `${Math.round(acc * 100)}% in één keer juist` : 'Alles in één keer juist!';
  $('#mg-body').innerHTML = `<div class="eyebrow">Ronde ${k + 1} klaar</div>
    <div class="fb ${miss ? 'no' : 'ok'}" role="status"><h3>${head}</h3><div class="small">${k === 4 ? `${toks.length - (ck ? ck.badT.size : 0)} van ${toks.length} woorden juist.` : `${MG.gaps.length} woorden ingevuld${miss ? `, ${miss} keer mis getikt` : ''}.`} Je beste score voor deze ronde: ${Math.round(m.r[k] * 100)}%.</div></div>
    ${shown}
    <div class="row" style="justify-content:space-between;align-items:center"><span class="small">Score voor deze tekst</span>${memoBadge(t.id)}</div>
    ${gold ? '<div class="card mg-goldcard">★ 100%! Alle vijf rondes gedaan en de hele tekst zonder fout getypt.</div>' : k === 4 && s < 100 && m.r.every(x => x != null) ? '<div class="small">Typ de tekst nog eens zonder fout voor 100% in goud.</div>' : ''}
    ${k < 4 ? `<button class="btn block" data-act="mg-round" data-k="${k + 1}">Ronde ${k + 2} · ${esc(MEMO_ROUNDS[k + 1].n)}</button>` : ''}
    <div class="grid2"><button class="btn line" data-act="mg-round" data-k="${k}">Nog eens</button><button class="btn line" data-act="mg-intro">Naar de tekst</button></div>`;
  $('#memo .obody').scrollTop = 0;
}
function memoClose() { closeOverlay('memo'); MG = null; render(); }

Object.assign(DAYWORD, {mg: 'Onthoud'}); Object.assign(DAYWORD_EN, {mg: 'Learn by heart'});
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return; const a = el.dataset.act;
  if (a === 'mg-text') memoOverlay(el.dataset.id);
  else if (a === 'mg-round' && MG) { if (memoOpen(MG.id, +el.dataset.k)) memoStart(+el.dataset.k); }
  else if (a === 'mg-pick' && MG) memoPick(+el.dataset.j);
  else if (a === 'mg-intro' && MG) memoIntro();
  else if (a === 'mg-close') memoClose();
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'mg-form') return; e.preventDefault();
  const v = $('#mg-in').value; if (!v.trim()) { $('#mg-err').hidden = false; return; } memoCheck(v);
});
