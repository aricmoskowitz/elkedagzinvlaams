/* ===== VERSION 1.5: four tabs (Pad · Woorden · Naslag · Ik), curriculum reference,
   word facts, flashcards with swipe, add any word to a set ===== */

/* ---------- tabs ---------- */
function render() {
  const m = $('#main'); if (!m) return;
  if (!['pad', 'woorden', 'naslag', 'ik'].includes(TAB)) TAB = 'pad';
  const st = m.scrollTop;
  m.innerHTML = {pad: viewPad, woorden: viewWoorden, naslag: viewNaslag, ik: viewIk}[TAB]();
  $$('#tabs button').forEach(b => { b.classList.toggle('on', b.dataset.tab === TAB); b.setAttribute('aria-selected', b.dataset.tab === TAB); });
  m.scrollTop = st;
  if (TAB === 'pad') afterRenderMaps();
  if (TAB === 'naslag') afterNaslag();
}
function padLinks() {
  const due = dueKeys().length; const left = Math.max(0, (S.settings.cap || 60) - doneToday()); const rev = Math.min(due, left);
  return `<div>
    <button class="tapline" data-act="review"><div class="t"><div style="font-weight:600" data-en="Review">Herhalen</div><div class="small">${rev ? `${rev} kaart${rev === 1 ? '' : 'en'} · ~${Math.max(1, Math.ceil(rev * 10 / 60))} min` : due ? 'Daglimiet bereikt' : 'Niets te herhalen'}</div></div><span class="chev">›</span></button>
    <button class="tapline" data-act="feed"><div class="t"><div style="font-weight:600">Scroll</div><div class="small">Eén tik per kaart, voor als je moe bent</div></div><span class="chev">›</span></button>
  </div>`;
}
function weekBlock() {
  const d = new Date(); const ws = weekStartDay(d), td = dayNum(d);
  const act = [0, 1, 2, 3, 4, 5, 6].map(i => { const dd = new Date(d); dd.setDate(d.getDate() - (td - (ws + i))); const a = S.activity[dateKey(dd)]; return !!(a && a.n); });
  return `<div class="stack" style="gap:6px"><div class="spread"><span class="eyebrow">Deze week</span><span class="small">${act.filter(Boolean).length} van 5 dagen</span></div><div class="weekbar">${act.map(a => `<span class="${a ? 'on' : ''}"></span>`).join('')}</div></div>`;
}

/* ---------- words anywhere: tap to see, tap to add ---------- */
const FUNC_W = new Set('ik jij je u hij zij ze het wij we jullie men mij me jou hem haar ons hen hun mijn jouw zijn uw onze de een dit dat deze die er hier daar en of maar want dus om in op aan bij naar van met voor uit door over tot na te als dan niet geen ook nog wel al zo heel wat wie waar hoe hé ja nee'.split(' '));
function tapWords(text) {
  return esc(text).split(/(\s+)/).map((tok, i) => {
    const core = tok.replace(/^[^\p{L}’']+|[^\p{L}’']+$/gu, '');
    if (!core) return tok;
    if (FUNC_W.has(core.toLowerCase()) && !FORM_IX[norm(core)]) return tok;
    if (i > 0 && /^\p{Lu}/u.test(core) && !FORM_IX[norm(core)]) return tok;
    const n = norm(core); const id = FORM_IX[n] || (Object.values(S.custom || {}).find(l => norm(l.w) === n) || {}).id;
    return tok.replace(core, id ? `<button class="rw" data-act="word" data-id="${id}">${core}</button>` : `<button class="rw new" data-act="word-add" data-w="${esc(core)}">${core}</button>`);
  }).join('');
}
function readHTML(text) { return tapWords(text); }
function quickAdd(w) {
  const sets = S.sets;
  const s = openSheet(`<div class="stack">
    <div class="eyebrow">Nieuw woord</div><div class="wc-word">${esc(w)}</div>
    <div class="small">Dit woord staat nog niet in je woorden. Voeg het toe aan <b>Mijn woorden</b>${sets.length ? ' of aan een set' : ''}; vul de kaart nu of later aan.</div>
    <label class="f">Zet ook in set<select id="qa-set"><option value="">Alleen Mijn woorden</option>${sets.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select></label>
    <button class="btn block" id="qa-go">Vul de kaart in</button>
  </div>`);
  s.querySelector('#qa-go').onclick = () => { const set = s.querySelector('#qa-set').value; closeSheet(); wordForm(set || null, w); };
}
/* the form, now with a prefilled word and a set picker */
function wordForm(setId, prefill) {
  const s = openSheet(`<form id="wform" class="stack" autocomplete="off">
    <h2>Nieuw woord</h2>
    <label class="f">Woord<input id="nw-w" type="text" lang="nl" autocapitalize="off" autocorrect="off" spellcheck="false" required value="${esc(prefill || '')}"></label>
    ${AI.ok !== false ? '<button class="link" type="button" id="nw-draft">Laat Claude de kaart invullen ›</button><div id="nw-draft-st"></div>' : ''}
    <div id="nw-err" class="small" style="color:var(--warn)" hidden>Vul het woord en de Nederlandse uitleg in.</div>
    <label class="f">Soort<select id="nw-p"><option value="n">zelfstandig naamwoord</option><option value="v">werkwoord</option><option value="adj">bijvoeglijk naamwoord</option><option value="adv">bijwoord / ander</option></select></label>
    <div id="nw-noun" class="stack" style="gap:10px"><div class="row"><label class="chip"><input type="radio" name="nw-g" value="de" checked> <b class="de">de</b></label><label class="chip"><input type="radio" name="nw-g" value="het"> <b class="het">het</b></label></div>
    <div class="grid2"><label class="f">Meervoud<input id="nw-pl" type="text" lang="nl" autocapitalize="off"></label><label class="f">Verkleinwoord<input id="nw-dim" type="text" lang="nl" autocapitalize="off"></label></div></div>
    <label class="f">Uitleg in het Nederlands<textarea id="nw-d" rows="2" lang="nl"></textarea></label>
    <label class="f">Voorbeeldzin<input id="nw-s" type="text" lang="nl"></label>
    <label class="f">Engels<input id="nw-en" type="text"></label>
    <label class="f">Set<select id="nw-set"><option value="">Alleen Mijn woorden</option>${S.sets.map(x => `<option value="${x.id}" ${x.id === setId ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
    <button class="btn block" type="submit">Bewaar</button>
  </form>`);
  const dr = s.querySelector('#nw-draft'); if (dr) dr.onclick = () => draftWord(s);
  s.querySelector('#nw-p').onchange = e => { s.querySelector('#nw-noun').hidden = e.target.value !== 'n'; };
  s.querySelector('#wform').onsubmit = e => {
    e.preventDefault();
    const w = s.querySelector('#nw-w').value.trim(), d = s.querySelector('#nw-d').value.trim();
    if (!w || !d) { s.querySelector('#nw-err').hidden = false; return; }
    const p = s.querySelector('#nw-p').value; const id = 'u-' + Date.now().toString(36);
    const l = {id, custom: true, w, p, d, s: s.querySelector('#nw-s').value.trim(), en: s.querySelector('#nw-en').value.trim(), u: 0};
    if (p === 'n') { l.g = s.querySelector('input[name="nw-g"]:checked').value; l.pl = s.querySelector('#nw-pl').value.trim() || null; l.dim = s.querySelector('#nw-dim').value.trim() || null; }
    S.custom[id] = l; S.seen[id] = 1; introduce('w:' + id + ':rec');
    const sid = s.querySelector('#nw-set').value; if (sid) { const set = S.sets.find(x => x.id === sid); if (set) set.ids.push(id); }
    Store.mark('words', 'items', 'state'); closeSheet(); toast('Bewaard: ' + w); render();
  };
}

/* ---------- word facts: the forms Ari asked for, per kind of word ---------- */
const CMP = {goed: ['beter', 'best'], veel: ['meer', 'meest'], weinig: ['minder', 'minst'], graag: ['liever', 'liefst'], vaak: ['vaker', 'vaakst'], dichtbij: ['dichterbij', 'dichtstbij'], moe: ['moeër', 'moest'], vorig: null};
function adjForms(l) {
  const w = l.w.toLowerCase();
  if (w in CMP) return CMP[w];
  if (l.p !== 'adj') return null;
  const e = l.e || w + 'e';
  const cmp = w.endsWith('r') ? w + 'der' : e + 'r';
  const sup = w.endsWith('s') ? w + 't' : w + 'st';
  return [cmp, sup];
}
const presPart = l => l.w === 'zijn' ? 'zijnde' : l.w + 'd';
function verbFacts(l) {
  const f = vForms(l); const sp = x => f.sep ? `${x} … ${f.sep}` : x;
  return [['ik (nu)', 'ik ' + sp(f.ik)], ['jij (nu)', 'jij ' + sp(f.jij)], ['wij (nu)', 'wij ' + sp(f.pl)], ['ik (verleden)', 'ik ' + sp(f.im[0])], ['wij (verleden)', 'wij ' + sp(f.im[1])],
    ['voltooid deelwoord', f.pp === '—' ? '—' : auxWord(f.aux) + ' ' + f.sep + f.pp], ['tegenwoordig deelwoord', presPart(l)]];
}
function wordFacts(l) {
  let rows = [];
  if (l.p === 'n') rows = [['lidwoord', l.g ? `<b class="${l.g}">${l.g}</b>` : '—'], ['meervoud', l.pl ? `<span class="de">de</span> ${esc(l.pl)}` : '—'], ['verkleinwoord', l.dim ? `<span class="het">het</span> ${esc(l.dim)}` : '—']];
  else if (l.v) rows = verbFacts(l).map(([k, v]) => [k, `<span class="verbword">${esc(v)}</span>`]);
  else { const a = adjForms(l); if (a) rows = [['vergrotende trap', esc(a[0])], ['overtreffende trap', 'het ' + esc(a[1])]]; if (l.e && l.p === 'adj') rows.unshift(['voor een de-woord', esc(l.e)]); }
  if (!rows.length) return '';
  return `<dl class="facts">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
}
function setsOf(id) { return S.sets.filter(s => s.ids.includes(id)); }
function wordCardHTML(l, opts = {}) {
  const s = l.s ? `<div class="row" style="align-items:flex-start">${speakBtn(l.s)}<div class="nl" style="font-size:18px">${highlight(l.s, l.w)}</div></div>` : '';
  const inSets = setsOf(l.id);
  return `<div class="stack">
    <div class="spread"><div><div class="eyebrow">${POS[l.p] || ''}${l.custom ? ' · mijn woord' : ''}</div><div class="wc-word">${wordHTML(l)}</div></div>${speakBtn((l.g ? l.g + ' ' : '') + l.w)}</div>
    ${wordFacts(l)}
    <div><div class="eyebrow">Betekenis</div><div class="nl" style="font-size:18px;line-height:1.45">${esc(l.d || '—')}</div></div>
    ${s ? `<div><div class="eyebrow">Voorbeeld</div>${s}</div>` : ''}
    ${l.v ? `<details class="more"><summary>Alle vervoegingen</summary>${conjTable(l)}</details>` : ''}
    ${!l.v && l.why ? `<div class="why small">${l.why}</div>` : ''}
    ${l.note ? `<div class="why small" style="border-left:3px solid var(--line);padding-left:10px">${l.note}</div>` : ''}
    <div><button class="en-hidden" data-act="reveal-en" data-en-text="${esc(l.en || '')}">Toon Engels</button></div>
    ${opts.actions === false ? '' : `${inSets.length ? `<div class="small">In: ${inSets.map(x => esc(x.name)).join(', ')}</div>` : ''}<div class="row wrap"><button class="btn line" data-act="add-to-set" data-id="${esc(l.id)}">+ Aan een set</button>${AI.ok !== false ? `<button class="btn line" data-act="zeg" data-id="${esc(l.id)}">Zeg het anders</button>` : ''}</div>`}
  </div>`;
}
function addToSetSheet(wordId) {
  openSheet(`<div class="stack"><h2>Aan welke set?</h2>${S.sets.map(s => `<button class="btn line block" data-act="set-add" data-set="${s.id}" data-id="${esc(wordId)}" data-close="1" ${s.ids.includes(wordId) ? 'disabled' : ''}>${esc(s.name)}${s.ids.includes(wordId) ? ' · zit erin' : ''}</button>`).join('') || '<div class="small">Je hebt nog geen eigen sets.</div>'}<button class="btn block" data-act="set-new-with" data-id="${esc(wordId)}">+ Nieuwe set</button></div>`);
}

/* ---------- WOORDEN tab ---------- */
let WSEG = 'woorden';
const allWords = () => LEX.concat(Object.values(S.custom || {}));
function viewWoorden() {
  const segs = [['woorden', 'Woorden', 'Words'], ['werkwoorden', 'Werkwoorden', 'Verbs'], ['sets', 'Sets', 'Word sets']];
  let body = '';
  if (WSEG === 'woorden') body = `<input type="search" id="wsearch" placeholder="Zoek een woord of betekenis" aria-label="Zoek een woord" value="${esc(WQ)}"><div class="row wrap">${[['alle', 'alle'], ['de', 'de'], ['het', 'het'], ['adj', 'bijv. nw.'], ['eigen', 'mijn woorden']].map(f => `<button class="chip${WF === f[0] ? ' on' : ''}" data-act="wfilter" data-f="${f[0]}">${f[1]}</button>`).join('')}</div><div id="wlist">${wordList()}</div>`;
  else if (WSEG === 'werkwoorden') body = `<div class="small">ik · wij (nu) · ik (verleden) · voltooid deelwoord</div><div class="list">${allWords().filter(l => l.v).map(l => { const f = vForms(l); return `<div class="li" data-act="word" data-id="${esc(l.id)}" role="button" tabindex="0"><span class="w">${esc(l.w)}</span><span class="d"><span class="verbword">${esc(f.ik)} · ${esc(f.pl)} · ${esc(f.im[0])} · ${esc(f.sep + f.pp)}</span></span></div>`; }).join('')}</div>`;
  else {
    const unitSets = UNITS.filter(u => u.built).map(u => getSet('unit-' + u.id));
    const mine = Object.keys(S.custom || {});
    body = `<div class="eyebrow">Mijn sets</div><div>${[{id: 'mine', name: 'Mijn woorden', ids: mine, own: true}].concat(S.sets.map(s => ({...s, own: true}))).map(setRow).join('')}</div>
      <div class="grid2"><button class="btn line" data-act="set-new">Nieuwe set</button><button class="btn line" data-act="word-new">Nieuw woord</button></div>
      <div class="eyebrow" style="margin-top:8px">Per stad</div><div>${unitSets.map(setRow).join('')}</div>`;
  }
  return `<div class="stack">
    <div class="spread"><h1 data-en="Words">Woorden</h1><button class="btn" data-act="cards" style="min-height:42px;padding:8px 16px">Kaarten</button></div>
    ${coachTip('woorden', 'Al je woorden: zoek, tik voor alle vormen en zet ze in een set. Met Kaarten oefen je ze: veeg naar rechts als je het weet, naar links als je het nog niet weet.')}
    <div class="row wrap">${segs.map(s => `<button class="chip${WSEG === s[0] ? ' on' : ''}" data-act="wseg" data-seg="${s[0]}" data-en="${s[2]}">${s[1]}</button>`).join('')}</div>
    ${body}
  </div>`;
}
function setRow(s) {
  return `<div class="tapline" style="cursor:default"><div class="t"><div class="nl" style="font-size:18px">${esc(s.name)}</div><div class="small">${s.ids.length} woorden</div></div><button class="btn line" style="min-height:40px;padding:8px 12px" data-act="cards" data-set="${s.id}" ${s.ids.length ? '' : 'disabled'}>Kaarten</button>${s.own && s.id !== 'mine' ? `<button class="iconbtn" data-act="set-edit" data-id="${s.id}" aria-label="Bewerk set" style="color:var(--go)">✎</button>` : ''}</div>`;
}
function wordList() {
  const q = norm(WQ);
  const res = allWords().filter(l => (WF === 'alle' || (WF === 'adj' ? l.p === 'adj' : WF === 'eigen' ? l.custom : l.g === WF)) && (!q || norm(l.w).includes(q) || norm(l.d || '').includes(q) || norm(l.en || '').includes(q)));
  if (!res.length) return `<div class="small" style="padding:12px 0">Geen woorden gevonden. ${WQ ? `<button class="link" data-act="word-add" data-w="${esc(WQ)}">Voeg “${esc(WQ)}” toe ›</button>` : ''}</div>`;
  return `<div class="list">${res.map(l => `<div class="li" data-act="word" data-id="${esc(l.id)}" role="button" tabindex="0"><span class="w">${wordHTML(l)}</span><span class="d">${esc(l.d || '')}</span></div>`).join('')}</div>`;
}

/* ---------- FLASHCARDS: simple or full, swipe right = I know it ---------- */
const MODAL_EN = new Set(['can', 'may', 'must', 'shall', 'will', 'should']);
function enBase(l) {
  const parts = String(l.en || '').replace(/\(.*?\)/g, '').split(/[;,]/).map(t => t.trim()).filter(Boolean);
  if (!parts.length) return null;
  if (MODAL_EN.has(parts[0])) return parts[0];
  const to = parts.find(p => p.startsWith('to ')); return to ? to.slice(3) : parts[0];
}
function en3(base) {
  const [w, ...rest] = base.split(' '); let x;
  if (MODAL_EN.has(w)) x = w; else if (w === 'be') x = 'is'; else if (w === 'have') x = 'has'; else if (/(s|sh|ch|x|z|o)$/.test(w)) x = w + 'es'; else if (/[^aeiou]y$/.test(w)) x = w.slice(0, -1) + 'ies'; else x = w + 's';
  return [x, ...rest].join(' ');
}
const PERS = [['ik', 'I', 'ik'], ['jij', 'you', 'jij'], ['hij', 'he', 'hij'], ['zij', 'she', 'hij'], ['wij', 'we', 'pl'], ['jullie', 'you all', 'pl'], ['zij', 'they', 'pl']];
function verbPair(l) {
  const f = vForms(l); const b = enBase(l); const p = PERS[rnd(PERS.length)];
  const nl = `${p[0]} ${f[p[2]]}${f.sep ? ' ' + f.sep : ''}`;
  if (!b) return {nl, en: l.d};
  const [w, ...rest] = b.split(' ');
  let en;
  if (w === 'be') en = p[1] + ' ' + (p[1] === 'I' ? 'am' : ['he', 'she'].includes(p[1]) ? 'is' : 'are') + (rest.length ? ' ' + rest.join(' ') : '');
  else en = p[1] + ' ' + (['he', 'she'].includes(p[1]) ? en3(b) : b);
  return {nl, en};
}
let CARDS = null;
function deckOptions() {
  const own = [{id: 'mine', name: 'Mijn woorden', ids: Object.keys(S.custom || {})}].concat(S.sets);
  const units = UNITS.filter(u => u.built).map(u => getSet('unit-' + u.id));
  return [{id: 'seen', name: 'Woorden die ik al zag', ids: Object.keys(S.seen || {}).filter(id => LX(id))},
    {id: 'weak', name: 'Moeilijke woorden', ids: allWords().filter(l => { const it = S.items['w:' + l.id + ':rec']; return it && (it.l > 0 || it.e < 2.4); }).map(l => l.id)},
    {id: 'verbs', name: 'Alle werkwoorden', ids: allWords().filter(l => l.v).map(l => l.id)},
    {id: 'nouns', name: 'Alle zelfstandige naamwoorden', ids: allWords().filter(l => l.p === 'n').map(l => l.id)},
    {id: 'adjs', name: 'Alle bijvoeglijke naamwoorden', ids: allWords().filter(l => l.p === 'adj').map(l => l.id)}].concat(own, units);
}
function openCards(setId) {
  const decks = deckOptions(); const pre = S.settings.cards || {mode: 'simple', dir: 'nl', n: 20};
  const s = openSheet(`<div class="stack">
    <h2>Kaarten</h2>
    <label class="f">Welke woorden?<select id="cd-deck">${decks.map(d => `<option value="${d.id}" ${d.id === (setId || 'seen') ? 'selected' : ''} ${d.ids.length ? '' : 'disabled'}>${esc(d.name)} (${d.ids.length})</option>`).join('')}</select></label>
    <div class="eyebrow">Soort kaart</div>
    <div class="row wrap"><label class="chip"><input type="radio" name="cd-mode" value="simple" ${pre.mode === 'simple' ? 'checked' : ''}> Eenvoudig</label><label class="chip"><input type="radio" name="cd-mode" value="full" ${pre.mode === 'full' ? 'checked' : ''}> Volledig</label></div>
    <div class="small">Eenvoudig: woord ↔ vertaling; een werkwoord krijgt een persoon (<i>jij neemt</i> ↔ <i>you take</i>). Volledig: het woord, en achteraan alle vormen, de uitleg en een voorbeeldzin.</div>
    <div class="eyebrow">Voorkant</div>
    <div class="row wrap"><label class="chip"><input type="radio" name="cd-dir" value="nl" ${pre.dir === 'nl' ? 'checked' : ''}> Nederlands</label><label class="chip"><input type="radio" name="cd-dir" value="en" ${pre.dir === 'en' ? 'checked' : ''}> Engels</label><label class="chip"><input type="radio" name="cd-dir" value="mix" ${pre.dir === 'mix' ? 'checked' : ''}> Door elkaar</label></div>
    <label class="f">Hoeveel?<select id="cd-n">${[10, 20, 40, 999].map(n => `<option value="${n}" ${pre.n === n ? 'selected' : ''}>${n === 999 ? 'alle' : n}</option>`).join('')}</select></label>
    <button class="btn block" id="cd-go">Start</button>
  </div>`);
  s.querySelector('#cd-go').onclick = () => {
    const deck = decks.find(d => d.id === s.querySelector('#cd-deck').value);
    const mode = s.querySelector('input[name="cd-mode"]:checked').value, dir = s.querySelector('input[name="cd-dir"]:checked').value, n = +s.querySelector('#cd-n').value;
    S.settings.cards = {mode, dir, n}; Store.mark('state'); closeSheet();
    startCards(shuffle(deck.ids.filter(id => LX(id))).slice(0, n), {mode, dir, name: deck.name});
  };
}
function startCards(ids, o) {
  if (!ids.length) { toast('Geen woorden in deze stapel'); return; }
  CARDS = {ids, i: 0, known: [], unknown: [], flipped: false, ...o};
  openOverlay('cards', `<button class="iconbtn" data-act="overlay-close" data-id="cards" aria-label="Sluiten">✕</button><div class="progress"><div id="cd-prog" style="width:0%"></div></div><span class="small" id="cd-count"></span>`, `<div id="cd-body" class="stack"></div>`);
  cardRender();
}
function cardFaces(l) {
  const front = CARDS.dir === 'mix' ? (rnd(2) ? 'nl' : 'en') : CARDS.dir;
  if (CARDS.mode === 'full') {
    const nlFace = `<div class="eyebrow">${POS[l.p] || ''}</div><div class="wc-word">${wordHTML(l)}</div>`;
    const enFace = `<div class="eyebrow">${POS_EN[l.p] || ''}</div><div class="wc-word" style="font-family:var(--ui)">${esc(l.en || l.d)}</div>`;
    const back = `<div class="stack" style="gap:10px;text-align:left">${front === 'en' ? `<div class="wc-word">${wordHTML(l)}</div>` : `<div class="small">${esc(l.en || '')}</div>`}${wordFacts(l)}<div class="nl" style="font-size:17px">${esc(l.d || '')}</div>${l.s ? `<div class="nl" style="font-size:17px"><i>${highlight(l.s, l.w)}</i></div>` : ''}</div>`;
    return {front: front === 'en' ? enFace : nlFace, back, say: (l.g ? l.g + ' ' : '') + l.w};
  }
  let nl, en;
  if (l.v) { const p = verbPair(l); nl = esc(p.nl); en = esc(p.en); }
  else { nl = wordHTML(l); en = esc(l.en || l.d || ''); }
  const nlF = `<div class="wc-word">${nl}</div>`, enF = `<div class="wc-word" style="font-family:var(--ui)">${en}</div>`;
  return {front: front === 'en' ? enF : nlF, back: front === 'en' ? nlF : enF, say: l.v ? nl.replace(/<[^>]+>/g, '') : (l.g ? l.g + ' ' : '') + l.w, nlBack: front === 'en'};
}
function cardRender() {
  const C = CARDS; const b = $('#cd-body'); if (!b) return;
  $('#cd-prog').style.width = Math.round(100 * C.i / C.ids.length) + '%'; $('#cd-count').textContent = Math.min(C.i + 1, C.ids.length) + ' / ' + C.ids.length;
  if (C.i >= C.ids.length) {
    b.innerHTML = `<div class="stack" style="padding-top:20px"><div class="eyebrow">Klaar · ${esc(C.name)}</div><div class="grid2"><div><div class="big-num" style="color:var(--go)">${C.known.length}</div><div class="small">wist ik</div></div><div><div class="big-num" style="color:var(--warn)">${C.unknown.length}</div><div class="small">nog niet</div></div></div>
      ${C.unknown.length ? `<div class="list">${C.unknown.map(id => LX(id)).map(l => `<div class="li" data-act="word" data-id="${esc(l.id)}" role="button" tabindex="0"><span class="w">${wordHTML(l)}</span><span class="d">${esc(l.en || '')}</span></div>`).join('')}</div><button class="btn block" data-act="cards-again">Oefen de ${C.unknown.length} onbekende opnieuw</button>` : ''}
      <button class="btn line block" data-act="overlay-close" data-id="cards">Terug</button></div>`;
    Store.mark('items', 'state'); return;
  }
  const l = LX(C.ids[C.i]); C.face = cardFaces(l); C.flipped = false;
  b.innerHTML = `${C.i === 0 ? coachTip('cards', 'Tik op de kaart om ze om te draaien. Veeg naar rechts als je het wist, naar links als je het nog niet wist. De knoppen eronder doen hetzelfde.') : ''}
    <div class="swipe-wrap"><div class="swipe-hint left">nog niet</div><div class="swipe-hint right">wist ik</div>
    <div class="fcard2" id="fcard" role="button" tabindex="0" aria-label="Draai de kaart om"><div class="face">${C.face.front}</div><div class="small tapnote">Tik om om te draaien</div></div></div>
    <div class="grid2"><button class="btn line warnline" data-act="card-grade" data-ok="0">← Nog niet</button><button class="btn" data-act="card-grade" data-ok="1">Wist ik →</button></div>
    <div class="row" style="justify-content:center">${speakBtn(C.face.say)}</div>`;
  bindSwipe($('#fcard'));
}
function cardFlip() {
  const C = CARDS; if (!C) return; const el = $('#fcard'); if (!el) return;
  C.flipped = !C.flipped; el.classList.toggle('flipped', C.flipped);
  $('.face', el).innerHTML = C.flipped ? C.face.back : C.face.front; $('.tapnote', el).textContent = C.flipped ? 'Veeg of kies hieronder' : 'Tik om om te draaien';
  if (C.flipped && (C.face.nlBack || CARDS.mode === 'full')) Audio.say(C.face.say);
}
function cardGrade(ok) {
  const C = CARDS; if (!C || C.i >= C.ids.length) return;
  const id = C.ids[C.i]; grade('w:' + id + ':rec', ok); (ok ? C.known : C.unknown).push(id);
  const el = $('#fcard');
  if (el && !reduceMotion) { el.style.transition = 'transform .22s ease-in, opacity .22s'; el.style.transform = `translateX(${ok ? 420 : -420}px) rotate(${ok ? 18 : -18}deg)`; el.style.opacity = '0'; setTimeout(() => { C.i++; cardRender(); }, 200); }
  else { C.i++; cardRender(); }
}
function bindSwipe(el) {
  if (!el) return; let x0 = null, y0 = 0, dx = 0, moved = false;
  el.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; dx = 0; moved = false; el.setPointerCapture(e.pointerId); el.style.transition = 'none'; });
  el.addEventListener('pointermove', e => {
    if (x0 === null) return; dx = e.clientX - x0; if (Math.abs(dx) > 6) moved = true;
    el.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    const w = el.parentElement; w.classList.toggle('lean-right', dx > 50); w.classList.toggle('lean-left', dx < -50);
  });
  const end = () => {
    if (x0 === null) return; x0 = null; const w = el.parentElement; w.classList.remove('lean-right', 'lean-left');
    if (Math.abs(dx) > 90) return cardGrade(dx > 0);
    el.style.transition = 'transform .18s'; el.style.transform = '';
    if (!moved) cardFlip();
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', () => { x0 = null; el.style.transform = ''; });
  el.addEventListener('keydown', e => { if (e.key === 'ArrowRight') cardGrade(true); if (e.key === 'ArrowLeft') cardGrade(false); if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); cardFlip(); } });
}

/* ---------- NASLAG: the whole curriculum, Boog → Stad → Plein ---------- */
let NFOCUS = null, NQ = '';
function plainText(h) { return String(h || '').replace(/<[^>]+>/g, ''); }
function naslagSquare(q) {
  const m = mineFor(q.id); const n = m.fixes.length + m.words.length; const st = locStatus(planLoc(q.id));
  const built = q.built && SQ[q.id];
  const words = built ? SQ[q.id].words.map(LX).filter(Boolean) : [];
  const search = norm([q.name, q.title, q.en, plainText(q.rule), words.map(l => l.w + ' ' + (l.en || '')).join(' ')].join(' '));
  let inner;
  if (q.review) inner = `<div class="small">${esc(q.rule)}</div>${PT[q.u].built ? `<button class="link sm" data-act="markt" data-u="${q.u}">Naar de Grote Markt ›</button>` : ''}`;
  else if (built) {
    const S2 = SQ[q.id];
    inner = `<div class="eyebrow">Ontdek · de regel</div><p class="why" style="margin:0">${S2.rule}</p>
      ${S2.ex.map(id => { const s = SX[id]; return `<div class="row" style="align-items:flex-start">${speakBtn(s.nl)}<div><div class="nl" style="font-size:17px">${tapWords(s.nl)}</div><div class="small">${esc(s.en)}</div></div></div>`; }).join('')}
      <div class="eyebrow">Woorden</div><div class="row wrap" style="gap:6px">${words.map(l => `<button class="chip" data-act="word" data-id="${l.id}">${wordHTML(l)}</button>`).join('')}</div>
      ${READ[q.id] ? `<div class="small">Lees: ${esc(READ[q.id].title)}</div>` : ''}
      ${m.fixes.length ? `<div class="eyebrow">Van jou</div>${m.fixes.map(f => `<div class="small"><s>${esc(f.wrong)}</s> → <b class="nl">${esc(f.right)}</b></div>`).join('')}` : ''}
      <div class="row wrap"><button class="link sm" data-act="lesson-ro" data-q="${q.id}">Hele les ›</button><button class="link sm" data-act="plan-sq" data-id="${q.id}">Naar het plein ›</button></div>`;
  } else inner = `<p class="why" style="margin:0">${esc(q.rule)}</p><div class="small">Dit plein wordt later gebouwd.</div>${n ? `<button class="link sm" data-act="plan-sq" data-id="${q.id}">Van jou: ${n} ›</button>` : ''}`;
  return `<details class="nsq${q.review ? ' review' : ''}" id="ns-${q.id}" data-s="${esc(search)}"><summary><span class="pn${q.review ? ' star' : ''}">${q.review ? '★' : q.n}</span><span class="t"><span class="nl">${esc(q.name)}</span><span class="small"> · ${esc(q.review ? 'herhaling en opdracht' : q.title)}</span></span>${n ? `<span class="badge">${n}</span>` : ''}<span class="st ${st.replace(' ', '')}">${st}</span></summary><div class="nbody stack" style="gap:8px">${inner}</div></details>`;
}
function naslagTown(t, ti) {
  const sqs = PLAN_SQ.filter(q => q.u === t.id); const g = GRAM[t.id];
  const gsearch = norm([t.name, t.gram, t.gramEn, t.theme, t.can, g ? plainText(g.why) : ''].join(' '));
  return `<details class="ntown" id="nt-${t.id}"><summary><span class="t"><span class="small">Stad ${ti + 1}</span> <b class="nl" style="font-size:18px">${esc(t.name)}</b><br><span class="small">${esc(t.gram)} · ${esc(t.theme)}</span></span></summary>
    <div class="nbody stack" style="gap:6px">
      <div class="small cando">${esc(t.can)}</div>
      ${g ? `<details class="nsq gram" id="ng-${t.id}" data-s="${esc(gsearch)}"><summary><span class="pn star">G</span><span class="t"><span class="nl">Grammatica</span><span class="small"> · ${esc(g.title)}</span></span></summary><div class="nbody stack" style="gap:8px"><div class="why">${g.why}</div>${(g.body || []).map(p => `<div class="why">${p}</div>`).join('')}${g.ex && g.ex[0] && SX[g.ex[0]] ? frameHTML(SX[g.ex[0]]) : ''}</div></details>` : ''}
      ${sqs.map(naslagSquare).join('')}
    </div></details>`;
}
function viewNaslag() {
  const curArc = arcOf(SQ[S.cur] ? SQ[S.cur].u : 'u1').id;
  const arcs = DELEN.map(D => `<div class="deel"><div class="eyebrow">${esc(D.name)} · ${esc(D.en)}</div>` + ARCS.filter(a => a.deel === D.id).map(a => {
    const towns = PLAN_TOWNS.filter(t => t.arc === a.id);
    return `<details class="planarc narc" id="na-${a.id}" ${a.id === curArc ? 'open' : ''}><summary><span class="t"><b>Boog ${a.n} · ${esc(a.name)}</b><span class="small"> · ${towns.length} steden</span></span></summary>${towns.map(naslagTown).join('')}${a.border ? `<div class="small planborder">↓ over ${esc(a.border)} naar boog ${a.n + 1}</div>` : ''}</details>`;
  }).join('') + '</div>').join('');
  return `<div class="stack">
    <h1 data-en="Reference">Naslag</h1>
    ${coachTip('naslag', 'Het hele leerplan, net zoals het pad: boog, stad, plein. Open een plein voor de regel, de voorbeelden en de woorden. Zoek bovenaan.')}
    <input type="search" id="nsearch" placeholder="Zoek: omdat, verkleinwoord, de of het…" aria-label="Zoek in het leerplan" value="${esc(NQ)}">
    <div id="nempty" class="small" hidden>Niets gevonden.</div>
    <details class="nsq" id="ns-frame"><summary><span class="pn star">Z</span><span class="t"><span class="nl">Het zinsschema</span><span class="small"> · de basis van elke zin</span></span></summary><div class="nbody stack" style="gap:8px"><div class="small">Elke hoofdzin past hierin. Goud is het werkwoord: plaats 2 en het einde.</div>${frameHTML(SX.u2s2)}${SX.u7s1 ? frameHTML(SX.u7s1) : ''}</div></details>
    <div id="ncur">${arcs}</div>
  </div>`;
}
function naslagFilter() {
  const q = norm(NQ); let hits = 0;
  $$('#ncur details.nsq').forEach(d => { const ok = !q || d.dataset.s.includes(q); d.hidden = !ok; if (ok && q) { hits++; d.closest('.ntown').open = true; d.closest('.narc').open = true; } });
  if (q) { $$('#ncur .ntown').forEach(t => { t.hidden = !$$('details.nsq:not([hidden])', t).length; }); $$('#ncur .narc').forEach(a => { a.hidden = !$$('.ntown:not([hidden])', a).length; }); $$('#ncur .deel').forEach(d => { d.hidden = !$$('.narc:not([hidden])', d).length; }); }
  else { $$('#ncur .ntown, #ncur .narc, #ncur .deel').forEach(x => { x.hidden = false; }); }
  const e = $('#nempty'); if (e) e.hidden = !q || hits > 0;
}
function afterNaslag() {
  if (NQ) naslagFilter();
  if (NFOCUS) { const id = NFOCUS; NFOCUS = null; const d = $('#ns-' + id) || $('#nt-' + id);
    if (d) { d.open = true; const t = d.closest('.ntown'); if (t) t.open = true; const a = d.closest('.narc'); if (a) a.open = true; d.classList.add('focus'); setTimeout(() => d.scrollIntoView({block: 'center'}), 50); } }
}
function openPlan(focus) {
  if ($('#proc') && focus) { const L = planLoc(focus); const q = PSQ[focus]; openSheet(`<div class="stack"><div class="loc">${locLine(L)}</div><h2>${esc(L ? L.townName + ' · ' + L.sqName : '')}</h2>${q ? `<div class="small">${esc(q.title)} · ${esc(q.en)}</div><p class="why" style="margin:0">${q.rule || ''}</p>` : ''}<div class="small">Na het bewaren vind je dit terug in Naslag.</div><button class="btn block" data-act="sheet-close">Terug naar je verslag</button></div>`); return; }
  closeOverlay('proc'); closeSheet(); TAB = 'naslag'; NFOCUS = focus || null; render(); if (!focus) $('#main').scrollTop = 0; }
