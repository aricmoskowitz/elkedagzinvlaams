/* ===== VERSION 2.10: a sign for every town's theme, on the Pad and on the town map =====
   Each town has one pixel sign for its theme: a tram for the trams, plants for the plant market, a hospital for the doctor's town.
   2.11: it stands in the middle of every square (the cyclist rides over it and waits beside it), and the town map has more of
   them, small, on the grass around the pleinen. Gold with sparkles after Ronde 3: on the Pad and on the grass when every plein
   of the town has passed it, in the middle of a plein when that plein has. Grey while the town or plein is closed. */

// 14 px wide sprites, simple shapes without stands, tracks or steam, one character per pixel; '.' is empty, K is the outline
const LM_COL = {K: '#2A2620', W: '#F4EFE4', Y: '#F2C14E', B: '#8FB8DE', G: '#8C877E', R: '#C8553D', L: '#5E9E4E', D: '#3F7A38', O: '#C9743A', N: '#9C6B4A',
  F: '#F2D35B', C: '#E8E1D2', S: '#B9D7EF', P: '#8C5A9E', A: '#D08A3A', X: '#D23B30', U: '#6E8FB5'};
const LANDMARK_ART = {
  tram: ['......KK......', '......K.......', 'KKKKKKKKKKKKKK', 'KWWWWWWWWWWWWK', 'KWBBWBBWBBWBBK', 'KWBBWBBWBBWBBK', 'KWWWWWWWWWWWWK', 'KYYYYYYYYYYYYK', 'KKKKKKKKKKKKKK', '.KK.KK..KK.KK.'],
  plants: ['...R......R...', '..RYR....RYR..', '...R..LL..R...', '...L..LL..L...', '...LL.DD.LL...', '....LLDDLL....', '.....LDDL.....', '..KKKKKKKKKK..', '...KOOOOOOK...', '...KOOOOOOK...', '....KKKKKK....'],
  fries: ['...F.F.FF.F...', '..FFFFFFFFFF..', '..FFFFFFFFFF..', '..KKKKKKKKKK..', '..KXXWXXWXXK..', '...KXWXXWXK...', '...KXXWXXXK...', '....KXWXXK....', '....KXXWXK....', '.....KXXK.....', '......KK......'],
  cup: ['..KKKKKKKKK...', '..KWWWWWWWKKK.', '..KNNNNNNNK.K.', '..KWWWWWWWK.K.', '...KWWRWWK.K..', '...KWWWWWKK...', '....KKKKK.....', 'KKKKKKKKKKKKK.', '.KCCCCCCCCCK..', '..KKKKKKKKK...'],
  book: ['.KKKKK..KKKKK.', 'KWWWWWKKWWWWWK', 'KWGGGWKKWGGGWK', 'KWWWWWKKWWWWWK', 'KWGGGWKKWGGWWK', 'KWWWWWKKWWWWWK', 'KWGGWWKKWGGGWK', 'KWWWWWKKWWWWWK', 'KPPPPPKKPPPPPK', '.KKKKKKKKKKKK.'],
  gable: ['.....KKKK.....', '.....KCCK.....', '...KKKCCKKK...', '...KCCBBCCK...', '.KKKCCCCCCKKK.', '.KCCBBCCBBCCK.', '.KCCBBCCBBCCK.', '.KCCCCCCCCCCK.', '.KCCBBCNNCCCK.', '.KCCBBCNNCCCK.', '.KKKKKKKKKKKK.'],
  weather: ['..........F...', '.......F.FFF.F', '.........FFFF.', '.....KKKK.FFF.', '...KKWWWWK.F..', '..KWWWWWWWKK..', '.KWWWWWWWWWWK.', 'KWWWWWWWWWWWWK', '.KKKKKKKKKKKK.', '..U..U..U..U..', '.U..U..U..U...'],
  hospital: ['KKKKKKKKKKKKKK', 'KWWWWWXXWWWWWK', 'KWWWWWXXWWWWWK', 'KWWWXXXXXXWWWK', 'KWWWXXXXXXWWWK', 'KWWWWWXXWWWWWK', 'KWWWWWXXWWWWWK', 'KWBBWWWWWWBBWK', 'KWBBWWNNWWBBWK', 'KWWWWWNNWWWWWK', 'KKKKKKKKKKKKKK'],
};
// the town's theme → its landmark (a new town adds a line here; tests/validate.js checks every built town has one)
const TOWN_LANDMARK = {
  u1: ['tram', 'De tram'], u2: ['plants', 'Een plantenkraam'], u3: ['fries', 'Een frietkot'], u4: ['cup', 'Een kop koffie'], u5: ['book', 'Een verhalenboek'],
  u6: ['gable', 'Een trapgevel'], u7: ['weather', 'Zon, wolk en regen'], u11: ['hospital', 'Het ziekenhuis'],
};
Object.keys(LANDMARK_ART).forEach(k => { LANDMARK_ART[k] = LANDMARK_ART[k].map(r => r.padEnd(14, '.').slice(0, 14)); });
const LM_W = 14, lmH = key => LANDMARK_ART[key].length;
// gold or grey versions keep the light and dark of each colour
const lum = hex => { const n = parseInt(hex.slice(1), 16); return (0.3 * (n >> 16) + 0.59 * (n >> 8 & 255) + 0.11 * (n & 255)) / 255; };
function lmColour(ch, mode) {
  const c = LM_COL[ch]; if (!c || ch === 'K' || !mode) return c;
  const l = lum(c); const shades = mode === 'gold' ? ['#A87A22', '#D9A12A', '#EFC447', '#F6DA7A'] : ['#9C978D', '#B8B3A9', '#CFCAC1', '#E4E0D8'];
  return shades[l < .45 ? 0 : l < .62 ? 1 : l < .8 ? 2 : 3];
}
function landmarkSVG(key, x, y, s, mode, label, spark = true) {
  let r = ''; LANDMARK_ART[key].forEach((row, j) => [...row].forEach((ch, i) => { const col = lmColour(ch, mode); if (col) r += `<rect x="${i}" y="${j}" width="1.05" height="1.05" fill="${col}"/>`; }));
  const w = LM_W * s, h = lmH(key) * s;
  return `<g class="landmark${mode === 'gold' ? ' gold' : ''}" role="img" aria-label="${esc(label)}" style="pointer-events:none"><g transform="translate(${x},${y}) scale(${s})" shape-rendering="crispEdges">${r}</g>${mode === 'gold' && spark ? sparkles(x + w / 2, y + h / 2, Math.max(w, h) * .55) : ''}</g>`;
}
// Ronde 3 passed on every plein of the town
const townRonde3 = u => !!UNIT[u] && UNIT[u].built && squaresOf(u).length > 0 && squaresOf(u).every(q => pleinProgress(q.id).ronde >= 3);
const lmMode = u => townRonde3(u) ? 'gold' : '';

/* ---------- where it stands: in the middle of every square, just left of the cyclist's spot (standPx), on the same ground line;
   the cyclist rides over it through the centre and waits beside it. Names keep off it (lmRects joins the `taken` list). ---------- */
const WLM_S = 1, TLM_S = 1.5;
const lmAt = ([cx, cy], key, s) => ({x: cx - LM_W * s, y: cy + 8 - lmH(key) * s, w: LM_W * s, h: lmH(key) * s});
const lmKey = u => TOWN_LANDMARK[u] && TOWN_LANDMARK[u][0];
// Pad: one per town square; town map: one per plein (the Grote Markt keeps its fountain)
function lmRects(level, u) {
  if (level === 'pad') return UNITS.map((t, i) => lmKey(t.id) ? lmAt(townPx(i), lmKey(t.id), WLM_S) : null).filter(Boolean).map(r => [r.x, r.y, r.w, r.h]);
  return lmKey(u) ? squaresOf(u).map((q, j) => lmAt(sqCenter(TSQ[j]), lmKey(u), TLM_S)).map(r => [r.x, r.y, r.w, r.h]) : [];
}
const _buildWorld = buildWorld; // wrapped on purpose: a square with a theme sign drops its fountain
buildWorld = function () { _buildWorld(); WORLD.squares.forEach((q, i) => { q.sign = !!(UNITS[i] && lmKey(UNITS[i].id)); }); };
const _worldOverlay = worldOverlay; // wrapped on purpose: the landmarks go under the names, flags and cyclist
worldOverlay = function () {
  const lms = UNITS.map((u, i) => { const lm = TOWN_LANDMARK[u.id]; if (!lm) return ''; const st = townState(u.id); const off = st === 'later' || st === 'locked'; const L = lmAt(townPx(i), lm[0], WLM_S);
    return landmarkSVG(lm[0], L.x, L.y, WLM_S, off ? 'grey' : lmMode(u.id), `${lm[1]} in ${u.name}: ${u.theme}${townRonde3(u.id) ? ', Ronde 3 overal gehaald' : ''}`); }).join('');
  return lms + _worldOverlay();
};

/* ---------- the town map also has the same sign, small, here and there on the grass around the pleinen ---------- */
const LM_FREE = ['grass', 'flower', 'tuft', 'field', 'field2'];
const SCATTER_MAX = 9;
// free blocks of grass (a ring of one cell keeps them off roads and houses), spread out over the map; marked as 'house' so names and trees keep off
function scatterSpots(g, wc, hc, ok, n) {
  const hard = t => ['road', 'house', 'plaza', 'path', 'bridge'].includes(t); const out = [];
  const free = (x, y) => { for (let dy = -1; dy <= hc; dy++) for (let dx = -1; dx <= wc; dx++) { const t = g[y + dy] && g[y + dy][x + dx]; const inside = dy >= 0 && dy < hc && dx >= 0 && dx < wc;
    if (t === undefined || (inside ? !LM_FREE.includes(t) && t !== 'tree' && t !== 'treeX' : hard(t))) return false; } return true; };
  while (out.length < n) {
    let best = null;
    for (let y = 1; y + hc < g.length - 1; y++) for (let x = 1; x + wc < g[0].length - 1; x++) {
      if (!free(x, y) || !ok(x, y)) continue;
      const d = out.length ? Math.min(...out.map(o => Math.hypot(o.x - x, o.y - y))) : 99; if (d < 6) continue;
      const sc = -d + hsh(x * 1.7, y * 2.3) * 2; // the farthest from the others, a little shuffled
      if (!best || sc < best.sc) best = {x, y, sc};
    }
    if (!best) break;
    for (let dy = 0; dy < hc; dy++) for (let dx = 0; dx < wc; dx++) g[best.y + dy][best.x + dx] = 'house';
    out.push(best);
  }
  return out;
}
const lmCells = (key, s) => [Math.ceil(LM_W * s / TS), Math.ceil(lmH(key) * s / TS)];
const _buildTown = buildTown; // wrapped on purpose: the scattered signs are placed after the houses and trees
buildTown = function (u) {
  if (TOWN_CACHE[u]) return TOWN_CACHE[u];
  const T = _buildTown(u); const key = lmKey(u); T.scatter = []; if (!key) return T;
  T.squares.forEach((q, j) => { q.sign = j < 3; });
  const [wc, hc] = lmCells(key, 1);
  // off the squares, and first where the names would stand (with the cyclist on any plein), so a sign never takes a name's spot
  const clear = (x, y) => TSQ.every(q => x + wc <= q.t[0] - q.h - 2 || x >= q.t[0] + q.h + 2 || y + hc <= q.t[1] - q.h - 3 || y >= q.t[1] + q.h + 2);
  const [mx, my] = sqCenter(TSQ[3]), mh = TSQ[3].h * TS;
  const names = [-1, 0, 1, 2].flatMap(here => { // the cyclist on no plein or on one of them
    const taken = squaresOf(u).flatMap((q, j) => { const [x, y] = sqCenter(TSQ[j]); return [[x - 28, y - 18, 56, 14]].concat(j === here ? [heroRect(x, y)] : []); })
      .concat([[mx - mh, my - mh + 2, 2 * mh, 14], [mx - mh, my + 2, 2 * mh, 14], [mx - 10, my - 12, 20, 20]], lmRects('town', u));
    return squaresOf(u).map((q, j) => { const [x, y] = sqCenter(TSQ[j]); return placeSign(T.g, q.name, x, y, taken, j === 0 ? 'S' : 'N'); })
      .concat(['★ Grote Markt', '★ Grote Markt · 100%'].map(t => placeSign(T.g, t, mx, my, taken.slice(), 'N'))).flatMap(n => [n.r, n.a]); });
  // the sign, the flag row above it and a margin stay off every name
  const offNames = (x, y) => names.every(([nx, ny, nw, nh]) => x * TS >= nx + nw + 4 || (x + wc) * TS <= nx - 4 || (y - 1) * TS >= ny + nh + 4 || (y + hc) * TS <= ny - 4);
  T.scatter = scatterSpots(T.g, wc, hc, (x, y) => clear(x, y) && offNames(x, y), SCATTER_MAX).map(p => ({key, x: p.x * TS + (wc * TS - LM_W) / 2, y: p.y * TS + (hc * TS - lmH(key))}));
  return T;
};
const _townOverlay = townOverlay; // wrapped on purpose: the landmarks go under the names, flags and cyclist
townOverlay = function (u) {
  const T = buildTown(u); const lm = TOWN_LANDMARK[u]; if (!lm) return _townOverlay(u); const unit = UNIT[u];
  const all = lmMode(u); const many = T.scatter.map(p => landmarkSVG(p.key, p.x, p.y, 1, all, lm[1], false)).join('');
  // the one in the middle of a plein turns gold when that plein has passed Ronde 3
  const mid = squaresOf(u).map((q, j) => { const L = lmAt(sqCenter(TSQ[j]), lm[0], TLM_S); const r3 = pleinProgress(q.id).ronde >= 3;
    return landmarkSVG(lm[0], L.x, L.y, TLM_S, sqState(q.id) === 'locked' ? 'grey' : r3 ? 'gold' : '', `${lm[1]} op ${q.name}: het thema van ${unit.name}, ${unit.theme}${r3 ? '. Ronde 3 gehaald' : ''}`); }).join('');
  return `<g aria-hidden="true">${many}</g>` + mid + _townOverlay(u);
};
