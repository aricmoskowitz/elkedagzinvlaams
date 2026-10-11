/* ===== VERSION 2.0: Home Screen app (service worker + update toast) ===== */
function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; location.reload(); });
  navigator.serviceWorker.register('sw.js').then(reg => {
    const offer = w => { if (w && navigator.serviceWorker.controller) updateToast(w); };
    if (reg.waiting) offer(reg.waiting);
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') offer(w); }); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
}
function updateToast(worker) {
  if ($('#update')) return;
  const el = document.createElement('div'); el.id = 'update'; el.setAttribute('role', 'status');
  el.innerHTML = `<span>Nieuwe versie</span><button class="link" type="button" data-en="New version: reload">Herlaad</button>`;
  el.querySelector('button').onclick = () => { Store.flush(); worker.postMessage('skipWaiting'); };
  document.body.appendChild(el);
}

/* ===== VERSION 2.0: Praten in Claude (start block) =====
   EDZ-START v1 goes app → Claude Project. See FORMATS.md §1. */
const MODES = [['onderwerp', 'Onderwerp', 'Topic'], ['opdracht', 'Opdracht', 'Task'], ['dagboek', 'Dagboek', 'Diary'], ['foto', 'Foto', 'Photo']];
const BEURTEN = ['6–8', '8–10', '12–15'];
// every word first seen counts from the day it was seen (1.5 states: from before 2.0)
function stampSeen() { const d = today(); Object.keys(S.seen || {}).forEach(id => { if (S.seenAt[id] === undefined) S.seenAt[id] = d; }); }
const _markRaw = Store.mark; Store.mark = function (...a) { try { stampSeen(); } catch (e) {} return _markRaw.apply(this, a); };
function placeLine(q) {
  const sq = PSQ[q]; const u = sq.u; const a = arcOf(u);
  return `${a.level} · Boog ${a.n} · Stad ${townIndexInArc(u)} ${PT[u].name} (${u}) · ${sq.review ? 'Grote Markt' : 'Plein ' + sq.n + ' ' + sq.name} (${q})`;
}
function recentWords() {
  const since = today() - 14;
  const ids = Object.keys(S.seenAt || {}).filter(id => S.seenAt[id] >= since && LX(id)).sort((a, b) => S.seenAt[b] - S.seenAt[a]);
  Object.keys(S.custom || {}).forEach(id => { if (!ids.includes(id)) ids.push(id); });
  return uniq(ids.map(id => LX(id)).filter(Boolean).map(l => l.w)).slice(0, 30);
}
function weakGroups() {
  const g = {};
  Object.entries(S.fix || {}).filter(([id]) => !known('c:' + id + ':fix')).forEach(([, f]) => { const k = f.plan || ''; (g[k] = g[k] || []).push(f); });
  return Object.entries(g).sort((a, b) => b[1].length - a[1].length).slice(0, 5).map(([k, fs]) => {
    const x = (S.extras || []).find(e => e.id === k);
    const label = PSQ[k] ? `${k} ${PSQ[k].title.toLowerCase()}` : x ? x.title : 'Algemeen: ' + String(fs[0].why || fs[0].right).replace(/\.$/, '').slice(0, 50);
    return {k, label, n: fs.length};
  });
}
function sceneFor(u) { return SCENARIOS.find(s => s.u === u) || SCENARIOS.find(s => s.id === 'sc-free'); }
// o: {mode, q (a square) or u (a town: its Grote Markt)}
function startBlock(o) {
  const P = S.settings.praten; const mode = o.mode || P.mode;
  const q = o.u ? marktId(o.u) : (o.q && PSQ[o.q] ? o.q : nextSquare());
  const sq = PSQ[q]; const unit = PT[sq.u];
  const lines = ['EDZ-START v1', 'modus: ' + mode, 'datum: ' + dateKey(), 'niveau: ' + placeLine(q)];
  lines.push('focus: ' + (sq.review ? `${unit.gram} (${sq.u})` : `${sq.title} (${q})`) + ' · kan: ' + unit.can);
  const weak = weakGroups(); const sc = sceneFor(sq.u);
  if (mode === 'onderwerp') lines.push(`taak: Praat over ${String(unit.theme || '').toLowerCase()} en gebruik ${sq.review ? String(unit.gram).toLowerCase() : sq.title.toLowerCase()}.${weak[0] ? ' Oefen ook: ' + weak[0].label.replace(/^u\d+q\d+ /, '') + '.' : ''}`);
  if (mode === 'opdracht') {
    lines.push(`taak: ${sc.title}. ${sc.goal}`);
    lines.push(`scène: ${sc.id} · Jij bent ${sc.role} · opener: "${sc.open}"`);
    lines.push('doel: ' + (sc.doel || sc.goal));
  }
  if (mode === 'dagboek') lines.push('taak: vertel over je dag of je les');
  if (mode === 'foto') lines.push('taak: verwerk de foto');
  const rec = recentWords(); if (rec.length) lines.push('recent: ' + rec.join(', '));
  if (weak.length) lines.push('zwak: ' + weak.map(w => `${w.label} (${w.n}×)`).join(' · '));
  lines.push(`instellingen: vertaling ${P.vertaling ? 'ja' : 'nee'} · verbeteren ${P.verbeteren === 'einde' ? 'op het einde' : 'per beurt'} · beurten ${P.beurten}`);
  lines.push('EDZ-EINDE');
  return lines.join('\n');
}
let PRATEN = null;
function openPraten(o = {}) {
  PRATEN = {mode: o.mode || S.settings.praten.mode, q: o.q || null, u: o.u || null};
  const s = openSheet(`<div class="stack" id="praten">
    <h2 data-en="Talk in Claude">Praten in Claude</h2>
    ${coachTip('praten', 'Kies wat je wilt doen, kopieer het startblok en plak het in een nieuw gesprek in je Claude Project. Zet daar de stem aan als je wilt. Aan het einde krijg je een verslag: plak het hier via Verslag plakken.')}
    <div id="pr-body"></div></div>`);
  fillPraten(s);
}
function fillPraten(s) {
  const P = S.settings.praten; const R = PRATEN; const block = startBlock(R);
  const chips = (name, opts, cur) => `<div class="row wrap" role="radiogroup">${opts.map(([v, l, en]) => `<button type="button" class="chip${cur === v ? ' on' : ''}" data-pr="${name}" data-v="${v}" role="radio" aria-checked="${cur === v}"${en ? ` data-en="${en}"` : ''}>${l}</button>`).join('')}</div>`;
  const url = S.settings.projectUrl;
  const hist = (S.talks || []).filter(t => t.src === 'claude').slice(0, 5);
  $('#pr-body', s).innerHTML = `<div class="stack" style="gap:12px">
    ${chips('mode', MODES, R.mode)}
    <div class="eyebrow">Instellingen</div>
    ${chips('vertaling', [['ja', 'vertaling ja'], ['nee', 'vertaling nee']], P.vertaling ? 'ja' : 'nee')}
    ${chips('verbeteren', [['beurt', 'verbeteren per beurt'], ['einde', 'op het einde']], P.verbeteren)}
    ${chips('beurten', BEURTEN.map(b => [b, b + ' beurten']), P.beurten)}
    <textarea id="pr-block" rows="7" readonly aria-label="Startblok" style="font-family:ui-monospace,Menlo,monospace;font-size:12px">${esc(block)}</textarea>
    <button class="btn block" id="pr-copy" type="button">Kopieer startblok</button>
    ${url ? `<a class="btn line block" id="pr-open" href="${esc(url)}" target="_blank" rel="noopener">Open Claude</a><button class="link sm" type="button" id="pr-url-edit">Wijzig de link van je Project</button>`
      : `<label class="f" for="pr-url">Plak de link van je Claude Project<input id="pr-url" type="url" inputmode="url" placeholder="https://claude.ai/project/…" autocapitalize="off" autocorrect="off" spellcheck="false"></label><button class="btn line block" type="button" id="pr-url-save">Bewaar de link</button><div id="pr-url-err" class="small" style="color:var(--warn)" hidden>Dat is geen link. Hij begint met https://</div>`}
    <div class="small">Plak het blok in een nieuw gesprek in je Project, zet daar de stem aan als je wilt, en zeg <i>klaar</i> als je stopt. Het verslag plak je terug via <b>Verslag plakken</b>.</div>
    <button class="btn line block" data-act="verslag" type="button">Verslag plakken</button>
    ${hist.length ? `<div class="stack" style="gap:2px"><div class="eyebrow">Eerdere verslagen</div>${hist.map(t => `<button class="tapline" data-act="talk-view" data-id="${t.id}"><div class="t"><div>${esc(t.title || 'Gesprek')}</div><div class="small">${esc(t.date)} · ${esc(t.modus || '')}</div></div><span class="chev">›</span></button>`).join('')}</div>` : ''}
  </div>`;
  $$('[data-pr]', s).forEach(b => b.onclick = () => {
    const k = b.dataset.pr, v = b.dataset.v;
    if (k === 'mode') { R.mode = v; P.mode = v; } else if (k === 'vertaling') P.vertaling = v === 'ja'; else P[k] = v;
    Store.mark('state'); fillPraten(s);
  });
  $('#pr-copy', s).onclick = () => copyText(block, $('#pr-block', s), 'Startblok gekopieerd');
  const save = $('#pr-url-save', s);
  if (save) save.onclick = () => { const v = $('#pr-url', s).value.trim(); if (!/^https:\/\/\S+$/.test(v)) { $('#pr-url-err', s).hidden = false; return; } S.settings.projectUrl = v; Store.mark('state'); fillPraten(s); toast('Link bewaard'); };
  const edit = $('#pr-url-edit', s); if (edit) edit.onclick = () => { S.settings.projectUrl = ''; Store.mark('state'); fillPraten(s); };
}
function copyText(text, ta, done) {
  const fallback = () => { if (ta) { ta.removeAttribute('readonly'); ta.focus(); ta.select(); ta.setAttribute('readonly', ''); } toast('Selecteer en kopieer de tekst'); };
  try { navigator.clipboard.writeText(text).then(() => toast(done), fallback); } catch (e) { fallback(); }
}

/* ===== VERSION 2.0: report import (EDZ-VERSLAG v1) =====
   Claude Project → app. See FORMATS.md §2. Never throws: every problem becomes a Dutch message. */
const ASK_JSON = 'Vraag Claude: ‘geef het verslag opnieuw als geldige JSON’';
function hashText(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + '-' + s.length.toString(36); }
function parseReport(text) {
  text = String(text || '').replace(/\r\n?/g, '\n');
  const i = text.indexOf('EDZ-VERSLAG v1');
  if (i < 0) return {error: 'Ik vind geen verslag in deze tekst.', hint: 'Kopieer het hele blok, van EDZ-VERSLAG v1 tot EDZ-EINDE. Vraag Claude anders: ‘geef me het verslag’.'};
  let body = text.slice(i + 'EDZ-VERSLAG v1'.length);
  const e = body.indexOf('EDZ-EINDE'); if (e >= 0) body = body.slice(0, e);
  body = body.replace(/^\s*```[a-z]*\s*$/gim, '');
  const a = body.indexOf('{'), b = body.lastIndexOf('}');
  if (a < 0 || b < a) return {error: e < 0 ? 'Het verslag is niet volledig: het einde ontbreekt.' : 'Het verslag is leeg.', hint: 'Kopieer het hele blok, tot en met EDZ-EINDE. ' + ASK_JSON + '.'};
  const raw = body.slice(a, b + 1);
  let d = null;
  try { d = JSON.parse(raw); } catch (err) {
    try { d = JSON.parse(raw.replace(/[“”„‟″]/g, '"').replace(/[‘’‚‛′]/g, "'")); } catch (err2) { d = null; }
  }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return {error: 'Het verslag is geen geldige JSON.' + (e < 0 ? ' Het einde (EDZ-EINDE) ontbreekt ook.' : ''), hint: ASK_JSON + '.'};
  return {data: cleanReport(d), hash: hashText(JSON.stringify(d))};
}
const str = (x, n = 400) => typeof x === 'string' ? x.trim().slice(0, n) : typeof x === 'number' ? String(x) : '';
const planId = id => (typeof id === 'string' && PSQ[id] && !PSQ[id].review) ? id : null;
function cleanReport(d) {
  const r = {v: d.v, modus: MODES.some(m => m[0] === d.modus) ? d.modus : 'onderwerp', datum: /^\d{4}-\d\d-\d\d$/.test(d.datum) ? d.datum : dateKey(), onderwerp: str(d.onderwerp, 120) || 'Gesprek met Claude',
    plein: typeof d.plein === 'string' && PSQ[d.plein] ? d.plein : null, beurten: Number.isFinite(+d.beurten) ? +d.beurten : 0, doelBereikt: d.doelBereikt === true,
    samenvatting: str(d.samenvatting, 800), tip: str(d.tip, 400), tekst: str(d.tekst, 4000), bron: str(d.bron, 200)};
  const topic = t => t && typeof t === 'object' && str(t.title) ? {title: str(t.title, 80), town: PT[t.town] ? t.town : null, rule: str(t.rule), examples: arr(t.examples).filter(x => x && str(x.nl) && str(x.en)).map(x => ({nl: str(x.nl, 200), en: str(x.en, 200)}))} : null;
  r.corrections = arr(d.corrections).filter(c => c && str(c.wrong) && str(c.right)).slice(0, 12).map(c => {
    const nt = topic(c.newTopic); const plan = planId(c.plan);
    return {wrong: str(c.wrong, 240), right: str(c.right, 240), why: str(c.why, 300), type: str(c.type, 30), plan, newTopic: plan ? null : nt};
  });
  const have = new Set(Object.values(S.custom || {}).map(l => norm(l.w)));
  // "de kraam" → kraam (de): the lemma without its article
  const words = arr(d.words).filter(w => w && str(w.w)).map(w => { const m = str(w.w, 60).match(/^(de|het)\s+(.+)$/i); return m ? {...w, w: m[2], g: w.g || m[1].toLowerCase(), p: w.p || 'n'} : w; });
  r.wordsKnown = words.filter(w => FORM_IX[norm(w.w)] || have.has(norm(w.w))).map(w => str(w.w, 60));
  r.words = words.filter(w => !FORM_IX[norm(w.w)] && !have.has(norm(w.w))).slice(0, 12).map(w => ({w: str(w.w, 60), p: ['n', 'v', 'adj', 'adv'].includes(w.p) ? w.p : 'adv', g: w.g === 'de' || w.g === 'het' ? w.g : null, pl: str(w.pl, 60), dim: str(w.dim, 60), d: str(w.d, 200), s: str(w.s, 200), en: str(w.en, 120), plan: planId(w.plan)}));
  r.goed = arr(d.goed).filter(g => g && str(g.topic)).slice(0, 5).map(g => { const plan = planId(g.plan); return {topic: str(g.topic, 120), plan, mastered: g.mastered === true, newTopic: plan ? null : topic(g.newTopic)}; });
  return r;
}
const MODE_TITLE = {onderwerp: 'Je gesprek in je plan', opdracht: 'Je opdracht in je plan', dagboek: 'Je dagboek in je plan', foto: 'Je foto in je plan'};
function openReport() {
  closeSheet();
  const s = openSheet(`<div class="stack">
    <h2 data-en="Paste report">Verslag plakken</h2>
    <div class="small">Kopieer in Claude het hele verslag, van <b>EDZ-VERSLAG v1</b> tot <b>EDZ-EINDE</b>. Tekst errond mag mee.</div>
    <textarea id="rep-t" rows="9" aria-label="Verslag" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="EDZ-VERSLAG v1&#10;{…}&#10;EDZ-EINDE"></textarea>
    <div id="rep-err" role="alert"></div>
    <div class="grid2"><button class="btn line" type="button" id="rep-paste">Plak</button><button class="btn" type="button" id="rep-go">Verwerk</button></div>
  </div>`);
  const ta = $('#rep-t', s);
  $('#rep-paste', s).onclick = async () => { try { const t = await navigator.clipboard.readText(); if (t) ta.value = t; else toast('Het klembord is leeg'); } catch (e) { ta.focus(); toast('Houd het vak ingedrukt en kies Plak'); } };
  $('#rep-go', s).onclick = () => {
    const res = importReport(ta.value);
    if (res.error) $('#rep-err', s).innerHTML = `<div class="fb no"><b>${esc(res.error)}</b>${res.hint ? `<div class="small">${esc(res.hint)}</div>` : ''}</div>`;
  };
}
function importReport(text) {
  let res; try { res = parseReport(text); } catch (e) { res = {error: 'Dit verslag kon ik niet lezen.', hint: ASK_JSON + '.'}; }
  if (res.error) return res;
  if ((S.imports || []).some(x => (x.h || x) === res.hash)) { const x = S.imports.find(y => (y.h || y) === res.hash); return {error: 'Dit verslag heb je al verwerkt' + (x.d ? ' op ' + x.d : '') + '.', hint: 'Elk verslag telt maar één keer.'}; }
  const r = res.data; closeSheet();
  openProc({title: (r.modus === 'opdracht' && r.doelBereikt ? 'Doel bereikt! ' : '') + (MODE_TITLE[r.modus] || 'Je verslag in je plan'), head: 'Verslag · ' + r.onderwerp, src: r.modus,
    text: [r.tekst, ...r.corrections.map(c => c.right)].join(' '), corrected: r.tekst, correctedLabel: r.modus === 'foto' ? 'De foto, overgetypt' + (r.bron ? ' · ' + r.bron : '') : 'Je tekst, verbeterd', corrections: r.corrections, words: r.words, grammar: r.goed,
    note: r.samenvatting, tip: r.tip, setName: 'Uit Claude – week ' + weekNo(),
    onSave: () => saveReport(r, res.hash)});
  return {ok: true, data: r};
}
function saveReport(r, hash) {
  S.imports = S.imports || []; S.imports.push({h: hash, d: dateKey()}); if (S.imports.length > 300) S.imports.splice(0, S.imports.length - 300);
  S.talks.unshift({id: uid('t'), src: 'claude', date: r.datum, modus: r.modus, title: r.onderwerp, q: r.plein, beurten: r.beurten, goal: r.doelBereikt, good: r.samenvatting, tip: r.tip, msgs: []});
  if (S.talks.length > 120) S.talks.length = 120;
  if (r.tekst) S.log.unshift({id: uid('l'), date: r.datum, mode: r.modus, source: 'claude', bron: r.bron, text: r.tekst, status: 'done'});
  if (r.modus === 'opdracht' && r.doelBereikt && r.plein) sqstate(r.plein).steps.gebruik = 1;
}
