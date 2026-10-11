/* ===== BATCH 3 · Lees house, Grote Markt, compact plan, usage meter ===== */

/* ---------- Lees: one short text per square ---------- */
ACTIVE_STEPS.push('lees');
STEP_DESC.lees = 'Een korte tekst met drie vragen';
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
    ${coachTip('lees', 'Lees de tekst. Tik op een groen onderlijnd woord voor de woordkaart. Tik op de luidspreker om de hele tekst te horen. Beantwoord dan de drie vragen: 2 van de 3 juist en dit gildehuis is klaar.')}
    <div class="row" style="align-items:flex-start">${speakBtn(R.text)}<h1 style="flex:1">${esc(R.title)}</h1></div>
    <div class="readtext nl">${readHTML(R.text)}</div>
    <button class="en-hidden" data-act="reveal-en" data-en-text="${esc(R.en)}" style="align-self:flex-start">Waarover gaat het? (Engels)</button>
    <div class="eyebrow">Drie vragen</div>
    ${R.qs.map((x, i) => `<div class="card stack" style="gap:8px" id="rq-${i}"><div style="font-weight:600">${i + 1}. ${esc(x.q)}</div><div class="opts">${x.o.map((o, j) => `<button class="opt" data-act="read-ans" data-i="${i}" data-j="${j}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
    <div id="read-end"></div>
  </div>`);
}
function readAnswer(i, j) {
  if (!READING || READING.ans[i] !== undefined) return;
  const R = READ[READING.q]; const ok = R.qs[i].a === j; READING.ans[i] = ok;
  const box = $('#rq-' + i); $$('.opt', box).forEach((b, k) => { b.disabled = true; if (k === R.qs[i].a) b.classList.add('right'); else if (k === j) b.classList.add('wrong'); });
  if (Object.keys(READING.ans).length === R.qs.length) {
    const n = Object.values(READING.ans).filter(Boolean).length; const pass = n >= 2;
    if (pass) { sqstate(READING.q).steps.lees = Math.max(sqstate(READING.q).steps.lees || 0, Math.round(n / R.qs.length * 100)); Store.mark('state'); }
    $('#read-end').innerHTML = `<div class="card soft stack" style="gap:8px"><div class="big-num">${n} / ${R.qs.length}</div><div>${pass ? 'Goed gelezen: dit gildehuis is klaar.' : 'Lees de tekst nog eens en probeer opnieuw.'}</div><button class="btn block" data-act="${pass ? 'read-close' : 'read-again'}" data-q="${READING.q}">${pass ? 'Terug naar het plein' : 'Opnieuw'}</button></div>`;
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
  const wk = String(weekStartDay()); const mDone = S.mission[wk] === u; const scen = SCENARIOS.find(s => s.u === u);
  const line = (act, attrs, title, desc, on = true) => `<button class="tapline" data-act="${act}" ${attrs} ${on ? '' : 'aria-disabled="true"'}><div class="t"><div style="font-weight:600;${on ? '' : 'color:var(--faint)'}">${title}</div><div class="small">${desc}</div></div><span class="chev" ${on ? '' : 'style="color:var(--faint)"'}>›</span></button>`;
  return `<div class="stack">
    <button class="back" data-act="pad-town" data-u="${u}">‹ ${esc(unit.name)}</button>
    <div><div class="eyebrow">Boog ${arcOf(u).n} · Stad ${townIndexInArc(u)} · Grote Markt</div><h1>Grote Markt van ${esc(unit.name)}</h1><div class="small" style="margin-top:2px">Alles van deze stad samen, en je opdracht in de stad</div></div>
    ${coachTip('markt', 'Elke stad eindigt op haar Grote Markt. Hier herhaal je de hele stad door elkaar: woorden, zinnen en luisteren. 80% en de stad is echt van jou. Doe ook je opdracht in de echte stad.')}
    <div class="card soft stack" style="gap:6px"><div class="eyebrow">Na deze stad</div><div class="nl" style="font-size:17px">${esc(unit.can)}</div></div>
    ${open ? '' : '<div class="card soft">De Grote Markt gaat open als je alle pleinen van deze stad klaar hebt.</div>'}
    <div>
      ${line('markt-review', `data-u="${u}"`, `Herhaal de hele stad${sc ? ` <span class="small">· ${sc}%</span>` : ''}`, '16 vragen door elkaar · checkpoint bij 80%', open)}
      ${line('mission', `data-u="${u}"`, `Opdracht in de stad${mDone ? ' <span class="small">· gedaan deze week</span>' : ''}`, esc(unit.mission || ''), true)}
      ${scen ? line('talk-start', `data-id="${scen.id}"`, 'Praat: ' + esc(scen.title), esc(scen.goal), open && AI.ok !== false) : ''}
      ${WRITING[u] ? line('markt-write', `data-u="${u}"`, 'Schrijf', esc(WRITING[u].prompt), open && AI.ok !== false) : ''}
    </div>
  </div>`;
}
function marktLink(u) {
  if (!marktId(u)) return '';
  const st = marktDone(u) ? 'klaar' : marktOpen(u) ? 'open' : 'nog dicht';
  return `<button class="tapline marktline" data-act="markt" data-u="${u}"><span class="pn star">★</span><div class="t"><div style="font-weight:600">Grote Markt</div><div class="small">Herhaal de hele stad · opdracht in de stad · ${st}</div></div><span class="chev">›</span></button>`;
}
function marktStatus(L) { return marktDone(L.u) ? 'klaar' : marktOpen(L.u) ? 'open' : 'nog dicht'; }

/* ---------- a cheaper plan for Claude: near arcs in full, far arcs compact ---------- */
function planText() {
  const cur = arcOf(SQ[S.cur] ? SQ[S.cur].u : 'u1'); const near = new Set(['a1', cur.id, (ARCS[cur.n] || cur).id]);
  return 'Square ids are the town id + q + number (u15q2 = town u15, square 2). Near arcs are described in full, far arcs compactly.\n' + PLAN_TOWNS.map(t => {
    const a = arcOf(t.id); const sqs = PLAN_SQ.filter(q => q.u === t.id && !q.review);
    return near.has(a.id)
      ? `Arc ${a.n} · Town ${townIndexInArc(t.id)} ${t.name} — ${t.gramEn}; ${t.themeEn || t.theme}: ` + sqs.map(q => `${q.id} ${q.en}`).join(' | ')
      : `${t.id} (arc ${a.n}) ${t.gramEn}: ` + sqs.map(q => `q${q.n} ${q.en}`).join('; ');
  }).join('\n');
}

/* ---------- usage meter ---------- */
const TOK = s => Math.round(String(s || '').length / 3.6);
function usageKind(input, tier) {
  if (tier === 'quick') return 'tutor';
  const p = typeof input === 'string' ? input : '';
  if (p.includes('Review a Dutch conversation')) return 'review';
  if (p.includes('log entry')) return 'log';
  if (p.includes('writing task')) return 'write';
  return 'other';
}
const _aiJsonRaw = AI.json;
AI.json = async function (input, tier = 'default', signal) {
  const r = await _aiJsonRaw.call(AI, input, tier, signal);
  try {
    const wk = String(weekStartDay()); S.usage = S.usage || {};
    const w = S.usage[wk] = S.usage[wk] || {calls: 0, tok: 0, k: {}};
    const inStr = typeof input === 'string' ? input : input.map(m => m.content).join('\n');
    const t = TOK(inStr) + TOK(JSON.stringify(r)) + 60; const kind = usageKind(input, tier);
    w.calls++; w.tok += t; w.k[kind] = w.k[kind] || [0, 0]; w.k[kind][0]++; w.k[kind][1] += t;
    Object.keys(S.usage).sort().slice(0, -8).forEach(k => delete S.usage[k]);
    Store.mark('state');
  } catch (e) {}
  return r;
};
const KIND_NAME = {tutor: 'Praten met de tutor', review: 'Bespreking na een gesprek', log: 'Logboek verwerken', write: 'Schrijven nakijken', other: 'Andere (uitleg, woordkaarten)'};
function usageBlock() {
  const wk = String(weekStartDay()); const U = S.usage || {}; const w = U[wk] || {calls: 0, tok: 0, k: {}};
  const prevKey = Object.keys(U).filter(k => k < wk).sort().pop(); const prev = prevKey ? U[prevKey] : null;
  const fmt = n => n >= 1000 ? (Math.round(n / 100) / 10).toLocaleString('nl-BE') + 'k' : String(n);
  const big = storageReport()[0];
  return `<div class="stack" style="gap:8px"><div class="eyebrow" data-en="Claude usage this week">Claude-gebruik deze week</div>
    <div class="grid2"><div><div class="big-num">${w.calls}</div><div class="small">vragen aan Claude</div></div><div><div class="big-num">~${fmt(w.tok)}</div><div class="small">tokens (schatting)</div></div></div>
    ${Object.entries(w.k).sort((a, b) => b[1][1] - a[1][1]).map(([k, v]) => `<div class="spread small"><span>${KIND_NAME[k] || k} · ${v[0]}×</span><span>~${fmt(v[1])}</span></div>`).join('')}
    ${prev ? `<div class="small">Vorige week: ${prev.calls} vragen · ~${fmt(prev.tok)} tokens</div>` : ''}
    <div class="small">Oefenen, herhalen, lezen en de kaart gebruiken geen Claude. Een gesprek van 10 beurten met bespreking is ongeveer 14k tokens. Je echte limiet staat in je Claude-instellingen onder Gebruik.</div>
    <div class="small">Opslag: grootste deel <b>${esc(big.n)}</b> ${big.kb} KB van 256 KB.</div>
  </div>`;
}
