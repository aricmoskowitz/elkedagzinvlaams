/* ===== VERSION 2.7: themes for old words, no translations, cleaner exports (brief 2) =====
   - importing a word that is already in the app fills its empty fields (thema, syn, ant, g, pl, dim), never overwrites
   - EDZ-VERSLAG words carry thema, syn and ant like EDZ-WOORDEN
   - the backup summary uses the app's own rule for "klaar" (sqComplete) and S.cur for plein_nu
   - a stored mistake can be deleted; corrections that only differ in a misheard name are not stored */

/* ---------- fill only empty fields ---------- */
const FILL_KEYS = ['th', 'syn', 'ant', 'g', 'pl', 'dim'];
const emptyVal = v => v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length);
// what a block entry x ({th, syn, ant, g, pl, dim}) would fill on the word with this id: {key: value}
function fillFor(id, x) {
  const l = LX(id); if (!l || !x) return {};
  const out = {};
  if (x.th && !themeOf(l)) out.th = x.th; // themeOf reads S.themes, the word's own th and the app's tag for the lemma
  if (!l.custom) return out; // an app word keeps its card; only a missing theme is added (in S.themes)
  const r = relOf(l);
  if (x.syn && x.syn.length && !r.syn.length) out.syn = x.syn;
  if (x.ant && x.ant.length && !r.ant.length) out.ant = x.ant;
  if (l.p === 'n') ['g', 'pl', 'dim'].forEach(k => { if (emptyVal(l[k]) && !emptyVal(x[k])) out[k] = x[k]; });
  return out;
}
function applyFill(id, f) {
  const l = LX(id); if (!l || !f || !Object.keys(f).length) return 0;
  Object.entries(f).forEach(([k, v]) => {
    if (k === 'th' && !l.custom) { S.themes = S.themes || {}; S.themes[id] = v; } else l[k] = v;
  });
  Store.mark('words'); return 1;
}

/* ---------- "klaar" for the backup summary: the app's own rule ---------- */
// a plein is klaar when the houses the app counts for progress are gehaald: Ontdek, Oefen and Luister (BUILT_STEPS),
// or a test-out. The same rule (sqComplete) opens the next plein and colours the plein's house on the Pad.
// Lees and Gebruik are extra: they add flags and stars, but a plein without them is still klaar.
const pleinKlaar = q => sqComplete(q);

/* ---------- mistakes ---------- */
// a correction whose only differences are names (a capital in the middle of the right sentence) was misheard, not wrong:
// "op de meer" → "op de Meir"
function nameSlip(wrong, right) {
  const W = String(wrong).trim().split(/\s+/), R = String(right).trim().split(/\s+/);
  if (W.length !== R.length) return false;
  const diff = R.map((r, i) => [W[i], r]).filter(([w, r]) => norm(w) !== norm(r));
  return diff.length > 0 && diff.every(([w, r], k) => /^\p{Lu}/u.test(r) && R.indexOf(r) > 0 && !/^\p{Lu}/u.test(w));
}
function deleteFix(id) {
  if (!S.fix || !S.fix[id]) return;
  confirmBox('Deze fout verwijderen? Ze komt niet meer terug in Herhalen.', 'Verwijder', () => {
    delete S.fix[id]; delete S.items['c:' + id + ':fix'];
    if (SES) { const k = 'c:' + id + ':fix'; const cur = SES.steps[SES.i]; SES.steps = SES.steps.filter((st, i) => i <= SES.i || st.key !== k); if (cur && cur.key === k) { SES.answered = true; sesNext(); } }
    Store.mark('items', 'state'); toast('Fout verwijderd'); if (!SES) render(); else { const s = $('.sheet'); if (s) closeSheet(); }
  });
}
