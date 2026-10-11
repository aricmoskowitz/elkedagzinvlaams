/* ===== WORD SETS ===== */
function getSet(id) {
  if (id.startsWith('unit-')) { const u = UNIT[id.slice(5)]; return {id, name: u.name, ids: lexOfUnit(u.n).map(l => l.id), unit: true}; }
  return S.sets.find(s => s.id === id);
}
let FLASH = null;
function studySet(id, mode) {
  const set = getSet(id); if (!set || !set.ids.length) return;
  const ids = shuffle(set.ids.filter(x => LX(x)));
  if (mode === 'type') { closeSheet(); return startSession({keys: ids.slice(0, 20).map(x => 'w:' + x + ':prod'), intros: false}); }
  FLASH = {ids, i: 0, knew: 0, flipped: false, name: set.name};
  closeSheet();
  openOverlay('flash', `<button class="iconbtn" data-act="overlay-close" data-id="flash" aria-label="Sluiten">✕</button><div class="progress"><div id="fl-prog" style="width:0%"></div></div><span class="small" id="fl-count"></span>`, `<div id="fl-body" class="stack"></div>`);
  flashRender();
}
function flashRender() {
  const b = $('#fl-body'); const F = FLASH;
  $('#fl-prog').style.width = Math.round(100 * F.i / F.ids.length) + '%'; $('#fl-count').textContent = Math.min(F.i + 1, F.ids.length) + ' / ' + F.ids.length;
  if (F.i >= F.ids.length) { b.innerHTML = `<div class="stack" style="padding-top:20px"><div class="eyebrow">Klaar</div><div class="big-num">${F.knew} / ${F.ids.length}</div><div class="muted">wist je al</div><button class="btn block" data-act="overlay-close" data-id="flash">Terug</button></div>`; Store.mark('items'); return; }
  const l = LX(F.ids[F.i]);
  const sent = l.s ? `<div class="nl" style="font-size:18px">${highlight(l.s, l.w)}</div>` : '';
  if (!F.flipped) b.innerHTML = `<div class="card flash" data-act="flip" role="button" tabindex="0" aria-label="Draai de kaart om"><div class="eyebrow">${esc(POS[l.p] || '')}</div><div class="wc-word">${wordHTML(l)}</div>${sent}<div class="small">Tik om om te draaien</div></div>`;
  else b.innerHTML = `<div class="card">${wordCardHTML(l, {actions: false})}</div><div class="grid2"><button class="btn line" data-act="flash-grade" data-ok="0">Nog niet</button><button class="btn" data-act="flash-grade" data-ok="1">Wist ik</button></div>`;
}
/* wordForm: see app13 */
function newSet(thenAdd) {
  const s = openSheet(`<form id="sform" class="stack"><h2>Nieuwe set</h2><label class="f">Naam<input id="ns-name" type="text" placeholder="Uit de les – week 40"></label><div id="ns-err" class="small" style="color:var(--warn)" hidden>Geef de set een naam.</div><button class="btn block" type="submit">Maak set</button></form>`);
  s.querySelector('#sform').onsubmit = e => {
    e.preventDefault(); const name = s.querySelector('#ns-name').value.trim();
    if (!name) { s.querySelector('#ns-err').hidden = false; return; }
    const set = {id: 's-' + Date.now().toString(36), name, ids: thenAdd ? [thenAdd] : []};
    S.sets.push(set); Store.mark('words'); closeSheet(); render();
    if (thenAdd) toast('Toegevoegd aan ' + name); else setEditor(set.id);
  };
}
function setEditor(id) {
  const set = S.sets.find(s => s.id === id); if (!set) return;
  const s = openSheet(`<div class="stack"><div class="spread"><h2>${esc(set.name)}</h2><button class="btn line" data-act="set-delete" data-id="${id}">Verwijder</button></div>
    <div class="list">${set.ids.map(x => LX(x)).filter(Boolean).map(l => `<div class="li"><span class="w" data-act="word" data-id="${esc(l.id)}">${wordHTML(l)}</span><span class="d"></span><button class="iconbtn" data-act="set-remove" data-set="${id}" data-id="${esc(l.id)}" aria-label="Haal weg">✕</button></div>`).join('') || '<div class="small">Nog leeg.</div>'}</div>
    <input type="search" id="set-q" placeholder="Zoek een woord om toe te voegen" aria-label="Zoek een woord"><div id="set-res"></div>
    <button class="btn line block" data-act="word-new" data-set="${id}">+ Nieuw woord maken</button></div>`);
  const q = s.querySelector('#set-q');
  q.oninput = () => {
    const v = norm(q.value); const res = !v ? [] : LEX.concat(Object.values(S.custom)).filter(l => !set.ids.includes(l.id) && norm(l.w).includes(v)).slice(0, 8);
    s.querySelector('#set-res').innerHTML = `<div class="list">${res.map(l => `<div class="li" data-act="set-add" data-set="${id}" data-id="${esc(l.id)}" role="button" tabindex="0"><span class="w">${wordHTML(l)}</span><span class="d">+ toevoegen</span></div>`).join('')}</div>`;
  };
}
function addToSetSheet(wordId) {
  const own = S.sets;
  openSheet(`<div class="stack"><h2>Aan welke set?</h2>${own.map(s => `<button class="btn line block" data-act="set-add" data-set="${s.id}" data-id="${esc(wordId)}" data-close="1">${esc(s.name)}</button>`).join('')}<button class="btn block" data-act="set-new-with" data-id="${esc(wordId)}">+ Nieuwe set</button></div>`);
}

/* ===== BACKUP =====
   2.0: Bewaar back-up uses the share sheet (a .json file) when it can, else a
   download. Zet back-up terug accepts 1.5 and 2.0 backups and confirms first. */
const backupName = () => 'elkedagzin-backup-' + dateKey() + '.json';
function backupText() { Store.flush(); return JSON.stringify(S, null, 1); }
function backupDone() { S.settings.lastBackup = Date.now(); Store.mark('state'); render(); }
async function exportData() {
  let r; try { r = await saveFile(backupName(), backupText(), 'application/json'); } catch (e) { return copyBackup(); }
  if (r === 'cancelled') return;
  backupDone(); toast(r === 'shared' ? 'Back-up bewaard' : 'Back-up gedownload');
}
function copyBackup() {
  const data = backupText();
  const s = openSheet(`<div class="stack"><h2>Back-up als tekst</h2><div class="small">Kopieer deze tekst en bewaar hem in een notitie. Terugzetten kan met <i>Zet back-up terug</i> als je hem als .json-bestand bewaart.</div><textarea id="exp-t" rows="8" readonly>${esc(data)}</textarea><button class="btn block" id="exp-copy">Kopieer</button></div>`);
  s.querySelector('#exp-copy').onclick = () => { const t = s.querySelector('#exp-t'); navigator.clipboard.writeText(t.value).then(() => { backupDone(); toast('Gekopieerd'); }, () => { t.select(); toast('Selecteer en kopieer de tekst'); }); };
}
// a 1.5 backup is the same state shape (v 2); a 2.0 backup is v 3
function parseBackup(text) {
  let d; try { d = JSON.parse(String(text).replace(/^\uFEFF/, '')); } catch (e) { return {error: 'Dit bestand is geen geldige back-up.'}; }
  if (!d || typeof d !== 'object' || Array.isArray(d) || !d.items || typeof d.items !== 'object') return {error: 'Dit bestand is geen back-up van Elke Dag Zin.'};
  return {data: d};
}
function restoreBackup(d) {
  S = Object.assign(blankState(), JSON.parse(JSON.stringify(d))); migrate();
  S.savedAt = Date.now(); Store.flush();
}
function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    const res = parseBackup(r.result); if (res.error) { toast(res.error); return; }
    confirmBox('Je huidige voortgang vervangen door deze back-up?', 'Vervang', () => { restoreBackup(res.data); closeOverlay('tour'); render(); toast('Back-up teruggezet'); });
  };
  r.onerror = () => toast('Het bestand kon niet gelezen worden');
  r.readAsText(file);
}
// a quiet reminder on Pad after 14 days without a backup (not before there is progress)
function backupReminder() {
  const last = S.settings.lastBackup || 0; const hasProgress = Object.keys(S.items).length > 0;
  if (!hasProgress || Date.now() - last < 14 * 864e5) return '';
  return `<button class="tapline" data-act="export"><div class="t"><div style="font-weight:600">Maak een back-up</div><div class="small">${last ? 'Je laatste back-up is van ' + Math.floor((Date.now() - last) / 864e5) + ' dagen geleden' : 'Je hebt nog geen back-up gemaakt'}. Je voortgang staat alleen op deze telefoon.</div></div><span class="chev">›</span></button>`;
}

/* ===== FEED ===== */
let FEED = null; const FC = {};
function openFeed() {
  FEED = {n: 0, seen: 0, newWords: 0, t0: Date.now(), usedX: new Set(), fid: 0, since: {n: 0, newW: 0, t: Date.now()}};
  const el = document.createElement('div'); el.id = 'feed'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Scroll');
  el.innerHTML = `<div class="fhead"><button class="iconbtn" data-act="fclose" aria-label="Sluiten" style="background:#fff;border:1px solid var(--line)">✕</button><button class="chip" data-act="faudio" data-en="Auto-play audio">${S.settings.autoAudio ? 'Geluid aan' : 'Geluid uit'}</button></div><div class="fscroll" id="fscroll"></div>`;
  document.body.appendChild(el);
  FEED.io = new IntersectionObserver(ents => ents.forEach(en => {
    if (!en.isIntersecting) return; const sec = en.target; const c = FC[sec.dataset.fid]; if (!c || c.viewed) return; c.viewed = true; if (c.kind !== 'b') FEED.seen++; feedViewed(c, sec);
    if (c.kind === 'l' && S.settings.autoAudio) Audio.say(c.s.nl);
    const all = $$('#fscroll .fcard'); if (all.indexOf(sec) >= all.length - 3) feedAppend();
  }), {threshold: 0.6});
  feedAppend();
}
function closeFeed() {
  if (!FEED) return; FEED.io.disconnect();
  const a = S.activity[dateKey()] = S.activity[dateKey()] || {n: 0, m: 0}; a.m = Math.round(((a.m || 0) + (Date.now() - FEED.t0) / 60000) * 10) / 10;
  Store.mark('state', 'items'); $('#feed').remove(); FEED = null; render();
}
function feedPlan() {
  const intro = Object.keys(S.items).filter(k => /^w:.*:(rec|gen)$/.test(k) && keyValid(k));
  const due = shuffle(intro.filter(isDue)), fam = shuffle(intro.filter(k => !isDue(k)));
  let qs = due.slice(0, 11); if (qs.length < 11) qs = qs.concat(fam.slice(0, 11 - qs.length));
  if (qs.length < 11) {
    for (const l of LEX) { if (qs.length >= 11) break; if (!S.items['w:' + l.id + ':rec'] && S.seen[l.id]) qs.push('w:' + l.id + ':' + (l.g && Math.random() < .5 ? 'gen' : 'rec')); }
  }
  const newL = LEX.filter(l => !S.seen[l.id]).slice(0, qs.length < 6 ? 4 : 2);
  const started = UNITS.filter(u => u.built && unitStarted(u.id)).map(u => u.n); if (!started.length) started.push(1);
  const sents = shuffle(SENT.filter(s => started.includes(s.u)));
  const verbs = shuffle(LEX.filter(l => l.v && (S.seen[l.id] || started.includes(l.u))));
  const nouns = shuffle(LEX.filter(l => l.p === 'n' && (S.seen[l.id] || started.includes(l.u))));
  const glances = [{kind: 'gv', l: verbs[0]}, {kind: 'gf', s: sents[0]}, {kind: 'gn', l: nouns[0]}].filter(g => g.l || g.s);
  const xs = shuffle(EXTRAS.filter(x => !FEED.usedX.has(x.title))).slice(0, 2); xs.forEach(x => FEED.usedX.add(x.title));
  if (FEED.usedX.size >= EXTRAS.length) FEED.usedX.clear();
  const pattern = ['q', 'q', 'w', 'q', 'x', 'q', 'g', 'q', 'l', 'n', 'q', 'q', 'x', 'q', 'g', 'w', 'q', 'l', 'n', 'q'];
  const out = []; let qi = 0, xi = 0, gi = 0, li = 0, ni = 0;
  const gl = shuffle(glances);
  pattern.forEach(p => {
    if (p === 'q' && qs[qi]) out.push({kind: 'q', key: qs[qi++]});
    else if (p === 'w' && qs[qi]) { const id = qs[qi++].split(':')[1]; out.push({kind: 'w', l: LX(id)}); }
    else if (p === 'x' && xs[xi]) out.push({kind: 'x', x: xs[xi++]});
    else if (p === 'g' && gl[gi]) out.push(gl[gi++]);
    else if (p === 'l' && sents[1 + li]) out.push({kind: 'l', s: sents[1 + li++]});
    else if (p === 'n' && newL[ni]) out.push({kind: 'n', l: newL[ni++]});
    else if (newL[ni]) out.push({kind: 'n', l: newL[ni++]});
  });
  while (newL[ni]) out.push({kind: 'n', l: newL[ni++]});
  out.push({kind: 'b'});
  return out;
}
function feedAppend() {
  const box = $('#fscroll'); if (!box) return;
  const cards = feedPlan();
  cards.forEach(c => {
    const fid = 'f' + (FEED.fid++); c.fid = fid; FC[fid] = c;
    const sec = document.createElement('section'); sec.className = 'fcard'; sec.dataset.fid = fid;
    sec.innerHTML = fcardHTML(c); box.appendChild(sec); FEED.io.observe(sec);
  });
}
function fcardHTML(c) {
  const hint = '<div class="fhint">veeg omhoog</div>';
  if (c.kind === 'q') {
    const ex = c.ex = makeEx(c.key, 'feed');
    if (ex.type === 'gen') return `<div class="fin"><div class="kind">De of het?</div><div class="nl" style="font-size:40px;text-align:center">${esc(ex.lex.w)}</div>${ex.sub ? `<div class="nl" style="font-size:17px;text-align:center">${ex.sub}</div>` : ''}<div class="dehet"><button class="d" data-act="fans" data-fid="${c.fid}" data-v="de">de</button><button class="h" data-act="fans" data-fid="${c.fid}" data-v="het">het</button></div><div class="ffb"></div></div>`;
    return `<div class="fin"><div class="kind">${DAYWORD[ex.label] || 'Kies'}</div><div class="ex-prompt" style="font-size:21px">${ex.prompt}</div>${ex.sub ? `<div class="ex-sub">${ex.sub}</div>` : ''}<div class="opts">${ex.options.map(o => `<button class="opt" data-act="fans" data-fid="${c.fid}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div><div class="ffb"></div></div>`;
  }
  if (c.kind === 'w' || c.kind === 'n') {
    const l = c.l; const isNew = c.kind === 'n';
    return `<div class="fin"><div class="kind">${isNew ? 'Nieuw woord' : 'Ken je dit woord?'}</div><div class="spread"><div class="wc-word">${wordHTML(l)}</div>${speakBtn((l.g ? l.g + ' ' : '') + l.w)}</div>${l.s ? `<div class="nl" style="font-size:18px">${highlight(l.s, l.w)}</div>` : ''}
      <div class="fback" ${isNew ? '' : 'hidden'}><div class="nl" style="font-size:17px">${esc(l.d)}</div>${l.pl ? `<div class="small">mv: de ${esc(l.pl)}${l.dim ? ' · het ' + esc(l.dim) : ''}</div>` : ''}<button class="en-hidden" data-act="reveal-en" data-en-text="${esc(l.en)}" style="margin-top:8px">Toon Engels</button></div>
      ${isNew ? '' : `<button class="btn line fshow" data-act="freveal" data-fid="${c.fid}">Toon betekenis</button><div class="grid2 fgrade" hidden><button class="btn line" data-act="fknew" data-fid="${c.fid}" data-ok="0">Nog niet</button><button class="btn" data-act="fknew" data-fid="${c.fid}" data-ok="1">Wist ik</button></div>`}</div>`;
  }
  if (c.kind === 'x') {
    const x = c.x; const lab = {straat: 'Straatnaam', vlaams: 'Vlaams dat je hoort', cultuur: 'Zo doen ze het hier'}[x.t];
    return `<div class="fin"><div class="eyebrow">${lab}</div><div class="wc-word" >${esc(x.title)}</div><div class="nl" style="font-size:18px;line-height:1.5">${x.body}</div>${x.ex ? `<div class="row">${speakBtn(x.ex)}<i class="nl" style="font-size:18px">${esc(x.ex)}</i></div>` : ''}<div class="muted small">${esc(x.en)}</div></div>`;
  }
  if (c.kind === 'gv') return `<div class="fin"><div class="kind">Werkwoord in één oogopslag</div><div class="spread"><div class="wc-word">${esc(c.l.w)}</div>${speakBtn(c.l.w)}</div><div class="small">${esc(c.l.d)}</div>${conjTable(c.l)}</div>`;
  if (c.kind === 'gf') return `<div class="fin"><div class="kind">Zinsschema</div><div class="row">${speakBtn(c.s.nl)}<div class="nl" style="font-size:20px">${esc(c.s.nl)}</div></div>${frameHTML(c.s)}<div class="why small">${frameNote(c.s)}</div></div>`;
  if (c.kind === 'gn') { const l = c.l; return `<div class="fin"><div class="kind">Zelfstandig naamwoord</div><div class="wc-word">${wordHTML(l)}</div><dl class="kv">${l.pl ? `<dt>meervoud</dt><dd><span class="de">de</span> ${esc(l.pl)}</dd>` : ''}${l.dim ? `<dt>verkleinwoord</dt><dd><span class="het">het</span> ${esc(l.dim)}</dd>` : ''}</dl><div class="why small">${genWhy(l)}</div></div>`; }
  if (c.kind === 'l') return `<div class="fin"><div class="kind">Luister</div><div style="display:flex;justify-content:center"><button class="speak" data-act="say" data-text="${esc(c.s.nl)}" style="width:84px;height:84px" aria-label="Speel af"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg></button></div><div class="fback" hidden><div class="nl" style="font-size:21px">${esc(c.s.nl)}</div><div class="small">${esc(c.s.en)}</div></div><button class="btn line fshow" data-act="freveal" data-fid="${c.fid}">Toon de zin</button></div>`;
  if (c.kind === 'b') return `<div class="fin" style="text-align:center"><div class="eyebrow">Even pauze</div><div class="nl bstat" style="font-size:24px"></div><div class="muted">Verder scrollen mag. Stoppen ook.</div><button class="btn" data-act="fclose" >Hier stoppen</button></div>`;
  return '';
}
function feedViewed(c, sec) {
  if (c.kind === 'n') { const l = c.l; S.seen[l.id] = 1; introduce('w:' + l.id + ':rec'); if (l.g) introduce('w:' + l.id + ':gen'); FEED.newWords++; Store.mark('state', 'items'); }
  if (c.kind === 'b') {
    const since = FEED.since; const n = FEED.seen - since.n; const mins = Math.max(1, Math.round((Date.now() - since.t) / 60000)); const nw = FEED.newWords - since.newW;
    FEED.since = {n: FEED.seen, newW: FEED.newWords, t: Date.now()};
    $('.bstat', sec).textContent = `${n} kaarten · ${mins} min · ${nw} ${nw === 1 ? 'nieuw woord' : 'nieuwe woorden'}`;
  }
}
function feedAnswer(fid, v) {
  const c = FC[fid]; if (!c || c.done) return; c.done = true; const ex = c.ex;
  const ok = norm(v) === norm(ex.answer);
  grade(ex.key, ok);
  const sec = document.querySelector(`.fcard[data-fid="${fid}"]`);
  $$('[data-act="fans"]', sec).forEach(b => { b.disabled = true; if (norm(b.dataset.v) === norm(ex.answer)) b.classList.add(ex.type === 'gen' ? 'pick' : 'right'); else if (norm(b.dataset.v) === norm(v)) b.classList.add('wrong'); });
  $('.ffb', sec).innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}" style="padding:10px 12px"><b>${ok ? 'Juist!' : 'Niet helemaal'}</b><div class="why small">${ex.type === 'gen' ? genWhy(ex.lex) : ex.why}</div></div>`;
  if (ex.say && ok) Audio.say(ex.say);
}
