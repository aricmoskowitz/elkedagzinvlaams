/* ===== VERSION 2.6: the woordenboek =====
   A built-in dictionary (woordenboek.json, made by build.py from src/woordenboek/*.jsonl).
   - tap a word the app has no card for: the filled-in card opens, one tap adds it (to a set if you like)
   - the Nieuw woord form fills itself in when the word is in the woordenboek
   - searching in Woorden also finds woordenboek words
   - Ari's own words (imported lists) get their missing forms from it
   The file loads a few seconds after start (never while the app opens) and the service worker keeps it offline. */

let DICT = null, DICT_IX = null, DICT_P = null;
function loadDict() {
  if (DICT) return Promise.resolve(DICT);
  if (!DICT_P) DICT_P = fetch('woordenboek.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(list => {
    DICT = list.map(x => ({...x, id: 'd:' + x.w + ':' + x.p, dict: true})); DICT_IX = {};
    const add = (f, l) => { const k = norm(f || ''); if (k && !DICT_IX[k]) DICT_IX[k] = l; };
    DICT.forEach(l => add(l.w, l)); // lemmas first, so "kast" never points at another word's form
    DICT.forEach(l => { [l.pl, l.dim, l.e].concat(l.f || []).forEach(f => add(f, l)); if (l.v) allForms(l).forEach(f => add(f, l)); });
    enrichCustom();
    return DICT;
  }).catch(e => { DICT_P = null; throw e; });
  return DICT_P;
}
// a word as it stands in a text → its woordenboek entry (or null)
const dictFind = w => (DICT_IX && DICT_IX[norm(w)]) || null;
// one of Ari's own words with the same lemma and part of speech
const ownFor = l => Object.values(S.custom || {}).find(c => norm(c.w) === norm(l.w) && (c.p === l.p || !c.p));

/* ---------- tapping a word ---------- */
function lookupWord(w) {
  const go = () => {
    const l = dictFind(w);
    if (!l) return quickAdd(w, true);
    const own = ownFor(l); if (own) return showWord(own.id);
    openDictCard(l);
  };
  if (DICT) return go();
  toast('Even het woordenboek openen…');
  loadDict().then(go, () => quickAdd(w, true));
}
function openDictCard(l) {
  const s = openSheet(`<div class="stack">
    ${wordCardHTML(l, {actions: false}).replace('<div class="eyebrow">', `<div class="eyebrow"><span class="dictpill" data-en="From the dictionary">Woordenboek</span> ${l.vl ? '<span class="dictpill vl" data-en="Flemish">Vlaams</span> ' : ''}`)}
    <label class="f">Zet ook in set<select id="dc-set"><option value="">Geen set (alleen bij mijn woorden)</option>${S.sets.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
    <button class="btn block" id="dc-add">+ Voeg toe aan mijn woorden</button>
  </div>`);
  s.querySelector('#dc-add').onclick = () => { const id = addDictWord(l, s.querySelector('#dc-set').value); closeSheet(); toast('Bewaard: ' + l.w); render(); return id; };
}
// copy the entry into Ari's own words (with every form), straight into Herhalen
function addDictWord(l, setId) {
  const own = ownFor(l); let id = own && own.id;
  if (!id) {
    id = uid('u-'); const {dict, ...rest} = l;
    S.custom[id] = {...rest, id, custom: true, u: 0, plan: null, src: 'woordenboek', date: dateKey()};
    S.seen[id] = 1; introduce('w:' + id + ':rec'); if (l.g) introduce('w:' + id + ':gen');
  }
  if (setId) { const set = S.sets.find(x => x.id === setId); if (set && !set.ids.includes(id)) set.ids.push(id); }
  Store.mark('words', 'items', 'state'); return id;
}
// redefines quickAdd (app13): for a word that is not in the woordenboek either: say so, and offer Claude
function quickAdd(w, missing) {
  const sets = S.sets;
  const s = openSheet(`<div class="stack">
    <div class="eyebrow">Nieuw woord</div><div class="wc-word">${esc(w)}</div>
    <div class="small">${missing ? 'Dit woord staat niet in het woordenboek van de app. Vraag het aan je Claude Project (de vraag staat klaar om te plakken), of vul de kaart zelf in.' : 'Dit woord staat nog niet in je woorden. Vul de kaart nu of later aan.'}</div>
    ${missing ? `<button class="btn line block" id="qa-claude">Kopieer de vraag voor Claude</button>` : ''}
    <label class="f">Zet ook in set<select id="qa-set"><option value="">Geen set (alleen bij je eigen woorden)</option>${sets.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
    <button class="btn block" id="qa-go">Vul de kaart zelf in</button>
  </div>`);
  s.querySelector('#qa-go').onclick = () => { const set = s.querySelector('#qa-set').value; closeSheet(); wordForm(set || null, w); };
  const c = s.querySelector('#qa-claude');
  if (c) c.onclick = () => copyText(`Wat betekent “${w}”? Geef het woord als EDZ-WOORDEN v1-blok (set: Mijn woorden), met de/het, meervoud of vervoeging, een uitleg in het Nederlands, een voorbeeldzin en het Engels.`, null, () => toast('Gekopieerd: plak het in je Claude Project'));
}

/* ---------- the Nieuw woord form fills itself in ---------- */
function dictFillForm(inp) {
  const box = inp.closest('form'); if (!box) return;
  const run = () => {
    const l = dictFind(inp.value.trim()); const note = box.querySelector('#nw-dict');
    if (!l || norm(l.w) !== norm(inp.value.trim())) { if (note) note.remove(); return; }
    const set = (sel, v) => { const el = box.querySelector(sel); if (el && !el.value.trim() && v) el.value = v; };
    const p = box.querySelector('#nw-p'); if (p && [...p.options].some(o => o.value === l.p)) { p.value = l.p; p.dispatchEvent(new Event('change')); } else if (p) { p.value = 'adv'; p.dispatchEvent(new Event('change')); }
    if (l.g) { const g = box.querySelector(`input[name="nw-g"][value="${l.g}"]`); if (g) g.checked = true; }
    set('#nw-pl', l.pl); set('#nw-dim', l.dim); set('#nw-d', l.d); set('#nw-s', l.s); set('#nw-en', l.en);
    box.dataset.dict = l.id;
    if (!note) inp.insertAdjacentHTML('afterend', `<div id="nw-dict" class="small"><span class="dictpill">Woordenboek</span> ingevuld; pas aan wat je wilt.</div>`);
  };
  if (DICT) run(); else loadDict().then(run, () => {});
}
// after the form is saved (app13 wordForm), give the new word its verb forms and other fields from the woordenboek
document.addEventListener('submit', e => {
  const f = e.target; if (f.id !== 'wform' || !f.dataset.dict) return;
  setTimeout(() => { const l = (DICT || []).find(x => x.id === f.dataset.dict); const c = l && Object.values(S.custom).find(x => norm(x.w) === norm(l.w) && !x.v && !x.e);
    if (c) { ['v', 'e', 'f', 'se', 'vl', 'syn', 'ant'].forEach(k => { if (l[k] !== undefined && c[k] === undefined) c[k] = l[k]; }); Store.mark('words'); } }, 0);
});

/* ---------- Ari's own words get what is missing ---------- */
function enrichCustom() {
  let n = 0;
  Object.values(S.custom || {}).forEach(c => { const l = DICT.find(x => norm(x.w) === norm(c.w) && x.p === c.p); if (!l) return;
    ['g', 'pl', 'dim', 'e', 'v', 'f', 'd', 's', 'se', 'en'].forEach(k => { if ((c[k] === undefined || c[k] === null || c[k] === '') && l[k]) { c[k] = l[k]; n++; } }); });
  if (n) Store.mark('words');
  return n;
}

/* ---------- searching in Woorden finds woordenboek words too ---------- */
function dictHits(q) {
  q = norm(q || ''); if (q.length < 2 || !DICT) return '';
  const have = new Set(allWords().map(l => norm(l.w)));
  const hits = DICT.filter(l => !have.has(norm(l.w)) && (norm(l.w).startsWith(q) || norm(l.en || '').split(/[ ,]+/).includes(q))).slice(0, 8);
  if (!hits.length) return '';
  return `<div class="eyebrow" style="margin-top:12px"><span class="dictpill">Woordenboek</span> nog niet in je woorden</div>${hits.map(l => `<button class="tapline" data-act="dict-word" data-id="${esc(l.id)}"><div class="t"><div class="nl" style="font-weight:600">${wordHTML(l)}</div><div class="small">${esc(l.en || '')}</div></div><span class="chev">›</span></button>`).join('')}`;
}
const dictById = id => (DICT || []).find(l => l.id === id);

// load it after the app has opened, so opening stays fast
setTimeout(() => { loadDict().catch(() => {}); }, 2500);
