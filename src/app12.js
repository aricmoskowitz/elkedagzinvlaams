/* ===== BATCH 3 · Lees house, Grote Markt ===== */

/* ---------- Lees: one short text per square ---------- */
ACTIVE_STEPS.push('lees');
STEP_DESC.lees = 'Een korte tekst met vijf vragen';
function startStep(q, step) {
  if (!sqOpen(q)) { toast('Dit plein is nog dicht. Doe eerst het vorige, of test je erin.'); return; }
  S.cur = q; Store.mark('state');
  if (step === 'ontdek') return openLesson(q);
  if (step === 'oefen') return startSession({keys: practiceKeys(q), sq: q, step: 'oefen'});
  if (step === 'luister') return startSession({keys: listenKeys(q), sq: q, step: 'luister', intros: false});
  if (step === 'lees') return READ[q] ? openRead(q) : toast('Voor dit plein is er nog geen tekst.');
  if (step === 'gebruik') return openUse(q);
}
let READING = null;
function readHTML(text) {
  return esc(text).split(/(\s+)/).map(tok => {
    const core = tok.replace(/^[^\p{L}’']+|[^\p{L}’']+$/gu, '');
    const id = core && FORM_IX[norm(core)];
    return id ? tok.replace(core, `<button class="rw" data-act="word" data-id="${id}">${core}</button>`) : tok;
  }).join('');
}
function openRead(q) {
  const R = READ[q]; const sq = SQ[q]; READING = {q, ans: {}};
  openOverlay('read', `<button class="iconbtn" data-act="overlay-close" data-id="read" aria-label="Sluiten">✕</button><span class="small">Lees · ${esc(sq.name)}</span>`, `<div class="stack">
    ${coachTip('lees', 'Lees de tekst. Tik op een groen onderlijnd woord voor de woordkaart. Tik op de luidspreker om de hele tekst te horen. Beantwoord dan de vijf vragen: 4 van de 5 juist en dit gildehuis is gehaald.')}
    <div class="row" style="align-items:flex-start">${speakBtn(R.text)}<h1 style="flex:1">${esc(R.title)}</h1></div>
    <div class="readtext nl">${readHTML(R.text)}</div>
    <button class="en-hidden" data-act="reveal-en" data-en-text="${esc(R.en)}" style="align-self:flex-start">Waarover gaat het? (Engels)</button>
    <div class="eyebrow">${R.qs.length === 5 ? 'Vijf' : R.qs.length} vragen</div>
    ${R.qs.map((x, i) => `<div class="card stack" style="gap:8px" id="rq-${i}"><div style="font-weight:600">${i + 1}. ${esc(x.q)}</div><div class="opts">${x.o.map((o, j) => `<button class="opt" data-act="read-ans" data-i="${i}" data-j="${j}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
    <div id="read-end"></div>
  </div>`);
}
function readAnswer(i, j) {
  if (!READING || READING.ans[i] !== undefined) return;
  const R = READ[READING.q]; const ok = R.qs[i].a === j; READING.ans[i] = ok;
  const box = $('#rq-' + i); $$('.opt', box).forEach((b, k) => { b.disabled = true; if (k === R.qs[i].a) b.classList.add('right'); else if (k === j) b.classList.add('wrong'); });
  if (Object.keys(READING.ans).length === R.qs.length) {
    const n = Object.values(READING.ans).filter(Boolean).length; const pass = n >= Math.ceil(R.qs.length * .8); // 4 of 5, the same 80% as everywhere
    { const ss = sqstate(READING.q); ss.best = ss.best || {}; ss.best.lees = Math.max(ss.best.lees || 0, Math.round(n / R.qs.length * 100)); Store.mark('state'); } // 2.9: the Lezen meter counts every attempt
    if (pass) { sqstate(READING.q).steps.lees = Math.max(sqstate(READING.q).steps.lees || 0, Math.round(n / R.qs.length * 100)); Store.mark('state'); }
    $('#read-end').innerHTML = `<div class="card soft stack" style="gap:8px"><div class="big-num">${n} / ${R.qs.length}</div><div>${pass ? (n === R.qs.length ? 'Alles juist: dit gildehuis krijgt een ster.' : 'Goed gelezen: dit gildehuis is gehaald.') : 'Lees de tekst nog eens en probeer opnieuw.'}</div><button class="btn block" data-act="${pass ? 'read-close' : 'read-again'}" data-q="${READING.q}">${pass ? 'Terug naar het plein' : 'Opnieuw'}</button></div>`;
    $('#read-end').scrollIntoView({block: 'center', behavior: 'smooth'});
  }
}

/* ---------- Grote Markt: the town review + mission ---------- */
PLAN_SQ.filter(q => q.review && PT[q.u] && PT[q.u].built).forEach(q => { q.built = true; });
const marktId = u => (PLAN_SQ.find(q => q.u === u && q.review) || {}).id;
const marktOpen = u => testMode() || squaresOf(u).every(q => sqComplete(q.id));
const marktDone = u => ((S.markt || {})[u] || 0) >= 80;
function marktKeys(u) {
  const ks = [];
  squaresOf(u).forEach(q => {
    shuffle(q.words).slice(0, 2).forEach(id => { const l = LX(id); ks.push('w:' + id + ':' + (l.g && Math.random() < .5 ? 'gen' : l.v && Math.random() < .5 ? 'conj' : 'prod')); });
    const ss = shuffle(q.sents); ks.push('s:' + ss[0] + ':ord', 's:' + ss[1] + ':tr', 's:' + ss[2] + ':lis');
  });
  return shuffle(ks).slice(0, 16);
}
function viewMarkt(u) {
  const unit = UNIT[u]; const open = marktOpen(u); const sc = (S.markt || {})[u];
  const line = (act, attrs, title, desc, on = true) => `<button class="tapline" data-act="${act}" ${attrs} ${on ? '' : 'aria-disabled="true"'}><div class="t"><div style="font-weight:600;${on ? '' : 'color:var(--faint)'}">${title}</div><div class="small">${desc}</div></div><span class="chev" ${on ? '' : 'style="color:var(--faint)"'}>›</span></button>`;
  return `<div class="stack">
    <button class="back" data-act="pad-town" data-u="${u}">‹ ${esc(unit.name)}</button>
    <div><div class="eyebrow">Boog ${arcOf(u).n} · Stad ${townIndexInArc(u)} · Grote Markt</div><h1>Grote Markt van ${esc(unit.name)}</h1><div class="small" style="margin-top:2px">Alles van deze stad samen, en je opdracht in de stad</div></div>
    ${coachTip('markt', 'Elke stad eindigt op haar Grote Markt. Hier herhaal je de hele stad door elkaar: woorden, zinnen en luisteren. 80% en de stad is echt van jou. Doe ook je opdracht in de echte stad.')}
    ${goalCard(u)}
    ${open ? '' : '<div class="card soft">De Grote Markt gaat open als je alle pleinen van deze stad klaar hebt.</div>'}
    <div>
      ${line('markt-review', `data-u="${u}"`, `Herhaal de hele stad${sc ? ` <span class="small">· ${sc}%</span>` : ''}`, '16 vragen door elkaar · checkpoint bij 80%', open)}
      ${line('praten', `data-mode="opdracht" data-u="${u}"`, `Praten in Claude: ${esc(sceneFor(u).title)}${stepDone(marktId(u), 'gebruik') ? ' <span class="small">· gedaan</span>' : ''}`, esc(sceneFor(u).goal), open)}
    </div>
    ${missionRow(u)}
  </div>`;
}
function marktLink(u) {
  if (!marktId(u)) return '';
  const st = marktDone(u) ? 'klaar' : marktOpen(u) ? 'open' : 'nog dicht';
  return `<button class="tapline marktline" data-act="markt" data-u="${u}"><span class="pn star">★</span><div class="t"><div style="font-weight:600">Grote Markt</div><div class="small">Herhaal de hele stad · opdracht in de stad · ${st}</div></div><span class="chev">›</span></button>`;
}
function marktStatus(L) { return marktDone(L.u) ? 'klaar' : marktOpen(L.u) ? 'open' : 'nog dicht'; }
