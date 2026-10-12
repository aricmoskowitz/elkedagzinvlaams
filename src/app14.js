/* ===== VERSION 2.0: Home Screen app (service worker + update toast) ===== */
function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  // reload only when a new version replaces the running one, not when the first worker takes over
  let reloading = false; const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading || !hadController) return; reloading = true; location.reload(); });
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
    <div class="small">Kopieer in Claude het hele verslag, van <b>EDZ-VERSLAG v1</b> tot <b>EDZ-EINDE</b>. Tekst errond mag mee. Een woordenlijst (<b>EDZ-WOORDEN v1</b>) plak je ook hier.</div>
    <textarea id="rep-t" rows="9" aria-label="Verslag" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="EDZ-VERSLAG v1&#10;{…}&#10;EDZ-EINDE"></textarea>
    <div id="rep-err" role="alert"></div>
    <div class="grid2"><button class="btn line" type="button" id="rep-paste">Plak</button><button class="btn" type="button" id="rep-go">Verwerk</button></div>
    <button class="link sm" type="button" id="rep-file">Of kies een .txt-bestand ›</button><input type="file" id="rep-f" accept=".txt,text/plain" hidden>
  </div>`);
  const ta = $('#rep-t', s);
  $('#rep-paste', s).onclick = async () => { try { const t = await navigator.clipboard.readText(); if (t) ta.value = t; else toast('Het klembord is leeg'); } catch (e) { ta.focus(); toast('Houd het vak ingedrukt en kies Plak'); } };
  const go = () => {
    const res = whichBlock(ta.value) === 'woorden' ? importWords(ta.value) : importReport(ta.value);
    if (res.error) $('#rep-err', s).innerHTML = `<div class="fb no"><b>${esc(res.error)}</b>${res.hint ? `<div class="small">${esc(res.hint)}</div>` : ''}</div>`;
  };
  $('#rep-go', s).onclick = go;
  $('#rep-file', s).onclick = () => $('#rep-f', s).click();
  $('#rep-f', s).onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { ta.value = String(r.result || ''); go(); }; r.onerror = () => toast('Het bestand kon niet gelezen worden'); r.readAsText(f); };
}
// the first marker in the text decides: a report or a word list
function whichBlock(text) { const a = String(text || '').indexOf('EDZ-VERSLAG v1'), b = String(text || '').indexOf('EDZ-WOORDEN v1'); return b >= 0 && (a < 0 || b < a) ? 'woorden' : 'verslag'; }
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

/* ===== VERSION 2.0: Documents for the Claude Project (Ik → Documenten voor Claude) =====
   The same text as praten-project/*.md, generated from the app's data. Woorden.md adds Ari's own words. */
function mdText(h) { const t = document.createElement('textarea'); t.innerHTML = String(h || '').replace(/<[^>]+>/g, ''); return t.value.replace(/\s+/g, ' ').trim(); }
const DOCS = {
  'Curriculum.md': () => {
    const out = ['# Curriculum — Elke Dag Zin', '', 'The full learning plan from A2 to C1. Use the **square ids** (`u7q2`) when placing mistakes, words and grammar. Every town = one grammar point × one Antwerp theme × one can-do statement. Every town ends on its **Grote Markt** (review + field mission; not a grammar topic, never place items there).', '', 'Status: towns marked **(gebouwd)** exist in the app with words, sentences and exercises; the others are planned.', ''];
    DELEN.forEach(D => {
      out.push(`## ${D.name} · ${D.en}`, '');
      ARCS.filter(a => a.deel === D.id).forEach(a => {
        out.push(`### Boog ${a.n} · ${a.name} (${a.en}) · ${a.level}${a.border ? ' · grens: ' + a.border : ''}`, '');
        PLAN_TOWNS.filter(t => t.arc === a.id).forEach((t, i) => {
          out.push(`#### Stad ${i + 1} · ${t.name} (${t.id})${t.built ? ' (gebouwd)' : ''}`, `- Grammatica: ${t.gram} — ${t.gramEn}`, `- Thema: ${t.theme} — ${t.themeEn}`, `- Ik kan: ${t.can} — ${t.canEn}`);
          PLAN_SQ.filter(q => q.u === t.id && !q.review).forEach(q => out.push(`- **${q.id}** Plein ${q.n} · ${q.name}: ${q.title} (${q.en}). ${mdText(q.rule)}`));
          out.push('');
        });
      });
    });
    return out.join('\n').replace(/\n+$/, '\n');
  },
  'Woorden.md': () => {
    const out = ['# Woorden — Elke Dag Zin', '', 'Every word the app already teaches, by square. A word is **new** for a report only if it is not in this list (other forms of these words, like plurals or conjugations, are not new).', ''];
    const wl = l => `${l.p === 'n' && l.g ? l.g + ' ' : ''}${l.w} (${l.en || l.d || ''})`;
    SQUARES.forEach(q => out.push(`## ${q.id} · ${UNIT[q.u].name} · ${q.name}`, q.words.map(LX).filter(Boolean).map(wl).join('; '), ''));
    out.push('## Algemeen · basiswoorden zonder plein', "Known words that belong to no single square. They live in the app's *Algemeen* group.", ALGEMEEN_WORDS.map(LX).map(wl).join('; '), '');
    const sets = (S.sets || []).filter(x => x.src === 'woorden' && x.ids.length); const inSets = new Set(sets.flatMap(x => x.ids));
    const sqOf = l => l.custom ? l.plan : SQ_OF_WORD[l.id];
    const longDate = d => { const [y, m, dd] = String(d || '').split('-').map(Number); return y && m ? `${dd} ${MONTHS[m - 1]} ${y}` : ''; };
    sets.forEach(x => out.push(`## Set · ${x.name}${x.bron ? ' · ' + x.bron : ''}${x.datum ? ' (' + longDate(x.datum) + ')' : ''}`, 'Taught in their own set. The id after each word is its square in the curriculum (— = Algemeen).', x.ids.map(LX).filter(Boolean).map(l => `${wl(l)} [${sqOf(l) || '—'}]`).join('; '), ''));
    const own = Object.values(S.custom || {}).filter(l => !inSets.has(l.id));
    if (own.length) out.push('## Eigen woorden', 'Words Ari added from reports or by hand. They are not new either.', own.map(l => wl(l) + (l.plan ? ' · ' + l.plan : '')).join('; '), '');
    return out.join('\n').replace(/\n+$/, '\n');
  },
  'Scenes.md': () => {
    const out = ['# Scènes — Elke Dag Zin', '', 'Per built town: the conversation scene, the writing prompt and the field mission. Use these for **opdracht** sessions. Stay in the role; the learner is always the one who wants something.', ''];
    UNITS.filter(u => u.built).forEach(u => {
      const sc = SCENARIOS.find(s => s.u === u.id); const w = WRITING[u.id];
      out.push(`## ${u.id} · ${u.name} — ${u.gram} (${u.gramEn})`, `- Kan: ${u.can}`);
      if (sc) out.push(`- Scène: **${sc.title}**. Jij bent ${sc.role} (${sc.roleEn}).`, `- Doel van de leerder: ${sc.goal} (${sc.goalEn})`, ...(sc.doel ? [`- Meetbaar doel: ${sc.doel}`] : []), `- Opener: “${sc.open}”`);
      if (w) out.push(`- Schrijfopdracht: ${w.prompt}`);
      if (u.mission) out.push(`- Opdracht in de stad: ${u.mission}`);
      out.push('');
    });
    return out.join('\n').replace(/\n+$/, '\n');
  },
};
// share sheet with a file when the phone can, else a download
async function saveFile(name, text, type) {
  try {
    const file = new File([text], name, {type});
    if (navigator.canShare && navigator.canShare({files: [file]})) { await navigator.share({files: [file], title: name}); return 'shared'; }
  } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  const url = URL.createObjectURL(new Blob([text], {type}));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000); return 'downloaded';
}
function openDocs() {
  const rows = Object.keys(DOCS).map(n => { const t = DOCS[n](); return `<div class="tapline" style="cursor:default"><div class="t"><div style="font-weight:600">${n}</div><div class="small">${Math.max(1, Math.round(t.length / 1024))} KB${n === 'Woorden.md' ? ((k => ' · met ' + k + (k === 1 ? ' eigen woord' : ' eigen woorden'))(Object.keys(S.custom || {}).length)) : ''}</div></div><button class="btn line" style="min-height:40px;padding:8px 14px" data-act="doc-save" data-id="${n}">Bewaar</button></div>`; }).join('');
  openOverlay('docs', `<button class="iconbtn" data-act="overlay-close" data-id="docs" aria-label="Sluiten">✕</button><span class="small">Documenten voor Claude</span>`, `<div class="stack">
    <h1 data-en="Documents for Claude">Documenten voor Claude</h1>
    <div class="small">Je Claude Project <i>Elke Dag Zin · Praten</i> leest deze bestanden om je fouten en woorden op de juiste plek te zetten. Ze komen uit de app, met je eigen woorden erbij.</div>
    <div>${rows}</div>
    <div class="card soft small">Upload ze opnieuw naar je Project (vervang de oude) als er nieuwe steden gebouwd zijn, of één keer per maand. <i>Instructions.md</i>, <i>Formats.md</i> en <i>Ik.md</i> veranderen niet.</div>
  </div>`);
}
async function saveDoc(n) { if (!DOCS[n]) return; const r = await saveFile(n, DOCS[n](), 'text/markdown'); if (r === 'downloaded') toast(n + ' gedownload'); else if (r === 'shared') toast(n + ' bewaard'); }

/* ===== VERSION 2.0: first run · bring the progress from the old app (MIGRATION.md §C) ===== */
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function openWelcome() {
  const ov = openOverlay('welcome', `<span style="flex:1"></span>`, `<div class="stack">
    <h1>Welkom bij Elke Dag Zin</h1>
    <p class="why" style="margin:0">Elke dag een beetje Vlaams. Oefenen doe je hier; praten, je dagboek en foto's van je les doe je in je Claude Project.</p>
    ${isIOS() && !isStandalone() ? `<div class="card soft stack" style="gap:6px"><b>Zet de app eerst op je beginscherm</b><div class="small">Tik in Safari op <b>Deel</b> en kies <b>Zet op beginscherm</b>. Open de app daar en zet dan je back-up terug: Safari en de app op je beginscherm bewaren hun gegevens apart.</div></div>` : ''}
    <button class="btn block" type="button" id="mig-go">Zet je back-up uit de oude app terug</button>
    <input type="file" id="mig-file" accept="application/json,.json" hidden>
    <div class="small">In de oude app: Ik → Back-up → <b>Exporteer</b>. Bewaar het .json-bestand in Bestanden en kies het hier.</div>
    <div id="mig-out" role="status"></div>
    <button class="btn line block" type="button" id="mig-new">Ik begin nieuw</button>
  </div>`);
  $('#mig-go', ov).onclick = () => $('#mig-file', ov).click();
  $('#mig-new', ov).onclick = () => { closeOverlay('welcome'); openTour(0); };
  $('#mig-file', ov).onchange = e => {
    const f = e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => {
      const res = parseBackup(r.result);
      if (res.error) { $('#mig-out', ov).innerHTML = `<div class="fb no"><b>${esc(res.error)}</b><div class="small">Kies het .json-bestand dat de oude app bewaarde (elkedagzin-backup-….json).</div></div>`; return; }
      restoreBackup(res.data); S.coach.tour = 1; S.settings.lastBackup = Date.now(); Store.flush(); render(); migrated();
    };
    r.onerror = () => toast('Het bestand kon niet gelezen worden'); r.readAsText(f);
  };
}
function migrationSummary() {
  const n = (x, one, many) => [x, x === 1 ? one : many];
  return [n(SQ_ORDER.filter(sqComplete).length, 'plein klaar', 'pleinen klaar'), n(wordsKnown(), 'woord gekend', 'woorden gekend'), n(Object.keys(S.items).length, 'herhaalkaart', 'herhaalkaarten'), n(Object.keys(S.custom || {}).length, 'eigen woord', 'eigen woorden'),
    n((S.sets || []).length, 'set', 'sets'), n(Object.keys(S.fix || {}).length, 'correctie', 'correcties'), n(Object.keys(S.markt || {}).length, 'Grote Markt', 'Grote Markten'), n((S.talks || []).length + (S.log || []).length, 'gesprek of tekst', 'gesprekken en teksten')];
}
function migrated() {
  closeOverlay('welcome');
  openOverlay('welcome', `<span style="flex:1"></span><button class="iconbtn" data-act="overlay-close" data-id="welcome" aria-label="Sluiten">✕</button>`, `<div class="stack">
    <div class="eyebrow">Back-up teruggezet</div><h1>Je voortgang is hier</h1>
    <div class="grid2">${migrationSummary().map(([n, l]) => `<div><div class="big-num">${n}</div><div class="small">${l}</div></div>`).join('')}</div>
    <div class="card soft stack" style="gap:4px"><b>Kijk even na</b><div class="small">· Pad toont je steden en pleinen<br>· Woorden → Set → Alle eigen woorden toont je eigen woorden<br>· Naslag toont je correcties op hun plein</div></div>
    <div class="small">Upload daarna de nieuwe <b>Woorden.md</b> naar je Claude Project: daar staan nu ook je eigen woorden in.</div>
    <button class="btn block" data-act="docs">Documenten voor Claude</button>
    <button class="btn line block" data-act="overlay-close" data-id="welcome">Naar het pad</button>
  </div>`);
}

/* ===== EDZ-WOORDEN v1: a named word set from the Project or Ari's own list (FORMATS.md §4) =====
   Same paste box and normalising as the report. Words are matched on lemma + part of speech:
   a word already in the app is linked into the set and never overwritten. New words enter
   Herhalen a few a day (S.drip), or straight away when Ari drills the set. */
const WORD_P = ['n', 'v', 'adj', 'adv', 'pron', 'conj', 'prep'];
const DRIP_PER_DAY = 12;
const wordKey = (w, p) => norm(w) + '|' + p;
function wordIndex() {
  const ix = new Map();
  LEX.forEach(l => { const k = wordKey(l.w, l.p); if (!ix.has(k)) ix.set(k, l.id); });
  Object.values(S.custom || {}).forEach(l => { const k = wordKey(l.w, l.p); if (!ix.has(k)) ix.set(k, l.id); });
  return ix;
}
function parseWords(text) {
  text = String(text || '').replace(/\r\n?/g, '\n');
  const i = text.indexOf('EDZ-WOORDEN v1');
  if (i < 0) return {error: 'Ik vind geen woordenlijst in deze tekst.', hint: 'Kopieer het hele blok, van EDZ-WOORDEN v1 tot EDZ-EINDE.'};
  let body = text.slice(i + 'EDZ-WOORDEN v1'.length);
  const e = body.indexOf('EDZ-EINDE'); if (e >= 0) body = body.slice(0, e);
  body = body.replace(/^\s*```[a-z]*\s*$/gim, '');
  const a = body.indexOf('{'), b = body.lastIndexOf('}');
  if (a < 0 || b < a) return {error: 'De woordenlijst is leeg of niet volledig.', hint: 'Kopieer het hele blok, tot en met EDZ-EINDE.'};
  const raw = body.slice(a, b + 1); let d = null;
  try { d = JSON.parse(raw); } catch (err) { try { d = JSON.parse(raw.replace(/[“”„‟″]/g, '"').replace(/[‘’‚‛′]/g, "'")); } catch (err2) { d = null; } }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return {error: 'De woordenlijst is geen geldige JSON.', hint: 'Vraag Claude: ‘geef de woordenlijst opnieuw als geldige JSON’.'};
  const set = str(d.set, 80) || 'Geïmporteerd ' + dateKey(); // Ari names it in the preview
  if (!Array.isArray(d.words) || !d.words.length) return {error: 'De woordenlijst heeft geen woorden.', hint: 'Het veld "words" moet 1 tot 200 woorden bevatten.'};
  const ix = wordIndex(); const seen = new Set();
  const out = {set, datum: /^\d{4}-\d\d-\d\d$/.test(d.datum) ? d.datum : dateKey(), bron: str(d.bron, 120), fresh: [], existing: [], rejected: []};
  d.words.slice(0, 200).forEach((x, n) => {
    const nr = n + 1;
    if (!x || typeof x !== 'object') { out.rejected.push({nr, w: '?', why: 'geen woord'}); return; }
    let w = str(x.w, 60), g = x.g, p = typeof x.p === 'string' ? x.p.trim().toLowerCase() : '';
    const art = w.match(/^(de|het)\s+(.+)$/i); if (art) { w = art[2]; g = g || art[1].toLowerCase(); p = p || 'n'; }
    const miss = ['d', 's', 'en'].filter(k => !str(x[k])); if (!w) miss.unshift('w');
    if (miss.length) { out.rejected.push({nr, w: w || '?', why: 'ontbreekt: ' + miss.join(', ')}); return; }
    if (!WORD_P.includes(p)) { out.rejected.push({nr, w, why: p ? `onbekende woordsoort "${p}"` : 'woordsoort (p) ontbreekt'}); return; }
    if (p === 'n' && g !== 'de' && g !== 'het') { out.rejected.push({nr, w, why: 'zelfstandig naamwoord zonder de/het'}); return; }
    const k = wordKey(w, p);
    if (seen.has(k)) { out.rejected.push({nr, w, why: 'staat twee keer in de lijst'}); return; } seen.add(k);
    if (ix.has(k)) { out.existing.push({w, id: ix.get(k)}); return; }
    out.fresh.push({w, p, g: p === 'n' ? g : undefined, pl: p === 'n' ? str(x.pl, 60) || null : null, dim: p === 'n' ? str(x.dim, 60) || null : null, d: str(x.d, 200), s: str(x.s, 200), en: str(x.en, 120), plan: planId(x.plan), th: themeId(x.thema), syn: relList(x.syn), ant: relList(x.ant)});
  });
  if (d.words.length > 200) out.rejected.push({nr: 201, w: '…', why: `alleen de eerste 200 woorden (${d.words.length} in de lijst)`});
  return {data: out};
}
// "syn" / "ant": a list or a comma-separated string
const relList = v => (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : []).map(x => str(x, 60)).filter(Boolean).slice(0, 6);
// "thema": a theme id or its Dutch name; anything else is ignored
const themeId = t => typeof t !== 'string' ? '' : THEME[t.trim().toLowerCase()] ? t.trim().toLowerCase() : (THEMES.find(x => norm(x.name) === norm(t)) || {}).id || '';
const findSet = name => (S.sets || []).find(x => norm(x.name) === norm(name));
function importWords(text) {
  let res; try { res = parseWords(text); } catch (e) { res = {error: 'Deze woordenlijst kon ik niet lezen.'}; }
  if (res.error) return res;
  closeSheet(); previewWords(res.data); return {ok: true, data: res.data};
}
function previewWords(r) {
  const alg = r.fresh.filter(x => !x.plan).length;
  const ov = openOverlay('wimport', `<button class="iconbtn" data-act="overlay-close" data-id="wimport" aria-label="Sluiten">✕</button><span class="small">Woordenlijst${r.bron ? ' · ' + esc(r.bron) : ''}</span>`, `<div class="stack">
    <label class="f" for="wi-name">Naam van de set<input id="wi-name" type="text" value="${esc(r.set)}" maxlength="80" autocomplete="off"></label>
    <div id="wi-same"></div>
    <div class="procsum" id="wi-sum"><b>${r.fresh.length}</b> ${r.fresh.length === 1 ? 'nieuw woord' : 'nieuwe woorden'} · <b>${r.existing.length}</b> al in de app · <b>${alg}</b> naar Algemeen</div>
    <div class="small">Nieuwe woorden komen in de set en op hun plein (of in Algemeen). Woorden die al in de app staan, worden aan de set gekoppeld; hun kaart blijft zoals ze is. Nieuwe woorden komen ${DRIP_PER_DAY} per dag in Herhalen; oefen de set om ze sneller te krijgen.</div>
    ${r.rejected.length ? `<div class="card soft stack" style="gap:4px" id="wi-rej"><b>${r.rejected.length} niet ingelezen</b>${r.rejected.map(x => `<div class="small">${x.nr}. <b class="nl">${esc(x.w)}</b>: ${esc(x.why)}</div>`).join('')}</div>` : ''}
    ${r.fresh.length ? `<details class="card"><summary class="small" style="cursor:pointer">Toon de nieuwe woorden</summary><div class="small" style="margin-top:8px">${r.fresh.map(x => `${x.g ? `<span class="${x.g}">${x.g}</span> ` : ''}<b class="nl">${esc(x.w)}</b> · ${esc(x.plan ? placeLine(x.plan).replace(/^\S+ · /, '') : 'Algemeen')}`).join('<br>')}</div></details>` : ''}
    <div id="wi-err" class="small" style="color:var(--warn)" hidden>Geef de set een naam.</div>
    <div class="grid2"><button class="btn line" type="button" data-act="overlay-close" data-id="wimport">Annuleer</button><button class="btn" type="button" id="wi-go" ${r.fresh.length || r.existing.length ? '' : 'disabled'}>Importeer</button></div>
  </div>`);
  const name = $('#wi-name', ov);
  // the same name as an existing set: add to it (default) or make a new one
  const same = () => {
    const set = findSet(name.value.trim()); const box = $('#wi-same', ov);
    if (!set) { box.innerHTML = '<div class="small">Een nieuwe set.</div>'; return; }
    const inSet = r.existing.filter(x => set.ids.includes(x.id)).length;
    box.innerHTML = `<div class="card soft stack" style="gap:6px"><div class="small">Er is al een set <b>${esc(set.name)}</b> (${plural(set.ids.length, 'woord', 'woorden')}${inSet ? `; ${inSet} van deze woorden zitten er al in` : ''}).</div>
      <label class="small"><input type="radio" name="wi-mode" value="add" checked> Voeg toe aan die set</label>
      <label class="small"><input type="radio" name="wi-mode" value="new"> Maak een nieuwe set: <b>${esc(uniqueSetName(name.value.trim()))}</b></label></div>`;
  };
  name.oninput = same; same();
  $('#wi-go', ov).onclick = () => {
    const v = name.value.trim().replace(/\s+/g, ' '); if (!v) { $('#wi-err', ov).hidden = false; return; }
    const mode = ($('input[name="wi-mode"]:checked', ov) || {}).value;
    r.set = mode === 'new' ? uniqueSetName(v) : (findSet(v) || {}).name || v;
    const n = saveWords(r); closeOverlay('wimport'); render();
    toast(n.added || n.linked ? `${r.set}: ${n.added} nieuw, ${n.linked} gekoppeld` : 'Niets nieuws: alles stond al in de set');
  };
}
function saveWords(r) {
  let set = findSet(r.set);
  if (!set) { set = {id: uid('s-'), name: r.set, ids: []}; S.sets.push(set); }
  Object.assign(set, {src: 'woorden', bron: r.bron || set.bron || '', datum: r.datum});
  const ix = wordIndex(); let added = 0, linked = 0;
  r.fresh.forEach(x => {
    let id = ix.get(wordKey(x.w, x.p)); // pasted twice before saving: still one word
    if (!id) { id = uid('u-'); S.custom[id] = {id, custom: true, u: 0, w: x.w, p: x.p, g: x.g, pl: x.pl, dim: x.dim, d: x.d, s: x.s, en: x.en, plan: x.plan, src: 'woorden', date: r.datum}; if (x.th) S.custom[id].th = x.th; if (x.syn.length) S.custom[id].syn = x.syn; if (x.ant.length) S.custom[id].ant = x.ant; ix.set(wordKey(x.w, x.p), id); S.drip.ids.push(id); added++; }
    if (!set.ids.includes(id)) set.ids.push(id);
  });
  r.existing.forEach(x => { if (!set.ids.includes(x.id)) { set.ids.push(x.id); linked++; } });
  dripRelease(true);
  Store.mark('words', 'items', 'state');
  return {added, linked};
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && dripRelease()) render(); });
// a few new words a day into Herhalen; drilling a set releases its words at once
function dripRelease(sameDay) {
  const D = S.drip; if (!D || !D.ids.length) return 0;
  D.ids = D.ids.filter(id => LX(id) && !S.items['w:' + id + ':rec']);
  if (D.day === today() && !sameDay) return 0;
  const room = D.day === today() ? Math.max(0, DRIP_PER_DAY - (D.n || 0)) : DRIP_PER_DAY;
  const now = D.ids.splice(0, room);
  now.forEach(id => { introduce('w:' + id + ':rec'); S.seen[id] = 1; });
  D.n = (D.day === today() ? D.n || 0 : 0) + now.length; D.day = today();
  if (now.length) Store.mark('items', 'state');
  return now.length;
}
// Herhaal: one set on its own (due words first, then words not yet in Herhalen)
function reviewSet(id) {
  const set = getSet(id); if (!set) return;
  const ws = set.ids.map(LX).filter(Boolean); if (!ws.length) { toast('Deze set is leeg'); return; }
  const due = ws.filter(l => isDue('w:' + l.id + ':rec')), fresh = ws.filter(l => !S.items['w:' + l.id + ':rec']), rest = ws.filter(l => S.items['w:' + l.id + ':rec'] && !isDue('w:' + l.id + ':rec'));
  const d = shuffle(due); const pick = uniq(d.slice(0, 10).concat(fresh.slice(0, 15 - Math.min(10, d.length)), d.slice(10), shuffle(rest))).slice(0, 15);
  const keys = pick.map(l => 'w:' + l.id + (l.g && S.items['w:' + l.id + ':rec'] && Math.random() < .3 ? ':gen' : ':rec'));
  keys.forEach(k => introduce(k)); S.drip.ids = S.drip.ids.filter(x => !pick.some(l => l.id === x));
  closeSheet(); toast('Herhaal: ' + set.name); startSession({keys, intros: true});
}
function setWaiting(set) { const ids = new Set(S.drip.ids); return set.ids.filter(id => ids.has(id)).length; }
