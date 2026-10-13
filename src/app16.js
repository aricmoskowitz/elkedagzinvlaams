/* ===== VERSION 2.2: cards =====
   Herhalen tests (typing), Scroll practises with one tap, Kaarten studies a chosen group.
   New here: conjugation inside a real sentence (Herhalen and Scroll), synonym, antonym and
   definition cards (Scroll only), synonyms and antonyms on the word card, and a clearer
   "Verbeter de zin" card (what kind of mistake, which square, a hint on request). */

/* ---------- synonyms and antonyms ---------- */
function relOf(l) {
  const r = REL_BY_W[norm(l.w)] || {};
  return {syn: (l.syn && l.syn.length ? l.syn : r.syn) || [], ant: (l.ant && l.ant.length ? l.ant : r.ant) || []};
}
function relHTML(l) {
  const r = relOf(l); if (!r.syn.length && !r.ant.length) return '';
  return `<div class="rel small">${r.syn.length ? `<span data-en="Also: synonyms">ook:</span> <b class="nl">${r.syn.map(esc).join(', ')}</b>` : ''}${r.syn.length && r.ant.length ? ' · ' : ''}${r.ant.length ? `<span data-en="Opposite">tegenovergestelde:</span> <b class="nl">${r.ant.map(esc).join(', ')}</b>` : ''}</div>`;
}

/* ---------- conjugation in a sentence ----------
   The gap is a conjugated verb in one of the app's own sentences. The choices stay in
   one tense (neem/neemt/nemen or nam/namen/genomen), so only one answer fits. */
function conjSentences(l) {
  const f = vForms(l); if (!f) return [];
  const now = uniq([f.ik, f.jij, f.hij, f.pl, f.inv, f.u].filter(Boolean).map(x => x.toLowerCase()));
  const past = uniq([f.im[0], f.im[1]].filter(Boolean).map(x => x.toLowerCase()));
  return (lexSent[l.id] || []).map(o => { const s = o.surf.toLowerCase(); return now.includes(s) ? {...o, tense: 'nu'} : past.includes(s) ? {...o, tense: 'verleden'} : null; }).filter(Boolean);
}
function conjOptions(l, o) {
  const f = vForms(l); const ans = o.surf.toLowerCase();
  const pool = o.tense === 'nu' ? [f.ik, f.hij, f.pl] : [f.im[0], f.im[1], f.pp];
  const opts = uniq([ans].concat(pool.filter(Boolean).map(x => x.toLowerCase())));
  if (opts.length < 3) uniq([f.ik, f.hij, f.pl, f.im[0], f.im[1], l.w].map(x => x.toLowerCase())).forEach(x => { if (opts.length < 3 && !opts.includes(x)) opts.push(x); });
  return shuffle(opts.slice(0, 4));
}
function conjSentEx(key, l, o, ctx) {
  const s = o.s; const ans = o.surf.toLowerCase();
  const base = {key, lex: l, sent: s, label: 'conjS', prompt: `<span class="nl">${blankOut(s.nl, o.surf)}</span>`, sub: `${enCue(s.en, l)} · <span class="nl">(${esc(l.w)} · ${o.tense === 'nu' ? 'nu' : 'verleden tijd'})</span>`, answer: ans, why: clozeWhy(l, o.surf), say: s.nl};
  if (ctx === 'feed') return {...base, type: 'mc', options: conjOptions(l, o)};
  return {...base, type: 'type', accept: [norm(ans)]};
}

/* ---------- Scroll only: synonym / antonym and definition cards (they count as 'recognise') ---------- */
function relEx(l) {
  const r = relOf(l); const kind = r.syn.length && (!r.ant.length || Math.random() < .5) ? 'syn' : 'ant';
  const ans = pick(r[kind]); const avoid = new Set([l.w, ...r.syn, ...r.ant].map(norm));
  // same part of speech first; a rare one (an own pronoun like iemand) is filled up with other words, so there are always 4 choices
  const others = allWords().filter(x => x.id !== l.id && !avoid.has(norm(x.w)));
  const pool = shuffle(others.filter(x => x.p === l.p)).concat(shuffle(others.filter(x => x.p !== l.p))).map(x => x.w);
  const opts = shuffle(uniq([ans].concat(pool)).slice(0, 4));
  return {type: 'mc', key: 'w:' + l.id + ':rec', lex: l, label: kind, prompt: `<span class="nl" style="font-size:30px">${wordHTML(l)}</span>`,
    sub: kind === 'syn' ? 'Welk woord betekent ongeveer hetzelfde?' : 'Wat is het tegenovergestelde?', options: opts, answer: ans,
    why: `${wordHTML(l)}: ${esc(l.d || '')}. ${relHTML(l).replace(/<\/?div[^>]*>/g, '')}`, say: ans};
}
function defEx(l) {
  const opts = shuffle(uniq([l.w].concat(distractorsFor(l, l.w))).slice(0, 4));
  return {type: 'mc', key: 'w:' + l.id + ':rec', lex: l, label: 'def', prompt: `<span class="nl" style="font-size:21px">${esc(l.d)}</span>`, sub: POS[l.p] || '', options: opts, answer: l.w,
    why: `${wordHTML(l)}: ${esc(l.d)}. <span class="muted">(${esc(l.en || '')})</span>`, say: (l.g ? l.g + ' ' : '') + l.w};
}
// words the user has met that can carry these cards
const metWords = () => allWords().filter(l => S.items['w:' + l.id + ':rec'] || S.seen[l.id]);
Object.assign(DAYWORD, {conjS: 'Vervoeg in de zin', syn: 'Zelfde betekenis', ant: 'Tegenovergestelde', def: 'Welk woord is het?'});
Object.assign(DAYWORD_EN, {conjS: 'Conjugate in the sentence', syn: 'Same meaning', ant: 'Opposite', def: 'Which word is it?'});
HOWTO.fix = ['Typ de zin opnieuw, maar nu juist.', 'Het label zegt wat voor fout het is (woordvolgorde, lidwoord, werkwoordsvorm…). Vast? Tik op <b>Hint</b>: de woorden die niet kloppen worden gemarkeerd.'];
HOWTO.conjS = ['Vul de juiste vorm van het werkwoord in de zin in.', 'Tussen haakjes staan het werkwoord en de tijd: <i>(nemen · nu)</i> → <b class="verbword">neem</b>, <b class="verbword">neemt</b> of <b class="verbword">nemen</b>?'];

/* ---------- Verbeter de zin: what kind of mistake, where, and a hint ---------- */
const FIX_LABEL = {'word order': ['Woordvolgorde', 'Word order'], article: ['Lidwoord (de/het)', 'Article'], 'verb form': ['Werkwoordsvorm', 'Verb form'], adjective: ['Bijvoeglijk naamwoord', 'Adjective ending'], spelling: ['Spelling', 'Spelling'], 'word choice': ['Woordkeuze', 'Word choice'], other: ['Iets anders', 'Something else']};
const toks = s => norm(s).split(' ').filter(Boolean);
function multisetMinus(a, b) { const m = {}; b.forEach(x => { m[x] = (m[x] || 0) + 1; }); return a.filter(x => { if (m[x]) { m[x]--; return false; } return true; }); }
// the type from the report, or worked out from the two sentences (older corrections have none)
function fixType(f) {
  const t = String(f.type || '').toLowerCase();
  if (FIX_LABEL[t] && t !== 'other') return t;
  const w = toks(f.wrong), r = toks(f.right);
  const a = multisetMinus(w, r), b = multisetMinus(r, w);
  if (!a.length && !b.length) return 'word order';
  if (a.concat(b).every(x => ['de', 'het', 'een'].includes(x))) return 'article';
  if (a.length === 1 && b.length === 1) {
    const [x, y] = [a[0], b[0]];
    if (x + 'e' === y || y + 'e' === x) return 'adjective';
    const ix = FORM_IX[x], iy = FORM_IX[y];
    if ((ix && ix === iy && LX(ix).v) || (LEX.some(l => l.v && allForms(l).includes(x)) && LEX.some(l => l.v && allForms(l).includes(y)))) return 'verb form';
    if (lev(x, y) <= 2) return 'spelling';
  }
  return FIX_LABEL[t] ? t : 'word choice';
}
// which words of the wrong sentence are not where the right one has them (longest common subsequence)
function fixDiff(wrong, right) {
  const w = toks(wrong), r = toks(right); const n = w.length, m = r.length;
  const L = Array.from({length: n + 1}, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = w[i] === r[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const keep = new Set(); let i = 0, j = 0;
  while (i < n && j < m) { if (w[i] === r[j]) { keep.add(i); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  return new Set(w.map((_, k) => k).filter(k => !keep.has(k)));
}
const SRC_NAME = {log: 'je logboek', talk: 'je gesprek', write: 'je schrijfopdracht', onderwerp: 'je gesprek met Claude', opdracht: 'je opdracht met Claude', dagboek: 'je dagboek', foto: 'een foto van je les'};
const shortDate = d => { const [y, m, dd] = String(d || '').split('-').map(Number); return y && m ? `${dd} ${MONTHS[m - 1].slice(0, 3)}` : ''; };
function fixEx(key, f) {
  const t = fixType(f); const [lab, labEn] = FIX_LABEL[t];
  const words = String(f.wrong).trim().split(/\s+/); const diff = fixDiff(f.wrong, f.right);
  const x = (S.extras || []).find(e => e.id === f.plan);
  const place = PSQ[f.plan] ? `${PSQ[f.plan].name} · ${PSQ[f.plan].title.toLowerCase()}` : x ? x.title : '';
  const from = [SRC_NAME[f.src] ? 'uit ' + SRC_NAME[f.src] : '', shortDate(f.date)].filter(Boolean).join(', ');
  return {type: 'type', key, label: 'fix', fixType: t,
    prompt: `<span class="nl fixw" style="font-size:20px">${words.map((w, i) => `<span class="fx${diff.has(i) ? ' d' : ''}">${esc(w)}</span>`).join(' ')}</span>`,
    sub: `<span class="fixlab" data-en="${labEn}">${lab}</span>${place ? ` · <span class="small">${esc(place)}</span>` : ''}<br><span class="small">Verbeter de zin${from ? ' · ' + esc(from) : ''}.</span>${diff.size ? ` <button class="link sm" type="button" data-act="fix-hint" style="padding-left:0">Hint: wat is er mis? ›</button>` : ''} <button class="link sm" type="button" data-act="fix-del" data-id="${esc(key.split(':')[1])}" style="padding-left:0;color:var(--warn)" data-en="Not a real mistake? Delete it">Geen echte fout? Verwijder ›</button>`,
    answer: f.right, accept: [norm(f.right)], whole: true, why: esc(f.why || ''), say: f.right};
}
