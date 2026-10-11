/* ===== BATCH 2: Claude features (tutor, log, writing, helpers) ===== */
const AI = {
  fn: null, ok: null,
  async get() {
    if (this.ok === false) return null;
    if (this.fn) return this.fn;
    if (!window.claude || !window.claude.use) { this.ok = false; return null; }
    try { const s = await window.claude.use('sample'); if (!s) { this.ok = false; return null; } this.fn = s; this.ok = true; return s; } catch (e) { this.ok = false; return null; }
  },
  msg(code) {
    return {unavailable: 'Claude-functies werken alleen als je de app opent in de Claude-app of op claude.ai.', not_granted: 'De app mag Claude nu niet gebruiken. Je kunt het de volgende keer toestaan.', sampling_disabled: 'Claude is niet beschikbaar voor dit account.', rate_limited: 'Even te veel vragen, of je gebruikslimiet is bereikt. Probeer het later opnieuw.', session_expired: 'Log opnieuw in bij Claude.', refused: 'Claude kon hier niet op antwoorden. Formuleer het anders.', invalid_json: 'Het antwoord kwam niet goed door. Probeer het opnieuw.', cancelled: 'Gestopt.'}[code] || 'De verbinding met Claude liep mis. Probeer het opnieuw.';
  },
  fail(e) { const code = e && e.code; if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed', 'unavailable'].includes(code)) this.ok = false; return this.msg(code); },
  async json(input, tier = 'default', signal) { const s = await this.get(); if (!s) throw {code: 'unavailable'}; return s.json(input, {modelTier: tier, cache: false, signal}); }
};
const LEVEL = 'The learner is an adult English speaker living in Antwerp, around CEFR A2 (Flemish adult-education level 2.1), learning standard Belgian Dutch. Use Belgian Dutch norms (frieten, gsm, u to strangers; "ge/gij" only when quoting speech).';
function knownWords(max = 220) { return Object.keys(S.seen || {}).map(LX).filter(Boolean).map(l => l.w).slice(0, max).join(', ') || '(few yet)'; }
function curriculumText() {
  const a = SQUARES.map(q => `${q.id}: ${UNIT[q.u].name} · ${q.title} (${q.en})`);
  const b = UNITS.filter(u => !u.built).map(u => `${u.id}: ${u.name} · ${u.gramEn} (planned)`);
  return a.concat(b, ['arc2: simple past with strong verbs, relative clauses die/dat, the uses of er, om te + infinitive, reflexive verbs, passive with worden, zou conditional (later)', 'arc3: modal particles, spoken Flemish ge/gij, reading news, opinion writing (later)']).join('\n');
}
const CORR_SCHEMA = '"corrections": [{"wrong": "the learner\'s exact sentence or phrase", "right": "the corrected full sentence", "why": "one short English sentence naming the rule", "type": "word order | article | verb form | spelling | word choice | other"}]';
function weekNo(d = new Date()) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7); }
const uid = p => p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
function aiOffCard() { return `<div class="card soft">${AI.msg('unavailable')}</div>`; }
const thinking = t => `<div class="small" role="status" style="display:flex;gap:8px;align-items:center"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>${t || 'Claude denkt na…'}</div>`;

/* ---------- corrections into the review queue ---------- */
function addFix(c, src) {
  if (!c || !c.wrong || !c.right || norm(c.wrong) === norm(c.right)) return;
  const id = uid('f'); S.fix[id] = {wrong: String(c.wrong).slice(0, 240), right: String(c.right).slice(0, 240), why: String(c.why || '').slice(0, 300), type: c.type || '', src, date: dateKey()};
  introduce('c:' + id + ':fix');
}
function corrList(cs, name) {
  if (!cs || !cs.length) return `<div class="small">Geen fouten gevonden. Knap!</div>`;
  return cs.map((c, i) => `<label class="corr"><input type="checkbox" name="${name}" value="${i}" checked><span><span class="wrong">${esc(c.wrong)}</span><br><span class="right nl">${esc(c.right)}</span><br><span class="small">${esc(c.why || '')}</span></span></label>`).join('');
}

/* ---------- the processing card (log, writing, tutor review) ---------- */
function openProc(o) {
  const g = (o.grammar || []).map((gm, i) => ({...gm, i, outcome: grammarOutcome(gm)}));
  const words = (o.words || []).filter(w => w && w.w && !LEX.some(l => norm(l.w) === norm(w.w)) && !Object.values(S.custom).some(l => norm(l.w) === norm(w.w)));
  const setName = 'Uit de les – week ' + weekNo();
  const body = `<div class="stack">
    <h1>${esc(o.title || 'Verwerkt')}</h1>
    ${o.note ? `<div class="card soft nl" style="font-size:17px">${esc(o.note)}</div>` : ''}
    ${o.corrected ? `<div><div class="eyebrow">Je tekst, verbeterd</div><div class="nl" style="font-size:17px;line-height:1.5;margin-top:4px">${esc(o.corrected)}</div></div>` : ''}
    <div class="stack" style="gap:6px"><div class="eyebrow">Correcties · aangevinkt = naar je herhalingen</div>${corrList(o.corrections, 'pc')}</div>
    ${words.length ? `<div class="stack" style="gap:6px"><div class="eyebrow">Nieuwe woorden · vink aan wat je wilt bewaren (set: ${esc(setName)})</div>${words.map((w, i) => `<label class="corr"><input type="checkbox" name="pw" value="${i}"><span><b class="nl" style="font-size:18px">${w.g && w.p === 'n' ? `<span class="${w.g}">${w.g}</span> ` : ''}${esc(w.w)}</b><br><span class="small">${esc(w.d || '')}</span>${w.s ? `<br><i class="nl">${esc(w.s)}</i>` : ''}</span></label>`).join('')}</div>` : ''}
    ${g.length ? `<div class="stack" style="gap:6px"><div class="eyebrow">Grammatica uit je tekst</div>${g.map(x => `<div class="corr"><span>${x.outcome.box ? `<input type="checkbox" name="pg" value="${x.i}" checked style="margin-right:8px">` : ''}</span><span><b>${esc(x.topic)}</b><br><span class="small">${x.outcome.text}</span>${x.outcome.test ? `<br><button class="link" data-act="testout" data-qs="${x.outcome.test}">Test je in ›</button>` : ''}</span></div>`).join('')}</div>` : ''}
    ${o.tip ? `<div class="small"><b>Tip:</b> ${esc(o.tip)}</div>` : ''}
    <button class="btn block" id="proc-save">Bewaar wat aangevinkt is</button>
  </div>`;
  const ov = openOverlay('proc', `<button class="iconbtn" data-act="overlay-close" data-id="proc" aria-label="Sluiten">✕</button><span class="small">${esc(o.head || 'Verwerken')}</span>`, body);
  $('#proc-save', ov).onclick = () => {
    const pick = n => $$(`input[name="${n}"]:checked`, ov).map(x => +x.value);
    pick('pc').forEach(i => addFix(o.corrections[i], o.src));
    const pw = pick('pw');
    if (pw.length) {
      let set = S.sets.find(s => s.name === setName); if (!set) { set = {id: uid('s-'), name: setName, ids: []}; S.sets.push(set); }
      pw.forEach(i => { const w = words[i]; const id = uid('u-'); S.custom[id] = {id, custom: true, u: 0, w: String(w.w), p: ['n', 'v', 'adj', 'adv'].includes(w.p) ? w.p : 'adv', g: w.p === 'n' && (w.g === 'de' || w.g === 'het') ? w.g : undefined, pl: w.pl || null, dim: w.dim || null, d: w.d || '', s: w.s || '', en: w.en || ''}; set.ids.push(id); S.seen[id] = 1; introduce('w:' + id + ':rec'); });
    }
    pick('pg').forEach(i => applyGrammar(g[i]));
    g.filter(x => !x.outcome.box && x.outcome.sic).forEach(x => { S.sic[x.outcome.sic] = {topic: x.topic, date: dateKey()}; });
    if (o.onSave) o.onSave();
    Store.mark('items', 'words', 'log', 'state'); closeOverlay('proc'); render();
    toast('Bewaard');
  };
}
function grammarOutcome(gm) {
  const m = gm.match;
  if (m && SQ[m]) {
    const q = SQ[m]; const town = UNIT[q.u].name;
    if (sqComplete(m)) return {box: true, kind: 'pull', target: m, text: `Al gedaan in ${esc(town)} · ${esc(q.name)}. Aangevinkt: die oefeningen komen naar voren in je herhalingen.`};
    return {box: false, sic: m, test: gm.mastered && !sqOpen(m) ? m : '', text: `Komt in ${esc(town)} · ${esc(q.name)}. Het plein krijgt het label <i>gezien in de les</i> en staat bovenaan op Vandaag.${gm.mastered ? ' Je lijkt het al te kunnen: test je in als je wilt.' : ''}`};
  }
  if (m && UNIT[m]) return {box: false, sic: m, text: `Komt later, in ${esc(UNIT[m].name)} (${esc(UNIT[m].gram.toLowerCase())}).`};
  if (m && /^arc/.test(m)) return {box: false, text: 'Komt later, in boog ' + m.replace(/\D/g, '') + '.'};
  return {box: true, kind: 'extra', text: 'Staat niet in het pad. Aangevinkt: het wordt een <b>extra plein</b> in je eigen laag, met voorbeeldzinnen om te oefenen.'};
}
function applyGrammar(x) {
  const oc = x.outcome;
  if (oc.kind === 'pull') { squareKeys(oc.target).forEach(k => { if (S.items[k]) S.items[k].d = today(); }); }
  if (oc.kind === 'extra') {
    const ex = (x.examples || []).filter(e => e && e.nl && e.en).slice(0, 5);
    const id = uid('x'); S.extras.push({id, title: String(x.topic).slice(0, 80), rule: String(x.rule || '').slice(0, 400), examples: ex.map(e => ({nl: String(e.nl), en: String(e.en)})), date: dateKey()});
    ex.forEach((_, i) => introduce('e:' + id + '~' + i + ':tr'));
  }
}

/* ---------- LOG ---------- */
const SOURCES = [['les', 'les'], ['podcast', 'podcast'], ['straat', 'straat'], ['tutor', 'tutor'], ['ander', 'ander']];
function openLogForm(mode = 'quick') {
  const s = openSheet(`<form id="logform" class="stack" autocomplete="off">
    <h2>Nieuw in je logboek</h2>
    <div class="row wrap" role="radiogroup" aria-label="Soort">${[['quick', 'Snel'], ['reflect', 'Reflectie']].map(m => `<label class="chip${m[0] === mode ? ' on' : ''}"><input type="radio" name="lmode" value="${m[0]}" ${m[0] === mode ? 'checked' : ''} hidden>${m[1]}</label>`).join('')}</div>
    <div class="row wrap" role="radiogroup" aria-label="Bron">${SOURCES.map((x, i) => `<label class="chip${i === 0 ? ' on' : ''}"><input type="radio" name="lsrc" value="${x[0]}" ${i === 0 ? 'checked' : ''} hidden>${x[1]}</label>`).join('')}</div>
    <textarea id="log-t" rows="${mode === 'quick' ? 3 : 8}" lang="nl" placeholder="${mode === 'quick' ? 'Bv. Op de tram hoorde ik “ambetant”: vervelend.' : 'Wat heb je geleerd? ± 150 woorden in het Nederlands. Engels tussen haakjes mag.'}"></textarea>
    <div class="small">Tip: tik op de microfoon van je toetsenbord om te spreken in plaats van te typen.</div>
    <div id="log-err" class="small" style="color:var(--warn)" hidden>Schrijf eerst iets.</div>
    <div class="grid2"><button class="btn line" type="submit" data-proc="0">Bewaar</button><button class="btn" type="submit" data-proc="1">Bewaar en verwerk</button></div>
  </form>`);
  $$('label.chip', s).forEach(l => l.addEventListener('click', () => { const name = $('input', l).name; $$(`input[name="${name}"]`, s).forEach(i => i.closest('label').classList.remove('on')); l.classList.add('on'); $('input', l).checked = true; if (name === 'lmode') $('#log-t', s).rows = $('input', l).value === 'quick' ? 3 : 8; }));
  $('#logform', s).addEventListener('submit', e => {
    e.preventDefault(); const text = $('#log-t', s).value.trim(); if (!text) { $('#log-err', s).hidden = false; return; }
    const entry = {id: uid('l'), date: dateKey(), mode: $('input[name="lmode"]:checked', s).value, source: $('input[name="lsrc"]:checked', s).value, text: text.slice(0, 4000), status: 'new'};
    S.log.unshift(entry); Store.mark('log'); closeSheet(); render();
    if (e.submitter && e.submitter.dataset.proc === '1') processLog(entry.id); else toast('In je logboek gezet');
  });
}
function openLogbook() {
  const rows = S.log.filter(x => x.mode !== 'write').map(x => `<button class="tapline" data-act="log-open" data-id="${x.id}"><div class="t"><div class="small">${esc(x.date)} · ${esc(x.source)} · ${x.mode === 'quick' ? 'snel' : 'reflectie'}${x.status === 'done' ? ' · verwerkt' : ''}</div><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.text)}</div></div><span class="chev">›</span></button>`).join('');
  openOverlay('logbook', `<button class="iconbtn" data-act="overlay-close" data-id="logbook" aria-label="Sluiten">✕</button><span class="small">Logboek</span>`, `<div class="stack">
    <h1>Logboek</h1>
    ${coachTip('log', 'Hier noteer je wat je buiten de app leert: in de les, uit een podcast of op straat. Claude verbetert je tekst, stelt nieuwe woorden voor en koppelt de grammatica aan je pad. Niets wordt bewaard zonder jouw vinkje.')}
    <div class="grid2"><button class="btn line" data-act="log-new" data-mode="quick">Snel noteren</button><button class="btn line" data-act="log-new" data-mode="reflect">Reflectie</button></div>
    <div>${rows || '<div class="small">Nog niets genoteerd.</div>'}</div></div>`);
}
function openLogEntry(id) {
  const x = S.log.find(e => e.id === id); if (!x) return;
  const r = x.result;
  openSheet(`<div class="stack"><div class="small">${esc(x.date)} · ${esc(x.source)}</div><div class="nl" style="font-size:17px;line-height:1.5;white-space:pre-wrap">${esc(x.text)}</div>
    ${r && r.corrected ? `<div><div class="eyebrow">Verbeterd</div><div class="nl" style="font-size:17px;line-height:1.5">${esc(r.corrected)}</div></div>` : ''}
    ${x.status === 'done' ? '<div class="small">Verwerkt.</div>' : `<button class="btn block" data-act="log-proc" data-id="${x.id}">Verwerk met Claude</button>`}
    <button class="link" data-act="log-del" data-id="${x.id}" style="color:var(--warn)">Verwijder</button></div>`);
}
async function processLog(id) {
  const x = S.log.find(e => e.id === id); if (!x) return;
  closeSheet();
  const ov = openOverlay('proc', `<button class="iconbtn" data-act="overlay-close" data-id="proc" aria-label="Sluiten">✕</button><span class="small">Verwerken</span>`, `<div class="stack"><h1>Claude leest mee</h1>${thinking('Claude leest je tekst en zoekt fouten, woorden en grammatica… dit kan tot een minuut duren.')}</div>`);
  const prompt = `You process a learner's log entry for a Dutch learning app. ${LEVEL}
The learner wrote this ${x.mode === 'quick' ? 'quick note' : 'reflection'} about something learned outside the app (source: ${x.source}). It may mix Dutch and English.

ENTRY:
"""${x.text}"""

Words the learner already knows: ${knownWords()}

The app's curriculum (id: town · topic):
${curriculumText()}

Tasks:
1. Correct the Dutch parts. Give the full corrected text (keep English in brackets as is) and list only real errors.
2. Propose up to 8 NEW Dutch words or chunks the entry shows the learner is learning (not in the known list). For each: lemma, part of speech (n, v, adj, adv), de/het for nouns, plural, diminutive, a simple Dutch definition of at most 12 words using easy words, a short example sentence, and the English gloss.
3. Name up to 3 grammar topics the entry is about or practises. Match each to the most specific curriculum id (a square id like u1q2, a town id like u5, or arc2 / arc3), or null if it is not in the curriculum. Set mastered to true only if the entry uses that grammar correctly several times. For a null match, add a one-sentence English rule and 3 short example sentences with English.
4. One short encouraging sentence in simple Dutch.

Reply with only JSON:
{"corrected": "...", ${CORR_SCHEMA}, "words": [{"w": "", "p": "n", "g": "de", "pl": "", "dim": "", "d": "", "s": "", "en": ""}], "grammar": [{"topic": "short Dutch name (English)", "match": "u1q2 or null", "mastered": false, "rule": "", "examples": [{"nl": "", "en": ""}]}], "note": "..."}`;
  try {
    const r = await AI.json(prompt, 'default');
    closeOverlay('proc');
    openProc({title: 'Je logboek, verwerkt', head: 'Verwerken', src: 'log', corrected: r.corrected, corrections: Array.isArray(r.corrections) ? r.corrections : [], words: Array.isArray(r.words) ? r.words : [], grammar: Array.isArray(r.grammar) ? r.grammar : [], note: r.note,
      onSave: () => { x.status = 'done'; x.result = {corrected: String(r.corrected || '').slice(0, 4000)}; }});
  } catch (e) { $('.obody .inner', ov).innerHTML = `<div class="stack"><h1>Dat lukte niet</h1><div class="card soft">${AI.fail(e)}</div><button class="btn line" data-act="log-proc" data-id="${x.id}">Probeer opnieuw</button></div>`; }
}

/* ---------- TUTOR (Praten) ---------- */
let TALK = null;
function talkRules(sc, q) {
  const focusQ = q ? SQ[q] : null;
  const words = focusQ ? focusQ.words.map(id => LX(id).w) : sc.u ? squaresOf(sc.u).flatMap(x => x.words).map(id => LX(id).w) : [];
  const focus = focusQ ? `${focusQ.title} (${focusQ.en})` : sc.u ? `${UNIT[sc.u].gram} (${UNIT[sc.u].gramEn})` : 'everyday A2 Dutch';
  return `You are a Dutch conversation partner inside a language-learning app. ${LEVEL}
Your role: ${sc.role}. The scene is in Antwerp. The learner's goal: ${sc.goalEn}
Rules:
- You play ${sc.roleEn}. The learner is the one who wants something (${sc.goalEn}). Never swap roles: you never ask the learner for directions, help, advice or service; you give it.
- Answer in simple standard Belgian Dutch, 1 or 2 short sentences, and stay in your role.
- Use mostly words the learner knows: ${knownWords(160)}. Practise especially: ${focus}${words.length ? '; useful words: ' + words.join(', ') : ''}.
- Keep the talk going with one simple question, unless the goal is reached; then close warmly.
- If the learner writes English, answer in Dutch and show them how to say it.
- Check ONLY the learner's last message. If it contains a real error (grammar, word order, article, verb form, wrong word), give the corrected sentence and a one-sentence English explanation. Ignore capitals and punctuation. If it is fine, fix is null.
Reply with only JSON: {"reply": "your Dutch reply", "fix": null or {"right": "the learner's sentence corrected", "why": "short English explanation"}}`;
}
function startTalk(scId, q) {
  const sc = SCENARIOS.find(s => s.id === scId); if (!sc) return;
  closeSheet();
  TALK = {sc, q: q || null, id: uid('t'), msgs: [{who: 'tutor', text: sc.open}], turns: [{role: 'user', content: talkRules(sc, q) + `\n\n(The conversation has started. Your first line was: "${sc.open}")`}, {role: 'assistant', content: JSON.stringify({reply: sc.open, fix: null})}], busy: false};
  openOverlay('talk', `<button class="iconbtn" data-act="talk-close" aria-label="Sluiten">✕</button><span class="small" style="flex:1">${esc(sc.title)}</span><button class="chip" data-act="talk-audio" data-en="Read replies aloud">${S.settings.talkAudio ? 'Stem aan' : 'Stem uit'}</button>`,
    `<div class="stack">${coachTip('talk', 'Typ je antwoord, of tik op de microfoon van je toetsenbord en spreek. De tutor antwoordt met de Belgische stem. Onder je zin zie je meteen een verbetering. Tik op “Klaar” voor een bespreking: je fouten gaan naar je herhalingen.')}
      <div class="card soft"><div class="eyebrow">Doel</div><div class="nl" style="font-size:17px">${esc(sc.goal)}</div><div class="small" style="margin-top:2px">Je praat met ${esc(sc.role)}.</div></div>
      <div id="talk-msgs" class="stack" style="gap:10px"></div>
      <div id="talk-status"></div>
      <form id="talk-form" class="talkbar" autocomplete="off"><textarea id="talk-in" rows="2" lang="nl" placeholder="Typ of spreek…" aria-label="Jouw bericht"></textarea><button class="btn" type="submit">Stuur</button></form>
      <button class="btn line block" data-act="talk-end" id="talk-end" hidden>Klaar · bespreek mijn gesprek</button></div>`);
  renderTalk();
  if (S.settings.talkAudio) Audio.say(sc.open);
  $('#talk-form').addEventListener('submit', e => { e.preventDefault(); sendTalk(); });
  $('#talk-in').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTalk(); } });
}
function renderTalk() {
  const box = $('#talk-msgs'); if (!box || !TALK) return;
  box.innerHTML = TALK.msgs.map(m => m.who === 'tutor'
    ? `<div class="bubble tutor"><div class="nl">${esc(m.text)}</div>${speakBtn(m.text)}</div>`
    : `<div class="bubble me"><div class="nl">${esc(m.text)}</div>${m.fix ? `<div class="fixnote"><span class="nl">${esc(m.fix.right)}</span><br><span class="small">${esc(m.fix.why || '')}</span></div>` : ''}</div>`).join('');
  const mine = TALK.msgs.filter(m => m.who === 'me').length; $('#talk-end').hidden = mine < 2;
  const last = box.lastElementChild; if (last) last.scrollIntoView({block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth'});
}
async function sendTalk() {
  const inp = $('#talk-in'); const text = inp.value.trim(); if (!text || !TALK || TALK.busy) return;
  inp.value = ''; TALK.busy = true;
  TALK.msgs.push({who: 'me', text}); TALK.turns.push({role: 'user', content: text});
  renderTalk(); $('#talk-status').innerHTML = thinking('');
  if (TALK.turns.length > 28) TALK.turns.splice(2, 2);
  try {
    const r = await AI.json(TALK.turns, 'quick');
    const reply = String(r && r.reply || '').trim() || '…';
    const me = TALK.msgs[TALK.msgs.length - 1]; if (r && r.fix && r.fix.right && norm(r.fix.right) !== norm(text)) me.fix = {right: String(r.fix.right), why: String(r.fix.why || '')};
    TALK.msgs.push({who: 'tutor', text: reply}); TALK.turns.push({role: 'assistant', content: JSON.stringify({reply, fix: r.fix || null})});
    $('#talk-status').innerHTML = ''; renderTalk();
    if (S.settings.talkAudio) Audio.say(reply);
  } catch (e) { TALK.turns.pop(); TALK.msgs.pop(); inp.value = text; $('#talk-status').innerHTML = `<div class="card soft small">${AI.fail(e)}</div>`; renderTalk(); }
  finally { if (TALK) TALK.busy = false; }
}
async function endTalk() {
  if (!TALK || TALK.busy) return; const T = TALK; T.busy = true;
  $('#talk-status').innerHTML = thinking('Claude bespreekt je gesprek… dit kan even duren.');
  const mine = T.msgs.filter(m => m.who === 'me').map((m, i) => `${i + 1}. ${m.text}`).join('\n');
  const transcript = T.msgs.map(m => (m.who === 'me' ? 'Learner: ' : 'Partner: ') + m.text).join('\n');
  const prompt = `Review a Dutch conversation practice. ${LEVEL}
Scene: ${T.sc.roleEn}. Goal: ${T.sc.goalEn}
Transcript:
${transcript}

Learner messages (numbered):
${mine}

Reply with only JSON: {${CORR_SCHEMA} (only real errors, at most 6, "wrong" = the learner's exact message), "good": "one sentence in simple Dutch about what went well", "tip": "one concrete tip in English", "goalReached": true}`;
  try {
    const r = await AI.json(prompt, 'default');
    const cs = Array.isArray(r.corrections) ? r.corrections : [];
    S.talks.unshift({id: T.id, date: dateKey(), sc: T.sc.id, q: T.q, msgs: T.msgs.slice(0, 40).map(m => ({who: m.who, text: m.text})), good: r.good || '', tip: r.tip || ''});
    if (S.talks.length > 60) S.talks.length = 60;
    const nMine = T.msgs.filter(m => m.who === 'me').length;
    if (T.q && nMine >= 3) { sqstate(T.q).steps.gebruik = 1; }
    Store.mark('log', 'state'); closeOverlay('talk'); TALK = null;
    openProc({title: r.goalReached ? 'Doel bereikt!' : 'Je gesprek, besproken', head: 'Bespreking', src: 'talk', corrections: cs, note: r.good, tip: r.tip});
  } catch (e) { $('#talk-status').innerHTML = `<div class="card soft small">${AI.fail(e)}</div>`; T.busy = false; }
}
function closeTalk() {
  if (TALK && TALK.msgs.filter(m => m.who === 'me').length >= 2 && !TALK.busy) { confirmBox('Stoppen zonder bespreking? Je fouten gaan dan niet naar je herhalingen.', 'Stop', () => { closeOverlay('talk'); TALK = null; render(); }); return; }
  closeOverlay('talk'); TALK = null; render();
}
function viewPraten() {
  const open = UNITS.filter(u => u.built && townOpen(u.id));
  const scs = SCENARIOS.filter(s => !s.u || open.some(u => u.id === s.u));
  const hist = S.talks.slice(0, 6);
  return `<div class="stack">
    <h1 data-en="Talk">Praten</h1>
    ${coachTip('praten', 'Oefen gesprekken met een tutor die jouw woorden en grammatica kent. Spreek met de microfoon van je toetsenbord; de tutor antwoordt met de Belgische stem.')}
    ${AI.ok === false ? aiOffCard() : ''}
    <div>${scs.map(s => `<button class="tapline" data-act="talk-start" data-id="${s.id}"><div class="t"><div class="nl" style="font-size:18px">${esc(s.title)}</div><div class="small">${esc(s.goal)}${s.u ? ' · ' + esc(UNIT[s.u].name) : ''}</div></div><span class="chev">›</span></button>`).join('')}</div>
    ${hist.length ? `<div class="stack" style="gap:4px"><div class="eyebrow">Eerdere gesprekken</div>${hist.map(t => { const sc = SCENARIOS.find(s => s.id === t.sc); return `<button class="tapline" data-act="talk-view" data-id="${t.id}"><div class="t"><div>${esc(sc ? sc.title : 'Gesprek')}</div><div class="small">${esc(t.date)} · ${t.msgs.filter(m => m.who === 'me').length} beurten</div></div><span class="chev">›</span></button>`; }).join('')}</div>` : ''}
  </div>`;
}
function viewTalkHistory(id) {
  const t = S.talks.find(x => x.id === id); if (!t) return;
  openSheet(`<div class="stack"><div class="small">${esc(t.date)}</div>${t.msgs.map(m => `<div class="bubble ${m.who === 'me' ? 'me' : 'tutor'}"><div class="nl">${esc(m.text)}</div></div>`).join('')}${t.good ? `<div class="card soft nl">${esc(t.good)}</div>` : ''}${t.tip ? `<div class="small"><b>Tip:</b> ${esc(t.tip)}</div>` : ''}</div>`);
}

/* ---------- GEBRUIK: talk or write ---------- */
function openUse(q) {
  const sq = SQ[q]; const sc = SCENARIOS.find(s => s.u === sq.u) || SCENARIOS.find(s => s.id === 'sc-free'); const w = WRITING[sq.u];
  openSheet(`<div class="stack"><h2>Gebruik · ${esc(sq.name)}</h2><div class="small">Kies één van de twee. Een gesprek van minstens drie beurten of een nagekeken tekst maakt dit gildehuis klaar.</div>
    ${AI.ok === false ? aiOffCard() : ''}
    <button class="tapline" data-act="talk-start" data-id="${sc.id}" data-q="${q}"><div class="t"><div style="font-weight:600">Praat · ${esc(sc.title)}</div><div class="small">${esc(sc.goal)}</div></div><span class="chev">›</span></button>
    ${w ? `<button class="tapline" data-act="write-start" data-q="${q}"><div class="t"><div style="font-weight:600">Schrijf · 3 à 5 zinnen</div><div class="small">${esc(w.prompt)}</div></div><span class="chev">›</span></button>` : ''}</div>`);
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
Task given to the learner: ${w.en}
Grammar focus: ${sq.title} (${sq.en}).
Text:
"""${text}"""
Reply with only JSON: {"corrected": "the full corrected text", ${CORR_SCHEMA} (only real errors), "good": "one sentence in simple Dutch about what went well", "tip": "one concrete tip in English about the grammar focus"}`;
    try {
      const r = await AI.json(prompt, 'default');
      S.log.unshift({id: uid('l'), date: dateKey(), mode: 'write', source: 'app', text: text.slice(0, 4000), status: 'done', result: {corrected: String(r.corrected || '').slice(0, 4000)}});
      sqstate(q).steps.gebruik = 1; Store.mark('log', 'state');
      closeOverlay('write');
      openProc({title: 'Nagekeken', head: 'Schrijven', src: 'write', corrected: r.corrected, corrections: Array.isArray(r.corrections) ? r.corrections : [], note: r.good, tip: r.tip});
    } catch (e) { $('#write-status', ov).innerHTML = `<div class="card soft small">${AI.fail(e)}</div>`; $('#write-go', ov).disabled = false; }
  };
}

/* ---------- Zeg het anders ---------- */
function openZeg(id) {
  const l = LX(id); if (!l) return; closeSheet();
  const ov = openOverlay('zeg', `<button class="iconbtn" data-act="overlay-close" data-id="zeg" aria-label="Sluiten">✕</button><span class="small">Zeg het anders</span>`, `<div class="stack">
    ${coachTip('zeg', 'Leg het woord uit in het Nederlands, zonder het woord zelf te gebruiken. Zo oefen je wat je doet als je een woord vergeet.')}
    <h1>Zeg het anders</h1><div class="wc-word">${wordHTML(l)}</div><div class="small">Leg dit woord uit in het Nederlands, zonder het woord (of een vorm ervan) te gebruiken.</div>
    <textarea id="zeg-t" rows="3" lang="nl" placeholder="Het is iets dat…"></textarea><div id="zeg-status"></div><button class="btn block" id="zeg-go">Controleer</button></div>`);
  $('#zeg-go', ov).onclick = async () => {
    const t = $('#zeg-t', ov).value.trim(); if (!t) { $('#zeg-status', ov).innerHTML = '<div class="small" style="color:var(--warn)">Schrijf eerst een uitleg.</div>'; return; }
    const forms = [l.w, l.pl, l.dim].concat(l.v ? allForms(l) : []).filter(Boolean).map(norm);
    const words = norm(t).split(' ');
    if (forms.some(f => f && words.includes(f))) { $('#zeg-status', ov).innerHTML = `<div class="fb no"><b>Je gebruikte het woord zelf.</b><div class="small">Probeer het te omschrijven: waar is het, wat doe je ermee, hoe ziet het eruit?</div></div>`; return; }
    $('#zeg-go', ov).disabled = true; $('#zeg-status', ov).innerHTML = thinking('');
    try {
      const r = await AI.json(`A Dutch learner (A2) must explain the word "${l.w}" (${l.en}) in Dutch without using it. Their explanation: "${t}". Would a Dutch speaker guess the word from it? Ignore small grammar mistakes. Reply with only JSON: {"ok": true, "feedback": "one short English sentence", "better": "a simple Dutch explanation of at most 15 words"}`, 'quick');
      grade('w:' + l.id + ':prod', !!r.ok);
      $('#zeg-status', ov).innerHTML = `<div class="fb ${r.ok ? 'ok' : 'no'}"><h3>${r.ok ? 'Duidelijk!' : 'Nog niet helemaal'}</h3><div class="small">${esc(r.feedback || '')}</div>${r.better ? `<div class="nl">${esc(r.better)}</div>` : ''}</div>`;
    } catch (e) { $('#zeg-status', ov).innerHTML = `<div class="card soft small">${AI.fail(e)}</div>`; }
    finally { $('#zeg-go', ov).disabled = false; }
  };
}

/* ---------- Draft a new word card ---------- */
async function draftWord(sheet) {
  const w = $('#nw-w', sheet).value.trim(); const st = $('#nw-draft-st', sheet);
  if (!w) { $('#nw-err', sheet).hidden = false; return; }
  st.innerHTML = thinking('');
  try {
    const r = await AI.json(`Make a learner's flashcard for the Dutch word "${w}" (Belgian Dutch). ${LEVEL} Reply with only JSON: {"p": "n|v|adj|adv", "g": "de|het|null", "pl": "plural or empty", "dim": "diminutive or empty", "d": "simple Dutch definition, at most 12 easy words", "s": "short natural example sentence", "en": "English gloss"}`, 'quick');
    $('#nw-p', sheet).value = ['n', 'v', 'adj', 'adv'].includes(r.p) ? r.p : 'adv'; $('#nw-noun', sheet).hidden = $('#nw-p', sheet).value !== 'n';
    if (r.g === 'de' || r.g === 'het') { const g = $(`input[name="nw-g"][value="${r.g}"]`, sheet); if (g) g.checked = true; }
    $('#nw-pl', sheet).value = r.pl || ''; $('#nw-dim', sheet).value = r.dim || ''; $('#nw-d', sheet).value = r.d || ''; $('#nw-s', sheet).value = r.s || ''; $('#nw-en', sheet).value = r.en || '';
    st.innerHTML = '<div class="small">Ingevuld door Claude. Kijk het na en pas aan waar nodig.</div>';
  } catch (e) { st.innerHTML = `<div class="small" style="color:var(--warn)">${AI.fail(e)}</div>`; }
}

/* ---------- Free translation: ask Claude ---------- */
async function askTranslation(btn) {
  if (!SES || !SES.ex) return; const ex = SES.ex; const val = SES.lastVal; btn.disabled = true;
  const box = $('#ask-tr-out'); box.innerHTML = thinking('');
  try {
    const r = await AI.json(`A Dutch learner translated "${ex.sent.en}" as "${val}". The reference answer is "${ex.sent.nl}". Is the learner's sentence correct, natural Dutch with the same meaning? Ignore capitals and punctuation. Reply with only JSON: {"acceptable": true, "why": "one short English sentence", "better": "the best Dutch version"}`, 'quick');
    if (r.acceptable) { if (SES.snap !== undefined) { if (SES.snap === null) delete S.items[ex.key]; else S.items[ex.key] = JSON.parse(SES.snap); } grade(ex.key, true); SES.correct++; box.innerHTML = `<div class="fb ok"><b>Dat kan ook!</b><div class="small">${esc(r.why || '')}</div></div>`; }
    else box.innerHTML = `<div class="fb no"><b>Toch niet helemaal</b><div class="small">${esc(r.why || '')}</div>${r.better ? `<div class="nl">${esc(r.better)}</div>` : ''}</div>`;
  } catch (e) { box.innerHTML = `<div class="small">${AI.fail(e)}</div>`; btn.disabled = false; }
}

/* ---------- Extra squares (from the log) ---------- */
function openExtra(id) {
  const x = S.extras.find(e => e.id === id); if (!x) return;
  openOverlay('extra', `<button class="iconbtn" data-act="overlay-close" data-id="extra" aria-label="Sluiten">✕</button><span class="small">Extra plein</span>`, `<div class="stack">
    <div class="eyebrow">Extra plein · uit je logboek (${esc(x.date)})</div><h1>${esc(x.title)}</h1><p class="why" style="margin:0">${esc(x.rule)}</p>
    ${x.examples.map(e => `<div class="card stack" style="gap:6px"><div class="row">${speakBtn(e.nl)}<div class="nl" style="font-size:18px">${esc(e.nl)}</div></div><div class="small">${esc(e.en)}</div></div>`).join('')}
    ${x.examples.length ? `<button class="btn block" data-act="extra-practise" data-id="${x.id}">Oefen deze zinnen</button>` : ''}
    <button class="link" data-act="extra-del" data-id="${x.id}" style="color:var(--warn)">Verwijder dit extra plein</button></div>`);
}
function extrasBlock() {
  if (!S.extras.length) return '';
  return `<div class="stack" style="gap:4px"><div class="eyebrow">Extra pleinen uit je logboek</div>${S.extras.map(x => `<button class="tapline" data-act="extra-open" data-id="${x.id}"><div class="t"><div class="nl" style="font-size:17px">${esc(x.title)}</div><div class="small">${x.examples.length} voorbeeldzinnen · ${esc(x.date)}</div></div><span class="chev">›</span></button>`).join('')}</div>`;
}
function sicBlock() {
  const rows = Object.entries(S.sic || {}).filter(([k]) => (SQ[k] && !sqComplete(k)) || (UNIT[k] && !unitComplete(k)));
  if (!rows.length) return '';
  return rows.map(([k, v]) => { const isSq = !!SQ[k]; const u = isSq ? SQ[k].u : k; const name = isSq ? `${UNIT[u].name} · ${SQ[k].name}` : UNIT[k].name;
    return `<button class="tapline" data-act="${isSq ? 'sic-sq' : 'sic-town'}" data-id="${k}" data-u="${u}"><div class="t"><div style="font-weight:600">Gezien in de les: ${esc(v.topic)}</div><div class="small">${esc(name)}${UNIT[u].built ? '' : ' · komt later'}</div></div><span class="chev">›</span></button>`; }).join('');
}
function thenAndNow() {
  const firstT = S.talks[S.talks.length - 1], lastT = S.talks[0];
  const logs = S.log.filter(x => x.mode !== 'quick');
  const firstL = logs[logs.length - 1], lastL = logs[0];
  const col = (title, a, b, f) => a && b && a !== b ? `<div class="stack" style="gap:6px"><div class="eyebrow">${title}</div><div class="grid2"><div class="card soft"><div class="small">${esc(a.date)}</div>${f(a)}</div><div class="card"><div class="small">${esc(b.date)}</div>${f(b)}</div></div></div>` : '';
  const talkF = t => t.msgs.filter(m => m.who === 'me').slice(0, 4).map(m => `<div class="nl" style="font-size:15px">${esc(m.text)}</div>`).join('');
  const logF = l => `<div class="nl" style="font-size:15px">${esc(l.text.slice(0, 280))}</div>`;
  const html = col('Je eerste en je laatste gesprek', firstT, lastT, talkF) + col('Je eerste en je laatste tekst', firstL, lastL, logF);
  openOverlay('then', `<button class="iconbtn" data-act="overlay-close" data-id="then" aria-label="Sluiten">✕</button><span class="small">Toen en nu</span>`, `<div class="stack"><h1>Toen en nu</h1>${html || '<div class="small">Na een paar gesprekken of logboekteksten zie je hier hoe je vooruitgaat.</div>'}</div>`);
}
