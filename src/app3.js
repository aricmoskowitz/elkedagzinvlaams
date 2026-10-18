/* ===== UI HELPERS ===== */
let TAB = 'pad';
let NASLAG = 'grammatica';
function toast(msg) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, 2400);
}
function openSheet(html, onClose) {
  closeSheet();
  const b = document.createElement('div'); b.className = 'backdrop'; b.id = 'sheetback';
  b.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-top"><div class="grab"></div><button class="iconbtn sheet-x" data-act="sheet-close" aria-label="Sluiten" data-en="Close">✕</button></div>${html}</div>`; // 2.12: every sheet has a close button that stays in view
  b.addEventListener('click', e => { if (e.target === b) closeSheet(); });
  b._onClose = onClose; document.body.appendChild(b);
  return b.querySelector('.sheet');
}
function closeSheet() { const b = $('#sheetback'); if (b) { const f = b._onClose; b.remove(); if (f) f(); } }
function openOverlay(id, head, body) {
  closeOverlay(id);
  const o = document.createElement('div'); o.className = 'overlay'; o.id = id;
  o.innerHTML = `<div class="ohead">${head}</div><div class="obody"><div class="inner">${body}</div></div>`;
  document.body.appendChild(o); return o;
}
function closeOverlay(id) { const o = document.getElementById(id); if (o) o.remove(); }
function confirmBox(msg, yesLabel, onYes) {
  const s = openSheet(`<div class="stack"><h3>${msg}</h3><div class="grid2"><button class="btn line" data-act="sheet-close">Annuleer</button><button class="btn" id="cf-yes">${yesLabel}</button></div></div>`);
  s.querySelector('#cf-yes').onclick = () => { closeSheet(); onYes(); };
}

/* ===== WORD CARD & VERB OVERVIEW ===== */
function conjTable(l) {
  const f = vForms(l); const sp = x => f.sep ? `${x} … ${f.sep}` : x;
  const alt = (p, x) => l.v.alt && l.v.alt[p] ? x + ' / ' + l.v.alt[p].join(' / ') : x;
  const rows = [['ik', sp(f.ik)], ['jij / je', sp(alt('jij', f.jij))], ['omgekeerd: … jij?', f.sep ? `${f.inv} jij … ${f.sep}?` : f.inv + ' jij?'], ['u', sp(alt('u', f.u))], ['hij / zij / het', sp(f.hij)], ['wij / jullie / zij', sp(f.pl)]];
  const typeLab = {w: 'zwak', s: 'sterk', o: 'onregelmatig'}[l.v.t];
  const typeEn = {w: 'weak', s: 'strong', o: 'irregular'}[l.v.t];
  return `<div class="row wrap"><span class="tag" data-en="${typeEn}">${typeLab}</span>${l.v.fam ? `<span class="tag" data-en="vowel pattern">${esc(l.v.fam)}</span>` : ''}${f.sep ? `<span class="tag" data-en="separable">scheidbaar</span>` : ''}<span class="tag" data-en="auxiliary">${f.aux === 'z' ? 'zijn' : f.aux === 'hz' ? 'hebben / zijn' : 'hebben'}</span></div>
  <table class="conj"><tbody>
  <tr><td colspan="2" class="eyebrow" style="padding-top:10px" data-en="present">Tegenwoordige tijd</td></tr>
  ${rows.map(r => `<tr><td>${r[0]}</td><td>${esc(r[1])}</td></tr>`).join('')}
  <tr><td colspan="2" class="eyebrow" style="padding-top:12px" data-en="simple past">Verleden tijd</td></tr>
  <tr><td>ik / jij / hij</td><td>${esc(sp(f.im[0]))}</td></tr><tr><td>wij / jullie / zij</td><td>${esc(sp(f.im[1]))}</td></tr>
  <tr><td colspan="2" class="eyebrow" style="padding-top:12px" data-en="present perfect">Voltooide tijd</td></tr>
  <tr><td>hij</td><td>${f.pp === '—' ? '—' : auxWord(f.aux) + ' ' + esc(f.sep + f.pp)}</td></tr>
  <tr><td colspan="2" class="eyebrow" style="padding-top:12px" data-en="imperative">Gebiedende wijs</td></tr>
  <tr><td></td><td>${esc(sp(f.imp))}!</td></tr>
  </tbody></table>
  <div class="why small" style="margin-top:8px">${[stemNote(l), kofschip(l), f.sep ? `Separable: the prefix <i>${f.sep}</i> goes to the end in a main clause, and <i>ge-</i> slips in between in the participle: <i>${f.sep}${esc(f.pp)}</i>.` : '', l.v.t === 's' ? 'Strong verb: the past changes the vowel instead of adding -de/-te. Learn it with its family.' : '', l.why || ''].filter(Boolean).join(' ')}</div>`;
}
function wordCardHTML(l, opts = {}) {
  const s = l.s ? `<div class="row" style="align-items:flex-start">${speakBtn(l.s)}<div><div class="nl" style="font-size:18px">${highlight(l.s, l.w)}</div></div></div>` : '';
  return `<div class="stack">
    <div class="spread"><div><div class="eyebrow">${POS[l.p] || ''}${l.custom ? ' · eigen woord' : ''}</div><div class="wc-word">${wordHTML(l)}</div></div>${speakBtn((l.g ? l.g + ' ' : '') + l.w)}</div>
    ${s}
    <div class="nl" style="font-size:18px;line-height:1.45">${esc(l.d || '')}</div>
    ${l.p === 'n' && (l.pl || l.dim) ? `<dl class="kv">${l.pl ? `<dt data-en="plural">meervoud</dt><dd><span class="de">de</span> ${esc(l.pl)}</dd>` : ''}${l.dim ? `<dt data-en="diminutive">verkleinwoord</dt><dd><span class="het">het</span> ${esc(l.dim)}</dd>` : ''}</dl>` : ''}
    ${l.v ? conjTable(l) : ''}
    ${!l.v && l.why ? `<div class="why small">${l.why}</div>` : ''}
    ${l.note ? `<div class="why small" style="border-left:3px solid var(--line);padding-left:10px">${l.note}</div>` : ''}
    <div><button class="en-hidden" data-act="reveal-en" data-en-text="${esc(l.en || '')}">Toon Engels</button></div>
    ${opts.actions === false ? '' : `<div class="row wrap"><button class="btn line" data-act="add-to-set" data-id="${esc(l.id)}">+ Aan een set</button></div>`}
  </div>`;
}
function showWord(id) { const l = LX(id); if (l) openSheet(wordCardHTML(l)); }

/* ===== SESSION ===== */
let SES = null;
function startSession(opts) {
  const steps = [];
  const introOK = opts.intros !== false;
  opts.keys.forEach(k => {
    const [t, id] = k.split(':');
    if (t === 'w' && introOK && !S.seen[id]) { steps.push({intro: id}); S.seen[id] = 1; }
    steps.push({key: k});
  });
  if (!steps.length) { toast('Niets te oefenen op dit moment'); return; }
  SES = {...opts, steps, i: 0, first: {}, correct: 0, total: opts.keys.length, retried: {}, t0: Date.now()};
  const o = openOverlay('session', `<button class="iconbtn" data-act="ses-close" aria-label="Sluiten" data-en="Close">✕</button><div class="progress"><div id="ses-prog" style="width:0%"></div></div><span class="small" id="ses-count" style="min-width:48px;text-align:right"></span>`, `<div id="ses-body" class="stack"></div>`);
  Store.mark('state');
  sesRender();
}
function sesRender() {
  const st = SES.steps[SES.i]; const body = $('#ses-body');
  const doneKeys = SES.steps.slice(0, SES.i).filter(x => x.key && !x.retry).length;
  $('#ses-prog').style.width = Math.round(100 * doneKeys / SES.total) + '%';
  $('#ses-count').textContent = Math.min(doneKeys + 1, SES.total) + ' / ' + SES.total;
  if (!st) return sesEnd();
  if (st.intro) {
    const l = LX(st.intro);
    body.innerHTML = `<div class="eyebrow" data-en="New word">Nieuw woord</div><div class="card">${wordCardHTML(l, {actions: false})}</div><button class="btn block" data-act="ses-next">Verder</button>`;
    return;
  }
  const ex = SES.ex = makeEx(st.key, 'drill');
  body.innerHTML = exHTML(ex);
  if (ex.listen && ex.say) setTimeout(() => Audio.say(ex.say), 250);
  const inp = $('#ex-in'); if (inp) setTimeout(() => inp.focus(), 60);
}
function exHTML(ex) {
  let h = kindLabel(ex.label, 'ex-label');
  const how = howtoHTML(ex); if (how) h += how;
  if (ex.listen) h += `<div class="row">${speakBtn(ex.say, 'Speel af')}<span class="small">Tik om opnieuw te luisteren</span></div>`;
  if (ex.prompt) h += `<div class="ex-prompt">${ex.prompt}</div>`;
  if (ex.sub) h += `<div class="ex-sub">${ex.sub}</div>`;
  if (ex.type === 'gen') h += `<div class="dehet"><button class="d" data-act="ans" data-v="de">de</button><button class="h" data-act="ans" data-v="het">het</button></div>`;
  else if (ex.type === 'mc') h += `<div class="opts">${ex.options.map(o => `<button class="opt" data-act="ans" data-v="${esc(o)}"${ex.sentOpts ? ' style="font-size:17px"' : ''}>${esc(o)}</button>`).join('')}</div>`;
  else if (ex.type === 'order') h += `<div class="tokens answer" id="tok-ans" aria-label="Jouw zin"></div><div class="tokens" id="tok-pool">${ex.tokens.map((t, j) => `<button class="tok" data-act="tok" data-j="${j}">${esc(t.t)}</button>`).join('')}</div><button class="btn block" data-act="check">Controleer</button>`;
  else h += `<form id="ex-form" class="stack" autocomplete="off"><input id="ex-in" class="big" type="text" lang="nl" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-label="Antwoord"><div id="ex-err" class="small" style="color:var(--warn)" hidden>Typ eerst een antwoord.</div><button class="btn block" type="submit">Controleer</button></form>`;
  h += `<div id="fb"></div>`;
  return h;
}
function orderAnswer() { return $$('#tok-ans .tok').map(b => b.textContent).join(' '); }
function submitAnswer(val) {
  const ex = SES && SES.ex; if (!ex || SES.answered) return;
  if (ex.type === 'order') { if (!$$('#tok-ans .tok').length) { toast('Tik eerst de woorden aan'); return; } val = cap1(orderAnswer()) + (ex.punct || ''); }
  if ((ex.type === 'type') && !String(val).trim()) { const e = $('#ex-err'); if (e) e.hidden = false; return; }
  SES.answered = true;
  SES.snap = S.items[ex.key] ? JSON.stringify(S.items[ex.key]) : null; SES.lastVal = val;
  const res = check(ex, val);
  const st = SES.steps[SES.i];
  if (!st.retry) { grade(ex.key, res.ok); if (res.ok) SES.correct++; }
  if (!res.ok && !SES.retried[ex.key]) { SES.retried[ex.key] = 1; SES.steps.push({key: ex.key, retry: true}); }
  showFeedback(ex, res, val);
}
function showFeedback(ex, res, val) {
  // 2.8: an accepted other order (subject first instead of inversie, or the other way round) is shown as the learner wrote it,
  // with its own frame; the model sentence follows as "Ook juist"
  const own = res.ok && ex.whole && ex.frame ? ownOrder(ex.frame, val) : null;
  if (own) ex = {...ex, sent: ex.sent ? {...ex.sent, nl: own.nl} : ex.sent, frame: own, say: own.nl, why: frameNote(own), also: ex.answer, answer: own.nl};
  $$('#ses-body [data-act="ans"]').forEach(b => {
    b.disabled = true; const v = b.dataset.v;
    if (norm(v) === norm(ex.answer)) b.classList.add(ex.type === 'gen' ? 'pick' : 'right');
    else if (norm(v) === norm(val)) b.classList.add('wrong');
  });
  const inp = $('#ex-in'); if (inp) inp.disabled = true;
  $$('#ses-body .tok, #ses-body [data-act="check"], #ex-form button').forEach(b => b.disabled = true);
  const heads = {ok: 'Juist!', typo: 'Bijna goed', accent: 'Juist', article: 'Verkeerd lidwoord', order: 'Andere volgorde', form: 'Andere vorm', word: 'Niet helemaal'};
  const headsEn = {ok: 'Correct', typo: 'Almost: spelling', accent: 'Correct (accents)', article: 'Wrong article', order: 'Word order', form: 'Wrong verb form', word: 'Not quite'};
  let ansHTML;
  if (ex.type === 'gen') ansHTML = `<b class="${ex.answer}">${ex.answer}</b> ${esc(ex.lex.w)}`;
  else if (ex.sent && (ex.whole || ex.sentOpts)) ansHTML = tapWords(ex.sent.nl);
  else if (ex.sent) ansHTML = tapWords(ex.sent.nl).replace(new RegExp('(<button class="rw[^"]*)("[^>]*>' + String(ex.answer).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</button>)', 'i'), '$1 hl$2');
  else ansHTML = ex.lex && ex.lex.g && ex.label !== 'conj' ? `<b class="${ex.lex.g}">${ex.lex.g}</b> ${esc(ex.answer)}` : /\s/.test(String(ex.answer).trim()) ? tapWords(ex.answer) : esc(ex.answer);
  const fb = $('#fb');
  fb.innerHTML = `<div class="fb ${res.ok ? 'ok' : 'no'}" role="status">
    <h3 data-en="${headsEn[res.kind]}">${heads[res.kind]}</h3>
    ${res.note ? `<div class="small">${res.note}</div>` : ''}
    <div class="row">${ex.say ? speakBtn(ex.say) : ''}<div class="answer">${ansHTML}</div></div>
    ${yoursHTML(ex, res, val)}
    ${ex.also ? `<div class="small" data-en="Also correct">Ook juist: <span class="nl">${esc(ex.also)}</span></div>` : ''}
    ${ex.sent && (ex.listen || ex.whole) ? `<div class="small">${esc(ex.sent.en)}</div>` : ''}
    ${ex.frame && (res.kind === 'order' || ex.label === 'ord' || ex.label === 'tr') ? frameHTML(ex.frame) : ''}
    <div class="why">${whyFor(ex, res)}</div>
  </div><button class="btn block" data-act="ses-next" id="ses-next" style="margin-top:12px">Verder</button>`;
  if (!ex.listen && res.ok && ex.say && ex.type !== 'gen') setTimeout(() => Audio.say(ex.say), 150);
  setTimeout(() => { const n = $('#ses-next'); if (n) { n.focus({preventScroll: true}); n.scrollIntoView({behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest'}); } }, 50);
}
// a whole sentence that was not right: show the user's own sentence with the words that differ struck through
function yoursHTML(ex, res, val) {
  if (res.ok || !ex.whole || ex.type === 'order' || !String(val || '').trim()) return '';
  const words = String(val).trim().split(/\s+/); const diff = fixDiff(val, ex.answer);
  return `<div class="small yours"><span data-en="Your sentence">Jij:</span> <span class="nl">${words.map((w, i) => diff.has(i) ? `<s class="d">${esc(w)}</s>` : esc(w)).join(' ')}</span></div>`;
}
function sesNext() { if (!SES) return; SES.i++; SES.answered = false; sesRender(); }
function sesEnd() {
  const score = SES.total ? SES.correct / SES.total : 1;
  const mins = (Date.now() - SES.t0) / 60000;
  const a = S.activity[dateKey()] = S.activity[dateKey()] || {n: 0, m: 0}; a.m = Math.round(((a.m || 0) + mins) * 10) / 10;
  let msg = '';
  const pass = score >= 0.8;
  if (SES.sq && SES.step) {
    const ss = sqstate(SES.sq);
    if (pass && SES.round) { ss.rounds = ss.rounds || {}; ss.rounds[SES.step] = Math.max(ss.rounds[SES.step] || 1, SES.round); }
    else if (pass) ss.steps[SES.step] = Math.max(ss.steps[SES.step] || 0, Math.round(score * 100));
    S.cur = SES.sq;
    msg = pass && SES.round ? `Ronde ${SES.round} gehaald.` : pass ? `Checkpoint gehaald: dit gildehuis is klaar.` : `Voor het checkpoint heb je 80% nodig. Probeer het nog eens; wat je nu oefende telt al mee voor je herhalingen.`;
  }
  if (SES.markt) { S.markt = S.markt || {}; S.markt[SES.markt] = Math.max(S.markt[SES.markt] || 0, Math.round(score * 100)); msg = pass ? 'Checkpoint gehaald: deze stad is helemaal van jou.' : 'Voor de Grote Markt heb je 80% nodig. Wat je fout had, komt terug in je herhalingen.'; }
  if (SES.testout) {
    const ids = SES.testout;
    if (pass) { ids.forEach(q => { const ss = sqstate(q); BUILT_STEPS.forEach(st => { ss.steps[st] = ss.steps[st] || 'test'; }); }); msg = ids.length > 1 ? 'Getest en gehaald: deze stad is open en klaar.' : 'Getest en gehaald: dit plein is klaar. Het volgende plein is open.'; }
    else msg = 'Nog niet gehaald. Doe de gildehuizen van het vorige plein, of probeer later opnieuw.';
  }
  Store.mark('state', 'items');
  $('#ses-prog').style.width = '100%';
  $('#ses-body').innerHTML = `<div class="stack" style="padding-top:20px">
    <div class="eyebrow">Klaar</div>
    <div class="big-num">${SES.correct} / ${SES.total}</div>
    <div class="muted">in één keer juist · ${Math.max(1, Math.round(mins))} min</div>
    ${msg ? `<div class="card soft">${msg}</div>` : ''}
    <button class="btn block" data-act="ses-close">Terug</button></div>`;
  SES.finished = true;
}
function closeSession() { closeOverlay('session'); SES = null; render(); }

/* session builders (per square) */
function practiceKeys(q) {
  const sq = SQ[q]; const lex = sq.words.map(LX); const sents = sq.sents.map(id => SX[id]);
  const newLex = lex.filter(l => !S.items['w:' + l.id + ':rec']).slice(0, 6);
  const keys = [];
  newLex.forEach(l => { keys.push('w:' + l.id + ':rec'); if (l.g) keys.push('w:' + l.id + ':gen'); if (l.v) keys.push('w:' + l.id + ':conj'); });
  lex.filter(l => S.items['w:' + l.id + ':rec'] && S.items['w:' + l.id + ':rec'].r >= 1 && !S.items['w:' + l.id + ':prod']).slice(0, 3).forEach(l => keys.push('w:' + l.id + ':prod'));
  sents.filter(s => !S.items['s:' + s.id + ':ord']).slice(0, 4).forEach(s => keys.push('s:' + s.id + ':ord'));
  const pool = squareKeys(q).filter(k => !k.endsWith(':lis'));
  keys.push(...shuffle(pool.filter(k => isDue(k) && !keys.includes(k))).slice(0, Math.max(3, 14 - keys.length)));
  if (keys.length < 10) keys.push(...shuffle(pool.filter(k => S.items[k] && !keys.includes(k))).slice(0, 10 - keys.length));
  const words = keys.filter(k => k[0] === 'w'), sen = keys.filter(k => k[0] === 's');
  const out = []; let wi = 0, si = 0;
  while (wi < words.length || si < sen.length) { for (let r = 0; r < 3 && wi < words.length; r++) out.push(words[wi++]); if (si < sen.length) out.push(sen[si++]); }
  return out.slice(0, 16);
}
function listenKeys(q) {
  const ks = SQ[q].sents.map(id => 's:' + id + ':lis');
  return uniq([...ks.filter(k => !S.items[k]), ...ks.filter(isDue), ...shuffle(ks.filter(k => S.items[k] && !isDue(k)))]).slice(0, 7);
}
function testoutKeys(qs) {
  const ks = []; qs.forEach(q => { const sq = SQ[q];
    shuffle(sq.words).slice(0, 4).forEach(id => { const l = LX(id); ks.push('w:' + id + ':' + (l.g && Math.random() < .5 ? 'gen' : l.v && Math.random() < .5 ? 'conj' : 'prod')); });
    shuffle(sq.sents).slice(0, 2).forEach(id => ks.push('s:' + id + ':ord')); });
  return shuffle(ks).slice(0, qs.length > 1 ? 15 : 8);
}
function reviewKeys() { const left = Math.max(0, (S.settings.cap || 60) - doneToday()); return dueKeys().slice(0, left); }
function startReview() {
  const keys = reviewKeys();
  if (!keys.length) { toast(dueKeys().length ? 'Daglimiet bereikt. Morgen verder.' : 'Niets te herhalen. Goed bezig.'); return; }
  startSession({keys: keys.slice(0, 25), intros: false});
}
function startTestout(qs) { startSession({keys: testoutKeys(qs), intros: false, testout: qs}); }
function startStep(q, step) {
  if (!sqOpen(q)) { toast('Dit plein is nog dicht. Doe eerst het vorige, of test je erin.'); return; }
  S.cur = q; Store.mark('state');
  if (step === 'ontdek') return openLesson(q);
  if (step === 'oefen') return startSession({keys: practiceKeys(q), sq: q, step: 'oefen'});
  if (step === 'luister') return startSession({keys: listenKeys(q), sq: q, step: 'luister', intros: false});
  if (step === 'lees') return toast('Lezen komt in een volgende versie');
  if (step === 'gebruik') return openUse(q);
}
// the next guild house in the plein's own order (Ontdek, Oefen, Lees, Luister, Gebruik); Lees only where the plein has a text
const stepAvail = (q, s) => BUILT_STEPS.includes(s) || (s === 'lees' && typeof READ !== 'undefined' && !!READ[q]) || s === 'gebruik';
const nextStep = q => STEPS.find(s => stepAvail(q, s) && !stepDone(q, s)) || 'oefen';
const STEP_NAME = {ontdek: 'Ontdek', oefen: 'Oefen', lees: 'Lees', luister: 'Luister', gebruik: 'Gebruik'};

/* ===== LESSON (Ontdek, per square) ===== */
function openLesson(q, readOnly) {
  const sq = SQ[q]; const unit = UNIT[sq.u]; const g = GRAM[sq.u];
  const lex = sq.words.map(LX);
  const groups = [['Zelfstandige naamwoorden', lex.filter(l => l.p === 'n')], ['Werkwoorden · tik voor alle vormen', lex.filter(l => l.p === 'v')], ['Andere woorden', lex.filter(l => l.p !== 'n' && l.p !== 'v')]];
  const list = arr => `<div class="list">${arr.map(l => `<div class="li" data-act="word" data-id="${l.id}" role="button" tabindex="0"><span class="w">${wordHTML(l)}</span><span class="d">${esc(l.d)}</span></div>`).join('')}</div>`;
  const first = sq.n === 1;
  const body = `<div class="stack">
    ${coachTip('ontdek', 'Ontdek is het eerste gildehuis: je leest de regel, bekijkt voorbeelden in het zinsschema en ontmoet de nieuwe woorden. Tik op een woord voor alle vormen.')}
    <div><div class="eyebrow">${esc(unit.name)} · ${esc(sq.name)}</div><h1 style="margin-top:4px">${esc(sq.title)}</h1><div class="muted" style="margin-top:2px">${esc(sq.en)}</div></div>
    <p class="why" style="margin:0">${sq.rule}</p>
    ${sq.ex.map(id => { const s = SX[id]; return `<div class="card stack" style="gap:8px"><div class="row">${speakBtn(s.nl)}<div class="nl" style="font-size:19px">${tapWords(s.nl)}</div></div><div class="small">${esc(s.en)}</div>${frameHTML(s)}</div>`; }).join('')}
    <div class="small">Goud = het werkwoord (plaats 2 en het einde). Vet = het onderwerp. Een groen onderlijnd woord tik je aan voor de woordkaart.</div>
    ${first ? `<div class="card soft"><div class="eyebrow">Waarom werkt het zo?</div><div class="why" style="margin-top:4px">${g.why}</div></div>` : ''}
    <h2>Nieuwe woorden</h2>
    ${groups.filter(x => x[1].length).map(x => `<div><div class="eyebrow">${x[0]}</div>${list(x[1])}</div>`).join('')}
    ${readOnly ? '' : `<button class="btn block" data-act="lesson-done" data-q="${q}">Klaar · naar Oefen</button>`}
  </div>`;
  openOverlay('lesson', `<button class="iconbtn" data-act="overlay-close" data-id="lesson" aria-label="Sluiten">✕</button><span class="small">Ontdek · ${esc(sq.name)}</span>`, body);
  if (!readOnly) { sqstate(q).steps.ontdek = 1; Store.mark('state'); }
}
