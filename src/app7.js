/* ===== COACH: the app teaches itself ===== */
function coachTip(id, text) {
  if ((S.coach && S.coach[id]) || S.settings.tips === false) return '';
  return `<div class="tip" role="note"><div>${text}</div><button class="link" data-act="coach-ok" data-id="${id}">Begrepen</button></div>`;
}
const HOWTO = {
  fix: ['Typ de zin opnieuw, maar nu juist.', 'Deze zin komt uit je eigen logboek, gesprek of tekst.'],
  rec: ['Kies het woord dat in het gat past.', 'Voorbeeld: <i>Ik neem de ___ naar het station.</i> → <b>tram</b>'],
  prod: ['Typ het ontbrekende woord. Een kleine typfout telt als bijna goed.', 'Het Engels onder de zin helpt je.'],
  gen: ['Kies het lidwoord.', '<b class="de">de</b> is blauw, <b class="het">het</b> is rood. Zo zie je het overal in de app.'],
  conj: ['Typ de juiste vorm van het werkwoord.', 'Voorbeeld: <i>nemen · hij ___</i> → <b class="verbword">neemt</b>'],
  ord: ['Tik de stukjes in de juiste volgorde. Tik een stukje opnieuw om het terug te leggen.', 'Denk aan de regel: het werkwoord staat op plaats 2.'],
  tr: ['Schrijf de Engelse zin in het Nederlands.', 'Andere juiste volgordes tellen ook.'],
  lisMc: ['Luister en kies de zin die je hoort.', 'Tik op de luidspreker om opnieuw te luisteren.'],
  lisType: ['Luister en typ wat je hoort.', 'Hoofdletters en leestekens tellen niet mee.']
};
function howtoHTML(ex) {
  const k = 'ex-' + ex.label; if (!HOWTO[ex.label] || (S.coach && S.coach[k])) return '';
  S.coach[k] = 1; Store.mark('state');
  return `<div class="howto"><b>Zo werkt het</b><span>${HOWTO[ex.label][0]}</span><span class="small">${HOWTO[ex.label][1]}</span></div>`;
}
const TOUR = [
  {h: 'Welkom bij Elke Dag Zin', p: '<i>Zin</i> is goesting, en <i>zin</i> is een zin: elke dag een beetje. Je leert Vlaams met hele zinnen, niet met lijstjes. Na elk antwoord zie je waarom het zo is.',
   svg: '<svg viewBox="0 0 300 150"><g transform="translate(150,78) scale(1.6)" fill="none" stroke="#1E1B16" stroke-width="1.6" stroke-linejoin="round"><path d="M-24,34 V2 H-18 V-6 H-12 V-14 H-6 V-24 H6 V-14 H12 V-6 H18 V2 H24 V34 Z"/><path d="M-5,34 V24 A5,5 0 0 1 5,24 V34"/><path d="M-12,8 h6 M6,8 h6"/></g></svg>'},
  {h: 'Steden, pleinen, gildehuizen', p: 'Elke <b>stad</b> leert één stuk grammatica. In elke stad liggen drie <b>pleinen</b>: korte lessen. Op elk plein staan vijf <b>gildehuizen</b>: Ontdek, Oefen, Lees, Luister en Gebruik.',
   svg: '<svg viewBox="0 0 300 150" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="40" cy="75" r="22" stroke="#2F6B3A" stroke-width="2"/><path d="M62,75 H96" stroke="#CFCAC1" stroke-width="2" stroke-dasharray="1 5"/><rect x="100" y="55" width="40" height="40" rx="8" stroke="#2F6B3A" stroke-width="2"/><path d="M140,75 H170" stroke="#CFCAC1" stroke-width="2" stroke-dasharray="1 5"/>' + [0, 1, 2, 3, 4].map(i => `<path transform="translate(${186 + i * 24},60)" d="M-9,30 V4 H-5 V-2 H5 V4 H9 V30 Z" stroke="${i === 0 ? '#2F6B3A' : '#1E1B16'}" ${i === 0 ? 'fill="#2F6B3A"' : ''} stroke-width="1.5"/>`).join('') + '<text x="40" y="120" text-anchor="middle" font-size="12" fill="#6B665E" font-family="Work Sans, sans-serif">stad</text><text x="120" y="120" text-anchor="middle" font-size="12" fill="#6B665E" font-family="Work Sans, sans-serif">plein</text><text x="234" y="120" text-anchor="middle" font-size="12" fill="#6B665E" font-family="Work Sans, sans-serif">5 gildehuizen</text></svg>'},
  {h: 'Kleur betekent iets', p: '<b style="color:var(--go)">Groen</b>: hier kun je op tikken. Gevuld groen is je volgende stap. <b class="de">Blauw</b> is een <i>de</i>-woord, <b class="het">rood</b> een <i>het</i>-woord. <b class="verbword">Goud</b> is het werkwoord in het zinsschema.',
   svg: '<svg viewBox="0 0 300 150" font-family="Georgia, serif"><rect x="20" y="16" width="120" height="40" rx="10" fill="#2F6B3A"/><text x="80" y="41" text-anchor="middle" fill="#fff" font-family="Work Sans, sans-serif" font-size="14" font-weight="600">Start</text><text x="170" y="42" font-size="20" fill="#23408E">de <tspan fill="#1E1B16">tram</tspan></text><text x="20" y="92" font-size="20" fill="#B03A2E">het <tspan fill="#1E1B16">station</tspan></text><rect x="20" y="108" width="62" height="32" rx="7" fill="#F6F4F0"/><text x="51" y="129" text-anchor="middle" font-size="15" fill="#1E1B16">Morgen</text><rect x="86" y="108" width="52" height="32" rx="7" fill="#F3E4C2" stroke="#C99A3A"/><text x="112" y="129" text-anchor="middle" font-size="15" fill="#8A5D10">neem</text><rect x="142" y="108" width="80" height="32" rx="7" fill="#F6F4F0"/><text x="182" y="129" text-anchor="middle" font-size="15" fill="#1E1B16">ik de tram</text></svg>'},
  {h: 'Elke dag een beetje', p: 'Begin met je <b>herhalingen</b>: woorden die je bijna vergeet. Doe dan één stap op je plein. Moe? Open <b>Scroll</b>: één tik per kaart. Houd een label ingedrukt om het Engels te zien.',
   svg: '<svg viewBox="0 0 300 150" font-family="Work Sans, sans-serif"><rect x="40" y="14" width="220" height="44" rx="12" fill="none" stroke="#2F6B3A" stroke-width="1.5"/><text x="56" y="41" font-size="14" fill="#1E1B16" font-weight="600">Herhalen</text><text x="244" y="41" text-anchor="end" font-size="13" fill="#6B665E">12 · 2 min</text><rect x="40" y="66" width="220" height="44" rx="12" fill="#2F6B3A"/><text x="56" y="93" font-size="14" fill="#fff" font-weight="600">Oefen · Tramplein</text><text x="56" y="136" font-size="13" fill="#6B665E">Moe? Scroll ›</text></svg>'}
];
let TOURI = 0;
function openTour(i = 0) {
  TOURI = i; const t = TOUR[i]; const last = i === TOUR.length - 1;
  openOverlay('tour', `<span style="flex:1"></span><button class="link" data-act="tour-end" style="padding:8px 12px">Overslaan</button>`,
    `<div class="tour">${t.svg}<h1>${t.h}</h1><p class="why" style="margin:0;font-size:17px">${t.p}</p><div class="dots">${TOUR.map((_, j) => `<span class="${j === i ? 'on' : ''}"></span>`).join('')}</div><button class="btn block" data-act="${last ? 'tour-end' : 'tour-next'}">${last ? 'Beginnen' : 'Verder'}</button>${i ? `<button class="link" data-act="tour-prev" style="align-self:center">‹ Terug</button>` : ''}</div>`);
}
function openHelp() {
  const terms = [['stad', 'town', 'één stuk grammatica in een thema'], ['plein', 'square', 'een korte les van 10 à 15 minuten'], ['gildehuis', 'guild house', 'een van de vijf stappen op een plein'], ['Ontdek', 'Notice', 'de regel, voorbeelden, nieuwe woorden'], ['Oefen', 'Practise', 'oefeningen met een checkpoint (80%)'], ['Luister', 'Listen', 'zinnen horen en herkennen'], ['Lees · Gebruik', 'Read · Use', 'tekst lezen; spreken en schrijven (later)'], ['herhalen', 'review', 'woorden en zinnen die je bijna vergeet'], ['Scroll', 'feed', 'één tik per kaart, voor moe momenten'], ['set', 'word set', 'een lijst woorden als kaarten of om te typen'], ['testmodus', 'test mode', 'alles open, om de app te testen'], ['test je in', 'test out', 'een korte test om een plein over te slaan']];
  openOverlay('help', `<button class="iconbtn" data-act="overlay-close" data-id="help" aria-label="Sluiten">✕</button><span class="small">Hoe werkt Elke Dag Zin?</span>`,
    `<div class="stack"><h1>Hoe werkt Elke Dag Zin?</h1>
    <p class="why" style="margin:0">Je volgt een pad van steden. Elke stad leert één stuk grammatica in een thema uit het dagelijkse leven. In een stad liggen drie pleinen, en op elk plein doe je vijf stappen. Alles wat je oefent, komt later terug in je herhalingen, precies wanneer je het bijna vergeet.</p>
    <div class="card soft why"><b style="color:var(--go)">Groen</b> = tikken · <b class="de">blauw</b> = de · <b class="het">rood</b> = het · <b class="verbword">goud</b> = het werkwoord</div>
    <h2>Vlaggen en voortgang</h2>
    ${progressLegend()}
    <button class="btn line" data-act="tour-again">Toon de rondleiding opnieuw</button>
    <button class="btn line" data-act="tips-again">Toon alle tips opnieuw</button>
    <h2>Begrippen</h2>
    <div class="list">${terms.map(t => `<div class="li" style="cursor:default"><span class="w">${t[0]}</span><span class="d" style="white-space:normal">${t[2]} <i>(${t[1]})</i></span></div>`).join('')}</div></div>`);
}
