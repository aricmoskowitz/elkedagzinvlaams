/* ===== VERSION 2.4: progress you can see =====
   One visual language on every level:
   - a building is a piece of work: grey until it is done, in its colour once done
   - a yellow flag on it = gehaald (80% or more); a flag with a white star = 100%
   - a pennant on a plein's square grows with Ronde 1, 2 and 3 (one star per extra round)
   - bunting over a Grote Markt (and around a town on the Pad) = the Grote Markt is done
   - gold kerbs and sparkles = everything perfect
   Stad map: each plein has its own five guild houses, in the same colours as on the plein.
   Pad: each town has three plein houses and a town hall for its Grote Markt. */

/* ---------- the numbers ---------- */
// 0 = not yet, 1 = gehaald, 2 = 100% (Ontdek and Gebruik are done or not; a test-out counts as gehaald)
function houseLevel(q, st) {
  const v = S.sq[q] && S.sq[q].steps && S.sq[q].steps[st]; if (!v) return 0;
  if (v === 'test') return 1; if (st === 'ontdek' || st === 'gebruik') return 2;
  return v >= 100 ? 2 : 1;
}
function pleinProgress(q) {
  const levels = STEPS.map(st => houseLevel(q, st));
  const complete = sqComplete(q); const r = (S.sq[q] && S.sq[q].rounds && S.sq[q].rounds.oefen) || 1;
  const ronde = stepDone(q, 'oefen') ? r : 0;
  return {levels, done: levels.filter(Boolean).length, top: levels.filter(l => l === 2).length, complete, ronde, perfect: levels.every(l => l === 2) && ronde >= 3};
}
const missionDone = u => !!(S.missions || {})[u];
function townProgress(u) {
  const ps = squaresOf(u).map(q => pleinProgress(q.id)); const m = (S.markt || {})[u] || 0;
  return {pleinen: ps, complete: ps.filter(p => p.complete).length, perfectPleinen: ps.filter(p => p.perfect).length, markt: m, marktDone: m >= 80, marktTop: m >= 100, mission: missionDone(u),
    perfect: ps.length > 0 && ps.every(p => p.perfect) && m >= 100 && missionDone(u)};
}

/* ---------- the opdracht in de stad: one per town, the same box everywhere ---------- */
// 1.5–2.3 kept one town per week in S.mission; 2.4 keeps a date per town (S.missions) and still fills S.mission for the week bar
// the town's goal: grammar, theme and what you can do after it (stad page and Grote Markt)
function goalCard(u) {
  const unit = UNIT[u];
  return `<div class="goal">
      <div class="gr"><span class="gk" data-en="Grammar">Grammatica</span><span class="gv">${esc(unit.gram)}</span></div>
      <div class="gr"><span class="gk" data-en="Theme">Thema</span><span class="gv">${esc(unit.theme)}</span></div>
      <div class="gr can"><span class="gk" data-en="After this town you can">Na deze stad</span><span class="gv nl">${esc(unit.can)}</span></div>
    </div>`;
}
function missionToggle(u) {
  S.missions = S.missions || {}; const wk = String(weekStartDay());
  if (S.missions[u]) { delete S.missions[u]; if (S.mission[wk] === u) S.mission[wk] = null; }
  else { S.missions[u] = dateKey(); S.mission[wk] = u; toast('Goed gedaan. Amai!'); }
  Store.mark('state'); render();
}
function missionRow(u) {
  const unit = UNIT[u]; const on = missionDone(u); const d = on ? S.missions[u] : '';
  return `<div class="mission"><button class="mbox${on ? ' on' : ''}" data-act="mission" data-u="${u}" role="checkbox" aria-checked="${on}" aria-label="Opdracht in de stad gedaan">${on ? '✓' : ''}</button>
    <div><div class="eyebrow" data-en="Field mission">Opdracht in de stad</div><div>${esc(unit.mission || '')}</div>${on ? `<div class="small">Gedaan op ${esc(shortDate(d))}</div>` : ''}</div></div>`;
}

/* ---------- small pixel pieces for the map overlays (SVG) ---------- */
const GOLD = '#E0A82E';
function miniFlag(x, y, top) {
  return `<g transform="translate(${x},${y})" shape-rendering="crispEdges"><rect width="1.4" height="11" fill="#2A2620"/><rect x="1.4" width="8" height="5" fill="${top ? GOLD : '#F2D35B'}" stroke="#2A2620" stroke-width=".8"/>${top ? '<path d="M5.4,0.7 L6.1,2 L7.5,2.1 L6.4,3 L6.8,4.3 L5.4,3.6 L4,4.3 L4.4,3 L3.3,2.1 L4.7,2 Z" fill="#fff"/>' : ''}</g>`;
}
// the plein's pennant: Ronde 1 small, Ronde 2 bigger with a star, Ronde 3 biggest with two stars; gold when perfect
function pennant(x, y, ronde, perfect) {
  if (!ronde) return ''; const h = 10 + 5 * ronde, w = 7 + 3 * ronde, ph = 5 + 2 * ronde;
  const star = (cx, cy, r) => `<path d="${Array.from({length: 10}, (_, k) => { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * .45 : r; return (k ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2); }).join('')}Z" fill="#fff"/>`;
  const stars = Array.from({length: ronde - 1}, (_, k) => star(3.6 + k * 4.6, ph / 2, 2.2)).join('');
  return `<g transform="translate(${x},${y - h})" shape-rendering="crispEdges"><rect width="1.6" height="${h}" fill="#2A2620"/><path d="M1.6,0 h${w} l-3,${ph / 2} l3,${ph / 2} h-${w} z" fill="${perfect ? GOLD : '#C8553D'}" stroke="#2A2620" stroke-width=".9"/><g transform="translate(1.6,0)">${stars}</g></g>`;
}
// feestvlaggetjes: a sagging string of small triangles between two points
function bunting(x1, y1, x2, y2, gold) {
  const n = Math.max(3, Math.round(Math.hypot(x2 - x1, y2 - y1) / 7)); const cols = gold ? [GOLD, '#F2D35B'] : FACADE;
  let s = `<path d="M${x1},${y1} Q${(x1 + x2) / 2},${(y1 + y2) / 2 + 7} ${x2},${y2}" fill="none" stroke="#2A2620" stroke-width=".8"/>`;
  for (let k = 1; k < n; k++) { const t = k / n; const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * (x1 + x2) / 2 + t * t * x2, y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * ((y1 + y2) / 2 + 7) + t * t * y2;
    s += `<path d="M${x - 2},${y} L${x + 2},${y} L${x},${y + 4} Z" fill="${cols[k % cols.length]}" stroke="#2A2620" stroke-width=".5"/>`; }
  return `<g aria-hidden="true">${s}</g>`;
}
// sparkles around a perfect square (they twinkle unless reduced motion); pts overrides where they go
function sparkles(cx, cy, r, pts) {
  return `<g class="sparkle" aria-hidden="true">${(pts || [[-1, -1, 0], [1, -.8, .4], [1.1, .9, .8], [-.9, 1, 1.2], [0, -1.25, .6]]).map(([dx, dy, dl]) => `<g transform="translate(${cx + dx * r},${cy + dy * r})"><path style="animation-delay:${dl}s" d="M0,-7 L1.6,-1.6 L7,0 L1.6,1.6 L0,7 L-1.6,1.6 L-7,0 L-1.6,-1.6 Z" fill="#fff" stroke="${GOLD}" stroke-width="1"/></g>`).join('')}</g>`;
}

/* ---------- a guild house on the stad map (canvas), in the plein's colours ---------- */
function drawMiniGuild(R, px, py, col, on) {
  const ink = on ? '#2A2620' : '#A9A49A', c = on ? col : '#DAD5CC', win = on ? '#F4EFE4' : '#EEEAE2';
  [[2, 6, 12, 10], [4, 3, 8, 3], [6, 1, 4, 2]].forEach(([x, y, w, h]) => R(px + x - 1, py + y - 1, w + 2, h + 1, ink));
  [[2, 6, 12, 10], [4, 3, 8, 3], [6, 1, 4, 2]].forEach(([x, y, w, h]) => R(px + x, py + y, w, h, c));
  R(px + 4, py + 8, 3, 3, win); R(px + 9, py + 8, 3, 3, win); R(px + 6, py + 12, 4, 4, ink);
}

/* ---------- the legend, under the maps ---------- */
function progressLegend(level) {
  const row = (icon, text) => `<div class="lg"><svg viewBox="0 0 22 18" width="22" height="18" aria-hidden="true">${icon}</svg><span>${text}</span></div>`;
  const house = (col, on) => `<g shape-rendering="crispEdges"><rect x="4" y="7" width="12" height="10" fill="${on ? col : '#DAD5CC'}" stroke="${on ? '#2A2620' : '#A9A49A'}"/><rect x="7" y="3" width="6" height="4" fill="${on ? col : '#DAD5CC'}" stroke="${on ? '#2A2620' : '#A9A49A'}"/></g>`;
  return `<details class="legend"><summary data-en="What the flags mean">Wat betekenen de vlaggen?</summary><div class="lgs">
    ${row(house('#C8553D', false), level === 'pad' ? 'Grijs huis: dit plein is nog niet klaar' : 'Grijs gildehuis: nog niet gedaan')}
    ${row(house('#C8553D', true) + miniFlag(13, 0, false), level === 'pad' ? 'Huis met vlag: plein klaar' : 'Gekleurd met gele vlag: gehaald (80% of meer)')}
    ${row(house('#C8553D', true) + miniFlag(13, 0, true), level === 'pad' ? 'Vlag met ster: plein perfect' : 'Vlag met ster: 100%')}
    ${level === 'pad' ? '' : row(pennant(9, 18, 3, false), 'Wimpel op het plein: groeit met Ronde 1, 2 en 3')}
    ${row(bunting(1, 6, 21, 6, false), level === 'pad' ? 'Vlaggetjes rond de stad: Grote Markt gehaald' : 'Vlaggetjes: Grote Markt gehaald')}
    ${row(`<rect x="2" y="5" width="13" height="11" fill="#DDD4C3" stroke="${GOLD}" stroke-width="2"/><path transform="translate(17,5)" d="M0,-4.5 L1.1,-1.1 L4.5,0 L1.1,1.1 L0,4.5 L-1.1,1.1 L-4.5,0 L-1.1,-1.1 Z" fill="#fff" stroke="${GOLD}" stroke-width=".9"/>`, level === 'pad' ? 'Goud en glitter: de hele stad perfect' : 'Goud en glitter: alles 100% en Ronde 3')}
  </div></details>`;
}
