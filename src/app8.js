/* ===== RETRO MAPS: world (arc) → town → square =====
   One tile renderer (canvas, 8 px tiles) draws every level; an SVG layer on
   top holds labels, markers, tap targets and the cyclist. */
const TS = 8;
const ACTIVE_STEPS = ['ontdek', 'oefen', 'luister', 'gebruik'];
const W = {grass: '#A9D38C', grass2: '#98C67C', tuft: '#86B96A', path: '#EAD7A5', pathEdge: '#C9AE78', plaza: '#DDD4C3', cobble: '#C9BEA9', sand: '#F0E3B8', water: '#79B2E3', water2: '#A7CFF2', deep: '#5E9BD3', bridge: '#B98B5A', plank: '#8E6640', tree: '#3E7B3A', tree2: '#5FA052', trunk: '#7A5334', mtn: '#B89A78', mtn2: '#957658', snow: '#F6F3EC', field: '#C9B27A', field2: '#9CC27E', wall: '#F4EFE4', ink: '#2A2620', flowerA: '#E88AA6', flowerB: '#F2D35B', grey: '#BDB7AC', greyRoof: '#A39D92', stone: '#DDD4C3', cobble2: '#CDC2AD', curb: '#A99C84', zebra: '#F6F3EC', fountain: '#8FB8DE'};
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
  // roads: a kerb, then the stone, stamped every pixel; over water the road becomes a wooden bridge
  const roads = sc.roads || [];
  roads.forEach(pts => pts.forEach(([x, y]) => R(Math.round(x - RW / 2 - 2), Math.round(y - RW / 2 - 2), RW + 4, RW + 4, W.curb)));
  roads.forEach(pts => pts.forEach(([x, y], k) => { const t = (g[Math.floor(y / TS)] || [])[Math.floor(x / TS)]; const wet = t === 'water' || t === 'deep';
    R(Math.round(x - RW / 2), Math.round(y - RW / 2), RW, RW, wet ? W.bridge : W.stone); if (wet && k % 4 === 0) R(Math.round(x - RW / 2), Math.round(y), RW, 1, W.plank); }));
  // squares: kerb, cobbles, a fountain, and an opening with a zebra crossing where each road comes in
  (sc.squares || []).forEach(q => {
    const [cx, cy] = sqCenter(q); const h = q.h * TS, n = Math.round(q.h * 2);
    R(cx - h - 2, cy - h - 2, 2 * h + 4, 2 * h + 4, q.gold ? '#E0A82E' : W.curb); R(cx - h, cy - h, 2 * h, 2 * h, W.stone); // gold: everything perfect
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x + y) % 2) R(cx - h + x * TS + 2, cy - h + y * TS + 2, 4, 4, W.cobble2);
    if (!q.sign) { R(cx - 5, cy - 5, 10, 10, W.cobble2); R(cx - 2, cy - 2, 4, 4, W.fountain); } // 2.11: a square with a theme sign has no fountain
    (q.open || []).forEach(sd => { const [mx, my] = sqSide(q, sd); const [dx, dy] = DIR[sd];
      if (dx) { R(Math.round(mx - 3), Math.round(my - RW / 2), 6, RW, W.stone); for (let k = 0; k < 3; k++) R(Math.round(mx + dx * 6 - 1), Math.round(my - RW / 2 + 1 + k * 4), 2, 2, W.zebra); }
      else { R(Math.round(mx - RW / 2), Math.round(my - 3), RW, 6, W.stone); for (let k = 0; k < 3; k++) R(Math.round(mx - RW / 2 + 1 + k * 4), Math.round(my + dy * 6 - 1), 2, 2, W.zebra); } });
  });
  for (let y = 0; y < H; y++) for (let x = 0; x < Wd; x++) {
    const t = g[y][x], px = x * TS, py = y * TS;
    if (t === 'tree') { R(px + 6, py + 11, 4, 5, W.trunk); c.fillStyle = W.tree; c.beginPath(); c.arc(px + 8, py + 7, 7, 0, 7); c.fill(); c.fillStyle = W.tree2; c.beginPath(); c.arc(px + 6, py + 5, 3.5, 0, 7); c.fill(); }
    if (t === 'mtn' && x % 2 === 0 && g[y][x + 1] === 'mtn') { c.fillStyle = W.mtn; c.beginPath(); c.moveTo(px - 1, py + 8); c.lineTo(px + 8, py - 6); c.lineTo(px + 17, py + 8); c.fill(); c.fillStyle = W.mtn2; c.beginPath(); c.moveTo(px + 8, py - 6); c.lineTo(px + 17, py + 8); c.lineTo(px + 9, py + 8); c.fill(); if (hsh(x, y) > .55) { c.fillStyle = W.snow; c.beginPath(); c.moveTo(px + 5, py - 2); c.lineTo(px + 8, py - 6); c.lineTo(px + 11, py - 2); c.fill(); } }
  }
  houses.forEach(h => {
    if (h.k) { // 2.14: a bigger Pad building: the same drawing, scaled around the middle of its ground line
      c.save(); c.translate(h.x * TS + TS, h.y * TS + 2 * TS); c.scale(h.k, h.k); c.translate(-TS, -2 * TS); drawHouse(R, {...h, x: 0, y: 0}); c.restore(); return; }
    drawHouse(R, h);
  });
  function drawHouse(R, h) {
    const px = h.x * TS, py = h.y * TS, roof = h.gold ? '#E0A82E' : h.grey ? W.greyRoof : h.roof, wall = h.gold ? '#F6DA7A' : h.grey ? '#E4E0D8' : W.wall;
    if (h.guild) { drawMiniGuild(R, px, py, h.col, h.on); return; }
    if (h.hall) { const win = h.grey ? '#E4E0D8' : '#F4EFE4';
      R(px - 3, py + 2, 22, 14, roof); R(px - 1, py - 1, 18, 3, roof); R(px + 2, py - 4, 12, 3, roof); R(px + 5, py - 7, 6, 3, roof); R(px + 7, py - 9, 2, 2, h.grey ? '#CFCAC1' : '#F2D35B');
      R(px - 3, py + 15, 22, 1, 'rgba(0,0,0,.25)'); R(px, py + 4, 4, 4, win); R(px + 12, py + 4, 4, 4, win); R(px + 6, py, 4, 3, win); R(px + 6, py + 9, 4, 6, h.grey ? '#8C877E' : W.ink); return; }
    R(px + 1, py + 7, 14, 8, wall); R(px, py + 1, 16, 7, roof); R(px, py + 7, 16, 1, 'rgba(0,0,0,.22)');
    R(px + 6, py + 10, 3, 5, h.grey ? '#8C877E' : W.ink); R(px + 2, py + 9, 3, 3, h.grey ? '#CFCAC1' : '#8FB8DE'); R(px + 11, py + 9, 3, 3, h.grey ? '#CFCAC1' : '#8FB8DE');
  }
}
/* ---------- the cyclist (original 16×14 pixel sprite, two pedal frames) ---------- */
const BIKE = [
  ['......GGG.......', '.....GGGGG......', '......SSS.......', '......SSS.......', '.....WWWW.......', '....WWWWSSS.....', '....WWW....K....', '....PPP....K....', '...KKPPKKKKK....', '..KKK.PP..KKK...', '.K...KPP.K...K..', '.K.K.K..PK.K.K..', '.K...K...K...K..', '..KKK.....KKK...'],
  ['......GGG.......', '.....GGGGG......', '......SSS.......', '......SSS.......', '.....WWWW.......', '....WWWWSSS.....', '....WWW....K....', '....PPP....K....', '...KKPPKKKKK....', '..KKKPP...KKK...', '.K.PPK...K...K..', '.K.K.K...K.K.K..', '.K...K...K...K..', '..KKK.....KKK...']];
const BIKE_COL = {G: '#2F6B3A', K: '#2A2620', S: '#F2C9A0', W: '#F4EFE4', P: '#4A4A5A'};
function bikeSVG(f) { let s = ''; BIKE[f].forEach((row, y) => [...row].forEach((ch, x) => { if (BIKE_COL[ch]) s += `<rect x="${x}" y="${y}" width="1.05" height="1.05" fill="${BIKE_COL[ch]}"/>`; })); return s; }
const HERO_SCALE = 1.6;
// the sprite faces right; riding left mirrors it around its own middle
const heroAt = (px, py, left) => `translate(${px - 8 * HERO_SCALE},${py - 14 * HERO_SCALE}) ${left ? `translate(${16 * HERO_SCALE},0) scale(${-HERO_SCALE},${HERO_SCALE})` : `scale(${HERO_SCALE})`}`;
function heroG(px, py) { return `<g id="hero" transform="${heroAt(px, py)}" shape-rendering="crispEdges" aria-hidden="true">${bikeSVG(0)}</g>`; }
// ride along points (px) at a steady pace with a short ease in and out, then stop at endPx
function ride(pts, endPx) {
  return new Promise(res => {
    const hero = $('#hero'); if (!hero) return res();
    const all = endPx ? pts.concat([endPx]) : pts.slice(); const seg = [0];
    for (let k = 1; k < all.length; k++) seg.push(seg[k - 1] + Math.hypot(all[k][0] - all[k - 1][0], all[k][1] - all[k - 1][1]));
    const total = seg[seg.length - 1]; let left = false;
    for (let k = all.length - 1; k > 0; k--) { const dx = all[k][0] - all[k - 1][0]; if (Math.abs(dx) > .2) { left = dx < 0; break; } }
    if (!total || reduceMotion || all.length < 2) { const e = all[all.length - 1]; if (e) hero.setAttribute('transform', heroAt(e[0], e[1], left)); return res(); }
    const dur = Math.min(1600, Math.max(500, total / 0.32)); const t0 = performance.now(); let k = 0, frame = -1; left = false;
    const step = now => {
      const u = Math.min(1, (now - t0) / dur); const d = (u < .5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2) * total;
      while (k < seg.length - 2 && seg[k + 1] < d) k++;
      const f = (d - seg[k]) / ((seg[k + 1] - seg[k]) || 1); const x = all[k][0] + (all[k + 1][0] - all[k][0]) * f, y = all[k][1] + (all[k + 1][1] - all[k][1]) * f;
      const dx = all[k + 1][0] - all[k][0]; if (Math.abs(dx) > .2) left = dx < 0;
      const fr = Math.floor(d / 6) % 2; if (fr !== frame) { hero.innerHTML = bikeSVG(fr); frame = fr; }
      hero.setAttribute('transform', heroAt(x, y, left));
      if (u < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
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
/* 2.5: names never cover a house, a flag or a road, nor the arrow, the cyclist or another name. They may stand on
   a square. Each name takes the free spot closest to its square's centre (the user: close to the centre beats the usual side). */
const signW = text => text.length * 7 + 14;
// how much a sign rect covers what matters: houses, the flag row above a house, roads, and the rects in `taken`
function signCost(g, r, taken) {
  const [x0, y0, w, h] = r; if (x0 < 2 || y0 < 2 || x0 + w > g[0].length * TS - 2 || y0 + h > g.length * TS - 2) return Infinity;
  let c = 0;
  for (let cy = Math.floor(y0 / TS); cy <= Math.floor((y0 + h - 1) / TS); cy++) for (let cx = Math.floor(x0 / TS); cx <= Math.floor((x0 + w - 1) / TS); cx++) {
    const ov = (Math.min(x0 + w, (cx + 1) * TS) - Math.max(x0, cx * TS)) * (Math.min(y0 + h, (cy + 1) * TS) - Math.max(y0, cy * TS));
    const t = g[cy][cx], flagRow = g[cy + 1] && g[cy + 1][cx] === 'house'; // a house's flag stands in the row above it
    c += ov * (t === 'house' ? 20 : flagRow ? 12 : t === 'road' ? 8 : 0); // trees, grass and squares may be covered
  }
  taken.forEach(o => { c += 40 * Math.max(0, Math.min(x0 + w, o[0] + o[2]) - Math.max(x0, o[0])) * Math.max(0, Math.min(y0 + h, o[1] + o[3]) - Math.max(y0, o[1])); });
  return c;
}
// spots on a 4 px grid around the centre (x, y); the free one nearest the centre wins, a slight preference for `first` breaks ties
function placeSign(g, text, x, y, taken, first = 'N') {
  const w = signW(text); const bias = {N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0]}[first]; let best = null;
  for (let dy = -84; dy <= 84; dy += 4) for (let dx = -96; dx <= 96; dx += 4) {
    const cx = x + dx, top = y + dy - 8; const d = Math.hypot(dx, dy);
    // the name and the arrow that bobs on top of it (an open square) count together
    const score = Math.min(signCost(g, [cx - w / 2, top, w, 17], taken) + signCost(g, [cx - 7, top - 12, 14, 12], taken), 1e9) * 1000 + d - (dx * bias[0] + dy * bias[1]) * .15;
    if (!best || score < best.score) best = {score, x: cx, y: top, r: [cx - w / 2, top, w, 17], a: [cx - 7, top - 12, 14, 12]};
  }
  taken.push(best.r, best.a); return best;
}
// what stands on a square that a name must leave free: the cyclist, the Ronde flags or the bunting (the arrow bobs on top of the name)
const heroRect = (x, y) => [x + 14 - 13, y + 8 - 23, 26, 24];
// 2.12: one arrow only, the green one over the next step (open towns and pleinen have none)
const arrow = (x, y, next) => `<g transform="translate(${x},${y})"><g class="bob"><path d="M-6,-5 H6 L0,3 Z" fill="${next ? '#2F6B3A' : '#2A2620'}" stroke="#fff" stroke-width="1.5"/></g></g>`;
const flag = (x, y) => `<g transform="translate(${x},${y})" shape-rendering="crispEdges"><rect width="2" height="16" fill="#2A2620"/><rect x="2" width="9" height="6" fill="#F2D35B" stroke="#2A2620" stroke-width="1"/></g>`;
const blocks = (x, y, n, done) => `<g transform="translate(${x - (n * 12 - 2) / 2},${y})" shape-rendering="crispEdges">${Array.from({length: n}, (_, j) => `<rect x="${j * 12}" width="10" height="5" fill="${j < done ? '#2A2620' : '#fff'}" stroke="#2A2620" stroke-width="1"/>`).join('')}</g>`;
function sceneHTML(id, w, h, overlay, label) {
  return `<div class="world" id="${id}"><canvas aria-hidden="true"></canvas><svg viewBox="0 0 ${w * TS} ${h * TS}" role="img" aria-label="${esc(label)}">${overlay}</svg></div>`;
}

/* ---------- roads: straight, with a 90° turn, or curved; they meet a square like a street meets a plaza ----------
   A square is a block of stone tiles. A road leaves from the middle of one side and enters the next square
   in the middle of a side, so it never runs over a square. Road and square share one stone. */
const DIR = {N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0]};
const RW = 12; // road width in px
function lineTo(out, a, b) { const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]))); for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); return out; }
// straight, a short rounded corner, straight: first along x or along y
function lPath(a, b, firstAxis) {
  const c = firstAxis === 'x' ? [b[0], a[1]] : [a[0], b[1]]; const r = 6; const out = [a.slice()];
  const toward = (p, q, d) => { const L = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [p[0] + (q[0] - p[0]) * d / L, p[1] + (q[1] - p[1]) * d / L]; };
  const c1 = toward(c, a, r), c2 = toward(c, b, r); lineTo(out, a, c1);
  for (let k = 1; k <= 8; k++) { const t = k / 8; out.push([(1 - t) ** 2 * c1[0] + 2 * (1 - t) * t * c[0] + t * t * c2[0], (1 - t) ** 2 * c1[1] + 2 * (1 - t) * t * c[1] + t * t * c2[1]]); }
  return lineTo(out, c2, b);
}
function bezier(p0, p1, p2, p3) { const out = []; const n = Math.max(2, Math.round(Math.hypot(p3[0] - p0[0], p3[1] - p0[1]) * 1.4));
  for (let k = 0; k <= n; k++) { const t = k / n, u = 1 - t; out.push([0, 1].map(j => u * u * u * p0[j] + 3 * u * u * t * p1[j] + 3 * u * t * t * p2[j] + t * t * t * p3[j])); } return out; }
// a square: {t: [tile x, tile y] of its centre tile, h: half size in tiles (2.5 = 5×5)}
const sqCenter = s => [(s.t[0] + .5) * TS, (s.t[1] + .5) * TS];
const sqSide = (s, d) => { const [cx, cy] = sqCenter(s); const h = s.h * TS; return {N: [cx, cy - h], S: [cx, cy + h], E: [cx + h, cy], W: [cx - h, cy]}[d]; };
// kinds: 'line' straight, 'L' with a 90° turn, 'curve' smooth (leaves and arrives straight)
function roadBetween(A, out, B, inn, kind) {
  const a = sqSide(A, out), b = sqSide(B, inn);
  if (kind === 'line') return lineTo([a.slice()], a, b);
  if (kind === 'L') return lPath(a, b, DIR[out][0] ? 'x' : 'y');
  const d0 = DIR[out], d1 = DIR[inn], L = Math.hypot(b[0] - a[0], b[1] - a[1]) * .5;
  return bezier(a, [a[0] + d0[0] * L, a[1] + d0[1] * L], [b[0] + d1[0] * L, b[1] + d1[1] * L], b); // both handles point out of their square
}
// what the cyclist rides between two squares: centre → exit → road → entry → centre
function legPts(A, B, road, out, inn) { const p = [sqCenter(A)]; lineTo(p, sqCenter(A), sqSide(A, out)); p.push(...road.slice(1)); return lineTo(p, sqSide(B, inn), sqCenter(B)); }
function markRoad(g, pts) { pts.forEach(([px, py]) => { const x = Math.floor(px / TS), y = Math.floor(py / TS); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const r = g[y + dy]; if (r && r[x + dx] !== undefined && !['water', 'deep', 'plaza'].includes(r[x + dx])) r[x + dx] = 'road'; } }); }
function markSquare(g, s) { const lo = Math.ceil(s.h - .5); for (let y = s.t[1] - lo; y <= s.t[1] + lo; y++) for (let x = s.t[0] - lo; x <= s.t[0] + lo; x++) if (g[y] && g[y][x] !== undefined) g[y][x] = 'plaza'; }
// the sides of a square that a road uses (houses and labels stay off them)
const usedSides = (roads, i) => roads.filter(r => r.from === i).map(r => r.out).concat(roads.filter(r => r.to === i).map(r => r.in));
// houses around a square: the corners, and the middle of every side without a road (the guild hall on top)
function squareHouses(g, s, used, roof) {
  const [cx, cy] = s.t; const o = Math.ceil(s.h - .5) + 2; const out = [];
  // the town hall stands on the first side without a road (top if it can); 2.4: it stands for the Grote Markt
  const hs = ['N', 'S', 'W', 'E'].find(d => !used.includes(d));
  const mid = {N: {x: cx - 1, y: cy - o - 1}, S: {x: cx - 1, y: cy + o}, W: {x: cx - o - 1, y: cy - 1}, E: {x: cx + o, y: cy - 1}};
  const spots = (hs ? [{...mid[hs], hall: true}] : []).concat([{x: cx - o, y: cy - o}, {x: cx + o - 1, y: cy - o}, {x: cx - o, y: cy + o - 1}, {x: cx + o - 1, y: cy + o - 1}],
    ['W', 'E', 'S'].filter(d => d !== hs && !used.includes(d)).map(d => mid[d]));
  spots.forEach(h => { const cells = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dy]) => [h.x + dx, h.y + dy]);
    if (cells.every(([x, y]) => g[y] && ['grass', 'sand', 'flower', 'tuft'].includes(g[y][x]))) { cells.forEach(([x, y]) => { g[y][x] = 'house'; }); out.push({...h, roof}); } });
  return out;
}

/* ---------- LEVEL 1: the arc (world) ---------- */
const WGW = 42, WGH = 64;
// three towns to the right, one long road back, then right again; always on down the map
const TOWN_T = [[6, 7], [19, 10], [31, 17], [24, 29], [7, 29], [12, 42], [29, 46]];
const WSQ = TOWN_T.map(t => ({t, h: 2.5}));
const WROADS = [
  {from: 0, out: 'E', to: 1, in: 'N', kind: 'L'},
  {from: 1, out: 'E', to: 2, in: 'N', kind: 'curve'},
  {from: 2, out: 'S', to: 3, in: 'E', kind: 'L'},
  {from: 3, out: 'W', to: 4, in: 'E', kind: 'line'},
  {from: 4, out: 'S', to: 5, in: 'N', kind: 'curve'},
  {from: 5, out: 'E', to: 6, in: 'N', kind: 'L'},
];
const TOWN_LABEL = ['S', 'S', 'W', 'S', 'N', 'W', 'W']; // where each town's sign stands, off its roads
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
  // the roads, and the last one: down out of Waaromberg, over the river, two 90° turns to the pass
  const roads = WROADS.map(r => roadBetween(WSQ[r.from], r.out, WSQ[r.to], r.in, r.kind));
  const px = (PASS[0] + .5) * TS, a = sqSide(WSQ[6], 'S'), y1 = 56.5 * TS;
  const pass = lineTo([a.slice()], a, [a[0], y1 - 6]); pass.push(...lPath([a[0], y1 - 6], [px + 6, y1], 'y').slice(1), ...lPath([px + 6, y1], [px, WGH * TS], 'x').slice(1));
  roads.concat([pass]).forEach(r => markRoad(g, r));
  WSQ.forEach(s => markSquare(g, s));
  const used = WSQ.map((_, i) => usedSides(WROADS, i).concat(i === 6 ? ['S'] : []));
  const spots = WSQ.map((s, i) => squareHouses(g, s, used[i], ROOF[i]));
  // 2.14: a few more spots on free grass close around each square, so the bigger buildings can stand apart
  WSQ.forEach((s, i) => { const [cx, cy] = s.t; const lo = Math.ceil(s.h - .5); const cand = [];
    for (let y = cy - lo - 6; y <= cy + lo + 5; y++) for (let x = cx - lo - 6; x <= cx + lo + 5; x++) {
      if (x + 1 >= cx - lo - 1 && x <= cx + lo + 1 && y + 1 >= cy - lo - 1 && y <= cy + lo + 1) continue;
      let ok = true; for (let dy = -1; dy <= 2 && ok; dy++) for (let dx = -1; dx <= 2 && ok; dx++) { const t = g[y + dy] && g[y + dy][x + dx]; const inside = dy >= 0 && dy < 2 && dx >= 0 && dx < 2;
        if (t === undefined || (inside ? !['grass', 'flower', 'tuft'].includes(t) : ['road', 'plaza', 'house', 'water', 'deep'].includes(t))) ok = false; }
      if (ok) cand.push([x, y]); }
    cand.sort((a, b) => Math.hypot(a[0] + 1 - cx, a[1] + 1 - cy) - Math.hypot(b[0] + 1 - cx, b[1] + 1 - cy));
    for (const [x, y] of cand) { if (spots[i].length >= 9) break; if ([[0, 0], [1, 0], [0, 1], [1, 1]].some(([dx, dy]) => g[y + dy][x + dx] === 'house')) continue;
      if (spots[i].some(h => Math.abs(h.x - x) < 3 && Math.abs(h.y - y) < 3)) continue; spots[i].push({x, y, roof: ROOF[i], extra: true}); } }); // marked as a house only when used (worldRoles)
  // fields by Smulstad, flower meadows here and there
  for (let y = 20; y <= 24; y++) for (let x = 14; x <= 21; x++) if (g[y][x] === 'grass') g[y][x] = (x + y) % 3 ? 'field' : 'field2';
  const meadow = (x0, x1, y0, y1, p) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y] && g[y][x] === 'grass' && hsh(x * 1.3, y) > p) g[y][x] = 'flower'; };
  meadow(24, 33, 1, 9, .62); meadow(1, 6, 15, 22, .7); meadow(19, 27, 35, 40, .78); meadow(0, 41, 0, 56, .975);
  // the mountains that close the arc, with one pass
  for (let y = 58; y < WGH; y++) for (let x = 0; x < WGW; x += 2) if ((x < PASS[0] - 3 || x > PASS[0] + 2) && g[y][x] !== 'road' && g[y][x + 1] !== 'road') { g[y][x] = 'mtn'; g[y][x + 1] = 'mtn'; }
  for (let y = 56; y <= 57; y++) for (let x = 0; x < WGW; x += 2) if ((x < 10 || x > 30) && hsh(x, y) > .45 && g[y][x] === 'grass' && g[y][x + 1] === 'grass') { g[y][x] = 'mtn'; g[y][x + 1] = 'mtn'; }
  // a few woods, not everywhere
  plantTrees(g, 35, 41, 0, 13, .3); plantTrees(g, 0, 4, 9, 22, .25); plantTrees(g, 31, 41, 52, 57, .35); plantTrees(g, 2, 12, 34, 38, .2); plantTrees(g, 18, 28, 33, 41, .15); plantTrees(g, 8, 14, 12, 20, .15); // 2.14: fewer trees
  for (let y = 0; y < WGH; y++) for (let x = 0; x < WGW; x++) if (g[y][x] === 'grass' && hsh(x + 3, y + 7) < 0.03) g[y][x] = 'tuft';
  WORLD = {g, spots, roads: roads.concat([pass]), squares: WSQ.map((s, i) => ({...s, open: used[i]})),
    legs: WROADS.map((r, k) => legPts(WSQ[r.from], WSQ[r.to], roads[k], r.out, r.in))};
}
// 2.4: per town the town hall is its Grote Markt and three houses are its pleinen: grey until done, in colour once done
const PAD_K = 1.4; // 2.14: the Pad's buildings are drawn 1.4× so flags and bunting read well
// 2.14: the bigger buildings need room above them, so a spot on the top rows of the map is used last (any spot can hold the hall)
function worldRoles(i) {
  if (!WORLD) buildWorld(); WORLD.roles = WORLD.roles || {}; if (WORLD.roles[i]) return WORLD.roles[i];
  const ok = h => h.y >= 3; const hs = WORLD.spots[i].filter(ok).concat(WORLD.spots[i].filter(h => !ok(h)));
  // the box a building covers when drawn k× around the middle of its ground line (a plein house with its flag)
  const box = (h, k, hall, flag = true) => { const bx = h.x * TS + TS, by = h.y * TS + 2 * TS, [x0, y0, x1, y1] = hall ? [-3, -9, 19, 16] : flag ? [0, -9, 20, 16] : [0, 1, 16, 16];
    return [bx + (x0 - TS) * k, by + (y0 - 2 * TS) * k, bx + (x1 - TS) * k, by + (y1 - 2 * TS) * k]; }; // the boxes are generous already (a flag is thinner than its box)
  const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]; const used = [];
  const fits = b => !used.some(u => hit(u, b));
  const hall0 = hs.find(h => h.hall && ok(h)) || hs.find(h => h.hall) && hs[0];
  const fortHit = h => WORLD.fort && h.extra && h.x * TS < WORLD.fort.x + 7 * TS + TS && (h.x + 2) * TS > WORLD.fort.x - TS && h.y * TS < WORLD.fort.y + 7 * TS + TS && (h.y + 2) * TS > WORLD.fort.y - TS;
  // the town hall and the plein houses take the biggest size that fits (1.4×, else 1.2×, else 1×), so no two buildings overlap
  let hall, pleinen;
  for (const hk of [PAD_K, 1.2, 1]) {
    used.length = 0; hall = hall0 && {...hall0, hall: true, k: hk}; if (hall) used.push(box(hall, hk, true)); pleinen = [];
    for (const k of [PAD_K, 1.2, 1]) for (const h of hs) { if (pleinen.length === 3) break; if (h === hall0 || fortHit(h) || pleinen.some(p => p.x === h.x && p.y === h.y)) continue; const b = box(h, k, false); if (fits(b)) { used.push(b); pleinen.push({...h, hall: false, k}); } }
    if (pleinen.length === 3) break;
  }
  for (const h of hs) { if (pleinen.length === 3) break; if (h !== hall0 && !pleinen.some(p => p.x === h.x && p.y === h.y)) pleinen.push({...h, hall: false, k: 1}); } // only if there is no room at all
  const rest = [];
  for (const h of hs) { if (rest.length === 2) break; if (h.extra || h === hall0 || pleinen.some(p => p.x === h.x && p.y === h.y)) continue; const b = box(h, 1, false, false); if (fits(b)) { used.push(b); rest.push({...h, hall: false}); } } // small grey filler houses, only on the old spots
  [hall].concat(pleinen, rest).filter(h => h && h.extra).forEach(h => [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => { WORLD.g[h.y + dy][h.x + dx] = 'house'; })); // an extra spot in use is a house
  return (WORLD.roles[i] = {hall, pleinen, rest});
}
function worldHouses() {
  const out = [];
  UNITS.forEach((u, i) => { const st = townState(u.id); const off = st === 'later' || st === 'locked'; const r = worldRoles(i); const tp = u.built ? townProgress(u.id) : null;
    if (r.hall) out.push({...r.hall, grey: off || !(tp && tp.marktDone)});
    r.pleinen.forEach((h, j) => { const pp = tp && tp.pleinen[j]; out.push({...h, grey: off || !(pp && pp.complete), gold: !off && !!pp && pp.ronde >= 3}); }); // 2.12: golden after Ronde 3
    r.rest.forEach(h => out.push({...h, grey: off})); }); // 2.14: the four buildings drawn bigger; at most two small filler houses that touch nothing
  return out;
}
const townPx = i => sqCenter(WSQ[i]);
const standPx = ([x, y]) => [x + 14, y + 8]; // where the cyclist waits on a square: beside the theme sign in its middle (app21.js)
// where each town's name stands on the Pad (the arrows above the towns are placed first, so names keep clear of them too)
function worldSigns() {
  if (!WORLD) buildWorld();
  const here = UNIT[SQ[nextSquare()].u].n - 1; // the cyclist waits in one town only
  const taken = UNITS.flatMap((u, i) => { const [x, y] = townPx(i); return [[x - 21, y - 19, 42, 14]].concat(i === here ? [heroRect(x, y)] : [], worldRoles(i).pleinen.map(h => [h.x * TS + 9, h.y * TS - 12 * (h.k || 1), 14, 12 * (h.k || 1)])); }).concat(lmRects('pad')); // bunting above and below, the theme signs
  return UNITS.map((u, i) => { const [x, y] = townPx(i); return placeSign(WORLD.g, u.name, x, y, taken, TOWN_LABEL[i]); });
}
function worldOverlay() {
  const WS = worldSigns();
  const t = UNITS.map((u, i) => {
    const [x, y] = townPx(i); const st = townState(u.id); const dim = st === 'later' || st === 'locked';
    const lx = WS[i].x, ly = WS[i].y;
    const tpw = u.built && !dim ? townProgress(u.id) : null;
    return `<g class="wtown" data-act="town" data-u="${u.id}" role="button" tabindex="0" aria-label="${esc(u.name)}: ${esc(u.gram)}${tpw ? `, ${tpw.complete} van 3 pleinen klaar${tpw.marktDone ? ', Grote Markt gehaald' : ''}${tpw.perfect ? ', perfect' : ''}` : dim ? ', nog dicht' : ''}">
      <rect x="${x - 30}" y="${y - 30}" width="60" height="60" fill="transparent"/>
      ${dim ? `<g opacity=".8" fill="#fff"><circle cx="${x - 12}" cy="${y + 2}" r="14"/><circle cx="${x + 3}" cy="${y - 8}" r="15"/><circle cx="${x + 15}" cy="${y + 5}" r="12"/><circle cx="${x - 1}" cy="${y + 12}" r="12"/></g>` : ''}
      ${sign(lx, ly, u.name, dim)}
      ${tpw ? worldRoles(i).pleinen.map((h, j) => { const pp = tpw.pleinen[j]; if (!pp) return ''; const f = padFlag(pp); /* 2.12: 4 of the 5 guild houses decide the flag */
        const k = h.k || PAD_K, bx = h.x * TS + TS, by = h.y * TS + 2 * TS, at = (dx, dy) => [bx + (dx - TS) * k, by + (dy - 2 * TS) * k]; const [x1, y1] = at(-1, 2), [x2] = at(17, 2), [fx, fy] = at(10, -9);
        return roundsFlags(x1, y1, x2, y1, pp.ronde, .45 * k) + (f ? `<g transform="translate(${fx},${fy}) scale(${k})">${miniFlag(0, 0, f === 2)}</g>` : ''); }).join('') : ''}
      ${tpw && tpw.marktDone && tpw.pleinen.length && tpw.pleinen.every(p => p.ronde >= 2) ? bunting(x - 19, y - 17, x + 19, y - 17, tpw.pleinen.every(p => p.ronde >= 3)) : ''}<!-- 2.14: one banner across the square: Ronde 2 on every plein plus the Grote Markt (gold after Ronde 3 everywhere) -->
      ${tpw && tpw.perfect ? sparkles(x, y, 26) : ''}
      ${st === 'next' ? arrow(lx, ly - 6, true) : ''}
    </g>`;
  }).join('');
  const [px, py] = [(PASS[0] + .5) * TS, (WGH - 1) * TS];
  const mist = [[50, 476, 70, 14], [160, 488, 80, 16], [290, 474, 70, 14], [110, 504, 100, 12], [250, 506, 90, 12]].map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".5"/>`).join('');
  const border = `${mist}<g data-act="arc-next" role="button" tabindex="0" aria-label="Boog 2, volgt later">${sign(px, py - 24, 'Boog 2 · Thuiskomen', true)}</g>`;
  return t + border + heroG(...standPx(townPx(UNIT[SQ[nextSquare()].u].n - 1)));
}
function worldView() { return sceneHTML('world', WGW, WGH, worldOverlay(), 'Boog 1: zeven steden langs een weg met rechte stukken, haakse bochten en bochten, met een meer, een rivier en een bergpas naar boog 2'); }

/* ---------- LEVEL 2: a town ---------- */
const TGW = 42, TGH = 40;
const PLAZA_T = [[9, 8], [28, 13], [12, 25], [29, 31]];
const TSQ = PLAZA_T.map((t, j) => ({t, h: j === 3 ? 4.5 : 3.5})); // three 7×7 squares and a 9×9 Grote Markt (the first square's sign stands below it, off the way in)
const TROADS = [
  {from: 0, out: 'E', to: 1, in: 'W', kind: 'curve'},
  {from: 1, out: 'S', to: 2, in: 'E', kind: 'L'},
  {from: 2, out: 'S', to: 3, in: 'W', kind: 'curve'},
];
const TOWN_CACHE = {};
function buildTown(u) {
  if (TOWN_CACHE[u]) return TOWN_CACHE[u];
  const g = grid(TGW, TGH); const i = UNIT[u].n - 1;
  if (u === 'u2') for (let y = 0; y < TGH; y++) for (let x = 0; x < TGW; x++) if (hsh(x, y) > .82) g[y][x] = 'flower';
  if (u === 'u3') for (let y = 31; y <= 37; y++) for (let x = 1; x <= 10; x++) g[y][x] = (x + y) % 3 ? 'field' : 'field2';
  if (u === 'u4') for (let y = 0; y < TGH; y++) for (let x = 37; x < TGW; x++) { g[y][x] = x > 38 ? 'deep' : 'water'; if (x === 37) g[y][36] = 'sand'; }
  if (u === 'u7') for (let y = 0; y <= 3; y++) for (let x = 18; x < TGW; x += 2) if (hsh(x, y) > .25) { g[y][x] = 'mtn'; g[y][x + 1] = 'mtn'; }
  if (u === 'u1') for (let y = 33; y < TGH; y++) for (let x = 30; x < TGW; x++) if (((x - 37) / 6) ** 2 + ((y - 38) / 4) ** 2 < 1) g[y][x] = 'water';
  // the way in: straight down from the top of the map into the first square
  const top = sqSide(TSQ[0], 'N'); const entry = lineTo([[top[0], 0]], [top[0], 0], top);
  const roads = TROADS.map(r => roadBetween(TSQ[r.from], r.out, TSQ[r.to], r.in, r.kind));
  roads.concat([entry]).forEach(r => markRoad(g, r));
  TSQ.forEach(s => markSquare(g, s));
  // each plein gets its five guild houses around its square (on sides without a road), in step order
  const guild = TSQ.slice(0, 3).map((q, j) => {
    const [cx, cy] = q.t; const used = usedSides(TROADS, j).concat(j === 0 ? ['N'] : []); const signSide = j === 0 ? 'S' : 'N'; // the plein's sign stands there
    const side = {N: [[cx - 4, cy - 6], [cx - 1, cy - 6], [cx + 2, cy - 6]], E: [[cx + 5, cy - 4], [cx + 5, cy - 1], [cx + 5, cy + 2]], S: [[cx - 4, cy + 5], [cx - 1, cy + 5], [cx + 2, cy + 5]], W: [[cx - 6, cy - 4], [cx - 6, cy - 1], [cx - 6, cy + 2]]};
    const slots = ['N', 'E', 'S', 'W'].filter(d => d !== signSide).flatMap(d => used.includes(d) ? [side[d][0], side[d][2]] : side[d]);
    const out = [];
    for (const [x, y] of slots) { if (out.length === 5) break;
      const cells = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dy]) => [x + dx, y + dy]);
      if (cells.every(([a, b]) => g[b] && ['grass', 'flower', 'tuft', 'field', 'field2'].includes(g[b][a]))) { cells.forEach(([a, b]) => { g[b][a] = 'house'; }); out.push({x, y}); } }
    return out;
  });
  const nearSquare = (x, y) => TSQ.some(q => Math.abs(x - q.t[0]) <= q.h + 4 && Math.abs(y - q.t[1]) <= q.h + 4);
  const houses = [];
  for (let y = 1; y < TGH - 2; y += 3) for (let x = 1; x < TGW - 2; x += 3) {
    const free = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dy]) => ['grass', 'flower', 'tuft'].includes(g[y + dy][x + dx]));
    if (free && !nearSquare(x, y) && nearPath(g, x, y, 2) && !nearPath(g, x, y, 0) && hsh(x + i, y) < (u === 'u6' ? .95 : .7)) { houses.push({x, y, roof: hsh(x, y + i) > .5 ? ROOF[i] : '#9C6B4A'}); [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([dx, dy]) => g[y + dy][x + dx] = 'house'); }
  }
  plantTrees(g, 0, TGW - 2, 0, TGH - 2, u === 'u5' ? .55 : .3);
  const entryLeg = lineTo(entry.slice(), top, sqCenter(TSQ[0]));
  return (TOWN_CACHE[u] = {g, houses, guild, roads: roads.concat([entry]), squares: TSQ.map((s, j) => ({...s, open: usedSides(TROADS, j).concat(j === 0 ? ['N'] : []), fountain: j === 3})),
    legs: TROADS.map((r, k) => legPts(TSQ[r.from], TSQ[r.to], roads[k], r.out, r.in)), entry: entryLeg});
}
// where the names stand on a town map: three pleinen (the first one's name below it, off the way in) and the Grote Markt
function townSigns(u) {
  const T = buildTown(u); const qs = squaresOf(u); const tp = townProgress(u);
  const [mx, my] = sqCenter(TSQ[3]); const mh = TSQ[3].h * TS;
  const here = qs.findIndex(q => q.id === nextSquare()); // the cyclist waits on one square only
  const taken = qs.flatMap((q, j) => { const [x, y] = sqCenter(TSQ[j]); return [[x - 28, y - 18, 56, 14]].concat(j === here ? [heroRect(x, y)] : []); }) // Ronde flags
    .concat([[mx - mh, my - mh + 2, 2 * mh, 14], [mx - mh, my + 2, 2 * mh, 14], [mx - 10, my - 12, 20, 20]], lmRects('town', u)); // the Grote Markt's bunting and fountain, the theme signs
  const out = qs.map((q, j) => { const [x, y] = sqCenter(TSQ[j]); return placeSign(T.g, q.name, x, y, taken, j === 0 ? 'S' : 'N'); });
  const mt = '★ Grote Markt' + (tp.marktDone ? ' · ' + tp.markt + '%' : '');
  out.markt = placeSign(T.g, mt, mx, my, taken, 'N'); out.markt.text = mt;
  return out;
}
function townOverlay(u) {
  const qs = squaresOf(u); const nq = nextSquare(); const T = buildTown(u); const tp = townProgress(u); const TS2 = townSigns(u);
  const pl = qs.map((q, j) => {
    const [x, y] = sqCenter(TSQ[j]); const st = sqState(q.id); const dim = st === 'locked'; const pp = tp.pleinen[j];
    // flags on its guild houses; Ronde 2/3 flags across the square; sparkles when everything is perfect
    const flags = (T.guild[j] || []).map((h, k) => { const f = houseFlag(q.id, STEPS[k]); return f ? `<g transform="translate(${h.x * TS + 10},${h.y * TS - 9})">${f}</g>` : ''; }).join(''); // 2.22: also the dotted flag
    const label = `Plein ${q.n}: ${esc(q.name)} · ${pp.done} van 5 gildehuizen${pp.top ? `, ${pp.top} op 100%` : ''}${pp.ronde > 1 ? `, Ronde ${pp.ronde}` : ''}${pp.perfect ? ', perfect' : dim ? ', nog dicht' : ''}`;
    return `<g data-act="square" data-q="${q.id}" role="button" tabindex="0" style="cursor:pointer" aria-label="${label}">
      <rect x="${x - 36}" y="${y - 30}" width="72" height="60" fill="${dim ? 'rgba(255,255,255,.55)' : 'transparent'}"/>
      ${flags}${roundsFlags(x - 26, y - 16, x + 26, y - 16, pp.ronde)}${pp.perfect ? sparkles(x, y, 30) : ''}
      ${sign(TS2[j].x, TS2[j].y, q.name, dim)}
      ${st === 'next' ? arrow(TS2[j].x, TS2[j].y - 6, true) : ''}
    </g>`;
  }).join('');
  const [mx, my] = sqCenter(TSQ[3]); const mh = TSQ[3].h * TS; const mOpen = marktOpen(u);
  const markt = marktId(u) ? `<g data-act="markt" data-u="${u}" role="button" tabindex="0" style="cursor:pointer" aria-label="Grote Markt${tp.marktDone ? ', gehaald met ' + tp.markt + '%' : ''}">
      <rect x="${mx - 40}" y="${my - 32}" width="80" height="64" fill="${mOpen ? 'transparent' : 'rgba(255,255,255,.55)'}"/>
      ${tp.marktDone ? bunting(mx - mh + 2, my - mh + 4, mx + mh - 2, my - mh + 4, tp.perfect) + bunting(mx - mh + 2, my + 4, mx + mh - 2, my + 4, tp.perfect) : ''}
      ${tp.perfect ? sparkles(mx, my, 40) : ''}
      ${sign(TS2.markt.x, TS2.markt.y, TS2.markt.text, !mOpen)}</g>` : '';
  const here = qs.findIndex(q => q.id === nq);
  const hp = here >= 0 ? standPx(sqCenter(TSQ[here])) : [sqSide(TSQ[0], 'N')[0], 14];
  return pl + markt + heroG(...hp);
}
function sqState(q) { if (sqComplete(q)) return 'done'; if (!sqOpen(q)) return 'locked'; return nextSquare() === q ? 'next' : 'open'; }
// 2.4: the town's goal in one card above the map, progress on the map, one opdracht box (also on the Grote Markt)
function viewTown(u) {
  const unit = UNIT[u]; const qs = squaresOf(u); const locked = townState(u) === 'locked'; const tp = townProgress(u);
  const sum = [`${tp.complete} van ${qs.length} pleinen klaar`].concat(tp.perfectPleinen ? [`${tp.perfectPleinen} perfect`] : [], tp.marktDone ? [`Grote Markt ${tp.markt}%`] : [], tp.mission ? ['opdracht gedaan'] : []);
  return `<div class="stack">
    <button class="back" data-act="pad-up">‹ Pad</button>
    <div><div class="eyebrow">Boog ${arcOf(u).n} · Stad ${townIndexInArc(u)} · ${esc(arcOf(u).level)}</div><h1>${esc(unit.name)}</h1></div>
    ${goalCard(u)}
    ${coachTip('town2', 'Rond elk plein staan zijn vijf gildehuizen. Een huis krijgt kleur en een gele vlag als je het gehaald hebt, een vlag met een ster bij 100%. Na Ronde 2 hangen er vlaggetjes over het plein, na Ronde 3 gouden. Wat alles betekent, staat bij Ik → Hoe werkt Elke Dag Zin?')}
    ${sceneHTML('townmap', TGW, TGH, townOverlay(u), 'Plattegrond van ' + unit.name + ': ' + sum.join(', '))}
    <div class="small progsum">${sum.join(' · ')}</div>
    ${locked ? `<div class="card soft stack" style="gap:8px"><div>${esc(unit.name)} is nog dicht. Test je erin: 20 vragen over de hele stad, 18 juist om te slagen.</div><button class="btn line" data-act="testout" data-qs="${qs.map(q => q.id).join(',')}">Test je in</button></div>` : ''}
    ${missionRow(u)}
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
  const open = sqOpen(q); const nx = nextStep(q); const pp = pleinProgress(q);
  const h = STEPS.map((st, i) => {
    const built = ACTIVE_STEPS.includes(st); const done = stepDone(q, st);
    const state = !built ? 'later' : !open ? 'locked' : (st === nx && !sqComplete(q)) ? 'next' : 'open';
    const x = 8 + i * 65;
    return `<g data-act="step" data-q="${q}" data-step="${st}" role="button" tabindex="0" style="cursor:pointer" aria-label="${STEP_NAME[st]}${done ? ', klaar' : houseTried(q, st) ? ', geprobeerd' : ''}${built ? '' : ', later'}">
      <rect x="${x - 4}" y="0" width="64" height="150" fill="transparent"/>
      ${guildHouse(x, state, i)}
      ${built && houseFlag(q, st) ? /* the pole stands on the gable's second step; 2.22: also the dotted flag */ `<g transform="translate(${x + 40},10.5) scale(1.5)">${houseFlag(q, st)}</g>` : ''}
      ${state === 'next' ? arrow(x + 28, 9, true) : ''}
      ${sign(x + 28, 118, STEP_NAME[st], state === 'later' || state === 'locked')}
    </g>`;
  }).join('');
  const ni = STEPS.indexOf(nx);
  return h + roundsFlags(10, 40, 324, 40, pp.ronde, 2) + (pp.perfect ? sparkles(0, 0, 1, STEPS.map((_, i) => [8 + i * 65 + (i % 2 ? 50 : 8), i % 2 ? 26 : 70, i * .3])) : '') + heroG(8 + ni * 65 + 28, 186);
}
function viewSquare(q) {
  const sq = SQ[q]; const unit = UNIT[sq.u]; const open = sqOpen(q);
  return `<div class="stack">
    <button class="back" data-act="pad-town" data-u="${sq.u}">‹ ${esc(unit.name)}</button>
    <div><div class="eyebrow">Boog ${arcOf(sq.u).n} · Stad ${townIndexInArc(sq.u)} · Plein ${sq.n} van ${squareCount(sq.u)}</div><h1>${esc(sq.name)}</h1><div class="small" style="margin-top:2px">${esc(sq.title)} · ${esc(sq.en)}</div></div>
    ${coachTip('square', 'Op elk plein staan vijf gildehuizen. Het pijltje wijst naar je volgende stap; grijze huizen komen later. Tik op een huis.')}
    ${sceneHTML('sqmap', SGW, SGH, squareOverlay(q), 'Vijf gildehuizen op ' + sq.name)}
    ${open ? '' : `<div class="card soft stack" style="gap:8px"><div>Dit plein gaat open als je het vorige plein klaar hebt. Of test je erin: 10 vragen, 9 juist om te slagen. Dan zijn Ontdek en Oefen klaar.</div><button class="btn line" data-act="testout" data-qs="${q}">Test je in</button></div>`}
    <div>${STEPS.map(st => { const built = ACTIVE_STEPS.includes(st); const sc = S.sq[q] && S.sq[q].steps && S.sq[q].steps[st];
      return `<button class="tapline" data-act="step" data-q="${q}" data-step="${st}" ${built && open ? '' : 'aria-disabled="true"'}><div class="t"><div style="font-weight:600;${built && open ? '' : 'color:var(--faint)'}">${STEP_NAME[st]}${sc ? ` <span class="small">· ${sc === 'test' ? 'getest' : sc === 1 ? (st === 'ontdek' ? 'gelezen' : 'gedaan') : sc + '%'}</span>` : built && open ? bestTryHTML(q, st) : ''}</div><div class="small">${STEP_DESC[st]}${built ? '' : ' · later'}</div></div><span class="chev" ${built && open ? '' : 'style="color:var(--faint)"'}>›</span></button>`; }).join('')}</div>
    ${roundsBlock(q)}
    ${mineBlock(q)}
  </div>`;
}

// 2.18: a guild house that is not gehaald yet shows your best attempt (Oefen: the session score, Gebruik: the best report
// score in either kanaal); the house itself stays grey until 80%
function bestTry(q, st) {
  const ss = S.sq[q] || {};
  if (st === 'oefen') return (ss.tried || {}).oefen || 0;
  if (st === 'gebruik') { const b = ss.best || {}; return Math.max(+b.spreken || 0, +b.schrijven || 0); }
  return 0;
}
const bestTryHTML = (q, st) => { const t = bestTry(q, st); return t ? ` <span class="small" style="color:var(--warn)" data-en="Best attempt · 80% needed">· beste poging ${t}% · 80% nodig</span>` : ''; }; // next to the name, like a score

/* ---------- navigation with movement ---------- */
function afterRenderMaps() {
  const w = $('#world'); if (w) { if (!WORLD) buildWorld(); WORLD.houses = worldHouses(); drawScene($('canvas', w), {...WORLD, squares: WORLD.squares.map((q, i) => ({...q, gold: townProgress(UNITS[i].id).perfect}))});
    if (!afterRenderMaps.scrolled) { afterRenderMaps.scrolled = true; const y = townPx(UNIT[SQ[nextSquare()].u].n - 1)[1] / (WGH * TS) * w.offsetHeight; $('#main').scrollTop = Math.max(0, w.offsetTop + y - 220); } }
  const t = $('#townmap'); if (t && PAD.u) { const T = buildTown(PAD.u); const qs = squaresOf(PAD.u); const tp = townProgress(PAD.u);
    const gh = T.guild.flatMap((slots, j) => qs[j] ? slots.map((h, k) => ({...h, guild: true, col: FACADE[k], on: houseLevel(qs[j].id, STEPS[k]) > 0})) : []);
    drawScene($('canvas', t), {...T, houses: T.houses.concat(gh), squares: T.squares.map((q, j) => ({...q, gold: j < 3 ? !!(tp.pleinen[j] && tp.pleinen[j].perfect) : tp.perfect}))}); }
  const s = $('#sqmap'); if (s) drawScene($('canvas', s), buildSquare());
}
async function goTown(u) {
  const st = townState(u);
  if (st === 'later') { toast(`${UNIT[u].name} volgt later: ${UNIT[u].gram.toLowerCase()}.`); return; }
  if (RIDING) return; RIDING = true;
  try {
    const i = UNIT[u].n - 1; const from = UNIT[SQ[nextSquare()].u].n - 1;
    if (st !== 'locked' && i !== from) {
      let pts = [standPx(townPx(from))]; if (i > from) for (let s = from; s < i; s++) pts = pts.concat(WORLD.legs[s]); else for (let s = from - 1; s >= i; s--) pts = pts.concat(WORLD.legs[s].slice().reverse());
      await ride(pts, standPx(townPx(i)));
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
      let pts;
      if (nj < 0) { pts = town.entry.slice(); for (let s = 0; s < j; s++) pts = pts.concat(town.legs[s]); }
      else { pts = [standPx(sqCenter(TSQ[nj]))]; if (j > nj) for (let s = nj; s < j; s++) pts = pts.concat(town.legs[s]); else for (let s = nj - 1; s >= j; s--) pts = pts.concat(town.legs[s].slice().reverse()); }
      await ride(pts, standPx(sqCenter(TSQ[j])));
    }
    await zoomOut($('#townmap'), (PLAZA_T[j][0] + 1) * TS, PLAZA_T[j][1] * TS, TGW * TS, TGH * TS);
  } finally { RIDING = false; }
  PAD.lvl = 'sq'; PAD.q = q; PAD.u = SQ[q].u; render(); $('#main').scrollTop = 0;
}
async function goStep(q, st) {
  const hero = $('#hero'); const i = STEPS.indexOf(st);
  if (hero && $('#sqmap') && !reduceMotion && ACTIVE_STEPS.includes(st) && sqOpen(q)) {
    const from = STEPS.indexOf(nextStep(q)); const a = 8 + from * 65 + 28, b = 8 + i * 65 + 28;
    await ride(lineTo([[a, 186]], [a, 186], [b, 186]));
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
