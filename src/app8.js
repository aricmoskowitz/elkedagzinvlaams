/* ===== RETRO MAPS: world (arc) → town → square =====
   One tile renderer (canvas, 8 px tiles) draws every level; an SVG layer on
   top holds labels, markers, tap targets and the cyclist. */
const TS = 8;
const ACTIVE_STEPS = ['ontdek', 'oefen', 'luister', 'gebruik'];
const W = {grass: '#A9D38C', grass2: '#98C67C', tuft: '#86B96A', path: '#EAD7A5', pathEdge: '#C9AE78', plaza: '#DDD4C3', cobble: '#C9BEA9', sand: '#F0E3B8', water: '#79B2E3', water2: '#A7CFF2', deep: '#5E9BD3', bridge: '#B98B5A', plank: '#8E6640', tree: '#3E7B3A', tree2: '#5FA052', trunk: '#7A5334', mtn: '#B89A78', mtn2: '#957658', snow: '#F6F3EC', field: '#C9B27A', field2: '#9CC27E', wall: '#F4EFE4', ink: '#2A2620', flowerA: '#E88AA6', flowerB: '#F2D35B', grey: '#BDB7AC', greyRoof: '#A39D92'};
const ROOF = ['#C8553D', '#5E9E4E', '#D08A3A', '#4A78B0', '#8C5A9E', '#B8483A', '#7C7C8C'];
const hsh = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
const grid = (w, h) => Array.from({length: h}, () => Array(w).fill('grass'));
function legs(a, b) { // orthogonal route a→b: down/up, across, down/up
  const [x0, y0] = a, [x1, y1] = b; const ym = Math.round((y0 + y1) / 2); const c = [];
  for (let y = y0; y !== ym; y += Math.sign(ym - y0)) c.push([x0, y]);
  for (let x = x0; x !== x1; x += Math.sign(x1 - x0)) c.push([x, ym]);
  const sy = Math.sign(y1 - ym) || 1; for (let y = ym; y !== y1 + sy; y += sy) c.push([x1, y]);
  return c;
}
function paint(g, cells, type) {
  const H = g.length, Wd = g[0].length;
  cells.forEach(([x, y]) => [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => {
    const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= Wd || Y >= H) return;
    const t = g[Y][X]; g[Y][X] = (t === 'water' || t === 'deep' || t === 'bridge') ? 'bridge' : (t === 'plaza' ? 'plaza' : type);
  }));
}
function nearPath(g, x, y, r) { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const t = g[y + dy] && g[y + dy][x + dx]; if (t === 'path' || t === 'bridge' || t === 'plaza' || t === 'road') return true; } return false; }
function plantTrees(g, x0, x1, y0, y1, p) {
  for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) {
    if (!(g[y] && g[y + 1] && g[y][x] === 'grass' && g[y][x + 1] === 'grass' && g[y + 1][x] === 'grass' && g[y + 1][x + 1] === 'grass')) continue;
    if (nearPath(g, x, y, 1) || nearPath(g, x + 1, y + 1, 1) || hsh(x, y) > p) continue;
    g[y][x] = 'tree'; g[y][x + 1] = g[y + 1][x] = g[y + 1][x + 1] = 'treeX';
  }
}
/* ---------- renderer ---------- */
function drawScene(cv, sc) {
  const {g, houses = []} = sc; const H = g.length, Wd = g[0].length;
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.width = Wd * TS * dpr; cv.height = H * TS * dpr;
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.scale(dpr, dpr);
  const R = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const isWalk = t => t === 'path' || t === 'bridge' || t === 'plaza';
  for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
    const t = g[y][x], px = x * TS, py = y * TS;
    R(px, py, TS, TS, W.grass);
    if (t === 'tuft') { R(px + 2, py + 4, 1, 3, W.tuft); R(px + 4, py + 3, 1, 4, W.tuft); }
    else if (t === 'flower') R(px + 3, py + 3, 2, 2, hsh(x, y) > .5 ? W.flowerA : W.flowerB);
    else if (t === 'field' || t === 'field2') R(px, py, TS, TS, t === 'field' ? W.field : W.field2);
    else if (t === 'sand') R(px, py, TS, TS, W.sand);
    else if (t === 'water' || t === 'deep') { R(px, py, TS, TS, t === 'deep' ? W.deep : W.water); if ((x * 3 + y) % 5 === 0) R(px + 1, py + 3, 4, 1, W.water2); }
    else if (t === 'plaza') { R(px, py, TS, TS, W.plaza); if ((x + y) % 2) R(px + 2, py + 2, 4, 4, W.cobble); }
    else if (t === 'path' || t === 'bridge') {
      R(px, py, TS, TS, t === 'bridge' ? W.bridge : W.path);
      if (t === 'bridge') { R(px, py + 3, TS, 1, W.plank); R(px, py + 7, TS, 1, W.plank); }
      else { const e = (dx, dy) => { const n = g[y + dy] && g[y + dy][x + dx]; return n && !isWalk(n); };
        if (e(0, -1)) R(px, py, TS, 1, W.pathEdge); if (e(0, 1)) R(px, py + 7, TS, 1, W.pathEdge); if (e(-1, 0)) R(px, py, 1, TS, W.pathEdge); if (e(1, 0)) R(px + 7, py, 1, TS, W.pathEdge); }
    }
  }
  (sc.curves || []).forEach(cv2 => {
    const w = cv2.w, e = w + 4;
    cv2.pts.forEach(([x, y]) => R(Math.round(x - e / 2), Math.round(y - e / 2), e, e, W.pathEdge));
    cv2.pts.forEach(([x, y], k) => { const t = (g[Math.floor(y / TS)] || [])[Math.floor(x / TS)]; const wet = t === 'water' || t === 'deep';
      R(Math.round(x - w / 2), Math.round(y - w / 2), w, w, wet ? W.bridge : W.path); if (wet && k % 3 === 0) R(Math.round(x - w / 2), Math.round(y), w, 1, W.plank); });
  });
  for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
    const t = g[y][x], px = x * TS, py = y * TS;
    if (t === 'tree') { R(px + 6, py + 11, 4, 5, W.trunk); c.fillStyle = W.tree; c.beginPath(); c.arc(px + 8, py + 7, 7, 0, 7); c.fill(); c.fillStyle = W.tree2; c.beginPath(); c.arc(px + 6, py + 5, 3.5, 0, 7); c.fill(); }
    if (t === 'mtn' && x % 2 === 0 && g[y][x + 1] === 'mtn') { c.fillStyle = W.mtn; c.beginPath(); c.moveTo(px - 1, py + 8); c.lineTo(px + 8, py - 6); c.lineTo(px + 17, py + 8); c.fill(); c.fillStyle = W.mtn2; c.beginPath(); c.moveTo(px + 8, py - 6); c.lineTo(px + 17, py + 8); c.lineTo(px + 9, py + 8); c.fill(); if (hsh(x, y) > .55) { c.fillStyle = W.snow; c.beginPath(); c.moveTo(px + 5, py - 2); c.lineTo(px + 8, py - 6); c.lineTo(px + 11, py - 2); c.fill(); } }
  }
  houses.forEach(h => {
    const px = h.x * TS, py = h.y * TS, roof = h.grey ? W.greyRoof : h.roof, wall = h.grey ? '#E4E0D8' : W.wall;
    if (h.hall) { const win = h.grey ? '#E4E0D8' : '#F4EFE4';
      R(px - 3, py + 2, 22, 14, roof); R(px - 1, py - 1, 18, 3, roof); R(px + 2, py - 4, 12, 3, roof); R(px + 5, py - 7, 6, 3, roof); R(px + 7, py - 9, 2, 2, h.grey ? '#CFCAC1' : '#F2D35B');
      R(px - 3, py + 15, 22, 1, 'rgba(0,0,0,.25)'); R(px, py + 4, 4, 4, win); R(px + 12, py + 4, 4, 4, win); R(px + 6, py, 4, 3, win); R(px + 6, py + 9, 4, 6, h.grey ? '#8C877E' : W.ink); return; }
    R(px + 1, py + 7, 14, 8, wall); R(px, py + 1, 16, 7, roof); R(px, py + 7, 16, 1, 'rgba(0,0,0,.22)');
    R(px + 6, py + 10, 3, 5, h.grey ? '#8C877E' : W.ink); R(px + 2, py + 9, 3, 3, h.grey ? '#CFCAC1' : '#8FB8DE'); R(px + 11, py + 9, 3, 3, h.grey ? '#CFCAC1' : '#8FB8DE');
  });
}
/* ---------- the cyclist (original 16×14 pixel sprite, two pedal frames) ---------- */
const BIKE = [
  ['......GGG.......', '.....GGGGG......', '......SSS.......', '......SSS.......', '.....WWWW.......', '....WWWWSSS.....', '....WWW....K....', '....PPP....K....', '...KKPPKKKKK....', '..KKK.PP..KKK...', '.K...KPP.K...K..', '.K.K.K..PK.K.K..', '.K...K...K...K..', '..KKK.....KKK...'],
  ['......GGG.......', '.....GGGGG......', '......SSS.......', '......SSS.......', '.....WWWW.......', '....WWWWSSS.....', '....WWW....K....', '....PPP....K....', '...KKPPKKKKK....', '..KKKPP...KKK...', '.K.PPK...K...K..', '.K.K.K...K.K.K..', '.K...K...K...K..', '..KKK.....KKK...']];
const BIKE_COL = {G: '#2F6B3A', K: '#2A2620', S: '#F2C9A0', W: '#F4EFE4', P: '#4A4A5A'};
function bikeSVG(f) { let s = ''; BIKE[f].forEach((row, y) => [...row].forEach((ch, x) => { if (BIKE_COL[ch]) s += `<rect x="${x}" y="${y}" width="1.05" height="1.05" fill="${BIKE_COL[ch]}"/>`; })); return s; }
const HERO_SCALE = 1.6;
const heroAt = (px, py) => `translate(${px - 8 * HERO_SCALE},${py - 14 * HERO_SCALE}) scale(${HERO_SCALE})`;
function heroG(px, py) { return `<g id="hero" transform="${heroAt(px, py)}" shape-rendering="crispEdges" aria-hidden="true">${bikeSVG(0)}</g>`; }
function rideCells(cells, endPx) {
  return new Promise(res => {
    const hero = $('#hero'); if (!hero || !cells.length || reduceMotion) { if (hero && endPx) hero.setAttribute('transform', heroAt(...endPx)); return res(); }
    const step = Math.max(1, Math.round(cells.length / 40)); let k = 0, f = 0;
    const tick = () => {
      if (k >= cells.length) { if (endPx) hero.setAttribute('transform', heroAt(...endPx)); return res(); }
      const [cx, cy] = cells[k]; hero.setAttribute('transform', heroAt((cx + 1) * TS, (cy + 1.4) * TS));
      f = 1 - f; hero.innerHTML = bikeSVG(f); k += step; setTimeout(tick, 42);
    };
    tick();
  });
}
function zoomOut(el, px, py, sw, sh) {
  return new Promise(r => {
    if (!el || reduceMotion) return r();
    el.style.transformOrigin = `${px / sw * 100}% ${py / sh * 100}%`; el.style.transition = 'transform .42s ease-in, opacity .42s ease-in';
    requestAnimationFrame(() => { el.style.transform = 'scale(2.6)'; el.style.opacity = '0'; }); setTimeout(r, 400);
  });
}
/* ---------- shared overlay pieces ---------- */
function sign(cx, y, text, dim) {
  const t = text.toUpperCase(); const w = t.length * 7 + 14;
  return `<g transform="translate(${cx - w / 2},${y})"><rect width="${w}" height="17" fill="${dim ? '#EEEAE2' : '#fff'}" stroke="${dim ? '#A9A49A' : '#2A2620'}" stroke-width="2"/><text x="${w / 2}" y="12.5" text-anchor="middle" class="px" style="fill:${dim ? '#8C877E' : '#2A2620'}">${esc(t)}</text></g>`;
}
const arrow = (x, y, next) => `<g transform="translate(${x},${y})"><g class="bob"><path d="M-6,-5 H6 L0,3 Z" fill="${next ? '#2F6B3A' : '#2A2620'}" stroke="#fff" stroke-width="1.5"/></g></g>`;
const flag = (x, y) => `<g transform="translate(${x},${y})" shape-rendering="crispEdges"><rect width="2" height="16" fill="#2A2620"/><rect x="2" width="9" height="6" fill="#F2D35B" stroke="#2A2620" stroke-width="1"/></g>`;
const blocks = (x, y, n, done) => `<g transform="translate(${x - (n * 12 - 2) / 2},${y})" shape-rendering="crispEdges">${Array.from({length: n}, (_, j) => `<rect x="${j * 12}" width="10" height="5" fill="${j < done ? '#2A2620' : '#fff'}" stroke="#2A2620" stroke-width="1"/>`).join('')}</g>`;
function sceneHTML(id, w, h, overlay, label) {
  return `<div class="world" id="${id}"><canvas aria-hidden="true"></canvas><svg viewBox="0 0 ${w * TS} ${h * TS}" role="img" aria-label="${esc(label)}">${overlay}</svg></div>`;
}

/* ---------- curves: smooth roads stamped in pixel steps ---------- */
function catmull(pts, step = 3) {
  const out = []; const P = [pts[0], ...pts, pts[pts.length - 1]];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const n = Math.max(2, Math.round(len / step));
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  out.push(pts[pts.length - 1]); return out;
}
/* a road between two points with a gentle bend to one side */
function bend(a, b, k) { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1]; return [a, [mx - dy * k, my + dx * k], b]; }
function markRoad(g, samples) { samples.forEach(([px, py]) => { const x = Math.floor(px / TS), y = Math.floor(py / TS); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const r = g[y + dy]; if (r && r[x + dx] !== undefined && !['water', 'deep', 'plaza'].includes(r[x + dx])) r[x + dx] = 'road'; } }); }
const toCells = samples => samples.map(([px, py]) => [px / TS - 1, py / TS - 1.4]);

/* ---------- LEVEL 1: the arc (world) ---------- */
const WGW = 42, WGH = 64;
const TOWN_T = [[9, 7], [29, 10], [13, 21], [30, 28], [11, 37], [28, 44], [15, 54]];
const PASS = [20, 63];
let WORLD = null;
const coastX = y => (y < 15 || y > 40) ? 99 : 37 - Math.round(2.5 * Math.sin((y - 15) / 25 * Math.PI)) + Math.round(Math.sin(y / 2.3) * .6);
const riverY = x => 50 + Math.round(1.6 * Math.sin(x / 4.2));
const tc = ([x, y]) => [(x + 0.5) * TS, (y + 0.5) * TS];
function buildWorld() {
  const g = grid(WGW, WGH);
  // the sea along the east, with a beach
  for (let y = 0; y < WGH; y++) { const c = coastX(y); for (let x = c; x < WGW; x++) g[y][x] = x >= c + 2 ? 'deep' : 'water'; if (c < WGW) g[y][c - 1] = 'sand'; }
  // a lake in the west and the river that runs from it to the east edge
  for (let y = 0; y < WGH; y++) for (let x = 0; x < WGW; x++) { const d = ((x - 4.5) / 3.6) ** 2 + ((y - 50) / 2.8) ** 2; if (d < 1) g[y][x] = d < .45 ? 'deep' : 'water'; else if (d < 1.35 && g[y][x] === 'grass') g[y][x] = 'sand'; }
  for (let x = 7; x < WGW; x++) { const ry = riverY(x); g[ry][x] = 'water'; g[ry + 1][x] = 'water'; }
  // fields by Smulstad, flower meadows by Stekjesdorp and here and there
  for (let y = 15; y <= 19; y++) for (let x = 18; x <= 25; x++) if (g[y][x] === 'grass') g[y][x] = (x + y) % 3 ? 'field' : 'field2';
  const meadow = (x0, x1, y0, y1, p) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y] && g[y][x] === 'grass' && hsh(x * 1.3, y) > p) g[y][x] = 'flower'; };
  meadow(22, 35, 2, 16, .62); meadow(2, 9, 28, 33, .7); meadow(16, 26, 38, 42, .78); meadow(0, 41, 0, 56, .975);
  // the road: one smooth curve through every town and on to the pass
  const pts = TOWN_T.map(tc); const seg = [];
  for (let i = 0; i < pts.length - 1; i++) { const s = catmull(bend(pts[i], pts[i + 1], i % 2 ? -0.18 : 0.18)); seg.push(s); markRoad(g, s); }
  const passPts = catmull([pts[6], [(PASS[0] - 1) * TS, (58) * TS], [(PASS[0] + .5) * TS, (WGH - .5) * TS]]); markRoad(g, passPts);
  // town squares
  TOWN_T.forEach(([cx, cy]) => { for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) if (g[y] && ((x - cx) ** 2 + (y - cy) ** 2) <= 8.5 && !['water', 'deep'].includes(g[y][x])) g[y][x] = 'plaza'; });
  // the mountains that close the arc, with one pass
  for (let y = 58; y < WGH; y++) for (let x = 0; x < WGW; x += 2) if ((x < PASS[0] - 3 || x > PASS[0] + 2) && g[y][x] !== 'road') { g[y][x] = 'mtn'; g[y][x + 1] = 'mtn'; }
  for (let y = 56; y <= 57; y++) for (let x = 0; x < WGW; x += 2) if ((x < 10 || x > 28) && hsh(x, y) > .45 && g[y][x] === 'grass' && g[y][x + 1] === 'grass') { g[y][x] = 'mtn'; g[y][x + 1] = 'mtn'; }
  // a few woods, not everywhere
  plantTrees(g, 34, 41, 0, 13, .55); plantTrees(g, 0, 4, 10, 30, .55); plantTrees(g, 31, 41, 52, 57, .6); plantTrees(g, 17, 25, 24, 33, .3); plantTrees(g, 0, 7, 0, 3, .5);
  for (let y = 0; y < WGH; y++) for (let x = 0; x < WGW; x++) if (g[y][x] === 'grass' && hsh(x + 3, y + 7) < 0.03) g[y][x] = 'tuft';
  WORLD = {g, route: seg.map(toCells), curves: [{pts: seg.flat(), w: 9}, {pts: passPts, w: 9}], pier: true};
}
/* houses ring each town square, leaving the road free; the guild hall stands at the top */
function ringHouses(cx, cy, roof, grey, avoid, n = 5) {
  const out = [];
  const angles = [-90, -30, -150, 30, 150, 90, -60, -120];
  for (const a of angles) {
    if (out.length >= n) break;
    if (avoid.some(b => Math.abs(((a - b + 540) % 360) - 180) < 38)) continue;
    const r = a === -90 ? 4.6 : 4.3, x = Math.round(cx + Math.cos(a * Math.PI / 180) * r - 1), y = Math.round(cy + Math.sin(a * Math.PI / 180) * r - 1);
    out.push({x, y, roof, grey, hall: a === -90 && out.length === 0});
  }
  return out;
}
function townAngles(i) {
  const pts = TOWN_T; const out = [];
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  if (i > 0) out.push(ang(pts[i], pts[i - 1])); if (i < pts.length - 1) out.push(ang(pts[i], pts[i + 1])); else out.push(90);
  return out;
}
function worldHouses() {
  const out = [];
  TOWN_T.forEach(([cx, cy], i) => { const u = UNITS[i]; const st = townState(u.id); const grey = st === 'later' || st === 'locked';
    out.push(...ringHouses(cx, cy, ROOF[i], grey, townAngles(i), 5)); });
  return out;
}
const townPx = i => [(TOWN_T[i][0] + 0.5) * TS, (TOWN_T[i][1] + 0.5) * TS];
function worldOverlay() {
  const t = UNITS.map((u, i) => {
    const [x, y] = townPx(i); const st = townState(u.id); const dim = st === 'later' || st === 'locked';
    const below = i % 2 === 0 ? y < 380 : y < 60; const ly = below ? y + 34 : y - 54;
    const qs = u.built ? squaresOf(u.id) : [];
    return `<g class="wtown" data-act="town" data-u="${u.id}" role="button" tabindex="0" aria-label="${esc(u.name)}: ${esc(u.gram)}${st === 'done' ? ', klaar' : dim ? ', nog dicht' : ''}">
      <rect x="${x - 44}" y="${y - 44}" width="88" height="86" fill="transparent"/>
      ${dim ? `<g opacity=".8" fill="#fff"><circle cx="${x - 18}" cy="${y + 2}" r="18"/><circle cx="${x + 4}" cy="${y - 10}" r="20"/><circle cx="${x + 22}" cy="${y + 6}" r="16"/><circle cx="${x - 2}" cy="${y + 16}" r="16"/></g>` : ''}
      ${sign(x, ly, u.name, dim)}
      ${(st === 'open' || st === 'next') && qs.length ? blocks(x, below ? ly + 21 : ly - 8, qs.length, qs.filter(q => sqComplete(q.id)).length) : ''}
      ${st === 'done' ? flag(x + 22, y - 38) : ''}
      ${st === 'open' || st === 'next' ? arrow(x, below ? y - 44 : ly - 16, st === 'next') : ''}
    </g>`;
  }).join('');
  const [px, py] = [(PASS[0] + .5) * TS, (WGH - 1) * TS];
  const mist = [[50, 476, 70, 14], [160, 488, 80, 16], [290, 474, 70, 14], [110, 504, 100, 12], [250, 506, 90, 12]].map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".5"/>`).join('');
  const border = `${mist}<g data-act="arc-next" role="button" tabindex="0" aria-label="Boog 2, volgt later">${sign(px, py - 24, 'Boog 2 · Thuiskomen', true)}</g>`;
  const [hx, hy] = townPx(UNIT[SQ[nextSquare()].u].n - 1);
  return t + border + heroG(hx + 22, hy + 18);
}
function worldView() { return sceneHTML('world', WGW, WGH, worldOverlay(), 'Boog 1: zeven steden langs een kronkelende weg, met een meer, een rivier en een bergpas naar boog 2'); }

/* ---------- LEVEL 2: a town ---------- */
const TGW = 42, TGH = 40;
const PLAZA_T = [[9, 8], [28, 13], [12, 25], [29, 31]];
const TOWN_CACHE = {};
function buildTown(u) {
  if (TOWN_CACHE[u]) return TOWN_CACHE[u];
  const g = grid(TGW, TGH); const i = UNIT[u].n - 1;
  if (u === 'u2') for (let y = 0; y < TGH; y++) for (let x = 0; x < TGW; x++) if (hsh(x, y) > .82) g[y][x] = 'flower';
  if (u === 'u3') for (let y = 31; y <= 37; y++) for (let x = 1; x <= 10; x++) g[y][x] = (x + y) % 3 ? 'field' : 'field2';
  if (u === 'u4') for (let y = 0; y < TGH; y++) for (let x = 37; x < TGW; x++) { g[y][x] = x > 38 ? 'deep' : 'water'; if (x === 37) g[y][36] = 'sand'; }
  if (u === 'u7') for (let y = 0; y <= 3; y++) for (let x = 18; x < TGW; x += 2) if (hsh(x, y) > .25) { g[y][x] = 'mtn'; g[y][x + 1] = 'mtn'; }
  if (u === 'u1') for (let y = 33; y < TGH; y++) for (let x = 30; x < TGW; x++) if (((x - 37) / 6) ** 2 + ((y - 38) / 4) ** 2 < 1) g[y][x] = 'water';
  const P = PLAZA_T.map(tc);
  const entryS = catmull([[(PLAZA_T[0][0] + .5) * TS, 0], [(PLAZA_T[0][0] - 1) * TS, 3 * TS], P[0]]);
  const streets = [0, 1, 2].map(s => catmull(bend(P[s], P[s + 1], s % 2 ? 0.2 : -0.2)));
  markRoad(g, entryS); streets.forEach(s => markRoad(g, s));
  PLAZA_T.forEach(([cx, cy], j) => { const r2 = j === 3 ? 14 : 11; for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) if (g[y] && g[y][x] !== undefined && (x - cx) ** 2 + (y - cy) ** 2 <= r2 && !['water', 'deep'].includes(g[y][x])) g[y][x] = 'plaza'; });
  const houses = [];
  for (let y = 1; y < TGH - 2; y += 3) for (let x = 1; x < TGW - 2; x += 3) {
    const free = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dy]) => ['grass', 'flower', 'tuft'].includes(g[y + dy][x + dx]));
    if (free && nearPath(g, x, y, 2) && !nearPath(g, x, y, 0) && hsh(x + i, y) < (u === 'u6' ? .95 : .7)) { houses.push({x, y, roof: hsh(x, y + i) > .5 ? ROOF[i] : '#9C6B4A'}); [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => g[y + dy][x + dx] = 'house'); }
  }
  plantTrees(g, 0, TGW - 2, 0, TGH - 2, u === 'u5' ? .55 : .3);
  return (TOWN_CACHE[u] = {g, houses, streets: streets.map(toCells), entry: toCells(entryS), curves: [{pts: entryS.concat(streets.flat()), w: 10}]});
}
function townOverlay(u) {
  const qs = squaresOf(u); const nq = nextSquare();
  const pl = qs.map((q, j) => {
    const [cx, cy] = PLAZA_T[j]; const x = (cx + .5) * TS, y = (cy + 0.5) * TS; const st = sqState(q.id); const dim = st === 'locked';
    const done = BUILT_STEPS.filter(s => stepDone(q.id, s)).length;
    return `<g data-act="square" data-q="${q.id}" role="button" tabindex="0" style="cursor:pointer" aria-label="Plein ${q.n}: ${esc(q.name)}${st === 'done' ? ', klaar' : dim ? ', nog dicht' : ''}">
      <rect x="${x - 36}" y="${y - 30}" width="72" height="60" fill="${dim ? 'rgba(255,255,255,.55)' : 'transparent'}"/>
      ${sign(x, y - 46, q.name, dim)}
      ${!dim && st !== 'done' ? blocks(x, y - 24, 3, done) : ''}
      ${st === 'done' ? flag(x + 22, y - 24) : ''}
      ${st === 'next' || st === 'open' ? arrow(x, y - 56, st === 'next') : ''}
    </g>`;
  }).join('');
  const [mx, my] = tc(PLAZA_T[3]); const mOpen = marktOpen(u);
  const markt = marktId(u) ? `<g data-act="markt" data-u="${u}" role="button" tabindex="0" style="cursor:pointer" aria-label="Grote Markt">
      <rect x="${mx - 40}" y="${my - 32}" width="80" height="64" fill="${mOpen ? 'transparent' : 'rgba(255,255,255,.55)'}"/>
      <g shape-rendering="crispEdges"><rect x="${mx - 3}" y="${my - 3}" width="6" height="6" fill="#79B2E3" stroke="#2A2620"/></g>
      ${sign(mx, my - 50, '★ Grote Markt', !mOpen)}${marktDone(u) ? flag(mx + 26, my - 28) : ''}</g>` : '';
  const here = qs.findIndex(q => q.id === nq);
  const hp = here >= 0 ? [(PLAZA_T[here][0] + 3) * TS, (PLAZA_T[here][1] + 2.6) * TS] : [(PLAZA_T[0][0] + 1) * TS, 3 * TS];
  return pl + markt + heroG(...hp);
}
function sqState(q) { if (sqComplete(q)) return 'done'; if (!sqOpen(q)) return 'locked'; return nextSquare() === q ? 'next' : 'open'; }
function viewTown(u) {
  const unit = UNIT[u]; const qs = squaresOf(u); const locked = townState(u) === 'locked';
  const wk = String(weekStartDay()); const mDone = S.mission[wk] === u;
  return `<div class="stack">
    <button class="back" data-act="pad-up">‹ Pad</button>
    <div><div class="eyebrow">Boog ${arcOf(u).n} · Stad ${townIndexInArc(u)} · ${esc(arcOf(u).level)}</div><h1>${esc(unit.name)}</h1><div class="small" style="margin-top:2px">${esc(unit.gram)} · ${esc(unit.theme.toLowerCase())}</div></div>
    ${coachTip('town', 'Een stad heeft drie pleinen: korte lessen van 10 à 15 minuten, en een Grote Markt om alles te herhalen. Het pijltje wijst naar je volgende plein. Tik op een plein.')}
    ${sceneHTML('townmap', TGW, TGH, townOverlay(u), 'Plattegrond van ' + unit.name)}
    ${locked ? `<div class="card soft stack" style="gap:8px"><div>${esc(unit.name)} is nog dicht. Test je erin: 15 vragen over de hele stad.</div><button class="btn line" data-act="testout" data-qs="${qs.map(q => q.id).join(',')}">Test je in</button></div>` : ''}
    ${marktLink(u)}
    <div class="card soft stack" style="gap:6px"><div class="eyebrow" data-en="After this town">Na deze stad</div><div class="nl" style="font-size:17px">${esc(unit.can)}</div></div>
    <div class="row" style="align-items:flex-start;gap:12px"><button class="iconbtn" data-act="mission" data-u="${u}" aria-pressed="${mDone}" aria-label="Opdracht gedaan" style="border:1.5px solid ${mDone ? 'var(--ink)' : 'var(--go)'};border-radius:8px;width:32px;height:32px;flex:none;font-size:16px;${mDone ? 'background:var(--ink);color:#fff' : ''}">${mDone ? '✓' : ''}</button><div><div class="eyebrow" data-en="Field mission this week">Opdracht in de stad</div><div>${esc(unit.mission)}</div></div></div>
    <button class="link" data-act="unit-set" data-u="${u}">Oefen de woorden van ${esc(unit.name)} ›</button>
  </div>`;
}

/* ---------- LEVEL 3: a square with five guild houses ---------- */
const SGW = 42, SGH = 25;
let SQ_SCENE = null;
function buildSquare() {
  if (SQ_SCENE) return SQ_SCENE;
  const g = grid(SGW, SGH);
  for (let y = 14; y < SGH; y++) for (let x = 0; x < SGW; x++) g[y][x] = 'plaza';
  plantTrees(g, 0, SGW - 2, 0, 3, .5);
  return (SQ_SCENE = {g, houses: []});
}
const FACADE = ['#C8553D', '#D08A3A', '#4A78B0', '#5E9E4E', '#8C5A9E'];
function guildHouse(x, st, i) {
  const off = st === 'later' || st === 'locked';
  const col = off ? '#DAD5CC' : FACADE[i]; const ink = off ? '#A9A49A' : '#2A2620';
  const parts = [[0, 30, 56, 66], [6, 22, 44, 8], [13, 14, 30, 8], [20, 6, 16, 8]];
  let s = parts.map(([px, py, w, h]) => `<rect x="${px - 2}" y="${py - 2}" width="${w + 4}" height="${h + 2}" fill="${ink}"/>`).join('') + parts.map(([px, py, w, h]) => `<rect x="${px}" y="${py}" width="${w}" height="${h}" fill="${col}"/>`).join('');
  s += `<rect x="25" y="0" width="6" height="6" fill="${off ? '#CFCAC1' : '#F2D35B'}" stroke="${ink}" stroke-width="1.5"/>`;
  [[10, 40], [34, 40], [10, 60], [34, 60]].forEach(([wx, wy]) => { s += `<rect x="${wx}" y="${wy}" width="12" height="10" fill="${off ? '#EEEAE2' : '#F4EFE4'}" stroke="${ink}" stroke-width="2"/>`; });
  s += `<rect x="21" y="76" width="14" height="20" fill="${ink}"/>`;
  return `<g transform="translate(${x},14)" shape-rendering="crispEdges">${s}</g>`;
}
function squareOverlay(q) {
  const open = sqOpen(q); const nx = nextStep(q);
  const h = STEPS.map((st, i) => {
    const built = ACTIVE_STEPS.includes(st); const done = stepDone(q, st);
    const state = !built ? 'later' : !open ? 'locked' : (st === nx && !sqComplete(q)) ? 'next' : 'open';
    const x = 8 + i * 65;
    return `<g data-act="step" data-q="${q}" data-step="${st}" role="button" tabindex="0" style="cursor:pointer" aria-label="${STEP_NAME[st]}${done ? ', klaar' : ''}${built ? '' : ', later'}">
      <rect x="${x - 4}" y="0" width="64" height="150" fill="transparent"/>
      ${guildHouse(x, state, i)}
      ${done ? flag(x + 44, 10) : ''}
      ${state === 'next' ? arrow(x + 28, 9, true) : ''}
      ${sign(x + 28, 118, STEP_NAME[st], state === 'later' || state === 'locked')}
    </g>`;
  }).join('');
  const ni = STEPS.indexOf(nx);
  return h + heroG(8 + ni * 65 + 28, 186);
}
function viewSquare(q) {
  const sq = SQ[q]; const unit = UNIT[sq.u]; const open = sqOpen(q);
  return `<div class="stack">
    <button class="back" data-act="pad-town" data-u="${sq.u}">‹ ${esc(unit.name)}</button>
    <div><div class="eyebrow">Boog ${arcOf(sq.u).n} · Stad ${townIndexInArc(sq.u)} · Plein ${sq.n} van ${squareCount(sq.u)}</div><h1>${esc(sq.name)}</h1><div class="small" style="margin-top:2px">${esc(sq.title)} · ${esc(sq.en)}</div></div>
    ${coachTip('square', 'Op elk plein staan vijf gildehuizen. Het pijltje wijst naar je volgende stap; grijze huizen komen later. Tik op een huis.')}
    ${sceneHTML('sqmap', SGW, SGH, squareOverlay(q), 'Vijf gildehuizen op ' + sq.name)}
    ${open ? '' : `<div class="card soft stack" style="gap:8px"><div>Dit plein gaat open als je het vorige plein klaar hebt. Of test je erin: 8 vragen.</div><button class="btn line" data-act="testout" data-qs="${q}">Test je in</button></div>`}
    <div>${STEPS.map(st => { const built = ACTIVE_STEPS.includes(st); const sc = S.sq[q] && S.sq[q].steps && S.sq[q].steps[st];
      return `<button class="tapline" data-act="step" data-q="${q}" data-step="${st}" ${built && open ? '' : 'aria-disabled="true"'}><div class="t"><div style="font-weight:600;${built && open ? '' : 'color:var(--faint)'}">${STEP_NAME[st]}${sc ? ` <span class="small">· ${sc === 'test' ? 'getest' : sc === 1 ? (st === 'ontdek' ? 'gelezen' : 'gedaan') : sc + '%'}</span>` : ''}</div><div class="small">${STEP_DESC[st]}${built ? '' : ' · later'}</div></div><span class="chev" ${built && open ? '' : 'style="color:var(--faint)"'}>›</span></button>`; }).join('')}</div>
    ${roundsBlock(q)}
    ${mineBlock(q)}
  </div>`;
}

/* ---------- navigation with movement ---------- */
function afterRenderMaps() {
  const w = $('#world'); if (w) { if (!WORLD) buildWorld(); WORLD.houses = worldHouses(); drawScene($('canvas', w), WORLD);
    if (!afterRenderMaps.scrolled) { afterRenderMaps.scrolled = true; const y = townPx(UNIT[SQ[nextSquare()].u].n - 1)[1] / (WGH * TS) * w.offsetHeight; $('#main').scrollTop = Math.max(0, w.offsetTop + y - 220); } }
  const t = $('#townmap'); if (t && PAD.u) drawScene($('canvas', t), buildTown(PAD.u));
  const s = $('#sqmap'); if (s) drawScene($('canvas', s), buildSquare());
}
async function goTown(u) {
  const st = townState(u);
  if (st === 'later') { toast(`${UNIT[u].name} volgt later: ${UNIT[u].gram.toLowerCase()}.`); return; }
  if (RIDING) return; RIDING = true;
  try {
    const i = UNIT[u].n - 1; const from = UNIT[SQ[nextSquare()].u].n - 1;
    if (st !== 'locked' && i !== from) {
      let cells = []; if (i > from) for (let s = from; s < i; s++) cells = cells.concat(WORLD.route[s]); else for (let s = from - 1; s >= i; s--) cells = cells.concat(WORLD.route[s].slice().reverse());
      const [x, y] = townPx(i); await rideCells(cells, [x + 18, y + 14]);
    }
    const [x, y] = townPx(i); await zoomOut($('#world'), x, y, WGW * TS, WGH * TS);
  } finally { RIDING = false; }
  PAD.lvl = 'town'; PAD.u = u; render(); $('#main').scrollTop = 0;
}
async function goSquare(q) {
  if (RIDING) return; RIDING = true;
  try {
    const u = SQ[q].u; const qs = squaresOf(u); const j = qs.findIndex(x => x.id === q); const nj = qs.findIndex(x => x.id === nextSquare());
    const town = TOWN_CACHE[u];
    if (town && $('#townmap') && sqOpen(q)) {
      let cells = [];
      if (nj < 0) cells = town.entry.slice(3).concat(j >= 1 ? town.streets[0] : []).concat(j >= 2 ? town.streets[1] : []);
      else if (j > nj) for (let s = nj; s < j; s++) cells = cells.concat(town.streets[s]);
      else for (let s = nj - 1; s >= j; s--) cells = cells.concat(town.streets[s].slice().reverse());
      await rideCells(cells, [(PLAZA_T[j][0] + 3) * TS, (PLAZA_T[j][1] + 2.6) * TS]);
    }
    await zoomOut($('#townmap'), (PLAZA_T[j][0] + 1) * TS, PLAZA_T[j][1] * TS, TGW * TS, TGH * TS);
  } finally { RIDING = false; }
  PAD.lvl = 'sq'; PAD.q = q; PAD.u = SQ[q].u; render(); $('#main').scrollTop = 0;
}
async function goStep(q, st) {
  const hero = $('#hero'); const i = STEPS.indexOf(st);
  if (hero && $('#sqmap') && !reduceMotion && ACTIVE_STEPS.includes(st) && sqOpen(q)) {
    const from = STEPS.indexOf(nextStep(q)); const cells = []; const a = 8 + from * 65 + 28, b = 8 + i * 65 + 28;
    for (let k = 0; k <= 10; k++) cells.push([(a + (b - a) * k / 10) / TS - 1, 186 / TS - 1.4]);
    await rideCells(cells, [b, 186]);
  }
  startStep(q, st);
}
function todayFloat() {
  const q = nextSquare(); const sq = SQ[q]; const ns = nextStep(q);
  const due = Math.min(dueKeys().length, Math.max(0, (S.settings.cap || 60) - doneToday()));
  return `<div class="floatcard"><div class="t"><div class="small">${esc(UNIT[sq.u].name)} · ${esc(sq.name)}</div><div style="font-weight:600">${STEP_NAME[ns]}${due ? ` <span class="small">· ${due} herhalingen</span>` : ''}</div></div><button class="btn" data-act="step" data-q="${q}" data-step="${ns}" style="min-height:40px;padding:8px 14px">Start</button></div>`;
}
function viewPad() {
  if (PAD.lvl === 'sq' && SQ[PAD.q]) return viewSquare(PAD.q);
  if (PAD.lvl === 'town' && UNIT[PAD.u]) return viewTown(PAD.u);
  if (PAD.lvl === 'markt' && UNIT[PAD.u]) return viewMarkt(PAD.u);
  return `<div class="stack">
    <div class="spread"><div><h1 data-en="Path">Pad</h1><div class="small">Boog 1 · Rondkomen · A2</div></div>${testMode() ? '<span class="pill test" data-en="Test mode: everything is open">Testmodus</span>' : ''}</div>
    ${coachTip('pad', 'Dit is je wereld. Elke stad leert één stuk grammatica; de route toont de volgorde. Het pijltje wijst naar je volgende stad. Grijze steden zijn nog dicht. Achter de bergen ligt boog 2.')}
    ${worldView()}
    ${padLinks()}
    ${todayFloat()}
  </div>`;
}
