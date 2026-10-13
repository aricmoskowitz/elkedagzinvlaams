/* ===== 2.1: themes. Every word gets one theme, so the Woorden tab can group by theme.
   The tag is matched on the lemma, so the user's own words with the same lemma get it too
   (this list also covers the set "Mijn woorden 1"). A word list may bring its own
   "thema"; the user can change any word's theme on its card (S.themes). */
const THEMES = [
  {id: 'eten', name: 'Eten en drinken', en: 'Food and drink'},
  {id: 'winkelen', name: 'Winkelen en geld', en: 'Shopping and money'},
  {id: 'onderweg', name: 'Onderweg en reizen', en: 'Getting around and travel'},
  {id: 'stad', name: 'In de stad', en: 'In town'},
  {id: 'wonen', name: 'Thuis en wonen', en: 'Home'},
  {id: 'weer', name: 'Het weer', en: 'The weather'},
  {id: 'natuur', name: 'Natuur en dieren', en: 'Nature and animals'},
  {id: 'werk', name: 'Werk', en: 'Work'},
  {id: 'mensen', name: 'Mensen', en: 'People'},
  {id: 'tijd', name: 'Tijd en plannen', en: 'Time and plans'},
  {id: 'gevoel', name: 'Gevoelens en meningen', en: 'Feelings and opinions'},
  {id: 'lichaam', name: 'Lichaam en gezondheid', en: 'Body and health'},
  {id: 'taal', name: 'Taal en school', en: 'Language and school'},
  {id: 'vrij', name: 'Vrije tijd en cultuur', en: 'Free time and culture'},
  {id: 'beschrijven', name: 'Beschrijven', en: 'Describing things'},
  {id: 'basis', name: 'Basiswoorden', en: 'Core words'},
];
const THEME_BY_W = {};
Object.entries({
  eten: 'friet frietkot pak mayonaise saus broodje wafel pint terras koffie bier stoofvlees soep ei appel vork mes bord mossel vlees koekje lekker bestellen eten drinken brood taart bakker glas thee melk suiker café koken brooddoos',
  winkelen: 'pot zak prijs verkoper goedkoop duur meenemen afrekenen uitkiezen kosten kopen betalen kaart rekening bewijs overschot voorraad',
  onderweg: 'tram station halte fiets links rechts rechtdoor ver dichtbij fietsen uitstappen aankomen vertrekken wachten boot haven trein reizen vakantie weg zeil hijsen matroos vaart',
  stad: 'hoek straat plein brug kathedraal markt gebouw kerk toren gevel buurt stad rand periferie',
  wonen: 'huis deur raam tuin kamer trap appartement dak thuis wonen tafel opstaan kalken naaien goot kraan afsluiten zetten plooien vouwen',
  weer: 'regenen zon weer paraplu schijnen warm koud',
  natuur: 'plant bloem stekje cactus vogel zee zweven pauw sluw schuw vos gieten jagen',
  werk: 'werk werken arbeid voortbrengen meten inschatten vennoot hernoemen drager hergebruiken herzien hervatten herstarten',
  mensen: 'meisje vriend buur buurvrouw bezoeker uitnodigen krijger iemand karaktereigenschap redden',
  tijd: 'morgen vandaag vaak altijd zondag vroeg straks gisteren weekend vorig toen wanneer dag week vrij ooit pas verandering voorspelbaarheid voorspelbaar onvoorspelbaar voorspellen herdenken',
  gevoel: 'mening vinden denken hopen zeker moe druk gezellig goed leuk geloven geduld wens verwarring meeleven peinzen lachen nadenken',
  lichaam: 'blaas slapen rennen lopen',
  taal: 'les taal nederlands leren lezen schrijven vragen begrijpen zeggen niveau mededeling herhalen gedicht',
  vrij: 'spelen wandelen museum boek schilderij film kijken speelbaar',
  beschrijven: 'oud nieuw groot klein mooi hoog smal rood wit donker licht breed scherp rond zwaar gevaarlijk voorzichtig verschillend',
  basis: 'zijn hebben nemen gaan komen zoeken zien liggen krijgen willen kunnen mogen moeten zullen maken blijven waar hoe waarom omdat want als graag samen alstublieft weten terugkomen ophalen opbellen weinig genoeg delen klaar alleen maar bewijzen beeld halen gebruiken vatten kennen herkennen starten blijkbaar gewoon kans doen geven sluiten',
}).forEach(([t, ws]) => ws.split(' ').forEach(w => { THEME_BY_W[w] = t; }));
const THEME = Object.fromEntries(THEMES.map(t => [t.id, t]));
