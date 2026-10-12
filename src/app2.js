/* ===== AUDIO ===== */
const Audio = {
  voices: [],
  load() { if (!('speechSynthesis' in window)) return; const f = () => { this.voices = speechSynthesis.getVoices().filter(v => /^nl/i.test(v.lang)); }; f(); speechSynthesis.onvoiceschanged = f; },
  voice() {
    const vs = this.voices; if (!vs.length) return null;
    return vs.find(v => v.name === S.settings.voice) || vs.find(v => /ellen/i.test(v.name)) || vs.find(v => /nl[-_]BE/i.test(v.lang)) || vs[0];
  },
  say(text) {
    if (!('speechSynthesis' in window)) { toast('Spraak is niet beschikbaar in deze browser'); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g, ''));
      const v = this.voice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'nl-BE';
      u.rate = S.settings.rate || 0.9; speechSynthesis.speak(u);
    } catch (e) {}
  }
};
const speakBtn = (text, label = 'Beluister') => `<button class="speak" data-act="say" data-text="${esc(text)}" aria-label="${label}" data-en="Listen"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg></button>`;

/* ===== ARTICLES & WORD DISPLAY ===== */
const art = l => l && l.g ? `<span class="art ${l.g}">${l.g}</span> ` : '';
const wordHTML = l => `${art(l)}<span>${esc(l.w)}</span>`;
function highlight(sentence, surf) {
  const re = new RegExp('(^|[^\\p{L}])(' + surf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=[^\\p{L}]|$)', 'iu');
  return esc(sentence).replace(re, '$1<b>$2</b>');
}
function blankOut(sentence, surf) {
  const re = new RegExp('(^|[^\\p{L}])(' + surf.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=[^\\p{L}]|$)', 'iu');
  return esc(sentence).replace(re, '$1<span class="blank">' + '_'.repeat(Math.max(3, surf.length)) + '</span>');
}

/* ===== SENTENCE FRAME ===== */
function frameCols(s) {
  const c = s.ch, cols = {1: [], 2: [], 3: [], 4: [], 5: []};
  c.forEach((x, i) => {
    let sl = x.sl;
    if (sl === 's') sl = (i === 0) ? '1' : '3';
    cols[sl].push(x.sl === 's' ? `<u>${esc(x.t)}</u>` : esc(x.t));
  });
  return cols;
}
function frameHTML(s) {
  const cols = frameCols(s);
  const labs = {1: ['1', 'voorveld', 'slot 1'], 2: ['2', 'persoonsvorm', 'conjugated verb'], 3: ['3', 'middenveld', 'middle field'], 4: ['4', 'eind', 'verb end'], 5: ['5', 'nazin', 'after']};
  const show = [1, 2, 3, 4].concat(cols[5].length ? [5] : []);
  return `<div class="frame" role="img" aria-label="Zinsschema">` + show.map(n => {
    const empty = !cols[n].length;
    return `<div class="slot s${n}${empty ? ' empty' : ''}"><span class="lab" data-en="${labs[n][2]}">${labs[n][0]} · ${labs[n][1]}</span><span class="box">${empty ? (n === 1 ? 'leeg' : '–') : cols[n].join(' ')}</span></div>`;
  }).join('') + `</div><div class="small" style="margin-top:4px">Onderstreept: het onderwerp.</div>`;
}
const SUBORD = new Set(['omdat', 'dat', 'of', 'als', 'wanneer', 'toen', 'waar', 'wat', 'wie', 'hoe', 'hoeveel', 'waarom', 'welke', 'terwijl', 'voordat', 'nadat', 'zodat', 'hoewel', 'tot', 'sinds', 'zodra']);
function frameNote(s) {
  const c = s.ch; const pv = c.find(x => x.sl === '2'); const subj = c.find(x => x.sl === 's'); const first = c[0];
  const end = c.filter(x => x.sl === '4').map(x => x.t);
  let t = '';
  if (first.sl === '2') t = s.q ? `A yes/no question leaves slot 1 empty, so the verb <i>${esc(pv.t)}</i> comes first.` : `A command leaves slot 1 empty: the verb <i>${esc(pv.t)}</i> comes first.`;
  else if (first.sl === 's') t = `The subject <i>${esc(first.t)}</i> is in slot 1 and the verb <i>${esc(pv.t)}</i> in slot 2.`;
  else t = `<i>${esc(first.t)}</i> takes slot 1, so the verb <i>${esc(pv.t)}</i> stays in slot 2 and the subject <i>${esc(subj ? subj.t : '')}</i> follows it (<i>inversie</i>).`;
  if (end.length) t += ` <i>${esc(end.join(' '))}</i> goes to the end.`;
  if (subj && ['jij', 'je'].includes(subj.t.toLowerCase()) && first.sl !== 's') t += ` With <i>${subj.t.toLowerCase()}</i> after the verb, the verb has no <i>-t</i>.`;
  const five = c.filter(x => x.sl === '5'); const sub = five.length > 1 ? five[0].t.toLowerCase() : '';
  if (SUBORD.has(sub)) t += ` After <i>${esc(sub)}</i> the conjugated verb goes to the end of the clause: <i>${esc(five.map(x => x.t).join(' '))}</i>.`;
  else if (['want', 'maar', 'en', 'dus'].includes(sub)) t += ` After <i>${esc(sub)}</i> the word order stays normal: <i>${esc(five.map(x => x.t).join(' '))}</i>.`;
  return t;
}
/* valid word orders for a reorder task */
function orderVariants(s) {
  const c = s.ch.map(x => ({...x}));
  const vars = [c.map(x => x.t)];
  if (s.q || c[0].sl === '2') return vars.map(v => v.join(' '));
  const pvI = c.findIndex(x => x.sl === '2');
  const subjI = c.findIndex(x => x.sl === 's');
  const subj = c[subjI];
  const frontable = x => { const w = x.t.toLowerCase().split(' '); return ((PREPS.has(w[0]) && w.length > 1) || FRONT_ADV.has(x.t.toLowerCase()) || ['elke', 'volgende', 'vorig', 'vorige'].includes(w[0])) && !PRON.has(x.t.toLowerCase()); };
  const lower = t => PROPER.has(t.split(' ')[0]) ? t : t[0].toLowerCase() + t.slice(1);
  if (subjI === 0) {
    c.forEach((x, i) => {
      if (i > pvI && x.sl === '3' && frontable(x)) {
        const rest = c.filter((_, j) => j !== i && j !== 0 && j !== pvI);
        vars.push([x.t, c[pvI].t, lower(subj.t), ...rest.map(r => r.t)]);
      }
    });
  } else if (subj && !['jij', 'je'].includes(subj.t.toLowerCase())) {
    const front = c[0];
    const rest = c.filter((_, j) => j !== 0 && j !== pvI && j !== subjI);
    if (SUBORD.has(front.t.toLowerCase().split(' ')[0])) vars.push([cap1(subj.t), c[pvI].t, ...rest.map(r => r.t), lower(front.t)]);
    else vars.push([cap1(subj.t), c[pvI].t, lower(front.t), ...rest.map(r => r.t)]);
  }
  return vars.map(v => v.join(' '));
}

/* ===== EXERCISES ===== */
const DAYWORD = {fix: 'Verbeter je zin', rec: 'Kies het woord', prod: 'Vul in', gen: 'De of het?', conj: 'Vervoeg', ord: 'Zet in de juiste volgorde', tr: 'Vertaal naar het Nederlands', lisMc: 'Welke zin hoor je?', lisType: 'Luister en typ'};
const DAYWORD_EN = {fix: 'Correct your sentence', rec: 'Pick the word', prod: 'Fill in', gen: 'De or het?', conj: 'Conjugate', ord: 'Put in the right order', tr: 'Translate into Dutch', lisMc: 'Which sentence do you hear?', lisType: 'Listen and type'};

function distractorsFor(l, surf) {
  const s = surf.toLowerCase();
  if (l.v) {
    const f = vForms(l);
    if (f.sep && s === f.sep) return shuffle(['mee', 'op', 'uit', 'af', 'aan', 'terug'].filter(x => x !== s)).slice(0, 3);
    let pool = uniq([f.ik, f.hij, f.pl, f.im[0], f.im[1], l.w].map(x => x.toLowerCase())).filter(x => x !== s);
    return shuffle(pool).slice(0, 3);
  }
  if (l.p === 'adj' && l.e) {
    const others = shuffle(LEX.filter(x => x.id !== l.id && x.p === 'adj' && x.e));
    const first = s === l.e.toLowerCase() ? l.w : l.e;
    const rest = others.map(x => s === l.e.toLowerCase() ? x.e : x.w).filter(v => v !== s && v !== first);
    return [first, ...rest].slice(0, 3);
  }
  const pool = LEX.concat(Object.values(S.custom || {})).filter(x => x.id !== l.id && x.p === l.p);
  let field = 'w';
  if (l.p === 'n') { if (l.pl && s === l.pl.toLowerCase()) field = 'pl'; else if (l.dim && s === l.dim.toLowerCase()) field = 'dim'; }
  const same = shuffle(pool.filter(x => x.u === l.u && x[field])).concat(shuffle(pool.filter(x => x.u !== l.u && x[field])));
  const out = []; for (const x of same) { const v = x[field].toLowerCase(); if (v !== s && !out.includes(v)) out.push(v); if (out.length === 3) break; }
  // rare parts of speech (an own pronoun or conjunction): fill up with other words
  if (out.length < 3) for (const x of shuffle(LEX.filter(x => x.id !== l.id))) { const v = x.w.toLowerCase(); if (v !== s && !out.includes(v)) out.push(v); if (out.length === 3) break; }
  return out;
}
function clozeWhy(l, surf) {
  const s = surf.toLowerCase(); let t = '';
  if (l.v) {
    const f = vForms(l);
    if (f.sep && s === f.sep) t = `<i>${esc(l.w)}</i> is separable: in slot 2 you get the conjugated part, and <i>${f.sep}</i> goes to the end.`;
    else if (s === l.w.toLowerCase()) t = `After another verb, the infinitive <i>${esc(l.w)}</i> stays in one piece at the end.`;
    else if (s === f.pl.toLowerCase()) t = `Plural subject, so the verb looks like the infinitive: <i>${esc(f.pl)}</i>.`;
    else if (s === f.ik.toLowerCase()) t = `Just the stem <i>${esc(f.ik)}</i>: the subject is <i>ik</i>, or <i>jij/je</i> comes after the verb.`;
    else if (s === f.hij.toLowerCase()) t = `Stem + <i>t</i>: <i>${esc(f.hij)}</i> (jij, u, hij/zij).`;
    else if (f.pp && s === (f.sep + f.pp).toLowerCase()) t = `Participle of <i>${esc(l.w)}</i>, at the end of the sentence. It goes with <i>${f.aux === 'z' ? 'zijn' : f.aux === 'hz' ? 'hebben or zijn' : 'hebben'}</i>. ${l.v.t === 'w' ? kofschip(l) : 'Strong verb: learn the participle with its vowel family' + (l.v.fam ? ' (' + esc(l.v.fam) + ')' : '') + '.'}`;
    t += ` <span class="muted">(${esc(l.w)}: ${esc(l.en)})</span>`;
  } else if (l.p === 'n') {
    if (l.pl && s === l.pl.toLowerCase()) t = `Plural of ${wordHTML(l)}. Plurals always take <i class="de">de</i>.`;
    else if (l.dim && s === l.dim.toLowerCase()) t = `Diminutive of ${wordHTML(l)}: <i class="het">het</i> ${esc(l.dim)}. Every <i>-je</i> word is <i>het</i>.`;
    else t = `${wordHTML(l)}: ${esc(l.d)}. <span class="muted">(${esc(l.en)})</span>`;
    if (l.why) t += ' ' + l.why;
  } else if (l.p === 'adj' && l.e) {
    if (s === l.e.toLowerCase()) t = `<i>${esc(l.e)}</i>: before a noun with <i>de/het/die/dit</i>, before a <i>de</i>-word, or before a plural, the adjective gets <i>-e</i>.`;
    else t = `<i>${esc(l.w)}</i> without <i>-e</i>: either after the verb (<i>het huis is ${esc(l.w)}</i>), or <i>een</i> + a <i>het</i>-word (<i>een ${esc(l.w)} huis</i>).`;
    if (l.why) t += ' ' + l.why;
    t += ` <span class="muted">(${esc(l.en)})</span>`;
  } else t = `<i>${esc(l.w)}</i>: ${esc(l.d)}. <span class="muted">(${esc(l.en)})</span>`;
  return t;
}
function genWhy(l) {
  if (l.why) return l.why;
  if (l.w.endsWith('je')) return 'Every diminutive in <i>-je</i> is <i>het</i>.';
  return `No rule catches this one. Learn it as a pair: <b class="${l.g}">${l.g} ${esc(l.w)}</b>.`;
}

function makeEx(key, ctx = 'drill') {
  const [t, id, sk] = key.split(':');
  const it = S.items[key];
  if (t === 'c') {
    const f = S.fix[id];
    return {type: 'type', key, label: 'fix', prompt: `<span class="nl" style="font-size:20px">${esc(f.wrong)}</span>`, sub: 'Verbeter deze zin. Hij komt uit je ' + ({log: 'logboek', talk: 'gesprek', write: 'schrijfopdracht', onderwerp: 'gesprek met Claude', opdracht: 'opdracht met Claude', dagboek: 'dagboek', foto: 'foto'}[f.src] || 'oefening') + '.', answer: f.right, accept: [norm(f.right)], whole: true, why: esc(f.why || ''), say: f.right};
  }
  if (t === 'e') {
    const ex = extraSentence(id);
    return {type: 'type', key, label: 'tr', prompt: `<span class="nl">${esc(ex.en)}</span>`, sub: 'Extra plein', answer: ex.nl, accept: [norm(ex.nl)], whole: true, why: esc(ex.why || ''), say: ex.nl};
  }
  if (t === 'w') {
    const l = LX(id); const occ = (lexSent[id] || []);
    if (sk === 'gen') {
      const re = new RegExp('\\b(de|het)\\s+' + l.w + '\\b', 'i');
      const sent = l.s && re.test(l.s) ? esc(l.s).replace(re, m => '<span class="blank">___</span> ' + esc(m.split(/\s+/)[1])) : '';
      return {type: 'gen', key, lex: l, label: 'gen', prompt: `<span class="nl" style="font-size:34px">${esc(l.w)}</span>`, sub: sent ? `<span class="nl">${sent}</span>` : '', answer: l.g, why: genWhy(l), say: l.g + ' ' + l.w};
    }
    if (sk === 'conj' && l.v) {
      const f = vForms(l); const p = pick(['ik', 'jij', 'inv', 'u', 'hij', 'pl', 'pl']);
      const plLab = pick(['wij', 'jullie', 'zij']);
      let form = f[p]; let prompt;
      const lab = {ik: 'ik', jij: 'jij', u: 'u', hij: pick(['hij', 'zij', 'het']), pl: plLab}[p];
      if (p === 'inv') prompt = `<span class="blank">____</span> jij${f.sep ? ' … <span class="blank">___</span>' : ''}?`;
      else prompt = `${lab} <span class="blank">____</span>${f.sep ? ' … <span class="blank">___</span>' : ''}`;
      const ans = f.sep ? form + ' ' + f.sep : form;
      const why = personRule(p) + (stemNote(l) ? ' ' + stemNote(l) : '') + (f.sep ? ` Separable: <i>${f.sep}</i> goes to the end.` : '') + (l.v.o ? ` <i>${esc(l.w)}</i> is irregular; learn its forms by heart.` : '');
      if (ctx === 'feed') {
        const opts = shuffle(uniq([ans, ...uniq([f.ik, f.hij, f.pl, f.im[0]]).map(x => f.sep ? x + ' ' + f.sep : x)]).slice(0, 4));
        if (!opts.includes(ans)) opts[0] = ans;
        return {type: 'mc', key, lex: l, label: 'conj', prompt: `<span class="nl">${prompt}</span>`, sub: `<span class="nl">(${esc(l.w)})</span>`, options: shuffle(opts), answer: ans, why, say: null};
      }
      const alts = ((l.v.alt && l.v.alt[p]) || []).map(x => norm(f.sep ? x + ' ' + f.sep : x));
      return {type: 'type', key, lex: l, label: 'conj', prompt: `<span class="nl">${prompt}</span>`, sub: `Infinitief: <b class="nl">${esc(l.w)}</b>${f.sep ? ' · typ beide delen, bv. <i>neem mee</i>' : ''}`, answer: ans, accept: [norm(ans), ...alts], why: why + (alts.length ? ` Both <i>${esc(ans)}</i> and <i>${esc(l.v.alt[p].join(', '))}</i> are correct.` : ''), say: null, conjP: p};
    }
    const useSent = occ.length && (sk === 'prod' ? true : Math.random() < 0.75);
    if (useSent) {
      const o = pick(occ); const s = o.s;
      const body = `<span class="nl">${blankOut(s.nl, o.surf)}</span>`;
      const hint = l.v ? ` · <span class="nl">(${esc(l.w)})</span>` : '';
      const base = {key, lex: l, sent: s, prompt: body, sub: `${esc(s.en)}${hint}`, answer: o.surf.toLowerCase(), why: clozeWhy(l, o.surf) + (s.why ? ' ' + s.why : ''), say: s.nl};
      if (sk === 'rec' || ctx === 'feed') {
        const opts = shuffle([o.surf.toLowerCase(), ...distractorsFor(l, o.surf)]).slice(0, ctx === 'feed' ? 3 : 4);
        if (!opts.includes(o.surf.toLowerCase())) opts[0] = o.surf.toLowerCase();
        return {...base, type: 'mc', label: 'rec', options: shuffle(opts)};
      }
      return {...base, type: 'type', label: 'prod', accept: [norm(o.surf)]};
    }
    const defP = `<span class="nl" style="font-size:20px">${esc(l.d)}</span>`;
    if (sk === 'rec' || ctx === 'feed') {
      const opts = shuffle([l.w, ...distractorsFor(l, l.w)]).slice(0, ctx === 'feed' ? 3 : 4);
      if (!opts.includes(l.w)) opts[0] = l.w;
      return {type: 'mc', key, lex: l, label: 'rec', prompt: defP, sub: l.p === 'n' ? '' : POS[l.p], options: shuffle(opts), answer: l.w, why: `${wordHTML(l)}: ${esc(l.d)}. <span class="muted">(${esc(l.en)})</span>`, say: (l.g ? l.g + ' ' : '') + l.w};
    }
    return {type: 'type', key, lex: l, label: 'prod', prompt: defP, sub: `${POS[l.p] || ''}${l.g ? ' · <b class="' + l.g + '">' + l.g + '</b> …' : ''} · ${esc(l.w.length)} letters`, answer: l.w, accept: [norm(l.w)], why: `${wordHTML(l)}: ${esc(l.d)}. <span class="muted">(${esc(l.en)})</span>` + (l.why ? ' ' + l.why : ''), say: (l.g ? l.g + ' ' : '') + l.w};
  }
  const s = SX[id];
  if (sk === 'tr') return {type: 'type', key, label: 'tr', prompt: `<span class="nl">${esc(s.en)}</span>`, sub: 'Zeg het in het Nederlands, uit je hoofd.', answer: s.nl, accept: orderVariants(s).map(norm), whole: true, why: frameNote(s) + (s.why ? ' ' + s.why : ''), frame: s, say: s.nl};
  if (sk === 'ord') {
    const words = s.nl.split(' ').length;
    if (it && it.r >= 1 && words <= 6 && Math.random() < 0.4) {
      return {type: 'type', key, sent: s, label: 'tr', prompt: `<span class="nl">${esc(s.en)}</span>`, sub: '', answer: s.nl, accept: orderVariants(s).map(norm), whole: true, why: frameNote(s) + (s.why ? ' ' + s.why : ''), frame: s, say: s.nl};
    }
    const lower = t => PROPER.has(t.split(' ')[0]) ? t : t[0].toLowerCase() + t.slice(1);
    const toks = shuffle(s.ch.map((x, i) => ({t: i === 0 ? lower(x.t) : x.t, i})));
    return {type: 'order', key, sent: s, label: 'ord', prompt: `<span class="nl" style="font-size:20px">${esc(s.en)}</span>`, sub: '', tokens: toks, answer: s.nl, accept: orderVariants(s).map(norm), whole: true, why: frameNote(s) + (s.why ? ' ' + s.why : ''), frame: s, say: s.nl, punct: s.nl.trim().slice(-1)};
  }
  /* listening */
  if (it && it.r >= 1) return {type: 'type', key, sent: s, label: 'lisType', prompt: '', listen: true, sub: 'Typ de zin die je hoort.', answer: s.nl, accept: [norm(s.nl)], whole: true, why: `${esc(s.en)}`, say: s.nl, frame: s};
  const others = shuffle(SENT.filter(x => x.id !== s.id && x.u === s.u)).slice(0, 2).map(x => x.nl);
  return {type: 'mc', key, sent: s, label: 'lisMc', listen: true, prompt: '', sub: '', options: shuffle([s.nl, ...others]), answer: s.nl, why: `${esc(s.en)}`, say: s.nl, sentOpts: true};
}

/* ===== CHECKER ===== */
function check(ex, input) {
  if (ex.type === 'mc' || ex.type === 'gen') {
    const ok = norm(input) === norm(ex.answer);
    return {ok, kind: ok ? 'ok' : (ex.type === 'gen' ? 'article' : 'word')};
  }
  const n = norm(input);
  const cand = ex.accept;
  if (cand.includes(n)) return {ok: true, kind: 'ok'};
  if (cand.map(deacc).includes(deacc(n))) return {ok: true, kind: 'accent', note: 'Let op de accenten.'};
  if (!ex.whole && ex.lex && ex.lex.p === 'n') {
    const m = n.match(/^(de|het|een)\s+(.*)$/);
    if (m && cand.includes(m[2])) {
      if (m[1] !== 'een' && ex.lex.g && m[1] !== ex.lex.g && !(ex.lex.pl && m[2] === norm(ex.lex.pl))) return {ok: false, kind: 'article'};
      return {ok: true, kind: 'ok'};
    }
  }
  if (ex.whole) {
    const ws = n.split(' ').sort().join(' ');
    if (cand.some(c => c.split(' ').sort().join(' ') === ws)) return {ok: false, kind: 'order'};
    const swap = n.split(' ').map(w => w === 'de' ? 'het' : w === 'het' ? 'de' : w);
    for (let i = 0; i < swap.length; i++) {
      const w = n.split(' '); if (w[i] === 'de' || w[i] === 'het') { w[i] = w[i] === 'de' ? 'het' : 'de'; if (cand.includes(w.join(' '))) return {ok: false, kind: 'article'}; }
    }
  }
  if (ex.lex && ex.lex.v) {
    const forms = allForms(ex.lex); const f = vForms(ex.lex);
    const n2 = f.sep ? n.replace(new RegExp('\\s*' + f.sep + '$'), '') : n;
    if (forms.includes(n2) || forms.includes(n)) return {ok: false, kind: 'form'};
  }
  const best = Math.min(...cand.map(c => lev(deacc(n), deacc(c))));
  const len = (cand[0] || '').length;
  const tol = ex.whole ? Math.max(2, Math.floor(len * 0.07)) : len >= 8 ? 2 : len >= 4 ? 1 : 0;
  if (best <= tol) return {ok: true, kind: 'typo', note: 'Bijna: let op de spelling.'};
  return {ok: false, kind: 'word'};
}
function whyFor(ex, res) {
  if (res.kind === 'article' && ex.lex) return genWhy(ex.lex);
  if (res.kind === 'form' && ex.lex) return (ex.conjP ? personRule(ex.conjP) + ' ' : '') + ex.why;
  return ex.why;
}
