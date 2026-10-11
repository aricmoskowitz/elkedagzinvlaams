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
const PLAN_SCHEMA = `"corrections": [{"wrong": "the learner's exact sentence or phrase", "right": "the corrected sentence", "why": "one short English sentence naming the rule", "type": "word order | article | verb form | adjective | spelling | word choice | other", "plan": "the square id whose grammar point this error is about, or null", "newTopic": null}],
"words": [{"w": "lemma", "p": "n|v|adj|adv", "g": "de|het|null", "pl": "", "dim": "", "d": "simple Dutch definition, max 12 easy words", "s": "short example sentence", "en": "English", "plan": "the square id where this word fits best by theme or grammar"}],
"grammar": [{"topic": "short Dutch name (English)", "plan": "square id or null", "mastered": false, "newTopic": null}]`;
const PLAN_RULES = `Placement rules:
- Every correction gets a "plan": the square whose grammar point the mistake is about (e.g. a verb that should go to the end after "dat" belongs to the square about dat/of clauses). For a pure spelling or vocabulary slip, use the square where that word is taught, or null.
- If the grammar point is NOT covered by any square, set "plan": null and fill "newTopic": {"title": "short Dutch name (English)", "town": "the town id where it belongs best, e.g. u4", "rule": "one-sentence English rule", "examples": [{"nl": "", "en": ""}, {"nl": "", "en": ""}]}.
- "words": every Dutch content word the learner used or clearly learned that is NOT in the plan's word list below (no names, no function words), at most 10. Each gets the square where it fits best.
- "grammar": up to 3 constructions the learner used CORRECTLY, placed the same way; mastered = true only if used correctly several times.`;
function planWordList() { return LEX.map(l => l.w).join(', '); }

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
  const setName = 'Uit de les – week ' + weekNo();
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
    ${o.corrected ? `<details class="card"><summary class="small" style="cursor:pointer">Je tekst, verbeterd</summary><div class="nl" style="font-size:17px;line-height:1.5;margin-top:8px">${esc(o.corrected)}</div></details>` : ''}
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

/* ---------- log, talk review and writing use the plan ---------- */
async function processLog(id) {
  const x = S.log.find(e => e.id === id); if (!x) return;
  closeSheet();
  const ov = openOverlay('proc', `<button class="iconbtn" data-act="overlay-close" data-id="proc" aria-label="Sluiten">✕</button><span class="small">Verwerken</span>`, `<div class="stack"><h1>Claude leest mee</h1>${thinking('Claude verbetert je tekst en zoekt voor elke fout en elk woord de plek in je plan… dit kan tot een minuut duren.')}</div>`);
  const prompt = `You process a learner's log entry for a Dutch learning app. ${LEVEL}
The learner wrote this ${x.mode === 'quick' ? 'quick note' : 'reflection'} about something learned outside the app (source: ${x.source}). It may mix Dutch and English.

ENTRY:
"""${x.text}"""

THE LEARNING PLAN (square id = arc · town · square topic):
${planText()}

WORDS ALREADY IN THE PLAN: ${planWordList()}

Tasks: correct the Dutch (full corrected text; keep English in brackets), list the real errors, place everything in the plan, and add one short encouraging sentence in simple Dutch.
${PLAN_RULES}

Reply with only JSON: {"corrected": "...", ${PLAN_SCHEMA}, "note": "..."}`;
  try {
    const r = await AI.json(prompt, 'default');
    closeOverlay('proc');
    openProc({title: 'Je logboek in je plan', head: 'Verwerken', src: 'log', text: x.text, corrected: r.corrected, corrections: arr(r.corrections), words: arr(r.words), grammar: arr(r.grammar), note: r.note,
      onSave: () => { x.status = 'done'; x.result = {corrected: String(r.corrected || '').slice(0, 4000)}; }});
  } catch (e) { $('.obody .inner', ov).innerHTML = `<div class="stack"><h1>Dat lukte niet</h1><div class="card soft">${AI.fail(e)}</div><button class="btn line" data-act="log-proc" data-id="${x.id}">Probeer opnieuw</button></div>`; }
}
const arr = a => Array.isArray(a) ? a : [];
async function endTalk() {
  if (!TALK || TALK.busy) return; const T = TALK; T.busy = true;
  $('#talk-status').innerHTML = thinking('Claude bespreekt je gesprek en zoekt de plek van elke fout in je plan… dit kan even duren.');
  const mineTxt = T.msgs.filter(m => m.who === 'me').map(m => m.text);
  const transcript = T.msgs.map(m => (m.who === 'me' ? 'Learner: ' : 'Partner: ') + m.text).join('\n');
  const prompt = `Review a Dutch conversation practice. ${LEVEL}
Scene: ${T.sc.roleEn}. Goal: ${T.sc.goalEn}
Transcript:
${transcript}

THE LEARNING PLAN (square id = arc · town · square topic):
${planText()}

WORDS ALREADY IN THE PLAN: ${planWordList()}

List only real errors in the LEARNER's lines ("wrong" = the learner's exact message), at most 8, and place everything in the plan.
${PLAN_RULES}

Reply with only JSON: {${PLAN_SCHEMA}, "good": "one sentence in simple Dutch about what went well", "tip": "one concrete tip in English", "goalReached": true}`;
  try {
    const r = await AI.json(prompt, 'default');
    S.talks.unshift({id: T.id, date: dateKey(), sc: T.sc.id, q: T.q, msgs: T.msgs.slice(0, 40).map(m => ({who: m.who, text: m.text})), good: r.good || '', tip: r.tip || ''});
    if (S.talks.length > 60) S.talks.length = 60;
    if (T.q && mineTxt.length >= 3) sqstate(T.q).steps.gebruik = 1;
    Store.mark('log', 'state'); closeOverlay('talk'); TALK = null;
    openProc({title: r.goalReached ? 'Doel bereikt! Zo past het in je plan' : 'Je gesprek in je plan', head: 'Bespreking', src: 'talk', text: mineTxt.join(' '), corrections: arr(r.corrections), words: arr(r.words), grammar: arr(r.grammar), note: r.good, tip: r.tip});
  } catch (e) { $('#talk-status').innerHTML = `<div class="card soft small">${AI.fail(e)}</div>`; T.busy = false; }
}
function openWrite(q) {
  const sq = SQ[q]; const w = WRITING[sq.u]; closeSheet();
  const ov = openOverlay('write', `<button class="iconbtn" data-act="overlay-close" data-id="write" aria-label="Sluiten">✕</button><span class="small">Schrijf · ${esc(sq.name)}</span>`, `<div class="stack">
    <h1>Schrijf</h1><div class="nl" style="font-size:18px">${esc(w.prompt)}</div><button class="en-hidden" data-act="reveal-en" data-en-text="${esc(w.en)}" style="align-self:flex-start">Toon Engels</button>
    <textarea id="write-t" rows="7" lang="nl" placeholder="Schrijf hier je zinnen…"></textarea>
    <div id="write-err" class="small" style="color:var(--warn)" hidden>Schrijf eerst minstens één zin.</div>
    <div id="write-status"></div>
    <button class="btn block" id="write-go">Laat nakijken</button></div>`);
  $('#write-go', ov).onclick = async () => {
    const text = $('#write-t', ov).value.trim(); if (!text) { $('#write-err', ov).hidden = false; return; }
    $('#write-go', ov).disabled = true; $('#write-status', ov).innerHTML = thinking('Claude kijkt je tekst na… dit kan tot een minuut duren.');
    const prompt = `Correct a short Dutch writing task. ${LEVEL}
Task: ${w.en}  Grammar focus: ${sq.title} (${sq.en}), square ${q}.
Text:
"""${text}"""

THE LEARNING PLAN (square id = arc · town · square topic):
${planText()}

WORDS ALREADY IN THE PLAN: ${planWordList()}
${PLAN_RULES}

Reply with only JSON: {"corrected": "the full corrected text", ${PLAN_SCHEMA}, "good": "one sentence in simple Dutch about what went well", "tip": "one concrete tip in English about the grammar focus"}`;
    try {
      const r = await AI.json(prompt, 'default');
      S.log.unshift({id: uid('l'), date: dateKey(), mode: 'write', source: 'app', text: text.slice(0, 4000), status: 'done', result: {corrected: String(r.corrected || '').slice(0, 4000)}});
      sqstate(q).steps.gebruik = 1; Store.mark('log', 'state');
      closeOverlay('write');
      openProc({title: 'Nagekeken: zo past het in je plan', head: 'Schrijven', src: 'write', text, corrected: r.corrected, corrections: arr(r.corrections), words: arr(r.words), grammar: arr(r.grammar), note: r.good, tip: r.tip});
    } catch (e) { $('#write-status', ov).innerHTML = `<div class="card soft small">${AI.fail(e)}</div>`; $('#write-go', ov).disabled = false; }
  };
}
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
