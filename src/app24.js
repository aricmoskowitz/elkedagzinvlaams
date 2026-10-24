/* ===== 2.17: Luister en zet in volgorde — a listening card with a word bank =====
   You hear the sentence; every one of its words is in the bank, plus three words that don't belong (a de/het swap
   where it fits, the rest from other sentences of the same town). Tap the words in the order you heard them.
   Only the order you heard counts. In Herhalen and the Luister guild house (never in Scroll): a new sentence gets
   Welke zin hoor je? or this card, half and half; a sentence you got right before gets Luister en typ or this card. */
const LIS_EXTRA = 3;
function lisOrdEx(key) {
  const s = SX[key.split(':')[1]];
  const words = s.nl.replace(/[.!?]+$/, '').split(/\s+/).map(w => w.replace(/[,;:]+$/, ''));
  const lower = w => PROPER.has(w) ? w : w[0].toLowerCase() + w.slice(1);
  const have = new Set(words.map(norm)), extra = [];
  const add = w => { if (extra.length < LIS_EXTRA && w && !have.has(norm(w)) && !extra.some(x => norm(x) === norm(w))) extra.push(w); };
  if (have.has('de') && !have.has('het')) add('het'); else if (have.has('het') && !have.has('de')) add('de');
  shuffle(SENT.filter(x => x.u === s.u && x.id !== s.id)).forEach(x => x.nl.replace(/[.!?,;:]/g, '').split(/\s+/).forEach(w => { if (w.length > 1 && Math.random() < .3) add(lower(w)); }));
  shuffle(SENT.filter(x => x.id !== s.id)).slice(0, 20).forEach(x => x.nl.replace(/[.!?,;:]/g, '').split(/\s+/).forEach(w => { if (w.length > 1) add(lower(w)); }));
  const toks = shuffle([...words.map((w, i) => i === 0 ? lower(w) : w), ...extra].map((t, i) => ({t, i})));
  return {type: 'order', key, sent: s, label: 'lisOrd', listen: true, prompt: '', sub: 'Zet de woorden in de volgorde die je hoort. Er zitten ook woorden bij die je niet nodig hebt.',
    tokens: toks, answer: s.nl, accept: [norm(s.nl)], whole: true, exact: true, why: frameNote(s) + (s.why ? ' ' + s.why : ''), frame: s, say: s.nl, punct: s.nl.trim().slice(-1)};
}
const _makeExLis = makeEx; // wrapped on purpose: a listening key can also give the word-bank card
makeEx = function (key, ctx) {
  if (ctx !== 'feed' && /^s:[^:]+:lis$/.test(key) && SX[key.split(':')[1]]) {
    const it = S.items[key]; if (Math.random() < (it && it.r >= 1 ? .35 : .5)) return lisOrdEx(key);
  }
  return _makeExLis(key, ctx);
};
// tapped words can't be misspelled: on a word-bank card "almost right" (one word extra or missing) is wrong
const _checkLis = check; // wrapped on purpose
check = function (ex, input) { const r = _checkLis(ex, input); return ex.exact && r.kind === 'typo' ? {ok: false, kind: 'word'} : r; };
Object.assign(DAYWORD, {lisOrd: 'Luister en zet in volgorde'}); Object.assign(DAYWORD_EN, {lisOrd: 'Listen and put in order'}); KIND_ICON.lisOrd = '♪';
HOWTO.lisOrd = ['Luister en tik de woorden aan in de volgorde die je hoort.', 'Drie woorden horen er niet bij. Tik een gekozen woord opnieuw om het terug te leggen.'];
