/* ===== 2.0: helpers kept from the 1.5 Claude features =====
   The in-app tutor, log processing, writing correction, Zeg het anders,
   draftWord and Vraag Claude are gone: speaking and writing happen in the
   Claude Project (Elke Dag Zin · Praten) and come back as a pasted report.
   Old talks and log entries stay readable in Toen en nu. */
function weekNo(d = new Date()) { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7); }
const uid = p => p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

/* ---------- old talks (history) ---------- */
function viewTalkHistory(id) {
  const t = S.talks.find(x => x.id === id); if (!t) return;
  openSheet(`<div class="stack"><div class="small">${esc(t.date)}</div>${t.msgs.map(m => `<div class="bubble ${m.who === 'me' ? 'me' : 'tutor'}"><div class="nl">${esc(m.text)}</div></div>`).join('')}${t.good ? `<div class="card soft nl">${esc(t.good)}</div>` : ''}${t.tip ? `<div class="small"><b>Tip:</b> ${esc(t.tip)}</div>` : ''}</div>`);
}

/* ---------- GEBRUIK: speaking and writing happen in the Claude Project ---------- */
function openUse(q) {
  const sq = SQ[q]; const sc = SCENARIOS.find(s => s.u === sq.u) || SCENARIOS.find(s => s.id === 'sc-free');
  openSheet(`<div class="stack"><h2>Gebruik · ${esc(sq.name)}</h2>
    <div class="small">Spreken en schrijven doe je in je Claude Project <i>Elke Dag Zin · Praten</i>. Een geslaagde opdracht daar maakt dit gildehuis klaar.</div>
    ${sc ? `<div class="card soft"><div class="eyebrow">Opdracht</div><div class="nl" style="font-size:17px">${esc(sc.goal)}</div><div class="small" style="margin-top:2px">Je praat met ${esc(sc.role)}.</div></div>` : ''}
  </div>`);
}

/* ---------- Extra squares (from the log) ---------- */
function openExtra(id) {
  const x = S.extras.find(e => e.id === id); if (!x) return;
  openOverlay('extra', `<button class="iconbtn" data-act="overlay-close" data-id="extra" aria-label="Sluiten">✕</button><span class="small">Extra plein</span>`, `<div class="stack">
    <div class="eyebrow">Extra plein · toegevoegd (${esc(x.date)})</div><h1>${esc(x.title)}</h1><p class="why" style="margin:0">${esc(x.rule)}</p>
    ${x.examples.map(e => `<div class="card stack" style="gap:6px"><div class="row">${speakBtn(e.nl)}<div class="nl" style="font-size:18px">${esc(e.nl)}</div></div><div class="small">${esc(e.en)}</div></div>`).join('')}
    ${x.examples.length ? `<button class="btn block" data-act="extra-practise" data-id="${x.id}">Oefen deze zinnen</button>` : ''}
    <button class="link" data-act="extra-del" data-id="${x.id}" style="color:var(--warn)">Verwijder dit extra plein</button></div>`);
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
