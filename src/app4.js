/* ===== MAP: arc → town → square ===== */
const PAD = {lvl: 'arc', u: null, q: null};
const ARC_PTS = [[70, 64], [270, 138], [70, 212], [270, 286], [70, 362], [270, 436], [150, 508]];
const ICONS = {
  sign: '<path d="M0,16 V-16"/><path d="M-2,-12 H13 L17,-8 L13,-4 H-2 Z"/><path d="M2,-1 H-13 L-17,3 L-13,7 H2 Z"/>',
  plant: '<path d="M-10,4 H10 L7,17 H-7 Z"/><path d="M0,4 V-6"/><path d="M0,-4 C-10,-6 -12,-14 -8,-18 C-4,-14 -2,-10 0,-4"/><path d="M0,-6 C8,-8 11,-15 8,-19 C4,-15 1,-12 0,-6"/>',
  fries: '<path d="M-10,-2 L10,-2 L6,17 L-6,17 Z"/><path d="M-7,-2 L-9,-16 M-3,-2 L-3,-18 M1,-2 L2,-17 M5,-2 L8,-15"/>',
  cup: '<path d="M-12,-4 H8 V6 A10,10 0 0 1 -12,6 Z"/><path d="M8,-1 A5,5 0 0 1 8,8"/><path d="M-6,-10 q2,-3 0,-6 M0,-10 q2,-3 0,-6"/><path d="M-15,17 H12"/>',
  book: '<path d="M0,-10 C-6,-14 -13,-14 -16,-12 V12 C-13,10 -6,10 0,14 C6,10 13,10 16,12 V-12 C13,-14 6,-14 0,-10 Z"/><path d="M0,-10 V14"/>',
  gable: '<path d="M-12,17 V2 H-8 V-4 H-4 V-10 H4 V-4 H8 V2 H12 V17 Z"/><path d="M-3,17 V10 A3,3 0 0 1 3,10 V17"/><path d="M-6,5 h3 M3,5 h3"/>',
  why: '<path d="M-18,17 L-4,-8 L4,4 L9,-3 L18,17 Z"/><path d="M-3,-17 a3.5,3.5 0 1 1 3.5,3.5 v2.5"/><circle cx="0.5" cy="-6.5" r="0.8"/>'
};
function roadPath(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const my = (y0 + y1) / 2; d += ` C${x0},${my} ${x1},${my} ${x1},${y1}`; }
  return d;
}
function segPath(i) { const [x0, y0] = ARC_PTS[i], [x1, y1] = ARC_PTS[i + 1]; const my = (y0 + y1) / 2; return `M${x0},${y0} C${x0},${my} ${x1},${my} ${x1},${y1}`; }
function townState(u) {
  if (!UNIT[u].built) return 'later';
  if (unitComplete(u)) return 'done';
  if (!townOpen(u)) return 'locked';
  return SQ[nextSquare()].u === u ? 'next' : 'open';
}
function arcSVG() {
  const segs = ARC_PTS.slice(0, -1).map((_, i) => {
    const done = unitComplete(UNITS[i].id);
    return `<path id="seg${i}" d="${segPath(i)}" fill="none" stroke="${done ? 'var(--ink)' : '#CFCAC1'}" stroke-width="${done ? 2.5 : 2}" ${done ? '' : 'stroke-dasharray="1 6"'} stroke-linecap="round"/>`;
  }).join('');
  const towns = UNITS.map((u, i) => {
    const [x, y] = ARC_PTS[i]; const st = townState(u.id);
    const left = x < 170; const tx = left ? x + 44 : x - 44; const anchor = left ? 'start' : 'end';
    const ring = {next: 'fill="var(--go)" stroke="var(--go)"', open: 'fill="#fff" stroke="var(--go)" stroke-width="2"', done: 'fill="#fff" stroke="var(--ink)" stroke-width="2"', locked: 'fill="#fff" stroke="#CFCAC1" stroke-width="1.5"', later: 'fill="#fff" stroke="#DDD8CF" stroke-width="1.5" stroke-dasharray="3 3"'}[st];
    const iconStroke = st === 'next' ? '#fff' : st === 'locked' || st === 'later' ? '#BDB7AC' : 'var(--ink)';
    const nameCol = st === 'later' || st === 'locked' ? 'var(--faint)' : 'var(--ink)';
    const sub = st === 'later' ? 'volgt later' : st === 'locked' ? 'nog dicht · ' + u.gram.toLowerCase() : u.gram.toLowerCase();
    return `<g class="maptown" data-act="town" data-u="${u.id}" role="button" tabindex="0" aria-label="${esc(u.name)}: ${esc(u.gram)}${st === 'done' ? ', klaar' : ''}">
      <circle cx="${x}" cy="${y}" r="30" ${ring}/>
      <g transform="translate(${x},${y})" fill="none" stroke="${iconStroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[u.icon]}</g>
      ${st === 'done' ? `<g transform="translate(${x + 21},${y - 21})"><circle r="9" fill="var(--ink)"/><path d="M-4,0 l3,3 l5,-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>` : ''}
      <text x="${tx}" y="${y - 3}" text-anchor="${anchor}" style="font-size:16px;font-weight:600;fill:${nameCol}">${esc(u.name)}</text>
      <text x="${tx}" y="${y + 15}" text-anchor="${anchor}" style="font-family:var(--ui);font-size:11.5px;fill:${st === 'later' || st === 'locked' ? 'var(--faint)' : 'var(--ink2)'}">${esc(sub)}</text>
    </g>`;
  }).join('');
  const cu = SQ[nextSquare()].u; const ci = UNIT[cu].n - 1; const [cx, cy] = ARC_PTS[ci];
  return `<svg id="arcmap" viewBox="0 0 340 560" role="img" aria-label="Boog 1: zeven steden langs één weg">
    <g fill="none" stroke="#E4E0D8" stroke-width="1.2" stroke-linecap="round">
      <path d="M0,318 C60,308 110,326 170,314 S280,302 340,314"/><path d="M0,326 C60,316 110,334 170,322 S280,310 340,322"/>
      <path d="M20,556 L60,520 L100,556 M230,556 L262,528 L294,556"/>
    </g>
    <g fill="none" stroke="#DDD8CF" stroke-width="1.2"><circle cx="186" cy="92" r="7"/><path d="M186,99 v8"/><circle cx="202" cy="102" r="5"/><path d="M202,107 v6"/><circle cx="150" cy="250" r="6"/><path d="M150,256 v7"/><circle cx="192" cy="398" r="7"/><path d="M192,405 v8"/></g>
    <text x="332" y="346" text-anchor="end" style="font-family:var(--display);font-style:italic;font-size:12px;fill:#BDB7AC">de rivier</text>
    <path d="M${ARC_PTS[0][0]},8 L${ARC_PTS[0][0]},${ARC_PTS[0][1] - 30}" stroke="#CFCAC1" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round" fill="none"/>
    <text x="${ARC_PTS[0][0] + 10}" y="18" style="font-family:var(--ui);font-size:11px;fill:var(--ink2)">start</text>
    ${segs}${towns}
    <g id="cyclist" transform="translate(${cx + 26},${cy + 22})">${CYCLIST}</g>
  </svg>`;
}
const CYCLIST = '<g transform="translate(-14,-17) scale(.3)"><circle cx="29" cy="64" r="14" fill="#fff" stroke="#1E1B16" stroke-width="5"/><circle cx="71" cy="64" r="14" fill="#fff" stroke="#1E1B16" stroke-width="5"/><path d="M29,64 H47 L39,44 Z M39,44 H63 L47,64 M63,44 L71,64" fill="none" stroke="#1E1B16" stroke-width="5" stroke-linejoin="round"/><path d="M39,41 L51,26 L63,38" fill="none" stroke="#2F6B3A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M40,42 L53,50 L47,63" fill="none" stroke="#2F6B3A" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="55" cy="18" r="7" fill="#1E1B16"/></g>';
function rideTo(u) {
  return new Promise(res => {
    const cy = $('#cyclist'); if (!cy || reduceMotion) return res();
    const from = UNIT[SQ[nextSquare()].u].n - 1, to = UNIT[u].n - 1;
    const a = from, b = to; if (a === b) return res();
    const segs = []; if (b > a) for (let i = a; i < b; i++) segs.push({el: $('#seg' + i), rev: false}); else for (let i = a - 1; i >= b; i--) segs.push({el: $('#seg' + i), rev: true});
    const lens = segs.map(s => s.el.getTotalLength()); const total = lens.reduce((x, y) => x + y, 0);
    const ms = Math.min(1600, 400 + total * 1.6); const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / ms); let d = total * (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
      let i = 0; while (i < segs.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
      const p = segs[i].el.getPointAtLength(segs[i].rev ? lens[i] - d : d);
      cy.setAttribute('transform', `translate(${p.x + 10},${p.y + 6})`);
      if (k < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}
let RIDING = false;
async function goTown(u) {
  const st = townState(u);
  if (st === 'later') { toast(`${UNIT[u].name} volgt later: ${UNIT[u].gram.toLowerCase()}.`); return; }
  if (RIDING) return;
  if (st !== 'locked') { RIDING = true; try { await rideTo(u); } finally { RIDING = false; } }
  PAD.lvl = 'town'; PAD.u = u; render(); $('#main').scrollTop = 0;
}

/* town plan: three squares on one street */
const SQ_PTS = [[60, 250], [150, 160], [250, 70]];
function sqState(q) { if (sqComplete(q)) return 'done'; if (!sqOpen(q)) return 'locked'; return nextSquare() === q ? 'next' : 'open'; }
function townSVG(u) {
  const qs = squaresOf(u);
  const street = roadPath(SQ_PTS.slice(0, qs.length));
  const blocks = [[18, 170, 40, 26], [110, 222, 34, 22], [214, 200, 46, 26], [230, 128, 30, 20], [100, 90, 44, 24], [20, 60, 36, 30], [286, 150, 36, 24]].map(b => `<rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="3"/>`).join('');
  const glyph = ['<circle r="7"/><circle r="2"/>', '<path d="M-9,6 H9 M-7,6 V-3 L0,-9 L7,-3 V6"/>', '<path d="M-8,5 L-8,-3 L0,-8 L8,-3 L8,5 Z M-3,5 V0 H3 V5"/>'];
  const sq = qs.map((q, i) => {
    const [x, y] = SQ_PTS[i]; const st = sqState(q.id);
    const box = {next: 'fill="var(--go)" stroke="var(--go)"', open: 'fill="#fff" stroke="var(--go)" stroke-width="2"', done: 'fill="#fff" stroke="var(--ink)" stroke-width="2"', locked: 'fill="#fff" stroke="#CFCAC1" stroke-width="1.5"'}[st];
    const gs = st === 'next' ? '#fff' : st === 'locked' ? '#BDB7AC' : 'var(--ink)';
    const right = i < 2; const tx = right ? x + 40 : x - 40;
    return `<g data-act="square" data-q="${q.id}" role="button" tabindex="0" style="cursor:pointer" aria-label="Plein ${q.n}: ${esc(q.name)}">
      <rect x="${x - 28}" y="${y - 28}" width="56" height="56" rx="10" ${box}/>
      <g transform="translate(${x},${y})" fill="none" stroke="${gs}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">${glyph[i % 3]}</g>
      ${st === 'done' ? `<g transform="translate(${x + 24},${y - 24})"><circle r="9" fill="var(--ink)"/><path d="M-4,0 l3,3 l5,-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>` : ''}
      <text x="${tx}" y="${y - 2}" text-anchor="${right ? 'start' : 'end'}" style="font-family:var(--display);font-size:15px;font-weight:600;fill:${st === 'locked' ? 'var(--faint)' : 'var(--ink)'}">${esc(q.name)}</text>
      <text x="${tx}" y="${y + 15}" text-anchor="${right ? 'start' : 'end'}" style="font-family:var(--ui);font-size:11.5px;fill:${st === 'locked' ? 'var(--faint)' : 'var(--ink2)'}">${esc(q.title.toLowerCase())}</text>
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 340 300" role="img" aria-label="Plattegrond van ${esc(UNIT[u].name)}">
    <path d="${street}" fill="none" stroke="#CFCAC1" stroke-width="10" stroke-linecap="round"/>
    <path d="${street}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>
    ${sq}
  </svg>`;
}
/* square: five guild houses */
const STEP_DESC = {ontdek: 'De regel, voorbeelden en de nieuwe woorden', oefen: 'Oefeningen · checkpoint bij 80%', lees: 'Een korte tekst', luister: 'Zinnen horen, kiezen en typen', gebruik: 'Praat of schrijf in je Claude Project'};
const STEPS = ['ontdek', 'oefen', 'lees', 'luister', 'gebruik'];
function guildSVG(q) {
  const shapes = ['M-20,36 V-4 H-14 V-12 H-7 V-20 H7 V-12 H14 V-4 H20 V36 Z', 'M-20,36 V-8 L0,-24 L20,-8 V36 Z', 'M-20,36 V-2 Q-20,-22 0,-22 Q20,-22 20,-2 V36 Z', 'M-20,36 V-14 H-9 V-22 H9 V-14 H20 V36 Z', 'M-20,36 V-6 L-10,-18 L0,-6 L10,-18 L20,-6 V36 Z'];
  const open = sqOpen(q); const nx = nextStep(q);
  const g = STEPS.map((st, i) => {
    const built = BUILT_STEPS.includes(st); const done = stepDone(q, st); const x = 34 + i * 68;
    let style, door, lab;
    if (!built) { style = 'fill="#fff" stroke="#DDD8CF" stroke-width="1.4" stroke-dasharray="3 3"'; door = '#DDD8CF'; lab = 'var(--faint)'; }
    else if (!open) { style = 'fill="#fff" stroke="#CFCAC1" stroke-width="1.5"'; door = '#CFCAC1'; lab = 'var(--faint)'; }
    else if (st === nx && !sqComplete(q)) { style = 'fill="var(--go)" stroke="var(--go)" stroke-width="2"'; door = '#fff'; lab = 'var(--go)'; }
    else { style = 'fill="#fff" stroke="var(--go)" stroke-width="2"'; door = 'var(--go)'; lab = 'var(--ink)'; }
    return `<g data-act="step" data-q="${q}" data-step="${st}" role="button" tabindex="0" style="cursor:pointer" aria-label="${STEP_NAME[st]}${done ? ', klaar' : ''}${built ? '' : ', later'}" transform="translate(${x},44)">
      <rect x="-30" y="-34" width="60" height="100" fill="transparent"/>
      <path d="${shapes[i]}" ${style} stroke-linejoin="round"/>
      <path d="M-5,36 V26 A5,5 0 0 1 5,26 V36" fill="none" stroke="${door}" stroke-width="1.6"/>
      ${done ? '<g transform="translate(0,8)"><circle r="9" fill="var(--ink)"/><path d="M-4,0 l3,3 l5,-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>' : ''}
      <text y="56" text-anchor="middle" style="font-family:var(--display);font-size:13px;font-weight:600;fill:${lab}">${STEP_NAME[st]}</text>
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 340 108" role="group" aria-label="Vijf gildehuizen"><path d="M0,80 H340" stroke="var(--ink)" stroke-width="1.2"/>${g}</svg>`;
}

/* ===== VIEWS ===== */
function viewPad() {
  if (PAD.lvl === 'sq' && SQ[PAD.q]) return viewSquare(PAD.q);
  if (PAD.lvl === 'town' && UNIT[PAD.u]) return viewTown(PAD.u);
  return `<div class="stack">
    <div class="spread"><div><h1 data-en="Path">Pad</h1><div class="small">Boog 1 · Rondkomen · A2</div></div>${testMode() ? '<span class="pill test" data-en="Test mode: everything is open">Testmodus</span>' : ''}</div>
    ${coachTip('pad', 'Dit is je pad. Elke stad leert één stuk grammatica, en de weg toont de volgorde. Groen betekent: hier kun je op tikken. De fietser staat bij je volgende stap.')}
    <div class="mapbox">${arcSVG()}</div>
    <div class="small">Boog 2 (Vlaanderen, B1) en boog 3 (B2) volgen later.</div>
  </div>`;
}
function viewTown(u) {
  const unit = UNIT[u]; const qs = squaresOf(u);
  const locked = townState(u) === 'locked';
  const wk = String(weekStartDay()); const mDone = S.mission[wk] === u;
  return `<div class="stack">
    <button class="back" data-act="pad-up">‹ Pad</button>
    <div><h1>${esc(unit.name)}</h1><div class="small" style="margin-top:2px">${esc(unit.gram)} · ${esc(unit.theme.toLowerCase())}</div></div>
    ${coachTip('town', 'Een stad heeft drie pleinen: korte lessen van 10 à 15 minuten. Doe ze in volgorde. Tik op een plein.')}
    <div class="mapbox">${townSVG(u)}</div>
    <div>${qs.map(q => { const st = sqState(q.id); const n = BUILT_STEPS.filter(s => stepDone(q.id, s)).length;
      return `<button class="tapline" data-act="square" data-q="${q.id}"><div class="t"><div class="nl" style="font-size:18px;${st === 'locked' ? 'color:var(--faint)' : ''}">${q.n} · ${esc(q.name)}</div><div class="small">${esc(q.title)} · ${st === 'locked' ? 'nog dicht' : st === 'done' ? 'klaar' : n + ' van 3 klaar'}</div></div><span class="chev" ${st === 'locked' ? 'style="color:var(--faint)"' : ''}>›</span></button>`; }).join('')}</div>
    ${locked ? `<div class="card soft stack" style="gap:8px"><div>${esc(unit.name)} is nog dicht. Je kunt je erin testen: 15 vragen over de hele stad.</div><button class="btn line" data-act="testout" data-qs="${qs.map(q => q.id).join(',')}">Test je in</button></div>` : ''}
    <div class="card soft stack" style="gap:6px"><div class="eyebrow" data-en="After this town">Na deze stad</div><div class="nl" style="font-size:17px">${esc(unit.can)}</div></div>
    <div class="row" style="align-items:flex-start;gap:12px"><button class="iconbtn" data-act="mission" data-u="${u}" aria-pressed="${mDone}" aria-label="Opdracht gedaan" style="border:1.5px solid ${mDone ? 'var(--ink)' : 'var(--go)'};border-radius:8px;width:32px;height:32px;flex:none;font-size:16px;${mDone ? 'background:var(--ink);color:#fff' : ''}">${mDone ? '✓' : ''}</button><div><div class="eyebrow" data-en="Field mission this week">Opdracht in de stad</div><div>${esc(unit.mission)}</div></div></div>
    <button class="link" data-act="unit-set" data-u="${u}">Oefen de woorden van ${esc(unit.name)} ›</button>
  </div>`;
}
function viewSquare(q) {
  const sq = SQ[q]; const unit = UNIT[sq.u]; const open = sqOpen(q);
  return `<div class="stack">
    <button class="back" data-act="pad-town" data-u="${sq.u}">‹ ${esc(unit.name)}</button>
    <div><div class="eyebrow">Plein ${sq.n} van 3</div><h1>${esc(sq.name)}</h1><div class="small" style="margin-top:2px">${esc(sq.title)} · ${esc(sq.en)}</div></div>
    ${coachTip('square', 'Op elk plein staan vijf gildehuizen. Het groene huis is je volgende stap. Lees en Gebruik zijn nog in aanbouw.')}
    ${guildSVG(q)}
    ${open ? '' : `<div class="card soft stack" style="gap:8px"><div>Dit plein gaat open als je het vorige plein klaar hebt. Of test je erin: 8 vragen.</div><button class="btn line" data-act="testout" data-qs="${q}">Test je in</button></div>`}
    <div>${STEPS.map(st => { const built = BUILT_STEPS.includes(st); const sc = S.sq[q] && S.sq[q].steps && S.sq[q].steps[st];
      return `<button class="tapline" data-act="step" data-q="${q}" data-step="${st}" ${built && open ? '' : 'aria-disabled="true"'}><div class="t"><div style="font-weight:600;${built && open ? '' : 'color:var(--faint)'}">${STEP_NAME[st]}${sc ? ` <span class="small">· ${sc === 'test' ? 'getest' : sc === 1 ? 'gelezen' : sc + '%'}</span>` : ''}</div><div class="small">${STEP_DESC[st]}${built ? '' : ' · later'}</div></div><span class="chev" ${built && open ? '' : 'style="color:var(--faint)"'}>›</span></button>`; }).join('')}</div>
  </div>`;
}
function viewNaslag() {
  const segs = [['grammatica', 'Grammatica', 'Grammar'], ['werkwoorden', 'Werkwoorden', 'Verbs'], ['woorden', 'Woorden', 'Words'], ['sets', 'Sets', 'Word sets']];
  let body = '';
  if (NASLAG === 'grammatica') {
    body = `<div>${SQUARES.map(q => `<button class="tapline" data-act="lesson-ro" data-q="${q.id}"><div class="t"><div class="nl" style="font-size:18px">${esc(q.title)}</div><div class="small">${esc(UNIT[q.u].name)} · ${esc(q.name)}</div></div><span class="chev">›</span></button>`).join('')}</div>
      ${extrasBlock()}
      <div class="card stack" style="gap:8px"><div class="eyebrow">Het zinsschema</div><div class="small">Elke hoofdzin past hierin. Goud is het werkwoord.</div>${frameHTML(SX.u2s2)}</div>`;
  } else if (NASLAG === 'werkwoorden') {
    body = `<div class="list">${LEX.filter(l => l.v).map(l => `<div class="li" data-act="word" data-id="${l.id}" role="button" tabindex="0"><span class="w">${esc(l.w)}</span><span class="d"><span class="verbword">${esc(vForms(l).hij)}</span> · ${esc(l.v.im[0])} · ${esc((l.v.sep || '') + l.v.pp)}</span></div>`).join('')}</div>`;
  } else if (NASLAG === 'woorden') {
    body = `<input type="search" id="wsearch" placeholder="Zoek een woord" aria-label="Zoek een woord" value="${esc(WQ)}"><div class="row wrap">${[['alle', 'alle'], ['de', 'de'], ['het', 'het'], ['v', 'werkwoorden'], ['eigen', 'eigen']].map(f => `<button class="chip${WF === f[0] ? ' on' : ''}" data-act="wfilter" data-f="${f[0]}">${f[1]}</button>`).join('')}</div><div id="wlist">${wordList()}</div>`;
  } else {
    const unitSets = UNITS.filter(u => u.built).map(u => ({id: 'unit-' + u.id, name: u.name, ids: lexOfUnit(u.n).map(l => l.id), unit: true}));
    body = coachTip('sets', 'Een set is een lijst woorden om te studeren: als kaarten (omdraaien) of door te typen. Elke stad heeft een set; je kunt ook je eigen sets en woorden maken.') +
      `<div>${unitSets.concat(S.sets).map(s => `<div class="tapline" style="cursor:default"><div class="t"><div class="nl" style="font-size:18px">${esc(s.name)}</div><div class="small">${s.ids.length} woorden${s.unit ? '' : ' · eigen set'}</div></div><button class="btn line" style="min-height:40px;padding:8px 12px" data-act="set-study" data-id="${s.id}" data-mode="flip" ${s.ids.length ? '' : 'disabled'}>Kaarten</button><button class="btn line" style="min-height:40px;padding:8px 12px" data-act="set-study" data-id="${s.id}" data-mode="type" ${s.ids.length ? '' : 'disabled'}>Typen</button>${s.unit ? '' : `<button class="iconbtn" data-act="set-edit" data-id="${s.id}" aria-label="Bewerk set" style="color:var(--go)">✎</button>`}</div>`).join('')}</div>
      <div class="grid2"><button class="btn line" data-act="set-new">Nieuwe set</button><button class="btn line" data-act="word-new">Nieuw woord</button></div>`;
  }
  return `<div class="stack"><h1 data-en="Reference">Naslag</h1><div class="row wrap">${segs.map(s => `<button class="chip${NASLAG === s[0] ? ' on' : ''}" data-act="naslag" data-seg="${s[0]}" data-en="${s[2]}">${s[1]}</button>`).join('')}</div>${body}</div>`;
}
let WQ = '', WF = 'alle';
function wordList() {
  const all = LEX.concat(Object.values(S.custom || {})); const q = norm(WQ);
  const res = all.filter(l => (WF === 'alle' || (WF === 'v' ? l.p === 'v' : WF === 'eigen' ? l.custom : l.g === WF)) && (!q || norm(l.w).includes(q) || norm(l.d || '').includes(q)));
  if (!res.length) return `<div class="small" style="padding:12px 0">Geen woorden gevonden.</div>`;
  return `<div class="list">${res.map(l => `<div class="li" data-act="word" data-id="${esc(l.id)}" role="button" tabindex="0"><span class="w">${wordHTML(l)}</span><span class="d">${esc(l.d || '')}</span></div>`).join('')}</div>`;
}
function viewIk() {
  const bars = [['Woordenschat', 'Vocabulary', skillStat(k => /:(rec|prod)$/.test(k))], ['De / het', 'Articles', skillStat(k => k.endsWith(':gen'))], ['Vervoegen', 'Conjugation', skillStat(k => k.endsWith(':conj'))], ['Grammatica', 'Word order', skillStat(k => k.endsWith(':ord'))], ['Luisteren', 'Listening', skillStat(k => k.endsWith(':lis'))], ['Lezen', 'Reading', null], ['Spreken', 'Speaking', null], ['Schrijven', 'Writing', null]];
  const voices = Audio.voices;
  return `<div class="stack">
    <h1 data-en="Me">Ik</h1>
    <div class="grid2"><div><div class="big-num">${wordsKnown()}</div><div class="small">woorden gekend</div></div><div><div class="big-num">${sentencesKnown()}</div><div class="small">zinnen beheerst</div></div></div>
    ${weekBlock()}
    <div class="stack" style="gap:10px"><div class="eyebrow" data-en="Your eight skills">Je acht vaardigheden</div>
      ${bars.map(b => b[2] === null ? `<div class="bar soon"><span data-en="${b[1]}">${b[0]}</span><div class="track"></div><span class="num">later</span></div>` : `<div class="bar"><span data-en="${b[1]}">${b[0]}</span><div class="track"><div class="fill" style="width:${Math.round(b[2] * 100)}%"></div></div><span class="num">${Math.round(b[2] * 100)}%</span></div>`).join('')}
    </div>
    <button class="tapline" data-act="then"><div class="t"><div style="font-weight:600">Toen en nu</div><div class="small">Je eerste gesprek en tekst naast je laatste</div></div><span class="chev">›</span></button>
    <button class="tapline" data-act="help"><div class="t"><div style="font-weight:600">Hoe werkt Elke Dag Zin?</div><div class="small">Rondleiding, kleuren en begrippen</div></div><span class="chev">›</span></button>
    <div class="stack" style="gap:6px"><div class="eyebrow" data-en="Settings">Instellingen</div>
      <label class="f" for="set-start">Openen in<select id="set-start"><option value="scroll" ${S.settings.startView !== 'pad' ? 'selected' : ''}>Scroll: snelle kaarten</option><option value="pad" ${S.settings.startView === 'pad' ? 'selected' : ''}>Pad: de kaart en je volgende stap</option></select></label>
      <label class="switch" for="set-tour"><span><b>Rondleiding bij het openen</b><br><span class="small">Toon de uitleg elke keer dat je de app opent. Hoe werkt Elke Dag Zin? hierboven toont ze altijd.</span></span><input type="checkbox" id="set-tour" ${S.settings.tourOnStart ? 'checked' : ''}></label>
      <label class="switch" for="set-tips"><span><b>Uitlegkaartjes</b><br><span class="small">De groene tips bovenaan een scherm, één keer per scherm</span></span><input type="checkbox" id="set-tips" ${S.settings.tips !== false ? 'checked' : ''}></label>
      <label class="switch" for="set-test"><span><b>Testmodus</b><br><span class="small">Alle steden en pleinen open, om de app te testen</span></span><input type="checkbox" id="set-test" ${testMode() ? 'checked' : ''}></label>
      <label class="f" for="set-rate">Spreeksnelheid: <span id="rate-out">${S.settings.rate}</span></label>
      <input id="set-rate" type="range" min="0.6" max="1.1" step="0.05" value="${S.settings.rate}">
      <label class="f" for="set-voice">Stem<select id="set-voice">${voices.length ? voices.map(v => `<option value="${esc(v.name)}" ${Audio.voice() && Audio.voice().name === v.name ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('') : '<option>Geen Nederlandse stem gevonden</option>'}</select></label>
      <button class="link" data-act="say" data-text="Morgen neem ik de tram naar de Groenplaats.">Test de stem ›</button>
      <div class="small">Op iPhone: download <i>Ellen (verbeterd)</i> via Instellingen → Toegankelijkheid → Gesproken materiaal → Stemmen → Nederlands (België).</div>
      <label class="f" for="set-cap">Herhalingen per dag<select id="set-cap">${[30, 60, 90, 150].map(n => `<option value="${n}" ${S.settings.cap === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    </div>
    <div class="stack" style="gap:6px"><div class="eyebrow" data-en="Backup">Back-up</div>
      <div class="small">Je voortgang staat alleen op dit toestel. Bewaar af en toe een back-up in Bestanden.${S.settings.lastBackup ? ' Laatste back-up: ' + esc(dateKey(new Date(S.settings.lastBackup))) + '.' : ''}</div>
      <div class="grid2"><button class="btn line" data-act="export" data-en="Save backup">Bewaar back-up</button><button class="btn line" data-act="import" data-en="Restore backup">Zet back-up terug</button></div>
      <button class="link" data-act="export-text" data-en="Copy as text">Kopieer als tekst ›</button>
      <input type="file" id="imp-file" accept="application/json,.json" hidden>
      <button class="link" data-act="reset" style="color:var(--warn)">Alles wissen</button>
    </div>
  </div>`;
}
/* render: see app13 */
