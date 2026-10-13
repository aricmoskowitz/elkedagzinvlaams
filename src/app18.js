/* ===== VERSION 2.5: clearer cards (from the user's review) =====
   - every card says what kind of card it is in one clear label (kindLabel)
   - a fill-in card marks the English word that belongs in the gap (enCue), so only one choice fits
   - the Scroll listening card asks what the sentence means before it shows it
   The rules behind these are in CLAUDE.md (Writing content) and tests/validate.js checks them. */

/* ---------- the card label ---------- */
const KIND_ICON = {syn: '≈', ant: '⇄', def: '?', lisMc: '♪', lisType: '♪', lis: '♪'};
Object.assign(DAYWORD, {lis: 'Luister'}); Object.assign(DAYWORD_EN, {lis: 'Listen'});
function kindLabel(label, cls = 'kind') {
  const t = DAYWORD[label] || (cls === 'kind' ? 'Kies' : ''); if (!t) return '';
  return `<div class="${cls}" data-en="${esc(DAYWORD_EN[label] || '')}">${KIND_ICON[label] ? `<span class="ki" aria-hidden="true">${KIND_ICON[label]}</span>` : ''}${t}</div>`;
}

/* ---------- the English word that belongs in the gap ---------- */
const EN_IRR = {be: 'is are am was were been ’m ’re ’s', will: '’ll would', shall: '’ll', have: 'has had', do: 'does did done', go: 'goes went gone', come: 'came', get: 'got gotten', take: 'took taken', buy: 'bought', eat: 'ate eaten', drink: 'drank drunk', see: 'saw seen', read: 'read', write: 'wrote written', find: 'found', give: 'gave given', make: 'made', say: 'said', think: 'thought', know: 'knew known', leave: 'left', bring: 'brought', sit: 'sat', stand: 'stood', run: 'ran', ride: 'rode ridden', speak: 'spoke spoken', sleep: 'slept', pay: 'paid', sell: 'sold', tell: 'told', meet: 'met', choose: 'chose chosen', begin: 'began begun', keep: 'kept', feel: 'felt', hear: 'heard', lie: 'lay lain lying', hang: 'hung', put: 'put', let: 'let', cost: 'cost', send: 'sent', spend: 'spent', win: 'won', lose: 'lost', fall: 'fell fallen', forget: 'forgot forgotten', understand: 'understood', become: 'became', swim: 'swam swum', sing: 'sang sung', fly: 'flew flown', wear: 'wore worn', hold: 'held', catch: 'caught', teach: 'taught', drive: 'drove driven', break: 'broke broken', grow: 'grew grown', throw: 'threw thrown', show: 'shown', shine: 'shone', light: 'lit', can: 'could', must: 'had to', may: 'might', child: 'children', person: 'people', man: 'men', woman: 'women'};
const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// the forms an English gloss can take in a sentence: tram → trams, take → takes/took/taking, happy → happier
function enForms(w) {
  const f = new Set([w, w + 's', w + 'es', w + 'ed', w + 'd', w + 'ing', w + 'er', w + 'est', w + 'ly']);
  if (/[^aeiou]y$/.test(w)) ['ies', 'ied', 'ier', 'iest', 'ily'].forEach(e => f.add(w.slice(0, -1) + e));
  if (/e$/.test(w)) ['ing', 'ed', 'er', 'est'].forEach(e => f.add(w.slice(0, -1) + e));
  if (/[^aeiou][aeiou][bdglmnprt]$/.test(w)) ['ing', 'ed', 'er'].forEach(e => f.add(w + w.slice(-1) + e));
  (EN_IRR[w] || '').split(' ').filter(Boolean).forEach(x => f.add(x));
  return [...f];
}
// other English words for a lemma, when the sentences use them instead of the gloss (fiets: "bike", not "bicycle")
const EN_ALSO = {fiets: 'bike', nemen: 'have', opbellen: 'call', broodje: 'roll', pint: 'beer', stoofvlees: 'stew', drinken: 'have', liggen: 'be', willen: 'would like', zee: 'seaside'};
// the gloss as phrases to look for: "to pick out" → ["pick out", "pick"]; "to get, receive" → ["get", "receive"]
function enGlosses(l) {
  const raw = String(l.en || '').replace(/\([^)]*\)/g, ' ').split(/[,;/]| or /).concat(EN_ALSO[l.id] ? EN_ALSO[l.id].split(',') : []);
  const out = [];
  raw.map(x => x.trim().toLowerCase().replace(/^(to|a|an|the)\s+/, '').replace(/\s+/g, ' ')).filter(Boolean).forEach(x => {
    out.push(x); const w = x.split(' '); if (w.length > 1 && !['a', 'the'].includes(w[0])) out.push(w[0]);
  });
  return uniq(out);
}
// where the gloss is in the English sentence: [start, end] or null
function enSpot(en, l) {
  for (const g of enGlosses(l)) {
    const w = g.split(' '); const heads = enForms(w[0]);
    for (const h of heads.sort((a, b) => b.length - a.length)) {
      // a contraction (’m, ’ll) sits right after its subject: no word boundary in front
      const re = new RegExp((/^[’']/.test(h) ? '()' : '(^|[^\\p{L}’\'])') + '(' + reEsc([h].concat(w.slice(1)).join(' ')) + ')(?=[^\\p{L}]|$)', 'iu');
      const m = re.exec(en); if (m) return [m.index + m[1].length, m.index + m[1].length + m[2].length];
    }
  }
  return null;
}
// the English sentence with the gap's word marked; if it can't be found, the gloss follows in brackets
function enCue(en, l) {
  const at = enSpot(en, l);
  if (at) return `${esc(en.slice(0, at[0]))}<b class="en-hl">${esc(en.slice(at[0], at[1]))}</b>${esc(en.slice(at[1]))}`;
  return `${esc(en)} <span class="en-hl">(= ${esc(enGlosses(l)[0] || l.en || '')})</span>`;
}

/* ---------- Scroll: the listening card asks what the sentence means ---------- */
function lisOptions(s) {
  const pool = shuffle(SENT.filter(x => x.id !== s.id && x.u === s.u)).concat(shuffle(SENT.filter(x => x.u !== s.u)));
  const out = [s.en]; for (const x of pool) { if (!out.some(o => norm(o) === norm(x.en))) out.push(x.en); if (out.length === 3) break; }
  return shuffle(out);
}
// replaces the 'l' card of fcardHTML (app5)
function lisCardHTML(c) {
  const opts = c.opts = c.opts || lisOptions(c.s);
  return `<div class="fin">${kindLabel('lis')}<div style="display:flex;justify-content:center"><button class="speak" data-act="say" data-text="${esc(c.s.nl)}" style="width:84px;height:84px" aria-label="Speel af">${SPEAK_ICON(34)}</button></div>
    <div class="ex-sub" data-en="What does the sentence mean?">Wat betekent de zin?</div>
    <div class="opts">${opts.map((o, j) => `<button class="opt" style="font-size:17px" data-act="flis" data-fid="${c.fid}" data-j="${j}">${esc(o)}</button>`).join('')}</div>
    <div class="ffb"></div><div class="fback" hidden><div class="row">${speakBtn(c.s.nl)}<div class="nl" style="font-size:21px">${tapWords(c.s.nl)}</div></div></div></div>`;
}
function feedListen(fid, j) {
  const c = FC[fid]; if (!c || c.done) return; c.done = true;
  const pick1 = c.opts[+j]; const ok = pick1 === c.s.en;
  const sec = document.querySelector(`.fcard[data-fid="${fid}"]`);
  $$('[data-act="flis"]', sec).forEach((b, k) => { b.disabled = true; if (c.opts[k] === c.s.en) b.classList.add('right'); else if (k === +j) b.classList.add('wrong'); });
  $('.ffb', sec).innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}" style="padding:10px 12px"><b>${ok ? 'Juist!' : 'Niet helemaal'}</b><div class="why small">Je hoorde:</div></div>`;
  $('.fback', sec).hidden = false;
}
