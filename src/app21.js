/* ===== VERSION 2.10: a landmark for every town's theme, on the Pad and on the town map =====
   Each town shows one pixel landmark for its theme: a tram for the trams, a plant stall for the plant market,
   a hospital for the doctor's town. It stands on free grass (never on a road, a square, a house or a name)
   and turns gold, with sparkles, when every plein of the town has passed Ronde 3. Grey while the town is closed. */

// 24 px wide sprites, one character per pixel; '.' is empty, K is the outline
const LM_COL = {K: '#2A2620', W: '#F4EFE4', Y: '#F2C14E', B: '#8FB8DE', G: '#8C877E', R: '#C8553D', L: '#5E9E4E', D: '#3F7A38', O: '#C9743A', N: '#9C6B4A',
  F: '#F2D35B', C: '#E8E1D2', S: '#B9D7EF', P: '#8C5A9E', A: '#D08A3A', X: '#D23B30', U: '#6E8FB5'};
const LANDMARK_ART = {
  tram: ['..........KKKK..........', '...........K............', '..KKKKKKKKKKKKKKKKKKKK..', '.KWWWWWWWWWWWWWWWWWWWWK.', '.KWBBBWBBBWBBBWBBBWBBWK.', '.KWBBBWBBBWBBBWBBBWBBWK.',
    '.KWBBBWBBBWBBBWBBBWBBWK.', '.KWWWWWWWWWWWWWWWWWWWWK.', '.KYYYYYYYYYYYYYYYYYYYYK.', '.KWWWWWWWWWWWWWWWWWWWWK.', '.KKKKKKKKKKKKKKKKKKKKKK.', '...KK.KK........KK.KK...',
    'GGGGGGGGGGGGGGGGGGGGGGGG', '.K...K...K...K...K...K..'],
  plants: ['..KKKKKKKKKKKKKKKKKKKK..', '.KRRWWRRWWRRWWRRWWRRWWK.', '.KRRWWRRWWRRWWRRWWRRWWK.', '..KRK.KRK.KRK.KRK.KRK...', '..K..................K..', '..K..L....LDL....L...K..',
    '..K.LDL..LLDLL..LDL..K..', '..K.LLL...LLL...LLL..K..', '..K..O....OOO....O...K..', '..K.OOO...OOO...OOO..K..', '..KNNNNNNNNNNNNNNNNNNK..', '..KNNNNNNNNNNNNNNNNNNK..',
    '..K..................K..', '..K..................K..'],
  fries: ['......F.F.F.FF.F.......', '.....FFFFFFFFFFFF.......', '.....FFFFFFFFFFFF.......', '......KKKKKKKKKK........', '......KXXWXXWXXK........', '.......KXWXXWXK.........',
    '..KKKKKKKXXWXKKKKKKKKK..', '..KAAAAAAKXXKAAAAAAAAK..', '..KAWWWWWWKKWWWWWWWWAK..', '..KAWYYYYYYYYYYYYYYWAK..', '..KAWWWWWWWWWWWWWWWWAK..', '..KAAAAAAAAAAAAAAAAAAK..',
    '..KNNNNNNNNNNNNNNNNNNK..', '..KNNNNNNNNNNNNNNNNNNK..', '..KKKKKKKKKKKKKKKKKKKK..'],
  cup: ['.......K...K...K........', '......K...K...K.........', '.......K...K...K........', '........................', '...KKKKKKKKKKKKKKKKK....', '...KWWWWWWWWWWWWWWWKKKK.',
    '...KNNNNNNNNNNNNNNNK..K.', '...KWWWWWWWWWWWWWWWK..K.', '....KWWWWWWWWWWWWWK..K..', '....KWWWWWRWWWWWWWKKK...', '.....KWWWWWWWWWWWK......', '......KKKKKKKKKKK.......',
    '.KKKKKKKKKKKKKKKKKKKKK..', '..KCCCCCCCCCCCCCCCCCK...', '...KKKKKKKKKKKKKKKKK....'],
  book: ['..KKKKKKKKK..KKKKKKKKK..', '.KWWWWWWWWWKKWWWWWWWWWK.', '.KWGGGGGGGWKKWGGGGGGGWK.', '.KWWWWWWWWWKKWWWWWWWWWK.', '.KWGGGGGGWWKKWGGGGGGWWK.', '.KWWWWWWWWWKKWWWWWWWWWK.',
    '.KWGGGGGGGWKKWGGGGGGGWK.', '.KWWWWWWWWWKKWWWWWWWWWK.', '.KWGGGGGWWWKKWGGGGGWWWK.', '.KWWWWWWWWWKKWWWWWWWWWK.', '.KPPPPPPPPPKKPPPPPPPPPK.', '..KKKKKKKKKKKKKKKKKKKK..',
    '...........KK...........', '..........KNNK..........', '.........KNNNNK.........'],
  gable: ['...........KK...........', '..........KRRK..........', '.........KKRRKK.........', '.........KCCCCK.........', '.......KKKCBBCKKK.......', '.......KCCCBBCCCK.......',
    '.....KKKCCCCCCCCKKK.....', '.....KCCBBCCCCBBCCK.....', '...KKKCCBBCCCCBBCCKKK...', '...KCCCCCCCCCCCCCCCCK...', '...KCCBBCCCBBCCCBBCCK...', '...KCCBBCCCBBCCCBBCCK...',
    '...KCCCCCCCNNNCCCCCCK...', '...KCCCCCCCNNNCCCCCCK...', '...KKKKKKKKKKKKKKKKKK...'],
  weather: ['................FF......', '..............F.FF.F....', '...............FFFF.....', '......KKKKK...FFFFFF....', '....KKWWWWWKK.FFFFF.....', '...KWWWWWWWWWKKK.FF.F...',
    '.KKWWWWWWWWWWWWWKK......', 'KWWWWWWWWWWWWWWWWWK.....', 'KWWWWWWWWWWWWWWWWWWK....', '.KKKKKKKKKKKKKKKKKK.....', '...U...U...U...U........', '..U...U...U...U.........',
    '....U...U...U...U.......'],
  hospital: ['..........KKKK..........', '..........KXXK..........', '........KKKXXKKK........', '........KXXXXXXK........', '........KKKXXKKK........', '..KKKKKKKKKXXKKKKKKKKK..',
    '..KWWWWWWWKKKKWWWWWWWK..', '..KWBBWBBWWWWWWBBWBBWK..', '..KWBBWBBWWWWWWBBWBBWK..', '..KWWWWWWWWWWWWWWWWWWK..', '..KWBBWBBWWNNWWBBWBBWK..', '..KWBBWBBWWNNWWBBWBBWK..',
    '..KWWWWWWWWNNWWWWWWWWK..', '..KKKKKKKKKKKKKKKKKKKK..'],
};
// the town's theme → its landmark (a new town adds a line here; tests/validate.js checks every built town has one)
const TOWN_LANDMARK = {
  u1: ['tram', 'De tram'], u2: ['plants', 'Een plantenkraam'], u3: ['fries', 'Een frietkot'], u4: ['cup', 'Een kop koffie'], u5: ['book', 'Een verhalenboek'],
  u6: ['gable', 'Een trapgevel'], u7: ['weather', 'Zon, wolk en regen'], u11: ['hospital', 'Het ziekenhuis'],
};
Object.keys(LANDMARK_ART).forEach(k => { LANDMARK_ART[k] = LANDMARK_ART[k].map(r => r.padEnd(24, '.').slice(0, 24)); });
const LM_W = 24, lmH = key => LANDMARK_ART[key].length;
// gold or grey versions keep the light and dark of each colour
const lum = hex => { const n = parseInt(hex.slice(1), 16); return (0.3 * (n >> 16) + 0.59 * (n >> 8 & 255) + 0.11 * (n & 255)) / 255; };
function lmColour(ch, mode) {
  const c = LM_COL[ch]; if (!c || ch === 'K' || !mode) return c;
  const l = lum(c); const shades = mode === 'gold' ? ['#A87A22', '#D9A12A', '#EFC447', '#F6DA7A'] : ['#9C978D', '#B8B3A9', '#CFCAC1', '#E4E0D8'];
  return shades[l < .45 ? 0 : l < .62 ? 1 : l < .8 ? 2 : 3];
}
function landmarkSVG(key, x, y, s, mode, label) {
  let r = ''; LANDMARK_ART[key].forEach((row, j) => [...row].forEach((ch, i) => { const col = lmColour(ch, mode); if (col) r += `<rect x="${i}" y="${j}" width="1.05" height="1.05" fill="${col}"/>`; }));
  const w = LM_W * s, h = lmH(key) * s;
  return `<g class="landmark${mode === 'gold' ? ' gold' : ''}" role="img" aria-label="${esc(label)}" style="pointer-events:none"><g transform="translate(${x},${y}) scale(${s})" shape-rendering="crispEdges">${r}</g>${mode === 'gold' ? sparkles(x + w / 2, y + h / 2, Math.max(w, h) * .55) : ''}</g>`;
}
// Ronde 3 passed on every plein of the town
const townRonde3 = u => !!UNIT[u] && UNIT[u].built && squaresOf(u).length > 0 && squaresOf(u).every(q => pleinProgress(q.id).ronde >= 3);
const lmMode = u => townRonde3(u) ? 'gold' : '';

/* ---------- where a landmark stands: a free block of grass, marked as 'house' so names and trees keep off it ---------- */
const LM_FREE = ['grass', 'flower', 'tuft', 'field', 'field2'];
function findLandmarkSpot(g, wc, hc, ok, score) {
  const hard = t => ['road', 'house', 'plaza', 'path', 'bridge'].includes(t); // a ring of one cell keeps it off roads and houses
  let best = null;
  for (let y = 1; y + hc < g.length - 1; y++) for (let x = 1; x + wc < g[0].length - 1; x++) {
    let free = true;
    for (let dy = -1; dy <= hc && free; dy++) for (let dx = -1; dx <= wc && free; dx++) {
      const t = g[y + dy][x + dx]; const inside = dy >= 0 && dy < hc && dx >= 0 && dx < wc;
      if (inside ? !LM_FREE.includes(t) && t !== 'tree' && t !== 'treeX' : hard(t)) free = false; // a tree under it is cleared
    }
    if (!free || !ok(x, y)) continue;
    const sc = score(x, y); if (!best || sc < best.sc) best = {x, y, sc};
  }
  if (best) for (let dy = 0; dy < hc; dy++) for (let dx = 0; dx < wc; dx++) g[best.y + dy][best.x + dx] = 'house';
  return best;
}
const lmCells = (key, s) => [Math.ceil(LM_W * s / TS), Math.ceil(lmH(key) * s / TS)];

// Pad: next to each town, outside its bunting, arrow and name area
const WLM_S = 1;
const _buildWorld = buildWorld; // wrapped on purpose: the landmarks are placed once the world is built
buildWorld = function () {
  _buildWorld();
  // first where the names would stand (with the cyclist on any town), so a landmark never takes a name's spot
  const taken = UNITS.flatMap((u, i) => { const [x, y] = townPx(i); return [[x - 26, y - 26, 52, 14], [x - 26, y + 20, 52, 14], heroRect(x, y)]; });
  const names = UNITS.map((u, i) => { const [x, y] = townPx(i); const n = placeSign(WORLD.g, u.name, x, y, taken, TOWN_LABEL[i]); return [n.r, n.a]; }).flat();
  const offNames = (x, y, wc, hc) => names.every(([nx, ny, nw, nh]) => x * TS >= nx + nw + 4 || (x + wc) * TS <= nx - 4 || y * TS >= ny + nh + 4 || (y + hc) * TS <= ny - 4);
  WORLD.landmarks = UNITS.map((u, i) => {
    const lm = TOWN_LANDMARK[u.id]; if (!lm) return null; const [wc, hc] = lmCells(lm[0], WLM_S); const [tx, ty] = WSQ[i].t;
    const clear = (x, y) => WSQ.every(({t: [sx, sy]}) => x + wc <= sx - 5 || x >= sx + 5 || y + hc <= sy - 5 || y >= sy + 6);
    const spot = findLandmarkSpot(WORLD.g, wc, hc, (x, y) => clear(x, y) && offNames(x, y, wc, hc) && Math.hypot(x + wc / 2 - tx, y + hc / 2 - ty) < 11 && nearPath(WORLD.g, x + (wc >> 1), y + (hc >> 1), 4),
      // nearest its own town, and clearly further from every other town
      (x, y) => { const cx = x + wc / 2, cy = y + hc / 2; const own = Math.hypot(cx - tx - .5, cy - ty - .5);
        const other = Math.min(...WSQ.filter((_, j) => j !== i).map(({t: [ox, oy]}) => Math.hypot(cx - ox - .5, cy - oy - .5)));
        return own + (other < own + 4 ? 50 : 0) - .2 * other; });
    return spot && {key: lm[0], label: lm[1], x: spot.x * TS, y: spot.y * TS};
  });
};
const _worldOverlay = worldOverlay; // wrapped on purpose: landmarks go under the names and flags
worldOverlay = function () {
  if (!WORLD) buildWorld();
  const lms = UNITS.map((u, i) => { const L = WORLD.landmarks[i]; if (!L) return ''; const st = townState(u.id); const off = st === 'later' || st === 'locked';
    return landmarkSVG(L.key, L.x, L.y + (TS * lmCells(L.key, WLM_S)[1] - lmH(L.key) * WLM_S), WLM_S, off ? 'grey' : lmMode(u.id), `${L.label} in ${u.name}: ${u.theme}${townRonde3(u.id) ? ', Ronde 3 overal gehaald' : ''}`); }).join('');
  return lms + _worldOverlay();
};

// town map: between the pleinen, near a road, away from the squares and the way in
const TLM_S = 1.5;
const _buildTown = buildTown; // wrapped on purpose: one landmark per town map, placed after the houses
buildTown = function (u) {
  if (TOWN_CACHE[u]) return TOWN_CACHE[u];
  const T = _buildTown(u); const lm = TOWN_LANDMARK[u]; if (!lm) return T;
  const [wc, hc] = lmCells(lm[0], TLM_S);
  const clear = (x, y) => TSQ.every(q => x + wc <= q.t[0] - q.h - 2 || x >= q.t[0] + q.h + 2 || y + hc <= q.t[1] - q.h - 3 || y >= q.t[1] + q.h + 2);
  const spot = findLandmarkSpot(T.g, wc, hc, (x, y) => clear(x, y) && nearPath(T.g, x + (wc >> 1), y + (hc >> 1), Math.max(wc, hc)),
    (x, y) => Math.hypot(x + wc / 2 - TGW / 2, y + hc / 2 - TGH / 2));
  T.landmark = spot && {key: lm[0], label: lm[1], x: spot.x * TS, y: spot.y * TS + (TS * hc - lmH(lm[0]) * TLM_S)};
  return T;
};
const _townOverlay = townOverlay; // wrapped on purpose: the landmark goes under the names and flags
townOverlay = function (u) {
  const T = buildTown(u); const L = T.landmark; const unit = UNIT[u];
  return (L ? landmarkSVG(L.key, L.x, L.y, TLM_S, lmMode(u), `${L.label}: het thema van ${unit.name}, ${unit.theme}${townRonde3(u) ? '. Ronde 3 is overal gehaald' : ''}`) : '') + _townOverlay(u);
};
