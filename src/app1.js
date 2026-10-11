/* ===== UTIL ===== */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uniq = a => [...new Set(a)];
const dayNum = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
const dateKey = (d = new Date()) => { const z = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); };
const weekStartDay = (d = new Date()) => dayNum(d) - ((d.getDay() + 6) % 7);
const DAYS = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
const MONTHS = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const deacc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const norm = s => String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[.,!?;:"“”¿¡()…]/g, ' ').replace(/\.\.\./g, ' ').replace(/\s+/g, ' ').trim();
function lev(a, b) {
  if (a === b) return 0; const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({length: n + 1}, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;

/* ===== INDEXES ===== */
const LXB = Object.fromEntries(LEX.map(l => [l.id, l]));
const LX = id => LXB[id] || (S.custom && S.custom[id]) || null;
const SX = Object.fromEntries(SENT.map(s => [s.id, s]));
const UNIT = Object.fromEntries(UNITS.map(u => [u.id, u]));
const SQ = Object.fromEntries(SQUARES.map(q => [q.id, q]));
const squaresOf = u => SQUARES.filter(q => q.u === u);
const SQ_ORDER = SQUARES.map(q => q.id);
const PROPER = new Set(['Antwerpen','Groenplaats','Meir','Vogelmarkt','Theaterplein','Centraal','Gent','Brugge','Schelde']);
const PREPS = new Set(['naar','in','op','om','na','bij','aan','uit','met','voor','naast','van','over','tot','achter']);
const FRONT_ADV = new Set(['morgen','vandaag','nu','dan','vaak','altijd','hier','daar','vroeg','gisteren','gisteravond','zaterdag','straks','samen','thuis']);
const PRON = new Set(['me','mij','je','jij','u','hem','haar','ons','het','ze','zich']);

SENT.forEach(s => {
  s.ch = s.f.split(' / ').map(p => { const i = p.lastIndexOf(':'); return {t: p.slice(0, i), sl: p.slice(i + 1)}; });
  s.q = s.nl.trim().endsWith('?');
  s.keys = s.k.map(k => { const [surf, id] = k.includes('>') ? k.split('>') : [k, k]; return {surf, id}; });
});
const lexSent = {};
SENT.forEach(s => s.keys.forEach(k => (lexSent[k.id] = lexSent[k.id] || []).push({s, surf: k.surf})));
const lexOfUnit = n => LEX.filter(l => l.u === n);
const sentOfUnit = n => SENT.filter(s => s.u === n);

/* ===== VERBS ===== */
function vForms(l) {
  const v = l.v; if (!v) return null;
  const o = v.o || {};
  const base = v.sep ? l.w.slice(v.sep.length) : l.w;
  const stT = v.st.endsWith('t') ? v.st : v.st + 't';
  const f = {
    ik: o.ik || v.st, jij: o.jij || stT, inv: o.inv || v.st, u: o.u || stT, hij: o.hij || stT,
    pl: o.pl || base, ge: o.ge || stT, im: v.im, pp: v.pp, aux: v.aux, imp: v.imp || v.st, base, sep: v.sep || ''
  };
  return f;
}
const withSep = (form, f) => f.sep ? form + ' … ' + f.sep : form;
const auxWord = a => a === 'z' ? 'is' : a === 'hz' ? 'heeft / is' : 'heeft';
function allForms(l) {
  const f = vForms(l); if (!f) return [];
  return uniq([f.ik, f.jij, f.hij, f.pl, f.im[0], f.im[1], f.pp, f.sep + f.pp, l.w].filter(Boolean).map(norm));
}
function kofschip(l) {
  const v = l.v; if (!v || v.t !== 'w') return '';
  const last = v.kofl || v.st.replace(/(.)\1$/, '$1').slice(-1);
  const hard = 'tkfschp'.includes(last);
  return `Weak verb. The stem <i>${esc(v.st)}</i> ends in <b>${esc(last)}</b>, which is ${hard ? '' : '<b>not</b> '}in <i>’t kofschip</i> (t, k, f, s, ch, p), so the past takes <b>${hard ? '-te/-ten' : '-de/-den'}</b> and the participle ends in <b>${hard ? '-t' : '-d'}</b>.`;
}
function stemNote(l) {
  const f = vForms(l); if (!f || (l.v.o)) return '';
  const inf = f.base, st = l.v.st;
  if (/(.)\1$/.test(inf.replace(/en$/, '')) && !/(.)\1$/.test(st)) return `Double consonant becomes single at the end: <i>${inf}</i> → <i>${st}</i>.`;
  if (inf.endsWith('zen') && st.endsWith('s')) return `A <i>z</i> becomes <i>s</i> at the end of the stem: <i>${inf}</i> → <i>${st}</i>.`;
  if (inf.endsWith('ven') && st.endsWith('f')) return `A <i>v</i> becomes <i>f</i> at the end of the stem: <i>${inf}</i> → <i>${st}</i>.`;
  const m = inf.match(/^(.*?)([aeou])([^aeiou])en$/);
  if (m && st.endsWith(m[2] + m[2] + m[3])) return `The vowel is doubled to stay long in a closed syllable: <i>${inf.replace(/en$/, '')}·en</i> → <i>${st}</i>.`;
  return '';
}
const PERSON_LABEL = {ik:'ik', jij:'jij / je', inv:'… jij? (omgekeerd)', u:'u', hij:'hij / zij / het', pl:'wij · jullie · zij', ge:'ge / gij (spreektaal)'};
function personRule(p) {
  return {
    ik:'<i>ik</i> takes just the stem.',
    jij:'<i>jij</i>, <i>u</i> and <i>hij</i> take stem + <b>t</b>.',
    u:'<i>jij</i>, <i>u</i> and <i>hij</i> take stem + <b>t</b>.',
    hij:'<i>jij</i>, <i>u</i> and <i>hij</i> take stem + <b>t</b>.',
    inv:'When <i>jij/je</i> comes <b>after</b> the verb, the <b>t</b> drops: <i>neem jij?</i>',
    pl:'All plurals (<i>wij, jullie, zij</i>) use the infinitive.'
  }[p] || '';
}

/* ===== STATE =====
   2.0: one JSON state in localStorage (edz.v2), written 800 ms after the last change.
   migrate() accepts a 1.5 state (v 2) unchanged and adds the 2.0 fields. */
const LS_KEY = 'edz.v2';
const LS_OLD = 'goesting.v1';
const blankState = () => ({v:3, savedAt:0, items:{}, sq:{}, cur:'u1q1', seen:{}, seenAt:{}, activity:{}, sets:[], custom:{}, coach:{}, settings:{rate:0.9, cap:60, voice:'', autoAudio:false, test:true, talkAudio:true, projectUrl:'', praten:{mode:'onderwerp', vertaling:true, verbeteren:'beurt', beurten:'6–8'}, lastBackup:0}, mission:{}, log:[], talks:[], fix:{}, extras:[], sic:{}, imports:[]});
function migrate() {
  if (!S.v || S.v < 2) { S.v = 2; S.sq = S.sq || {}; S.cur = 'u1q1'; S.coach = S.coach || {}; S.settings = Object.assign(blankState().settings, S.settings || {}, {test: true}); delete S.units; }
  if (!SQ[S.cur]) S.cur = 'u1q1';
  ['log', 'talks', 'extras', 'imports', 'sets'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
  ['fix', 'sic', 'seenAt', 'items', 'sq', 'seen', 'activity', 'custom', 'coach', 'mission'].forEach(k => { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; });
  const def = blankState().settings;
  S.settings = Object.assign({}, def, S.settings || {});
  S.settings.praten = Object.assign({}, def.praten, S.settings.praten || {});
  if (S.settings.talkAudio === undefined) S.settings.talkAudio = true;
  if (S.v < 3) S.v = 3;
}
let S = blankState();
const Store = {
  timer: null,
  loadLocal() {
    try { const raw = localStorage.getItem(LS_KEY) || localStorage.getItem(LS_OLD); if (raw) S = Object.assign(blankState(), JSON.parse(raw)); } catch (e) {}
    migrate();
  },
  saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { if (!this.warned) { this.warned = true; toast('Opslaan lukte niet. Maak een back-up via Ik.'); } } },
  // the names are kept from 1.5 (state, items, words, log); there is one document now
  mark() { S.savedAt = Date.now(); clearTimeout(this.timer); this.timer = setTimeout(() => this.flush(), 800); },
  flush() { clearTimeout(this.timer); this.timer = null; this.saveLocal(); },
  persist() { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {} }
};
addEventListener('pagehide', () => Store.flush());
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') Store.flush(); });

/* ===== SRS ===== */
const today = () => dayNum();
function introduce(key) { if (!S.items[key]) S.items[key] = {d: today(), i: 0, e: 2.5, r: 0, l: 0, s: 0}; return S.items[key]; }
function grade(key, ok) {
  const it = introduce(key), t = today();
  if (ok) { it.r++; it.i = it.r === 1 ? 1 : it.r === 2 ? 3 : Math.max(it.i + 1, Math.round(it.i * it.e)); it.e = Math.min(3, it.e + 0.05); }
  else { it.l++; it.r = 0; it.i = 0; it.e = Math.max(1.3, it.e - 0.2); }
  it.d = t + it.i; it.s = t;
  const a = S.activity[dateKey()] = S.activity[dateKey()] || {n: 0, m: 0}; a.n++;
  Store.mark('items', 'state');
}
const isDue = k => S.items[k] && S.items[k].d <= today();
const known = k => S.items[k] && (S.items[k].r >= 2 || S.items[k].i >= 3);
function doneToday() { const a = S.activity[dateKey()]; return a ? a.n : 0; }
function dueKeys() {
  return shuffle(Object.keys(S.items).filter(k => isDue(k) && keyValid(k))).sort((a, b) => S.items[a].d - S.items[b].d);
}
function keyValid(k) { const [t, id] = k.split(':'); if (t === 'w') return !!LX(id); if (t === 'c') return !!(S.fix && S.fix[id]); if (t === 'e') return !!extraSentence(id); return !!SX[id]; }
function extraSentence(id) { const [xid, i] = id.split('~'); const x = (S.extras || []).find(e => e.id === xid); return x && x.examples && x.examples[+i]; }
function lexKeys(l) {
  const ks = ['w:' + l.id + ':rec', 'w:' + l.id + ':prod'];
  if (l.p === 'n' && l.g) ks.push('w:' + l.id + ':gen');
  if (l.v) ks.push('w:' + l.id + ':conj');
  return ks;
}
function unitKeys(u) {
  const n = UNIT[u].n; const ks = [];
  lexOfUnit(n).forEach(l => ks.push(...lexKeys(l)));
  sentOfUnit(n).forEach(s => ks.push('s:' + s.id + ':ord', 's:' + s.id + ':lis'));
  return ks;
}
function squareKeys(q) {
  const sq = SQ[q]; const ks = [];
  sq.words.forEach(id => ks.push(...lexKeys(LX(id))));
  sq.sents.forEach(id => ks.push('s:' + id + ':ord', 's:' + id + ':lis'));
  return ks;
}
function unitMastery(u) { if (!UNIT[u].built) return 0; const ks = unitKeys(u); return ks.filter(known).length / ks.length; }
function sqMastery(q) { const ks = squareKeys(q); return ks.filter(known).length / ks.length; }
function unitStarted(u) { return unitKeys(u).some(k => S.items[k]); }
const sqstate = q => (S.sq[q] = S.sq[q] || {steps: {}});
const BUILT_STEPS = ['ontdek', 'oefen', 'luister'];
const stepDone = (q, st) => !!(S.sq[q] && S.sq[q].steps && S.sq[q].steps[st]);
const sqComplete = q => BUILT_STEPS.every(st => stepDone(q, st));
const sqStarted = q => BUILT_STEPS.some(st => stepDone(q, st));
const testMode = () => !!S.settings.test;
function sqOpen(q) { const i = SQ_ORDER.indexOf(q); return testMode() || i === 0 || sqComplete(SQ_ORDER[i - 1]) || sqComplete(q) || sqStarted(q); }
const unitComplete = u => UNIT[u].built && squaresOf(u).every(q => sqComplete(q.id));
function townOpen(u) { const unit = UNIT[u]; if (!unit.built) return false; return squaresOf(u).some(q => sqOpen(q.id)); }
function nextSquare() { return SQ_ORDER.find(q => sqOpen(q) && !sqComplete(q)) || SQ_ORDER[SQ_ORDER.length - 1]; }
function wordsKnown() {
  const ids = new Set(); Object.keys(S.items).forEach(k => { if (k[0] === 'w' && known(k)) ids.add(k.split(':')[1]); }); return ids.size;
}
function sentencesKnown() { const ids = new Set(); Object.keys(S.items).forEach(k => { if (k[0] === 's' && known(k)) ids.add(k.split(':')[1]); }); return ids.size; }
function skillStat(test) {
  const all = []; UNITS.filter(u => u.built).forEach(u => unitKeys(u.id).filter(test).forEach(k => all.push(k)));
  return all.length ? all.filter(known).length / all.length : 0;
}
