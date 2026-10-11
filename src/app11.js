/* ===== BATCH 3 · storage split =====
   Each saved document must stay under 256 KB. Review items are split by arc
   (items = Arc 1, items-a2 … items-a10, items-x = your own words and fixes),
   log entries by month (log-2026-09 …). The state document lists every shard.
   Unchanged documents are not rewritten. */
function itemShard(k) {
  const [t, id] = k.split(':'); let u = null;
  if (t === 'w') { const l = LEX_BY_ID[id]; if (l && l.u) u = 'u' + l.u; }
  else if (t === 's') { const s = SX[id]; if (s) u = 'u' + s.u; }
  if (!u || !PT[u]) return 'items-x';
  return PT[u].arc === 'a1' ? 'items' : 'items-' + PT[u].arc;
}
const LEX_BY_ID = Object.fromEntries(LEX.map(l => [l.id, l]));
const DOC_LIMIT = 240000;
Object.assign(Store, {
  last: {}, warned: false,
  split() {
    const items = {items: {}}; Object.entries(S.items).forEach(([k, v]) => { const n = itemShard(k); (items[n] = items[n] || {})[k] = v; });
    const logs = {}; (S.log || []).forEach(e => { const n = 'log-' + String(e.date || dateKey()).slice(0, 7); (logs[n] = logs[n] || []).push(e); });
    const shards = Object.keys(items).concat(Object.keys(logs));
    const out = {
      state: {v: S.v, savedAt: S.savedAt, sq: S.sq, cur: S.cur, seen: S.seen, activity: S.activity, settings: S.settings, mission: S.mission, coach: S.coach, markt: S.markt || {}, usage: S.usage || {}, shards},
      words: {savedAt: S.savedAt, sets: S.sets, custom: S.custom, fix: S.fix, extras: S.extras, sic: S.sic},
      log: {savedAt: S.savedAt, talks: (S.talks || []).slice(0, 30), months: Object.keys(logs)},
    };
    Object.entries(items).forEach(([n, it]) => { out[n] = {savedAt: S.savedAt, items: it}; });
    Object.entries(logs).forEach(([n, l]) => { out[n] = {savedAt: S.savedAt, log: l}; });
    return out;
  },
  groupOf: n => n.startsWith('items') ? 'items' : n.startsWith('log') ? 'log' : n,
  async connect() {
    if (!window.claude || !window.claude.use) return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const uid = await user.id(); if (!uid) return;
      this.db = db; this.uid = uid;
      const stSnap = await this.ref('state').get(); const st = stSnap.exists ? stSnap.data() : null;
      const names = [...new Set(['items', 'words', 'log'].concat(st && st.shards || []))];
      const snaps = await Promise.all(names.map(n => this.ref(n).get()));
      const docs = {}; snaps.forEach((s, i) => { if (s.exists) docs[names[i]] = s.data(); });
      this.mode = 'db';
      const remoteAt = st ? (st.savedAt || 0) : 0;
      if (st && remoteAt > (S.savedAt || 0)) {
        const items = {}; let log = []; const seenLog = new Set();
        Object.entries(docs).forEach(([n, d]) => {
          if (n.startsWith('items')) Object.assign(items, d.items || {});
          if (n.startsWith('log')) (d.log || []).forEach(e => { if (e && !seenLog.has(e.id)) { seenLog.add(e.id); log.push(e); } });
        });
        log.sort((a, b) => String(b.date).localeCompare(String(a.date)));
        const wd = docs.words || {}, lg = docs.log || {};
        const clean = JSON.parse(JSON.stringify(st)); delete clean.shards;
        S = Object.assign(blankState(), clean, {items: JSON.parse(JSON.stringify(items))}, JSON.parse(JSON.stringify({sets: wd.sets || [], custom: wd.custom || {}, fix: wd.fix || {}, extras: wd.extras || [], sic: wd.sic || {}, log, talks: lg.talks || []})));
        migrate(); this.saveLocal();
        // documents written in the old single-document layout get rewritten once
        if (!st.shards) { ['state', 'items', 'words', 'log'].forEach(n => this.dirty.add(n)); this.flush(); }
      } else if (S.savedAt > remoteAt) { ['state', 'items', 'words', 'log'].forEach(n => this.dirty.add(n)); this.flush(); }
      render();
    } catch (e) { this.mode = 'local'; }
  },
  flush() {
    if (this.mode !== 'db' || !this.dirty.size) return;
    const groups = new Set(this.dirty); this.dirty.clear();
    if (groups.has('items') || groups.has('log')) groups.add('state'); // the shard list may change
    const parts = this.split();
    Object.keys(parts).filter(n => groups.has(this.groupOf(n))).forEach(n => {
      const str = JSON.stringify(parts[n]);
      const sig = str.replace(/"savedAt":\d+,?/, '');
      if (n !== 'state' && this.last[n] === sig) return;
      if (str.length > DOC_LIMIT && !this.warned) { this.warned = true; toast('Opslag: één deel van je voortgang is bijna vol. Maak een back-up via Ik.'); }
      const body = JSON.parse(str);
      this.chain[n] = (this.chain[n] || Promise.resolve()).then(() => this.ref(n).set(body)).then(() => { this.last[n] = sig; }).catch(e => {
        if (e && e.code === 'unavailable') { this.dirty.add(this.groupOf(n)); setTimeout(() => this.flush(), 4000); }
        else if (e && (e.code === 'revoked' || e.code === 'not_granted' || e.code === 'invalid_argument')) this.mode = 'local';
      });
    });
  },
});
function storageReport() {
  const p = Store.split();
  return Object.entries(p).map(([n, d]) => ({n, kb: Math.round(JSON.stringify(d).length / 102.4) / 10})).sort((a, b) => b.kb - a.kb);
}
