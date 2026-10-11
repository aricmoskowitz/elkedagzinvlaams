/* ===== PLAN PLACEMENT: every mistake and word gets a place in the plan =====
   Boog · Stad · Plein. Built squares, planned squares (not built yet) and
   squares you added from your own log/talks ("toegevoegd") all count. */

/* ---------- where things live ---------- */
const FORM_IX = (() => {
  const ix = {};
  const add = (f, id) => { const k = norm(f); if (k && k.length > 1 && !ix[k]) ix[k] = id; };
  LEX.forEach(l => { [l.w, l.pl, l.dim, l.e].forEach(f => f && add(f, l.id)); if (l.v) allForms(l).forEach(f => add(f, l.id)); });
  return ix;
})();
const SQ_OF_WORD = (() => { const m = {}; PLAN_SQ.forEach(q => (q.words || []).forEach(w => { m[w] = q.id; })); return m; })();
function planLoc(id) {
  if (!id) return null;
  if (PSQ[id]) { const q = PSQ[id]; const t = PT[q.u]; return {id, kind: q.built ? 'built' : 'planned', arc: arcOf(q.u).n, town: townIndexInArc(q.u), townName: t.name, sq: q.n, sqName: q.name, title: q.title, en: q.en, u: q.u}; }
  const x = (S.extras || []).find(e => e.id === id);
  if (x) { if (!x.town || !PT[x.town]) return {id, kind: 'added', arc: null, town: null, townName: 'Nog niet geplaatst', sq: null, sqName: 'Toegevoegd', title: x.title, en: '', u: null};
    return {id, kind: 'added', arc: arcOf(x.town).n, town: townIndexInArc(x.town), townName: PT[x.town].name, sq: null, sqName: 'toegevoegd plein', title: x.title, en: '', u: x.town}; }
  return null;
}
function locLine(L) { if (!L) return 'Algemeen'; return L.arc ? `Boog ${L.arc} · Stad ${L.town} · ${L.sq ? 'Plein ' + L.sq : 'toegevoegd'}` : 'Nog niet geplaatst'; }
function locStatus(L) {
  if (!L) return '';
  if (L.kind === 'added') return 'toegevoegd';
  if (PSQ[L.id] && PSQ[L.id].review) return PSQ[L.id].built ? marktStatus(L) : 'later';
  if (L.kind === 'planned') return 'later';
  if (sqComplete(L.id)) return 'klaar';
  if (!sqOpen(L.id)) return 'nog dicht';
  return sqStarted(L.id) ? 'bezig' : 'open';
}
const planOrder = id => { const i = PLAN_SQ.findIndex(q => q.id === id); if (i >= 0) return i; const x = (S.extras || []).find(e => e.id === id); if (x && x.town) { const j = PLAN_SQ.findIndex(q => q.u === x.town); return j + 2.5; } return 9999; };
function usedPlanWords(text) {
  const seen = new Set(), out = [];
  norm(text).split(' ').forEach(t => { const id = FORM_IX[t]; if (id && !seen.has(id)) { seen.add(id); out.push(id); } });
  return out;
}
function mineFor(id) {
  id = id || null;
  const fixes = Object.entries(S.fix || {}).filter(([, f]) => (f.plan || null) === id).map(([k, f]) => ({k, ...f}));
  const words = Object.values(S.custom || {}).filter(w => (w.plan || null) === id);
  return {fixes, words};
}
function mineCountTown(u) {
  let n = 0; PLAN_SQ.filter(q => q.u === u).forEach(q => { const m = mineFor(q.id); n += m.fixes.length + m.words.length; });
  (S.extras || []).filter(x => x.town === u).forEach(x => { const m = mineFor(x.id); n += m.fixes.length + m.words.length + 1; });
  return n;
}

/* ---------- corrections with a place ---------- */
function addFix(c, src, plan) {
  if (!c || !c.wrong || !c.right || norm(c.wrong) === norm(c.right)) return;
  const id = uid('f'); S.fix[id] = {wrong: String(c.wrong).slice(0, 240), right: String(c.right).slice(0, 240), why: String(c.why || '').slice(0, 300), type: c.type || '', src, date: dateKey(), plan: plan || null};
  introduce('c:' + id + ':fix');
}
/* ---------- the processing card, grouped by place in the plan ---------- */
function openProc(o) {
  const groups = {}; const G = key => (groups[key] = groups[key] || {key, corrections: [], words: [], used: [], good: []});
  const newTopics = []; const topicKey = t => 'new:' + (t.town || '') + ':' + norm(t.title || '');
  (o.corrections || []).forEach((c, i) => {
    let key = PSQ[c.plan] ? c.plan : null;
    if (!key && c.newTopic && c.newTopic.title) { key = topicKey(c.newTopic); if (!newTopics.find(t => t.key === key)) newTopics.push({key, ...c.newTopic}); }
    G(key || 'general').corrections.push({...c, i});
  });
  const words = (o.words || []).filter(w => w && w.w && !FORM_IX[norm(w.w)] && !Object.values(S.custom).some(l => norm(l.w) === norm(w.w)));
  words.forEach((w, i) => G(PSQ[w.plan] ? w.plan : 'general').words.push({...w, i}));
  (o.grammar || []).forEach(g => {
    let key = PSQ[g.plan] ? g.plan : null;
    if (!key && g.newTopic && g.newTopic.title) { key = topicKey(g.newTopic); if (!newTopics.find(t => t.key === key)) newTopics.push({key, ...g.newTopic}); }
    if (key) G(key).good.push(g);
  });
  const usedBy = {}; usedPlanWords(o.text || '').forEach(id => { const q = SQ_OF_WORD[id]; if (q) (usedBy[q] = usedBy[q] || []).push(id); });
  Object.keys(usedBy).forEach(q => { if (groups[q]) groups[q].used = usedBy[q]; });
  const usedOnly = Object.keys(usedBy).filter(q => !groups[q]).sort((a, b) => planOrder(a) - planOrder(b));
  const nC = (o.corrections || []).length, nNew = newTopics.length;
  const keys = Object.keys(groups).sort((a, b) => {
    const oa = a === 'general' ? 1e5 : a.startsWith('new:') ? planOrder(PLAN_SQ.find(q => q.u === a.split(':')[1]) ? PLAN_SQ.find(q => q.u === a.split(':')[1]).id : '') + 2.5 : planOrder(a);
    const ob = b === 'general' ? 1e5 : b.startsWith('new:') ? planOrder(PLAN_SQ.find(q => q.u === b.split(':')[1]) ? PLAN_SQ.find(q => q.u === b.split(':')[1]).id : '') + 2.5 : planOrder(b);
    return oa - ob;
  });
  const setName = o.setName || 'Uit de les – week ' + weekNo();
  const card = key => {
    const g = groups[key]; let head;
    if (key === 'general') head = `<div class="loc">Algemeen</div><div class="nl" style="font-size:17px">Spelling en losse woorden</div>`;
    else if (key.startsWith('new:')) { const t = newTopics.find(x => x.key === key); const tw = PT[t.town]; head = `<div class="loc">${tw ? `Boog ${arcOf(t.town).n} · Stad ${townIndexInArc(t.town)} · ${esc(tw.name)}` : 'Nog niet geplaatst'} <span class="pill new">nieuw in je plan</span></div><div class="nl" style="font-size:17px">${esc(t.title)}</div><div class="small">${esc(t.rule || '')}</div>`; }
    else { const L = planLoc(key); head = `<div class="loc">${locLine(L)} <span class="pill ${['klaar', 'bezig', 'open'].includes(locStatus(L)) ? 'go' : ''}">${locStatus(L)}</span></div><div class="nl" style="font-size:17px">${esc(L.townName)} · ${esc(L.sqName)}</div><div class="small">${esc(L.title)}${L.en && L.en !== L.title ? ' · ' + esc(L.en) : ''}</div>`; }
    return `<div class="card stack placecard" style="gap:8px">${head}
      ${g.corrections.map(c => `<label class="corr"><input type="checkbox" name="pc" value="${c.i}" checked><span><span class="wrong">${esc(c.wrong)}</span><br><span class="right nl">${esc(c.right)}</span><br><span class="small">${esc(c.why || '')}</span></span></label>`).join('')}
      ${g.words.map(w => `<label class="corr"><input type="checkbox" name="pw" value="${w.i}" checked><span><span class="pill new">nieuw woord</span> <b class="nl" style="font-size:17px">${w.g && w.p === 'n' ? `<span class="${w.g}">${w.g}</span> ` : ''}${esc(w.w)}</b><br><span class="small">${esc(w.d || '')}</span></span></label>`).join('')}
      ${g.good.map(x => `<div class="small">✓ Goed gebruikt: ${esc(x.topic)}${x.mastered && PSQ[x.plan] && PSQ[x.plan].built && !sqOpen(x.plan) ? ` · <button class="link" data-act="testout" data-qs="${x.plan}" style="min-height:0;padding:0">test je in ›</button>` : ''}</div>`).join('')}
      ${g.used.length ? `<div class="small">Ook gebruikt uit dit plein: ${g.used.map(id => `<b class="nl">${esc(LX(id).w)}</b>`).join(', ')}</div>` : ''}
      ${key !== 'general' && !key.startsWith('new:') ? `<button class="link sm" data-act="plan-go" data-id="${key}">Toon in het plan ›</button>` : ''}
    </div>`;
  };
  const body = `<div class="stack">
    <h1>${esc(o.title || 'Verwerkt')}</h1>
    ${o.note ? `<div class="card soft nl" style="font-size:17px">${esc(o.note)}</div>` : ''}
    ${o.corrected ? `<details class="card"><summary class="small" style="cursor:pointer">${esc(o.correctedLabel || 'Je tekst, verbeterd')}</summary><div class="nl" style="font-size:17px;line-height:1.5;margin-top:8px">${esc(o.corrected)}</div></details>` : ''}
    <div class="procsum"><b>${nC}</b> ${nC === 1 ? 'fout' : 'fouten'} · <b>${words.length}</b> ${words.length === 1 ? 'nieuw woord' : 'nieuwe woorden'}${nNew ? ` · <b>${nNew}</b> nieuw in je plan` : ''}</div>
    <div class="small">Elke fout en elk nieuw woord staat bij het plein waar het hoort. Vink uit wat je niet wilt bewaren.</div>
    ${keys.map(card).join('') || '<div class="card soft">Geen fouten en geen nieuwe woorden. Knap!</div>'}
    ${usedOnly.length ? `<div class="card stack" style="gap:2px"><div class="eyebrow">Woorden uit je plan die je al gebruikte</div>${usedOnly.map(q => { const L = planLoc(q); return `<button class="usedrow" data-act="plan-go" data-id="${q}"><span class="loc">${L.arc}·${L.town}·${L.sq}</span><span class="t"><span class="small">${esc(L.sqName)}</span> <span class="nl">${usedBy[q].map(id => esc(LX(id).w)).join(', ')}</span></span><span class="chev">›</span></button>`; }).join('')}</div>` : ''}
    ${o.tip ? `<div class="small"><b>Tip:</b> ${esc(o.tip)}</div>` : ''}
    <div class="savebar"><button class="btn block" id="proc-save">Bewaar in mijn plan</button></div>
  </div>`;
  const ov = openOverlay('proc', `<button class="iconbtn" data-act="overlay-close" data-id="proc" aria-label="Sluiten">✕</button><span class="small">${esc(o.head || 'Verwerken')}</span>`, body);
  $('#proc-save', ov).onclick = () => {
    const pick = n => $$(`input[name="${n}"]:checked`, ov).map(x => +x.value);
    const pc = pick('pc'); const created = {};
    const topicId = key => {
      if (created[key]) return created[key];
      const t = newTopics.find(x => x.key === key); if (!t) return null;
      const ex = (t.examples || []).filter(e => e && e.nl && e.en).slice(0, 4);
      const id = uid('x'); S.extras.push({id, town: PT[t.town] ? t.town : null, title: String(t.title).slice(0, 80), rule: String(t.rule || '').slice(0, 400), examples: ex.map(e => ({nl: String(e.nl), en: String(e.en)})), date: dateKey(), src: o.src});
      ex.forEach((_, i) => introduce('e:' + id + '~' + i + ':tr'));
      return (created[key] = id);
    };
    pc.forEach(i => { const c = o.corrections[i]; let plan = PSQ[c.plan] ? c.plan : null; if (!plan && c.newTopic && c.newTopic.title) plan = topicId(topicKey(c.newTopic)); addFix(c, o.src, plan); });
    const pw = pick('pw');
    if (pw.length) {
      let set = S.sets.find(s => s.name === setName); if (!set) { set = {id: uid('s-'), name: setName, ids: []}; S.sets.push(set); }
      pw.forEach(i => { const w = words[i]; const id = uid('u-'); S.custom[id] = {id, custom: true, u: 0, w: String(w.w), p: ['n', 'v', 'adj', 'adv'].includes(w.p) ? w.p : 'adv', g: w.p === 'n' && (w.g === 'de' || w.g === 'het') ? w.g : undefined, pl: w.pl || null, dim: w.dim || null, d: w.d || '', s: w.s || '', en: w.en || '', plan: PSQ[w.plan] ? w.plan : null}; set.ids.push(id); S.seen[id] = 1; introduce('w:' + id + ':rec'); });
    }
    (o.grammar || []).forEach(g => {
      if (g.newTopic && g.newTopic.title) topicId(topicKey(g.newTopic));
      if (PSQ[g.plan] && !(PSQ[g.plan].built && sqComplete(g.plan))) S.sic[g.plan] = {topic: g.topic, date: dateKey()};
      if (PSQ[g.plan] && PSQ[g.plan].built && sqComplete(g.plan)) squareKeys(g.plan).forEach(k => { if (S.items[k]) S.items[k].d = today(); });
    });
    if (o.onSave) o.onSave();
    Store.mark('items', 'words', 'log', 'state'); closeOverlay('proc'); render();
    toast('Bewaard in je plan');
  };
}

const arr = a => Array.isArray(a) ? a : [];

/* ---------- your items on a square ---------- */
function mineBlock(id) {
  const m = mineFor(id);
  if (!m.fixes.length && !m.words.length) return '';
  return `<div class="card stack mine" style="gap:8px"><div class="eyebrow">Van jou · uit je gesprekken, teksten en logboek</div>
    ${m.fixes.map(f => `<div class="corr" style="cursor:default"><span><span class="wrong">${esc(f.wrong)}</span><br><span class="right nl">${esc(f.right)}</span><br><span class="small">${esc(f.why)} · ${esc(f.date)}</span></span></div>`).join('')}
    ${m.words.length ? `<div class="small">Jouw woorden hier: ${m.words.map(w => `<button class="link" data-act="word" data-id="${w.id}" style="padding:0;min-height:0">${esc(w.w)}</button>`).join(', ')}</div>` : ''}
    <button class="btn line" data-act="mine-practise" data-id="${id}">${m.fixes.length + m.words.length === 1 ? 'Oefen dit' : 'Oefen deze ' + (m.fixes.length + m.words.length) + ' dingen'}</button></div>`;
}
function practiseMine(id) {
  const m = mineFor(id);
  const keys = m.fixes.map(f => 'c:' + f.k + ':fix').concat(m.words.map(w => 'w:' + w.id + ':rec'));
  const x = (S.extras || []).find(e => e.id === id); if (x) x.examples.forEach((_, i) => keys.push('e:' + x.id + '~' + i + ':tr'));
  if (!keys.length) { toast('Hier staat nog niets om te oefenen.'); return; }
  keys.forEach(k => introduce(k)); closeSheet(); closeOverlay('plan');
  startSession({keys: shuffle(keys).slice(0, 20), intros: false});
}

/* ---------- the whole plan ---------- */
function openPlan(focus) {
  const focusArc = focus && (PSQ[focus] ? PT[PSQ[focus].u].arc : ((S.extras || []).find(x => x.id === focus) || {}).town && PT[S.extras.find(x => x.id === focus).town].arc);
  const row = q => { const m = mineFor(q.id); const n = m.fixes.length + m.words.length; const st = locStatus(planLoc(q.id));
    return `<button class="planrow${q.review ? ' review' : ''}${focus === q.id ? ' focus' : ''}" data-act="plan-sq" data-id="${q.id}" id="pl-${q.id}"><span class="pn">${q.review ? '★' : q.n}</span><span class="t"><span class="nl">${esc(q.name)}</span><span class="small"> · ${esc(q.review ? 'herhaling en opdracht' : q.title)}</span></span>${n ? `<span class="badge" aria-label="${n} van jou">${n}</span>` : ''}<span class="st ${st.replace(' ', '')}">${st}</span></button>`; };
  const arcs = DELEN.map(D => `<div class="deel"><div class="eyebrow">${esc(D.name)} · ${esc(D.en)}</div>` + ARCS.filter(a => a.deel === D.id).map(a => {
    const towns = PLAN_TOWNS.filter(t => t.arc === a.id);
    let mineN = 0;
    const tHTML = towns.map((t, ti) => {
      const sqs = PLAN_SQ.filter(q => q.u === t.id); const added = (S.extras || []).filter(x => x.town === t.id);
      mineN += mineCountTown(t.id);
      const done = sqs.filter(q => q.built && sqComplete(q.id)).length; const built = sqs.filter(q => q.built).length;
      const rows = sqs.map(row).join('') + added.map(x => { const m = mineFor(x.id); const n = m.fixes.length + m.words.length;
        return `<button class="planrow added${focus === x.id ? ' focus' : ''}" data-act="plan-sq" data-id="${x.id}" id="pl-${x.id}"><span class="pn">+</span><span class="t"><span class="nl">${esc(x.title)}</span></span>${n ? `<span class="badge">${n}</span>` : ''}<span class="st toegevoegd">toegevoegd</span></button>`; }).join('');
      return `<div class="plantown"><div class="spread"><div><span class="small">Stad ${ti + 1}</span> <b class="nl" style="font-size:18px">${esc(t.name)}</b></div><span class="small">${built ? done + '/' + built : 'later'}</span></div><div class="small" style="margin:-2px 0 2px">${esc(t.gram)} · ${esc(t.theme)}</div><div class="small cando">${esc(t.can)}</div>${rows}</div>`;
    }).join('');
    const open = a.id === 'a1' || a.id === focusArc || mineN > 0;
    return `<details class="planarc"${open ? ' open' : ''}><summary><span class="t"><b>Boog ${a.n} · ${esc(a.name)}</b><span class="small"> · ${towns.length} steden</span></span>${mineN ? `<span class="badge">${mineN}</span>` : ''}</summary>${tHTML}${a.border ? `<div class="small planborder">↓ over ${esc(a.border)} naar boog ${a.n + 1}</div>` : '<div class="small planborder">Einde van het pad: C1</div>'}</details>`;
  }).join('') + '</div>').join('');
  const loose = (S.extras || []).filter(x => !x.town || !PT[x.town]);
  const gen = mineFor(null);
  const ov = openOverlay('plan', `<button class="iconbtn" data-act="overlay-close" data-id="plan" aria-label="Sluiten">✕</button><span class="small">Het hele plan</span>`, `<div class="stack">
    <h1>Het hele plan</h1>
    <div class="small">${ARCS.length} bogen · ${PLAN_TOWNS.length} steden · ${PLAN_SQ.length} pleinen, van A2 tot C1. Elke stad: één grammaticapunt, één Antwerps thema, één “ik kan”.</div>
    ${coachTip('plan', 'Het getal in de groene cirkel is wat van jou op dat plein staat: fouten uit je gesprekken en teksten, en woorden die je zelf gebruikte. Wat nog niet in het plan zat, staat er nu als “toegevoegd”. Elke stad eindigt op de Grote Markt: herhaling en je opdracht in de stad.')}
    ${arcs}
    ${loose.length || gen.fixes.length || gen.words.length ? `<section class="planarc"><h2>Nog niet geplaatst</h2>${loose.map(x => `<button class="planrow added" data-act="plan-sq" data-id="${x.id}"><span class="pn">+</span><span class="t nl">${esc(x.title)}</span><span class="st toegevoegd">toegevoegd</span></button>`).join('')}${gen.fixes.length || gen.words.length ? `<button class="planrow" data-act="plan-sq" data-id="general"><span class="pn">·</span><span class="t">Algemeen: spelling en losse woorden</span><span class="badge">${gen.fixes.length + gen.words.length}</span></button>` : ''}</section>` : ''}
  </div>`);
  if (focus) setTimeout(() => { const el = $('#pl-' + focus, ov); if (el) el.scrollIntoView({block: 'center'}); }, 60);
}
function openPlanSquare(id) {
  if (PSQ[id] && PSQ[id].review && PSQ[id].built) { closeOverlay('plan'); closeOverlay('proc'); TAB = 'pad'; PAD.lvl = 'markt'; PAD.u = PSQ[id].u; render(); $('#main').scrollTop = 0; return; }
  if (PSQ[id] && PSQ[id].built) { closeOverlay('plan'); closeOverlay('proc'); TAB = 'pad'; PAD.lvl = 'sq'; PAD.q = id; PAD.u = PSQ[id].u; render(); $('#main').scrollTop = 0; return; }
  const L = id === 'general' ? null : planLoc(id); const x = (S.extras || []).find(e => e.id === id); const q = PSQ[id];
  const m = mineFor(id === 'general' ? null : id);
  openSheet(`<div class="stack">
    <div class="loc">${id === 'general' ? 'Algemeen' : locLine(L)}</div>
    <h2>${id === 'general' ? 'Spelling en losse woorden' : esc(q ? q.name + ' · ' + q.title : x.title)}</h2>
    ${q ? `<div class="small">${esc(PT[q.u].name)} · ${esc(q.en)}</div><p class="why" style="margin:0">${esc(q.rule)}</p><div class="small cando">${esc(PT[q.u].can)}</div><div class="card soft small">${q.built ? '' : 'Dit plein wordt later gebouwd. '}Wat hieronder staat, oefen je nu al in je herhalingen.</div>` : ''}
    ${x ? `<div class="small">${x.town && PT[x.town] ? 'Toegevoegd aan ' + esc(PT[x.town].name) : 'Toegevoegd'} · ${esc(x.date)}</div><p class="why" style="margin:0">${esc(x.rule)}</p>${x.examples.map(e => `<div class="row">${speakBtn(e.nl)}<div><div class="nl">${esc(e.nl)}</div><div class="small">${esc(e.en)}</div></div></div>`).join('')}` : ''}
    ${m.fixes.map(f => `<div class="corr" style="cursor:default"><span><span class="wrong">${esc(f.wrong)}</span><br><span class="right nl">${esc(f.right)}</span><br><span class="small">${esc(f.why)}</span></span></div>`).join('')}
    ${m.words.length ? `<div class="small">Jouw woorden: ${m.words.map(w => `<b class="nl">${esc(w.w)}</b>`).join(', ')}</div>` : ''}
    ${m.fixes.length || m.words.length || (x && x.examples.length) ? `<button class="btn block" data-act="mine-practise" data-id="${id === 'general' ? '' : id}">Oefen dit nu</button>` : ''}
    ${x ? `<button class="link" data-act="extra-del" data-id="${x.id}" style="color:var(--warn)">Verwijder dit toegevoegde plein</button>` : ''}
  </div>`);
}
function extrasBlock() {
  return `<button class="tapline" data-act="plan-open"><div class="t"><div style="font-weight:600">Het hele plan</div><div class="small">Boog 1 tot 3, met jouw fouten en woorden op hun plek</div></div><span class="chev">›</span></button>`;
}

/* ---------- harder rounds in the Oefen house ---------- */
const ROUNDS = {2: {name: 'Ronde 2 · moeilijker', desc: 'Alle woorden zelf typen, de/het en vervoegen, alle zinnen bouwen'}, 3: {name: 'Ronde 3 · uit het hoofd', desc: 'Zinnen uit het Engels, zonder blokjes'}};
function roundKeys(q, r) {
  const sq = SQ[q]; const lex = sq.words.map(LX); const ks = [];
  if (r === 2) { lex.forEach(l => { ks.push('w:' + l.id + ':prod'); if (l.g) ks.push('w:' + l.id + ':gen'); if (l.v) ks.push('w:' + l.id + ':conj'); }); sq.sents.forEach(id => ks.push('s:' + id + ':ord')); return shuffle(ks).slice(0, 18); }
  sq.sents.forEach(id => ks.push('s:' + id + ':tr')); lex.forEach(l => ks.push('w:' + l.id + ':prod'));
  return shuffle(ks.slice(0, sq.sents.length)).concat(shuffle(ks.slice(sq.sents.length)).slice(0, 4)).slice(0, 14);
}
function roundsBlock(q) {
  if (!stepDone(q, 'oefen')) return '';
  const got = (S.sq[q].rounds || {}).oefen || 1;
  return `<div class="card stack" style="gap:4px"><div class="eyebrow">Oefen opnieuw, moeilijker</div>${[2, 3].map(r => { const open = r <= got + 1 || testMode(); const done = got >= r;
    return `<button class="tapline" data-act="round" data-q="${q}" data-r="${r}" ${open ? '' : 'aria-disabled="true"'}><div class="t"><div style="font-weight:600;${open ? '' : 'color:var(--faint)'}">${ROUNDS[r].name}${done ? ' <span class="small">· gehaald</span>' : ''}</div><div class="small">${ROUNDS[r].desc}${open ? '' : ' · na ronde ' + (r - 1)}</div></div><span class="chev" ${open ? '' : 'style="color:var(--faint)"'}>›</span></button>`; }).join('')}</div>`;
}
function startRound(q, r) {
  const got = (S.sq[q] && S.sq[q].rounds || {}).oefen || 1;
  if (r > got + 1 && !testMode()) { toast('Haal eerst ronde ' + (r - 1) + '.'); return; }
  startSession({keys: roundKeys(q, r), sq: q, step: 'oefen', round: r, intros: false});
}
