/* ===== VERSION 2.1: the Woorden tab, sets and themes =====
   One list with "Bekijk per": Soort · Stad · Thema · Set. Every group can be studied the
   same way (Herhaal, Kaarten). Own sets have their own page: rename, add or remove
   words, share as an EDZ-WOORDEN v1 block, delete. Word lists are imported under Ik. */
const VIEWS = [['soort', 'Soort', 'Part of speech'], ['stad', 'Stad', 'Town'], ['thema', 'Thema', 'Theme'], ['set', 'Set', 'Set']];
const SOORTEN = [['n', 'Zelfstandige naamwoorden', 'Nouns'], ['v', 'Werkwoorden', 'Verbs'], ['adj', 'Bijvoeglijke naamwoorden', 'Adjectives'], ['adv', 'Bijwoorden', 'Adverbs'], ['x', 'Andere woorden', 'Other words: question words, conjunctions, pronouns']];
let WOPEN = new Set(), WNG = '';
const wview = () => VIEWS.some(v => v[0] === S.settings.wview) ? S.settings.wview : 'soort';
const themeOf = l => (S.themes || {})[l.id] || l.th || THEME_BY_W[norm(l.w)] || '';
const townOfWord = l => l.custom ? (l.plan && PSQ[l.plan] ? PSQ[l.plan].u : null) : (l.u ? 'u' + l.u : null);
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);

/* the groups of one view: {key, name, en, sub, ids} */
function groupDefs(view) {
  const all = allWords();
  if (view === 'soort') return SOORTEN.map(([p, name, en]) => ({key: 'g:soort:' + p, name, en, ids: all.filter(l => p === 'x' ? !['n', 'v', 'adj', 'adv'].includes(l.p) : l.p === p).map(l => l.id)})).filter(g => g.ids.length);
  if (view === 'stad') {
    const by = {}; all.forEach(l => { const u = townOfWord(l) || ''; (by[u] = by[u] || []).push(l.id); });
    return PLAN_TOWNS.filter(t => by[t.id]).map(t => ({key: 'g:stad:' + t.id, name: t.name, en: t.gramEn, sub: `Boog ${arcOf(t.id).n} · Stad ${townIndexInArc(t.id)} · ${t.gram}${t.built ? '' : ' · later'}`, ids: by[t.id]}))
      .concat(by[''] ? [{key: 'g:stad:alg', name: 'Algemeen', en: 'No town', sub: 'Woorden zonder plein', ids: by['']}] : []);
  }
  if (view === 'thema') {
    const by = {}; all.forEach(l => { const t = themeOf(l); (by[t] = by[t] || []).push(l.id); });
    return THEMES.filter(t => by[t.id]).map(t => ({key: 'g:thema:' + t.id, name: t.name, en: t.en, ids: by[t.id]}))
      .concat(by[''] ? [{key: 'g:thema:geen', name: 'Zonder thema', en: 'No theme yet', sub: 'Tik op een woord om een thema te kiezen', ids: by['']}] : []);
  }
  return [getSet('mine')].concat(S.sets).map(x => ({key: x.id, name: x.name, own: x.id !== 'mine', sub: setSub(x), ids: x.ids.filter(id => LX(id))}));
}
function setSub(x) {
  const bits = [plural(x.ids.length, 'woord', 'woorden')];
  if (x.bron) bits.push(esc(x.bron)); if (x.datum) bits.push(esc(x.datum));
  const wait = x.id === 'mine' ? 0 : setWaiting(x); if (wait) bits.push(`<span data-en="${wait} not yet in Herhalen">${wait} wachten</span>`);
  return bits.join(' · ');
}

/* ---------- the tab ---------- */
// replaces the 1.5 viewWoorden (app13): segments and filter chips are gone
function viewWoorden() {
  const v = wview();
  return `<div class="stack">
    <h1 data-en="Words">Woorden</h1>
    ${coachTip('woorden2', 'Bekijk je woorden per soort, per stad, per thema of per set. Open een groep om de woorden te zien. Met Herhaal en Kaarten oefen je precies die groep. Je eigen sets beheer je onder Set.')}
    <input type="search" id="wsearch" placeholder="Zoek een woord of betekenis" aria-label="Zoek een woord" value="${esc(WQ)}">
    <div class="row wrap" role="tablist" aria-label="Bekijk per"><span class="small" style="align-self:center">Bekijk per</span>${VIEWS.map(x => `<button class="chip${v === x[0] ? ' on' : ''}" data-act="wview" data-v="${x[0]}" role="tab" aria-selected="${v === x[0]}" data-en="${x[2]}">${x[1]}</button>`).join('')}</div>
    <div id="wlist">${wordList()}</div>
    <button class="tapline" style="margin-top:8px" data-act="verslag"><div class="t"><div style="font-weight:600" data-en="Paste report">Verslag plakken</div><div class="small">Een woordenlijst of verslag van Claude toevoegen</div></div><span class="chev">›</span></button>
  </div>`;
}
// replaces app13 wordList: search results, or the groups of the current view
function wordList() {
  const q = norm(WQ);
  if (q) {
    const res = allWords().filter(l => norm(l.w).includes(q) || norm(l.d || '').includes(q) || norm(l.en || '').includes(q));
    if (!res.length) return `<div class="small" style="padding:12px 0">Geen woorden gevonden. <button class="link" data-act="word-add" data-w="${esc(WQ)}">Voeg “${esc(WQ)}” toe ›</button></div>`;
    return `<div class="small">${plural(res.length, 'woord', 'woorden')}</div>${wordRows(res)}`;
  }
  const v = wview(); const gs = groupDefs(v);
  return gs.map(g => groupHTML(g, v)).join('') + (v === 'set' ? `<div class="grid2" style="margin-top:12px"><button class="btn line" data-act="set-new">Nieuwe set</button><button class="btn line" data-act="word-new">Nieuw woord</button></div>` : '');
}
function groupHTML(g, v) {
  const n = g.ids.length; const open = WOPEN.has(g.key);
  const head = v === 'set'
    ? `<button class="wtoggle" data-act="set-edit" data-id="${esc(g.key)}"><span class="t"><span class="nl wname">${esc(g.name)}</span><span class="small">${g.sub}</span></span><span class="chev">›</span></button>`
    : `<button class="wtoggle" data-act="wgroup" data-id="${esc(g.key)}" aria-expanded="${open}"${g.en ? ` data-en="${esc(g.en)}"` : ''}><span class="t"><span class="nl wname">${esc(g.name)}</span><span class="small">${plural(n, 'woord', 'woorden')}${g.sub ? ' · ' + esc(g.sub) : ''}</span></span><span class="chev${open ? ' open' : ''}">›</span></button>`;
  return `<section class="wgroup"><div class="whead">${head}<div class="wacts">${studyButtons(g.key, n)}</div></div>${open ? groupBody(g) : ''}</section>`;
}
const studyButtons = (id, n) => `<button class="btn line sm" data-act="set-review" data-id="${esc(id)}" data-en="Review these words" ${n ? '' : 'disabled'}>Herhaal</button><button class="btn line sm" data-act="cards" data-set="${esc(id)}" data-en="Flashcards" ${n ? '' : 'disabled'}>Kaarten</button>`;
function groupBody(g) {
  let ls = g.ids.map(LX).filter(Boolean);
  let chips = '';
  if (g.key === 'g:soort:n') {
    chips = `<div class="row wrap">${[['', 'alle'], ['de', 'de'], ['het', 'het']].map(([k, l]) => `<button class="chip${WNG === k ? ' on' : ''}" data-act="wng" data-g="${k}">${k ? `<b class="${k}">${l}</b>` : l}</button>`).join('')}</div>`;
    if (WNG) ls = ls.filter(l => l.g === WNG);
  }
  return `<div class="wbody">${chips}${wordRows(ls, g.key === 'g:soort:v')}</div>`;
}
function wordRows(ls, verbs) {
  return `<div class="list">${ls.map(l => { const f = verbs && l.v ? vForms(l) : null;
    return `<div class="li" data-act="word" data-id="${esc(l.id)}" role="button" tabindex="0"><span class="w">${wordHTML(l)}</span><span class="d">${f ? `<span class="verbword">${esc(f.ik)} · ${esc(f.pl)} · ${esc(f.im[0])} · ${esc(f.sep + f.pp)}</span>` : esc(l.d || '')}</span></div>`; }).join('')}</div>`;
}

/* ---------- a set's own page ---------- */
const ownSet = id => (S.sets || []).find(x => x.id === id);
// replaces the 1.5 setEditor sheet (app5); set-add / set-remove still call setEditor
function setEditor(id) { openSetPage(id); }
function openSetPage(id) {
  const set = getSet(id); if (!set) return; const own = !!ownSet(id);
  closeSheet();
  const ls = set.ids.map(LX).filter(Boolean);
  const ov = openOverlay('setpage', `<button class="iconbtn" data-act="overlay-close" data-id="setpage" aria-label="Sluiten">✕</button><span class="small">Set</span>`, `<div class="stack">
    <div><div class="eyebrow">${own ? 'Eigen set' : 'Al je eigen woorden'}</div><h1 id="sp-name">${esc(set.name)}</h1>
      <div class="small">${setSub(set)}</div>
      ${own ? `<button class="link sm" data-act="set-rename" data-id="${esc(id)}" style="padding-left:0">Hernoem ›</button>` : ''}</div>
    <div class="grid2">${studyButtons(id, ls.length)}</div>
    ${ls.length ? `<button class="link sm" data-act="set-export" data-id="${esc(id)}" style="padding-left:0" data-en="Share as a word list (EDZ-WOORDEN v1)">Deel als woordenlijst ›</button>` : ''}
    <div class="list">${ls.map(l => `<div class="li"><span class="w" data-act="word" data-id="${esc(l.id)}" role="button" tabindex="0">${wordHTML(l)}</span><span class="d">${esc(l.d || '')}</span>${own ? `<button class="iconbtn" data-act="set-remove" data-set="${esc(id)}" data-id="${esc(l.id)}" aria-label="Haal ${esc(l.w)} uit de set">✕</button>` : ''}</div>`).join('') || '<div class="small" style="padding:10px 0">Nog leeg.</div>'}</div>
    ${own ? `<input type="search" id="set-q" placeholder="Zoek een woord om toe te voegen" aria-label="Zoek een woord om toe te voegen"><div id="set-res"></div>
      <button class="btn line block" data-act="word-new" data-set="${esc(id)}">+ Nieuw woord in deze set</button>
      <button class="link" data-act="set-delete" data-id="${esc(id)}" style="color:var(--warn)">Verwijder deze set</button>` : ''}
  </div>`);
  const q = $('#set-q', ov);
  if (q) q.oninput = () => {
    const v = norm(q.value); const res = !v ? [] : allWords().filter(l => !set.ids.includes(l.id) && norm(l.w).includes(v)).slice(0, 8);
    $('#set-res', ov).innerHTML = `<div class="list">${res.map(l => `<div class="li" data-act="set-add" data-set="${esc(id)}" data-id="${esc(l.id)}" role="button" tabindex="0"><span class="w">${wordHTML(l)}</span><span class="d">+ toevoegen</span></div>`).join('')}</div>`;
  };
}
const uniqueSetName = (name, except) => { let n = name, i = 2; while ((S.sets || []).some(x => x.id !== except && norm(x.name) === norm(n))) n = `${name} (${i++})`; return n; };
function renameSet(id) {
  const set = ownSet(id); if (!set) return;
  const s = openSheet(`<form class="stack" id="rn-form" autocomplete="off"><h2>Hernoem de set</h2>
    <label class="f">Naam<input id="rn-name" type="text" value="${esc(set.name)}" maxlength="80"></label>
    <div id="rn-err" class="small" style="color:var(--warn)" hidden></div>
    <div class="grid2"><button class="btn line" type="button" data-act="sheet-close">Annuleer</button><button class="btn" type="submit">Bewaar</button></div></form>`);
  const inp = $('#rn-name', s); setTimeout(() => { inp.focus(); inp.select(); }, 50);
  $('#rn-form', s).onsubmit = e => {
    e.preventDefault(); const v = inp.value.trim().replace(/\s+/g, ' '); const err = $('#rn-err', s);
    if (!v) { err.textContent = 'Geef de set een naam.'; err.hidden = false; return; }
    if ((S.sets || []).some(x => x.id !== id && norm(x.name) === norm(v))) { err.textContent = 'Er is al een set met die naam.'; err.hidden = false; return; }
    set.name = v; Store.mark('words'); closeSheet(); openSetPage(id); render(); toast('Hernoemd: ' + v);
  };
}
function deleteSet(id) {
  confirmBox('Deze set verwijderen? De woorden blijven bewaard.', 'Verwijder', () => { S.sets = S.sets.filter(s => s.id !== id); Store.mark('words'); closeOverlay('setpage'); render(); toast('Set verwijderd'); });
}

/* ---------- a set as an EDZ-WOORDEN v1 block (the reverse of the import) ---------- */
function wordsBlock(id) {
  const set = getSet(id); if (!set) return '';
  const ws = set.ids.map(LX).filter(Boolean).map(l => {
    const o = {w: l.w, p: l.p};
    if (l.p === 'n') { o.g = l.g; if (l.pl) o.pl = l.pl; if (l.dim) o.dim = l.dim; }
    Object.assign(o, {d: l.d || '', s: l.s || '', en: l.en || '', plan: (l.custom ? l.plan : SQ_OF_WORD[l.id]) || null});
    const t = themeOf(l); if (t) o.thema = t;
    const r = relOf(l); if (r.syn.length) o.syn = r.syn; if (r.ant.length) o.ant = r.ant;
    return JSON.stringify(o);
  });
  const head = JSON.stringify({v: 1, set: set.name, datum: dateKey(), bron: 'Elke Dag Zin'}).slice(0, -1);
  return `EDZ-WOORDEN v1\n${head},"words":[\n${ws.join(',\n')}]}\nEDZ-EINDE\n`;
}
function exportSet(id) {
  const set = getSet(id); const text = wordsBlock(id); if (!text) return;
  const s = openSheet(`<div class="stack"><h2>Deel als woordenlijst</h2>
    <div class="small">${esc(set.name)} als <b>EDZ-WOORDEN v1</b>: plak het in Claude, in een notitie, of importeer het later opnieuw onder Ik.</div>
    <textarea id="ex-w" rows="7" readonly style="font-family:ui-monospace,Menlo,monospace;font-size:12px">${esc(text)}</textarea>
    <div class="grid2"><button class="btn line" type="button" id="ex-copy">Kopieer</button><button class="btn line" type="button" id="ex-file">Bewaar als bestand</button></div></div>`);
  $('#ex-copy', s).onclick = () => copyText(text, $('#ex-w', s), 'Woordenlijst gekopieerd');
  $('#ex-file', s).onclick = async () => { const r = await saveFile(set.name.replace(/[\\/:*?"<>|]+/g, '-') + '.txt', text, 'text/plain'); if (r === 'downloaded') toast('Bestand gedownload'); else if (r === 'shared') toast('Bewaard'); };
}

/* ---------- a word's theme, on its card ---------- */
function themePicker(id) {
  const l = LX(id); if (!l) return; const cur = themeOf(l);
  openSheet(`<div class="stack"><h2>Thema van <span class="nl">${esc(l.w)}</span></h2>
    <div class="row wrap">${THEMES.map(t => `<button class="chip${cur === t.id ? ' on' : ''}" data-act="theme-set" data-id="${esc(id)}" data-t="${t.id}" data-en="${esc(t.en)}">${esc(t.name)}</button>`).join('')}</div></div>`);
}
function setTheme(id, t) {
  if (!THEME[t]) return; S.themes = S.themes || {}; S.themes[id] = t; Store.mark('words');
  closeSheet(); showWord(id); render(); toast('Thema: ' + THEME[t].name);
}
const themeLine = l => { const t = themeOf(l); return `<button class="link sm" data-act="theme-pick" data-id="${esc(l.id)}" style="padding-left:0">Thema: ${t ? esc(THEME[t].name) : 'kies een thema'} ›</button>`; };

/* ---------- import a word list: Ik → Woordenlijsten ---------- */
function openWordImport() {
  const s = openSheet(`<div class="stack">
    <h2 data-en="Import a word list">Woordenlijst importeren</h2>
    <div class="small">Plak een <b>EDZ-WOORDEN v1</b>-blok, van de eerste regel tot <b>EDZ-EINDE</b>, of kies een .txt-bestand. Je ziet eerst wat er binnenkomt, en je kiest de naam van de set.</div>
    <textarea id="wim-t" rows="8" aria-label="Woordenlijst" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="EDZ-WOORDEN v1&#10;{…}&#10;EDZ-EINDE"></textarea>
    <div id="wim-err" role="alert"></div>
    <div class="grid2"><button class="btn line" type="button" id="wim-paste">Plak</button><button class="btn line" type="button" id="wim-file">Kies bestand</button></div>
    <input type="file" id="wim-f" accept=".txt,text/plain" hidden>
    <button class="btn block" type="button" id="wim-go">Verder</button>
  </div>`);
  const ta = $('#wim-t', s);
  const go = () => {
    const res = whichBlock(ta.value) === 'verslag' && !/EDZ-WOORDEN v1/.test(ta.value) && /EDZ-VERSLAG v1/.test(ta.value) ? importReport(ta.value) : importWords(ta.value);
    if (res.error) $('#wim-err', s).innerHTML = `<div class="fb no"><b>${esc(res.error)}</b>${res.hint ? `<div class="small">${esc(res.hint)}</div>` : ''}</div>`;
  };
  $('#wim-paste', s).onclick = async () => { try { const t = await navigator.clipboard.readText(); if (t) ta.value = t; else toast('Het klembord is leeg'); } catch (e) { ta.focus(); toast('Houd het vak ingedrukt en kies Plak'); } };
  $('#wim-file', s).onclick = () => $('#wim-f', s).click();
  $('#wim-f', s).onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { ta.value = String(r.result || ''); go(); }; r.onerror = () => toast('Het bestand kon niet gelezen worden'); r.readAsText(f); };
  $('#wim-go', s).onclick = go;
}
