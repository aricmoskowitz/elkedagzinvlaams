/* ===== The full learning plan to C1: 10 arcs, 5 levels (Delen) =====
   Every town = one grammar point × one Antwerp theme × one can-do statement.
   Every square has the same five guild houses (five different skills).
   Every town ends on its Grote Markt: a review square with the field mission.
   Built towns/squares live in UNITS / SQUARES; everything else is planned here,
   so any mistake or word can be placed: Boog · Stad · Plein. */
const DELEN = [
  {id: 'A2', name: 'Deel A2', en: 'Getting by'},
  {id: 'B1', name: 'Deel B1', en: 'Independent'},
  {id: 'B1+', name: 'Deel B1+', en: 'Taking part'},
  {id: 'B2', name: 'Deel B2', en: 'Work and society'},
  {id: 'C1', name: 'Deel C1', en: 'At home in Dutch'},
];
const ARCS = [
  {id: 'a1', n: 1, deel: 'A2', name: 'Rondkomen', en: 'Getting by', level: 'A2', border: 'de bergpas'},
  {id: 'a2', n: 2, deel: 'A2', name: 'Thuiskomen', en: 'Settling in', level: 'A2', border: 'de grote rivier'},
  {id: 'a3', n: 3, deel: 'B1', name: 'Vlaanderen', en: 'Living in Flanders', level: 'B1', border: 'het donkere bos'},
  {id: 'a4', n: 4, deel: 'B1', name: 'Samenleven', en: 'Living together', level: 'B1', border: 'de sluizen'},
  {id: 'a5', n: 5, deel: 'B1+', name: 'Meepraten', en: 'Joining in', level: 'B1+', border: 'de heide'},
  {id: 'a6', n: 6, deel: 'B1+', name: 'Antwerpen van binnen', en: 'Antwerp from the inside', level: 'B1+', border: 'de dijk'},
  {id: 'a7', n: 7, deel: 'B2', name: 'Op het werk', en: 'At work', level: 'B2', border: 'de spoorbrug'},
  {id: 'a8', n: 8, deel: 'B2', name: 'Maatschappij', en: 'Society', level: 'B2', border: 'de taalgrens'},
  {id: 'a9', n: 9, deel: 'C1', name: 'Vlaanderen verstaan', en: 'Understanding Flanders', level: 'C1', border: 'de duinen'},
  {id: 'a10', n: 10, deel: 'C1', name: 'Thuis in het Nederlands', en: 'At home in Dutch', level: 'C1', border: null},
];
UNITS.forEach(u => { u.arc = 'a1'; });
/* planned towns: [id, arc, name, gram, gramEn, theme, themeEn, can, canEn, squares[[name, title, en, rule]]] */
const PLAN_ROWS = [
  ['u7', 'a1', null, null, null, null, null, null, null, [
    ['Omdatplein', 'Omdat en want', 'Omdat and want', 'After omdat the verb goes to the end; after want the order stays normal.'],
    ['Denkplein', 'Dat, of en vraagwoorden', 'Dat, of and question words', 'In a clause with dat, of, wat, waar… the conjugated verb goes to the end: Ik weet dat het dichtbij is.'],
    ['Alsplein', 'Als, wanneer, toen', 'When and if clauses', 'Time and condition clauses put the verb at the end; a main clause after them starts with its verb: Als het regent, neem ik de tram.']]],
  /* ---- Boog 2 · Thuiskomen (A2) ---- */
  ['u8', 'a2', 'Vroegerdorp', 'Verleden tijd', 'Simple past', 'Antwerpen vroeger', 'Old Antwerp and memories', 'Ik kan vertellen hoe iets vroeger was.', 'I can tell how things used to be.', [
    ['Oude Markt', 'Zwakke verleden tijd', 'Weak simple past', "Weak verbs add -te/-de ('t kofschip): werkte, woonde."],
    ['Klokkentoren', 'Sterke verleden tijd', 'Strong simple past', 'Strong verbs change their vowel: nam, kwam, schreef, was, had.'],
    ['Steenplein', 'Vroeger en toen', 'Used to and back then', 'Vroeger + simple past for habits: Vroeger woonde ik in Gent.'],
    ['Archiefplein', 'Perfectum of imperfectum', 'Perfect or simple past', 'The perfect for single events you report; the simple past for stories and background.']]],
  ['u9', 'a2', 'Morgenveld', 'Toekomst', 'Talking about the future', 'Afspraken en agenda', 'Appointments and plans', 'Ik kan een afspraak maken en zeggen wat ik ga doen.', 'I can make an appointment and say what I will do.', [
    ['Agendaplein', 'Gaan + infinitief', 'Going to', 'Ik ga morgen zwemmen: gaan in slot 2, infinitive at the end.'],
    ['Belofteplein', 'Zullen', 'Will / shall', 'Zullen for promises and predictions: Ik zal je helpen. Het zal regenen.'],
    ['Klokplein', 'Tijd en datum', 'Time and dates', 'om drie uur, op maandag, in mei, over een week, volgende week.']]],
  ['u10', 'a2', 'Vergelijkstad', 'Vergelijken', 'Comparatives and superlatives', 'Winkelen op de Meir en het weer', 'Shopping on the Meir and the weather', 'Ik kan dingen vergelijken en kiezen.', 'I can compare things and choose.', [
    ['Dan-plein', 'Groter dan', 'Comparatives', 'Add -er and use dan: groter dan, mooier dan; after r add -der: duurder.'],
    ['Topplein', 'De grootste', 'Superlatives', 'Add -st: de grootste, het mooiste, het duurst.'],
    ['Zo-als-plein', 'Zo … als, even … als', 'As … as', 'zo groot als, even duur als, niet zo warm als gisteren.'],
    ['Liefstplein', 'Liever, beter, meer', 'Irregular forms', 'graag → liever → het liefst; goed → beter → best; veel → meer → meest.']]],
  ['u11', 'a2', 'Spiegelmeer', 'Wederkerende werkwoorden', 'Reflexive verbs', 'Dagelijkse routine en de huisarts', 'Daily routine and the GP', 'Ik kan mijn dag en hoe ik me voel beschrijven.', 'I can describe my day and how I feel.', [
    ['Wasplein', 'Zich wassen', 'Reflexive pronouns', 'ik was me, jij wast je, hij wast zich, wij wassen ons, zij wassen zich.'],
    ['Voelplein', 'Zich voelen, zich haasten', 'Fixed reflexives', 'zich voelen, zich haasten, zich vergissen, zich herinneren.'],
    ['Wachtkamer', 'Bij de huisarts', 'At the doctor', 'Ik voel me niet goed. Ik heb pijn aan mijn rug. Sinds wanneer?']]],
  ['u12', 'a2', 'Hemhaarhof', 'Voornaamwoorden', 'Object and possessive pronouns', 'Familie en vrienden', 'Family and friends', 'Ik kan over de mensen in mijn leven praten.', 'I can talk about the people in my life.', [
    ['Zieplein', 'Hem, haar, ze, het', 'Object pronouns', 'Ik zie hem. Ik bel haar. For things: de-word → hem, het-word → het.'],
    ['Familieplein', 'Mijn, zijn, haar, hun', 'Possessives', 'mijn, jouw/je, uw, zijn, haar, ons/onze, jullie, hun; ons for het-words, onze for de-words.'],
    ['Vanmijplein', 'Die van mij', 'Mine, yours', 'Is dat jouw fiets? Nee, die van mij is rood. Ook: de mijne (formeler).'],
    ['Kennenplein', 'Weten of kennen', 'Weten or kennen', 'Weten for facts and clauses: Ik weet dat de halte dichtbij is. Ik weet waar hij woont. Kennen for people, places and things you are familiar with: Ik ken haar. Ken je Antwerpen? Ik ken dat liedje.']]],
  ['u13', 'a2', 'Buurtbrug', 'Voorzetsels', 'Prepositions of place and time', 'Wonen in mijn buurt', 'Living in my neighbourhood', 'Ik kan zeggen waar iets is en wanneer iets gebeurt.', 'I can say where something is and when it happens.', [
    ['Hoekplein', 'In, op, aan, bij', 'Place', 'in de stad, op de Meir, aan de Schelde, bij de bakker.'],
    ['Richtingplein', 'Naar, uit, van, door', 'Direction', 'Ik ga naar huis. Ik kom uit Gent. We fietsen door het park.'],
    ['Sindsplein', 'Om, sinds, tot, voor, over', 'Time', 'om acht uur, sinds 2024, tot vrijdag, twee jaar geleden, over een uur.'],
    ['Hangplein', 'Staan, liggen, zitten, hangen', 'Position verbs', 'Dutch says how something is placed: de fiets staat in de gang, het boek ligt op tafel, de sleutel zit in mijn zak, de foto hangt aan de muur. Putting something somewhere: zetten (staan), leggen (liggen), stoppen (zitten), hangen.']]],
  ['u14', 'a2', 'Nietdok', 'Ontkenning', 'Negation', 'Problemen en klachten', 'Problems and complaints', 'Ik kan beleefd zeggen wat niet klopt.', 'I can politely say what is wrong.', [
    ['Geenplein', 'Niet of geen', 'Niet or geen', 'geen replaces een or no article before a noun; niet for everything else.'],
    ['Plaatsplein', 'Waar staat niet?', 'Where niet goes', 'niet goes before the part it negates, and after the object: Ik zie hem niet.'],
    ['Nooitplein', 'Nog niet, niet meer, nooit', 'Not yet, no longer, never', 'De tram is nog niet gekomen. Ik woon er niet meer. Hij belt nooit.']]],
  /* ---- Boog 3 · Vlaanderen (B1) ---- */
  ['u15', 'a3', 'Diedatbrug', 'Betrekkelijke bijzinnen', 'Relative clauses', 'Mensen en beroepen', 'People and jobs', 'Ik kan iemand of iets precies beschrijven.', 'I can describe someone or something precisely.', [
    ['Brugplein', 'Die en dat', 'Die and dat', 'Die for de-words and plurals, dat for het-words; the verb goes to the end.'],
    ['Waarplein', 'Waar + voorzetsel', 'Waar + preposition', 'waarmee, waarover, waarin replace met wat / over wat; for people: met wie.'],
    ['Wiewatplein', 'Wie en wat', 'Wie and wat', 'Wie for people after a preposition, wat after alles, iets, niets and het + superlative.']]],
  ['u16', 'a3', 'Erveld', 'Het woordje er', 'The word er', 'In huis en boodschappen', 'At home and shopping', 'Ik kan over mijn huis en mijn boodschappen praten.', 'I can talk about my home and my shopping.', [
    ['Er-is-plein', 'Er is, er zijn', 'There is / there are', 'Er is een bakker om de hoek. Er zijn geen tomaten meer.'],
    ['Daarplein', 'Er als plaats', 'Er meaning there', 'Ik woon er al lang. Ben je er ooit geweest?'],
    ['Telplein', 'Er + hoeveelheid', 'Er with numbers', 'Ik heb er drie: er stands for the noun you counted.'],
    ['Voorzetselplein', 'Er + voorzetsel', 'Er + preposition', 'erover, ermee, erin: er replaces het/dat after a preposition, often split: Ik denk er niet aan.']]],
  ['u17', 'a3', 'Plannenhaven', 'Te en om te', 'Te and om te', 'Een cursus of werk zoeken', 'Finding a course or a job', 'Ik kan mijn plannen en doelen uitleggen.', 'I can explain my plans and goals.', [
    ['Plannenplein', 'Om te + infinitief', 'In order to', 'Ik ga naar de VDAB om werk te zoeken.'],
    ['Probeerplein', 'Proberen te, beginnen te', 'Verbs with te', 'Ik probeer vroeg op te staan. Het begint te regenen.'],
    ['Bezigplein', 'Aan het + infinitief', 'Doing right now', 'Ik ben aan het koken. Hij zit te lezen.']]],
  ['u18', 'a3', 'Voorbijmolen', 'Voltooid verleden tijd', 'Past perfect', 'Reisverhalen', 'Travel stories', 'Ik kan een verhaal in de juiste volgorde vertellen.', 'I can tell a story in the right order.', [
    ['Reisplein', 'Had en was + deelwoord', 'Had + participle', 'Ik had al gegeten toen hij belde. We waren net vertrokken.'],
    ['Volgordeplein', 'Nadat, voordat, toen', 'Sequence', 'Nadat ik had betaald, ging ik naar buiten.'],
    ['Vertelplein', 'Een verhaal vertellen', 'Telling a story', 'Simple past for the story line, past perfect for what happened before.']]],
  ['u19', 'a3', 'Denkaandorp', 'Vaste voorzetsels', 'Verbs with fixed prepositions', 'Hobby\'s en gevoelens', 'Hobbies and feelings', 'Ik kan vertellen waar ik van hou en waar ik aan denk.', 'I can say what I like and what I think about.', [
    ['Houdvanplein', 'Houden van, wachten op', 'Verb + preposition', 'houden van, wachten op, denken aan, zorgen voor, kijken naar: learn them as pairs.'],
    ['Waaropplein', 'Waarop, erop', 'Asking and referring', 'Waar wacht je op? Ik wacht erop. Waarvan hou je?'],
    ['Gevoelplein', 'Bang voor, trots op', 'Adjective + preposition', 'bang voor, trots op, blij met, boos op, geïnteresseerd in.']]],
  ['u20', 'a3', 'Adviesapotheek', 'Zou en beleefd advies', 'Zou for politeness and advice', 'Apotheek en gezondheid', 'Pharmacy and health', 'Ik kan beleefd advies vragen en geven.', 'I can politely ask for and give advice.', [
    ['Beleefdplein', 'Zou u … kunnen?', 'Polite requests', 'Zou u me kunnen helpen? Ik zou graag een afspraak maken.'],
    ['Raadplein', 'Je zou … moeten', 'Giving advice', 'Je zou meer water moeten drinken. Ik zou naar de dokter gaan.'],
    ['Apotheekplein', 'In de apotheek', 'At the pharmacy', 'Hebt u iets tegen hoofdpijn? Hoeveel keer per dag?']]],
  ['u21', 'a3', 'Gijzegem', 'Gesproken Vlaams', 'Spoken Flemish', 'Straat en café', 'Street and café', 'Ik kan gewone Antwerpse spreektaal volgen.', 'I can follow everyday Antwerp speech.', [
    ['Gijplein', 'Ge en gij', 'Ge and gij', 'Waar woont ge? Gij zijt … — you understand it; you write jij/je.'],
    ['Kesplein', 'Ne, nen en -ke', 'Ne, nen and -ke', 'nen hond, ne pintje, een manneke.'],
    ['Amaiplein', 'Typisch Vlaamse woorden', 'Typical Flemish words', 'goesting, ambetant, amai, allez, schoon, plezant, efkes.']]],
  /* ---- Boog 4 · Samenleven (B1) ---- */
  ['u22', 'a4', 'Werdstad', 'De lijdende vorm', 'The passive', 'De stad verandert', 'The city is changing', 'Ik kan zeggen wat er gebeurt zonder te zeggen wie het doet.', 'I can say what happens without saying who does it.', [
    ['Wordplein', 'Worden + deelwoord', 'Present passive', 'De brug wordt gerenoveerd (door de stad).'],
    ['Werdplein', 'Werd en is … geworden', 'Past passive', 'Het station werd in 1905 gebouwd. Het is verkocht.'],
    ['Ertwordtplein', 'Er wordt …', 'Impersonal passive', 'Er wordt veel gebouwd in Antwerpen. Er wordt gezegd dat …']]],
  ['u23', 'a4', 'Daaromdorp', 'Verbindingswoorden', 'Connectors with inversion', 'Verhuizen en keuzes', 'Moving house and choices', 'Ik kan redenen en gevolgen aan elkaar koppelen.', 'I can link reasons and results.', [
    ['Daaromplein', 'Daarom, dus', 'Therefore, so', 'Daarom neem ik de tram: after these words the verb stays in slot 2.'],
    ['Tochplein', 'Toch, anders', 'Still, otherwise', 'Het regent, toch ga ik fietsen. Haast je, anders mis je de bus.'],
    ['Bovendienplein', 'Bovendien, eerst, daarna', 'Moreover, first, then', 'Eerst zoek ik een huis, daarna verhuis ik. Bovendien is het goedkoper.']]],
  ['u24', 'a4', 'Zeggenstad', 'Indirecte rede', 'Reported speech', 'Berichten en de telefoon', 'Messages and the phone', 'Ik kan doorgeven wat iemand zei of vroeg.', 'I can pass on what someone said or asked.', [
    ['Zegtdatplein', 'Hij zegt dat …', 'Reported statements', 'Ze zegt dat ze later komt: dat + verb at the end, pronouns change.'],
    ['Vroegofplein', 'Ze vroeg of …', 'Reported questions', 'Hij vraagt of je tijd hebt. Ze vroeg waar het station is.'],
    ['Voicemailplein', 'Een bericht doorgeven', 'Passing on a message', 'Je moet hem terugbellen; hij zei dat het dringend was.']]],
  ['u25', 'a4', 'Clusterberg', 'Werkwoordclusters', 'Verb clusters', 'Werk en verplichtingen', 'Work and obligations', 'Ik kan zeggen wat ik moest, kon of wilde doen.', 'I can say what I had to, could or wanted to do.', [
    ['Moetenplein', 'Heb … moeten werken', 'Perfect of modals', 'Ik heb gisteren moeten werken: two infinitives, no participle of moeten.'],
    ['Eindplein', 'Dat ik heb moeten …', 'Clusters at the end', 'Ik weet niet of ik morgen zal kunnen komen.'],
    ['Zienplein', 'Zien komen, horen zingen', 'Perception verbs', 'Ik heb hem zien komen. We hoorden haar zingen.']]],
  ['u26', 'a4', 'Wellestad', 'Kleine woordjes', 'Modal particles', 'Buren en gesprekken', 'Neighbours and small talk', 'Ik kan natuurlijk en vriendelijk klinken.', 'I can sound natural and friendly.', [
    ['Welplein', 'Wel en toch', 'Wel and toch', 'Dat is toch mooi! Ik kom wel.'],
    ['Eensplein', 'Eens en maar', 'Eens and maar', 'Kijk eens! Kom maar binnen.'],
    ['Evenplein', 'Even, nog, al', 'Even, nog, al', 'Wacht even. Ben je er al? Nog een koffie?']]],
  ['u27', 'a4', 'Stadhuiskaai', 'Formele taal', 'Formal register', 'Het stadsloket en papieren', 'City services and paperwork', 'Ik kan een formele e-mail schrijven en een formulier invullen.', 'I can write a formal email and fill in a form.', [
    ['Loketplein', 'U en uw', 'Formal you', 'Use u/uw with officials; the verb takes the jij-form with t: Hebt u …? Kunt u …?'],
    ['Briefplein', 'Een formele e-mail', 'Formal email', 'Geachte …, Graag had ik …, Met vriendelijke groeten.'],
    ['Formulierplein', 'Formulieren en afkortingen', 'Forms and abbreviations', 'rijksregisternummer, bijlage, i.v.m., enz., m.a.w.']]],
  /* ---- Boog 5 · Meepraten (B1+) ---- */
  ['u28', 'a5', 'Zoudijk', 'Voorwaarden', 'Conditions', 'Dromen en wat als', 'Dreams and what ifs', 'Ik kan zeggen wat ik zou doen als …', 'I can say what I would do if …', [
    ['Droomplein', 'Als ik … had, zou ik …', 'Unreal present', 'Als ik tijd had, zou ik vaker lezen.'],
    ['Tenzijplein', 'Tenzij, zodra, zolang', 'Unless, as soon as', 'Ik kom, tenzij het regent. Zodra ik thuis ben, bel ik je.'],
    ['Zodatplein', 'Zodat en opdat', 'So that', 'Ik spreek traag, zodat iedereen het begrijpt.']]],
  ['u29', 'a5', 'Spijtveld', 'Onwerkelijk verleden', 'Past conditional', 'Keuzes achteraf', 'Looking back on choices', 'Ik kan praten over wat anders had kunnen lopen.', 'I can talk about what could have gone differently.', [
    ['Spijtplein', 'Als ik het had geweten, …', 'If I had known', 'Als ik het had geweten, was ik gekomen.'],
    ['Hadplein', 'Had … moeten, had … kunnen', 'Should have, could have', 'Je had me moeten bellen. Het had erger kunnen zijn.'],
    ['Wensplein', 'Ik wou dat …', 'Wishes', 'Ik wou dat ik vroeger Nederlands had geleerd.']]],
  ['u30', 'a5', 'Meningsmarkt', 'Je mening geven', 'Giving your opinion', 'Het stadsdebat: fiets, auto, LEZ', 'City debate: bikes, cars, low-emission zone', 'Ik kan mijn mening geven en reageren op die van anderen.', 'I can give my opinion and react to others.', [
    ['Vindplein', 'Ik vind dat …, volgens mij …', 'I think that…', 'Ik vind dat …, volgens mij …, ik denk dat …: dat sends the verb to the end.'],
    ['Eensplein', 'Daar ben ik het mee eens', 'Agreeing and disagreeing', 'Ik ben het met je eens. Daar ben ik het niet mee eens. Dat klopt, maar …'],
    ['Argumentplein', 'Argumenten geven', 'Giving arguments', 'Ten eerste …, bovendien …, daarom …']]],
  ['u31', 'a5', 'Hoewelhaven', 'Tegenstelling', 'Contrast and concession', 'Werk en privé', 'Work and private life', 'Ik kan voor- en nadelen tegen elkaar afwegen.', 'I can weigh up pros and cons.', [
    ['Hoewelplein', 'Hoewel, ondanks', 'Although, despite', 'Hoewel het regent, ga ik wandelen. Ondanks de regen …'],
    ['Terwijlplein', 'Terwijl, maar, echter', 'While, but, however', 'Hij werkt veel, terwijl zij liever thuis is. Het is echter duur.'],
    ['Weliswaarplein', 'Weliswaar … maar', 'Admittedly … but', 'Het is weliswaar ver, maar de reis is mooi.']]],
  ['u32', 'a5', 'Syndicusstraat', 'Tijd en voorwaarde in regels', 'Time clauses in rules', 'Regels in het gebouw en op het werk', 'Rules at home and at work', 'Ik kan regels en afspraken uitleggen en begrijpen.', 'I can explain and understand rules and agreements.', [
    ['Voordatplein', 'Voordat, nadat, zodra', 'Before, after, as soon as', 'Voordat je vertrekt, doe je het licht uit.'],
    ['Indienplein', 'Indien, mits, in geval van', 'Formal conditions', 'Indien u vragen hebt, neem dan contact op. Mits betaling.'],
    ['Verbodplein', 'Het is verboden te …', 'Rules and bans', 'Het is niet toegestaan te roken. Fietsen moeten in de kelder.']]],
  ['u33', 'a5', 'Woordsmederij', 'Woordvorming', 'Word formation', 'Solliciteren', 'Applying for a job', 'Ik kan een sollicitatiegesprek voeren.', 'I can hold a job interview.', [
    ['Heidplein', '-heid, -ing, -schap', 'Nouns from words', 'vrij → de vrijheid, oefenen → de oefening; -heid and -ing are de-words.'],
    ['Baarplein', '-baar, -loos, -lijk, on-', 'Adjectives from words', 'drinkbaar, werkloos, vriendelijk, onmogelijk.'],
    ['Gesprekplein', 'Het sollicitatiegesprek', 'The interview', 'Ik heb ervaring met … Mijn sterke punt is … Wanneer kan ik beginnen?']]],
  /* ---- Boog 6 · Antwerpen van binnen (B1+) ---- */
  ['u34', 'a6', 'Havenstad', 'Samengestelde woorden', 'Compounds and noun groups', 'De haven', 'The port', 'Ik kan uitleg over een bedrijf of proces volgen.', 'I can follow an explanation of a company or process.', [
    ['Containerplein', 'Samenstellingen', 'Compound nouns', 'The last part decides de/het: de haven + het bedrijf = het havenbedrijf.'],
    ['Tussen-s-plein', 'Tussen -s- en -e(n)-', 'Linking letters', 'de stadsbus, het rijbewijs, de pannenkoek.'],
    ['Procesplein', 'Een proces uitleggen', 'Explaining a process', 'Eerst wordt …, vervolgens …, ten slotte …']]],
  ['u35', 'a6', 'Rubenshof', 'Vertellende tijden', 'Narrative tenses', 'Kunst en geschiedenis', 'Art and history', 'Ik kan een museumtekst lezen en navertellen.', 'I can read and retell a museum text.', [
    ['Schilderplein', 'Imperfectum in verhalen', 'Simple past in narrative', 'Rubens woonde en werkte in Antwerpen; stories stay in the simple past.'],
    ['Drukkerijplein', 'Historisch presens', 'Historic present', 'In 1576 plunderen Spaanse soldaten de stad: present tense for vivid history.'],
    ['Museumkaai', 'Beschrijven wat je ziet', 'Describing art', 'Op de voorgrond …, op de achtergrond …, het doet me denken aan …']]],
  ['u36', 'a6', 'Krantenkaai', 'Samenvatten en bronnen', 'Summarising and sources', 'Krant en VRT', 'Newspapers and VRT', 'Ik kan zeggen wat een artikel zegt, in drie zinnen.', 'I can say what an article says in three sentences.', [
    ['Volgensplein', 'Volgens, naar verluidt, blijkbaar', 'Reporting sources', 'Volgens de stad … Blijkbaar is … Naar verluidt …'],
    ['Kernplein', 'De kern vinden', 'Finding the main point', 'Who, what, where, when, why — then one sentence per point.'],
    ['Samenvatplein', 'Samenvatten', 'Summarising', 'Het artikel gaat over … De schrijver vindt dat … Kortom …']]],
  ['u37', 'a6', 'Zorgdorp', 'Uitleggen en beschrijven', 'Explaining and describing precisely', 'Het ziekenhuis en de mutualiteit', 'Hospital and health insurance', 'Ik kan klachten precies beschrijven en uitleg volgen.', 'I can describe symptoms precisely and follow explanations.', [
    ['Klachtenplein', 'Sinds, al, telkens als', 'Describing symptoms', 'Ik heb al drie dagen koorts. Telkens als ik loop, doet het pijn.'],
    ['Mutualiteitplein', 'Terugbetaling en papieren', 'Reimbursement and paperwork', 'het getuigschrift, de terugbetaling, het remgeld.'],
    ['Uitlegplein', 'Een uitleg controleren', 'Checking you understood', 'Als ik het goed begrijp, moet ik … Bedoelt u dat …?']]],
  ['u38', 'a6', 'Sinksenfoor', 'Uitdrukkingen', 'Idioms and fixed expressions', 'Feesten en tradities', 'Festivals and traditions', 'Ik kan veelgebruikte uitdrukkingen begrijpen en gebruiken.', 'I can understand and use common idioms.', [
    ['Kermisplein', 'Vaste uitdrukkingen', 'Common idioms', 'Dat is een koud kunstje. Hij heeft een gat in zijn hand.'],
    ['Sinterklaasplein', 'Tradities uitleggen', 'Explaining traditions', 'Op 6 december … Het is de gewoonte om …'],
    ['Spreekwoordplein', 'Spreekwoorden', 'Proverbs', 'Wie niet waagt, wie niet wint. Beter laat dan nooit.']]],
  ['u39', 'a6', 'Klantenkade', 'Gesprekstechniek', 'Conversation strategies', 'Klantendienst en telefoon', 'Customer service and the phone', 'Ik kan een probleem aan de telefoon oplossen.', 'I can solve a problem on the phone.', [
    ['Herhaalplein', 'Vragen om herhaling', 'Asking to repeat', 'Sorry, kunt u dat herhalen? Wat bedoelt u met …?'],
    ['Omschrijfplein', 'Omschrijven', 'Talking around a word', 'Het is een ding waarmee je … Hoe noem je dat?'],
    ['Oplosplein', 'Een klacht oplossen', 'Resolving a complaint', 'Ik bel over … Wat kunt u voor me doen? Kan ik dat schriftelijk krijgen?']]],
  /* ---- Boog 7 · Op het werk (B2) ---- */
  ['u40', 'a7', 'Vergaderzaal', 'Voorstellen en afzwakken', 'Proposing and hedging', 'Vergaderen', 'Meetings', 'Ik kan in een vergadering voorstellen doen en reageren.', 'I can make proposals in a meeting and respond.', [
    ['Voorstelplein', 'Zouden we … kunnen?', 'Proposing', 'Zouden we kunnen overwegen om …? Mijn voorstel is …'],
    ['Afzwakplein', 'Misschien, eventueel, enigszins', 'Hedging', 'Het is misschien beter om … Ik ben er niet helemaal zeker van.'],
    ['Actieplein', 'Afspraken vastleggen', 'Agreeing actions', 'Wie doet wat tegen wanneer? Ik neem dat op me.']]],
  ['u41', 'a7', 'Rapportstad', 'Schrijftaal', 'Written register', 'Verslagen en e-mails', 'Reports and emails', 'Ik kan een helder verslag of zakelijke e-mail schrijven.', 'I can write a clear report or business email.', [
    ['Nominaliseerplein', 'Naamwoordstijl', 'Nominalisation', 'Er werd beslist → de beslissing; used in reports, sparingly.'],
    ['Moetwordenplein', 'Moet worden gedaan', 'Passive with modals', 'Het formulier moet worden ingevuld. Dit kan worden aangepast.'],
    ['Opbouwplein', 'Inleiding, kern, slot', 'Structure', 'In dit verslag … Ten eerste … Tot slot …']]],
  ['u42', 'a7', 'Presentatieplein', 'Een betoog opbouwen', 'Structuring a talk', 'Presenteren', 'Presenting', 'Ik kan een korte presentatie geven en vragen beantwoorden.', 'I can give a short presentation and answer questions.', [
    ['Structuurplein', 'Ten eerste, vervolgens, kortom', 'Signposting', 'Ik begin met … Vervolgens … Kortom …'],
    ['Grafiekplein', 'Cijfers en grafieken', 'Numbers and charts', 'stijgen, dalen, verdubbelen, met tien procent, de helft.'],
    ['Vragenplein', 'Vragen beantwoorden', 'Handling questions', 'Goede vraag. Als ik het goed begrijp, vraagt u … Daar kom ik op terug.']]],
  ['u43', 'a7', 'Onderhandelkade', 'Voorwaarden en toegevingen', 'Negotiating', 'Huur, prijs en loon', 'Rent, price and salary', 'Ik kan onderhandelen over een prijs of voorwaarden.', 'I can negotiate a price or conditions.', [
    ['Bodplein', 'Op voorwaarde dat …', 'On condition that', 'Ik ga akkoord op voorwaarde dat … Wat als we …?'],
    ['Toegeefplein', 'Ik wil best …, maar …', 'Conceding', 'Ik wil best tegemoetkomen, maar dan …'],
    ['Loonplein', 'Loon en contract', 'Salary and contract', 'het brutoloon, het nettoloon, de maaltijdcheques, de opzegtermijn.']]],
  ['u44', 'a7', 'Feedbackveld', 'Beleefdheid en kritiek', 'Politeness and criticism', 'Collega\'s en feedback', 'Colleagues and feedback', 'Ik kan tactvol kritiek geven en ontvangen.', 'I can give and take criticism tactfully.', [
    ['Zachtplein', 'Verzachten', 'Softening', 'Ik vraag me af of … Het zou fijn zijn als … Misschien kunnen we …'],
    ['Ikplein', 'Ik-boodschappen', 'I-statements', 'Ik merk dat … Ik heb het gevoel dat …'],
    ['Dankplein', 'Reageren op feedback', 'Responding to feedback', 'Bedankt voor je eerlijkheid. Daar heb je een punt.']]],
  ['u45', 'a7', 'Nuancedorp', 'Nuance', 'Degree and nuance', 'Evaluaties en beoordelingen', 'Evaluations and reviews', 'Ik kan precies zeggen hoe goed of slecht iets is.', 'I can say precisely how good or bad something is.', [
    ['Nogalplein', 'Nogal, vrij, tamelijk, enigszins', 'Fairly, quite', 'Het was nogal duur. Het ging vrij goed.'],
    ['Allesbehalveplein', 'Allesbehalve, allerminst', 'Anything but', 'Het was allesbehalve makkelijk.'],
    ['Versterkplein', 'Uiterst, bijzonder, ontzettend', 'Intensifiers', 'uiterst belangrijk, bijzonder geslaagd, ontzettend moe.']]],
  /* ---- Boog 8 · Maatschappij (B2) ---- */
  ['u46', 'a8', 'Gemeenteraad', 'Onpersoonlijke zinnen', 'Impersonal constructions', 'Politiek in stad en land', 'Politics in city and country', 'Ik kan uitleggen hoe België bestuurd wordt.', 'I can explain how Belgium is governed.', [
    ['Menplein', 'Men, je, er wordt', 'One, people', 'Men zegt dat … Er wordt beslist dat …'],
    ['Bestuursplein', 'Gemeente, gewest, federaal', 'Levels of government', 'de gemeente, het district, het Vlaams Gewest, de federale regering.'],
    ['Stemplein', 'Verkiezingen', 'Elections', 'stemmen, de stemplicht, de partij, de coalitie, de meerderheid.']]],
  ['u47', 'a8', 'Klimaatkaai', 'Oorzaak en gevolg', 'Cause and effect', 'Milieu en de Schelde', 'Environment and the Scheldt', 'Ik kan oorzaken en gevolgen van een probleem uitleggen.', 'I can explain the causes and effects of a problem.', [
    ['Doordatplein', 'Doordat of omdat', 'Doordat vs omdat', 'doordat for causes, omdat for reasons: De weg is nat doordat het regent.'],
    ['Leidentotplein', 'Leiden tot, zorgen voor', 'Leading to', 'Dat leidt tot meer files. Dat zorgt voor overlast.'],
    ['Gevolgplein', 'Als gevolg van, dankzij', 'As a result of', 'Als gevolg van de storm … Dankzij de nieuwe dijk …']]],
  ['u48', 'a8', 'Onderwijshof', 'Deelwoorden als bijvoeglijk naamwoord', 'Participles as adjectives', 'Onderwijs en opleiding', 'Education and training', 'Ik kan over opleidingen en het schoolsysteem praten.', 'I can talk about training and the school system.', [
    ['Gekochtplein', 'De gekochte fiets', 'Past participle adjectives', 'de gisteren gekochte fiets = de fiets die gisteren gekocht is.'],
    ['Lerendplein', 'De lerende mens', 'Present participle', 'de stijgende prijzen, een boeiende les.'],
    ['Schoolplein', 'Het Vlaamse schoolsysteem', 'The Flemish school system', 'basisschool, secundair, hogeschool, universiteit, volwassenenonderwijs.']]],
  ['u49', 'a8', 'Samenlevingsplein', 'Argumenteren', 'Arguing a case', 'Samenleven in een diverse stad', 'Living together in a diverse city', 'Ik kan een standpunt met argumenten en tegenargumenten verdedigen.', 'I can defend a position with arguments and counter-arguments.', [
    ['Enerzijdsplein', 'Enerzijds … anderzijds', 'On the one hand', 'Enerzijds …, anderzijds … Aan de ene kant …'],
    ['Tegenplein', 'Tegenargumenten', 'Counter-arguments', 'Men zou kunnen tegenwerpen dat … Toch denk ik …'],
    ['Conclusieplein', 'Een conclusie trekken', 'Concluding', 'Alles bij elkaar genomen … Daarom pleit ik voor …']]],
  ['u50', 'a8', 'Mediapark', 'Lange zinnen', 'Parsing long sentences', 'VRT NWS en De Standaard', 'News on VRT and in De Standaard', 'Ik kan het nieuws volgen zonder ondertitels.', 'I can follow the news without subtitles.', [
    ['Ontleedplein', 'Het werkwoord vinden', 'Finding the verbs', 'Find the conjugated verb in slot 2 and the verb end first; the rest hangs between.'],
    ['Tussenzinplein', 'Tussenzinnen', 'Embedded clauses', 'De minister, die gisteren in Antwerpen was, zei dat …'],
    ['Journaalplein', 'Het journaal', 'The TV news', 'Fast listening: headlines, then details; names and numbers first.']]],
  ['u51', 'a8', 'Contractenkaai', 'Juridische taal', 'Legal and administrative language', 'Contracten en rechten', 'Contracts and rights', 'Ik kan een huurcontract of reglement begrijpen.', 'I can understand a lease or regulations.', [
    ['Artikelplein', 'Artikels en clausules', 'Articles and clauses', 'de huurder, de verhuurder, de waarborg, de opzeg.'],
    ['Mitsplein', 'Mits, tenzij, behoudens', 'Formal conditions', 'mits schriftelijke toestemming, behoudens andersluidende afspraken.'],
    ['Rechtenplein', 'Rechten en plichten', 'Rights and duties', 'U hebt het recht om … De huurder is verplicht …']]],
  /* ---- Boog 9 · Vlaanderen verstaan (C1) ---- */
  ['u52', 'a9', 'Streektaalstad', 'Taalvariatie', 'Language variation', 'Antwerps en tussentaal', 'Antwerp dialect and in-between language', 'Ik kan tussentaal en Antwerps verstaan en weet wanneer ik standaardtaal gebruik.', 'I can understand tussentaal and Antwerp speech and know when to use standard Dutch.', [
    ['Tussentaalplein', 'Tussentaal', 'In-between language', 'ge/gij, ne(n), -ke, weglaten van eind-t: herkennen en vertalen naar standaardtaal.'],
    ['Sinjorenplein', 'Het Antwerps', 'Antwerp dialect', 'Klanken en woorden van de Sinjoren: herkennen, niet nadoen.'],
    ['Belgischplein', 'Belgisch en Nederlands Nederlands', 'Belgian vs Netherlands Dutch', 'de gsm / de mobiel, het lief / de vriendin, goesting / zin.']]],
  ['u53', 'a9', 'Humorhaven', 'Ironie en woordspel', 'Irony and wordplay', 'Humor, cartoons en comedy', 'Humour, cartoons and comedy', 'Ik kan grappen, ironie en understatement begrijpen.', 'I can understand jokes, irony and understatement.', [
    ['Ironieplein', 'Ironie en sarcasme', 'Irony', 'Dat is weer eens handig. — meaning the opposite.'],
    ['Woordspelplein', 'Woordspelingen', 'Puns', 'Double meanings in headlines and ads.'],
    ['Understatementplein', 'Dat valt wel mee', 'Understatement', 'Niet slecht = heel goed; het is niet echt mijn ding = ik haat het.']]],
  ['u54', 'a9', 'Literatuurlaan', 'Literaire stijl', 'Literary style', 'Antwerpse schrijvers', 'Antwerp writers', 'Ik kan een literaire tekst lezen en bespreken.', 'I can read and discuss a literary text.', [
    ['Consciencelaan', 'Oudere teksten lezen', 'Reading older texts', 'Old spellings and word order in 19th-century prose.'],
    ['Elsschotplein', 'Stijl en ironie', 'Style and irony', 'Short sentences, dry irony: how style carries meaning.'],
    ['Beeldspraakplein', 'Beeldspraak', 'Figurative language', 'metafoor, vergelijking, personificatie.']]],
  ['u55', 'a9', 'Podcastpier', 'Snel luisteren', 'Listening at speed', 'Podcasts en radio', 'Podcasts and radio', 'Ik kan snelle, spontane gesprekken volgen.', 'I can follow fast, spontaneous conversation.', [
    ['Ellipsplein', 'Weggelaten woorden', 'Ellipsis', 'Goed? — Ja, prima. Spoken Dutch drops what is obvious.'],
    ['Opvulplein', 'Euh, allez, zo, eigenlijk', 'Fillers', 'Recognise fillers so you can skip them while listening.'],
    ['Radioplein', 'Radio 1 en Studio Brussel', 'Radio', 'Interviews and discussions at natural speed.']]],
  ['u56', 'a9', 'Geschiedenisberg', 'Complexe tijdsrelaties', 'Complex time relations', 'Belgische geschiedenis', 'Belgian history', 'Ik kan een historisch verloop uitleggen.', 'I can explain a historical sequence.', [
    ['Eeuwplein', 'Nadat … had, toen … was', 'Layered past', 'Nadat België in 1830 onafhankelijk was geworden, …'],
    ['Taalstrijdplein', 'De taalstrijd', 'The language struggle', 'Hoe het Nederlands in Vlaanderen zijn plaats kreeg.'],
    ['Oorlogplein', 'Oorlog en wederopbouw', 'War and rebuilding', 'Antwerpen in de twee wereldoorlogen.']]],
  ['u57', 'a9', 'Cultuurkaai', 'Recenseren', 'Reviewing', 'Theater, film en muziek', 'Theatre, film and music', 'Ik kan een genuanceerde recensie schrijven.', 'I can write a nuanced review.', [
    ['Recensieplein', 'Evaluerende woorden', 'Evaluative vocabulary', 'overtuigend, gekunsteld, ontroerend, voorspelbaar.'],
    ['Deplein', 'deSingel en de Opera', 'Venues', 'Beschrijven wat je zag en wat het met je deed.'],
    ['Vergelijkingsplein', 'Vergelijken en situeren', 'Comparing works', 'In tegenstelling tot zijn vorige film … Het doet denken aan …']]],
  /* ---- Boog 10 · Thuis in het Nederlands (C1) ---- */
  ['u58', 'a10', 'Debatstad', 'Debatteren', 'Debating', 'Een publiek debat', 'A public debate', 'Ik kan spontaan en overtuigend debatteren.', 'I can debate spontaneously and persuasively.', [
    ['Weerlegplein', 'Weerleggen', 'Rebuttal', 'Dat klopt niet helemaal, want … U vergeet dat …'],
    ['Retoriekplein', 'Retorische vragen', 'Rhetorical questions', 'Wie wil er nu niet …? Is dat echt de oplossing?'],
    ['Inbreekplein', 'Het woord nemen', 'Taking the floor', 'Mag ik even inpikken? Als ik mag aanvullen …']]],
  ['u59', 'a10', 'Essayeiland', 'Samenhang in tekst', 'Coherence in writing', 'Het opiniestuk', 'The opinion piece', 'Ik kan een samenhangend opiniestuk schrijven.', 'I can write a coherent opinion piece.', [
    ['Derhalveplein', 'Derhalve, bijgevolg, niettemin', 'Formal connectors', 'derhalve, bijgevolg, niettemin, zodoende.'],
    ['Alineaplein', 'Alinea\'s en kernzinnen', 'Paragraphs', 'One idea per paragraph, the key sentence first.'],
    ['Stijlplein', 'Herschrijven', 'Editing your style', 'Shorter sentences, active verbs, fewer nouns.']]],
  ['u60', 'a10', 'Precisieplein', 'Woordkeuze', 'Precise word choice', 'Taal over taal', 'Talking about language', 'Ik kan precies het juiste woord kiezen.', 'I can choose exactly the right word.', [
    ['Collocatieplein', 'Vaste combinaties', 'Collocations', 'een besluit nemen, een rol spelen, kritiek uiten.'],
    ['Synoniemplein', 'Synoniemen met nuance', 'Near-synonyms', 'beginnen / starten / aanvangen; krijgen / ontvangen / verwerven.'],
    ['Valsevriendplein', 'Valse vrienden', 'False friends', 'eventueel ≠ eventually, actueel ≠ actual, brutaal = rude.']]],
  ['u61', 'a10', 'Registerrivier', 'Van register wisselen', 'Switching register', 'Van WhatsApp tot officieel', 'From WhatsApp to official', 'Ik kan hetzelfde zeggen voor een vriend, een collega en een instantie.', 'I can say the same thing to a friend, a colleague and an authority.', [
    ['Chatplein', 'Informeel schrijven', 'Informal writing', 'afkortingen, emoji, weglatingen: wat kan, wat niet.'],
    ['Collegaplein', 'Neutraal-professioneel', 'Neutral professional', 'Dag Sarah, even een vraag over …'],
    ['Instantieplein', 'Officieel', 'Official', 'Geachte heer, mevrouw, hierbij wens ik …']]],
  ['u62', 'a10', 'Tafelgesprek', 'Spontaan vertellen', 'Spontaneous storytelling', 'Verhalen aan tafel', 'Stories at the dinner table', 'Ik kan boeiend en spontaan vertellen.', 'I can tell a story spontaneously and engagingly.', [
    ['Spanningplein', 'Spanning opbouwen', 'Building tension', 'En toen … Plots … Je gelooft nooit wat er dan gebeurde.'],
    ['Beurtplein', 'Beurten nemen', 'Turn-taking', 'Wacht, laat me even … Wat vind jij?'],
    ['Pointeplein', 'De pointe', 'The punchline', 'Timing and understatement at the end of a story.']]],
  ['u63', 'a10', 'Eindpunt', 'Alles samen', 'Everything together', 'Jouw Antwerpen', 'Your Antwerp', 'Ik kan vlot en genuanceerd over complexe onderwerpen communiceren.', 'I can communicate fluently and with nuance about complex topics.', [
    ['Leesplein', 'Lezen op C1', 'C1 reading', 'Long argumentative texts, implicit meaning.'],
    ['Luisterplein', 'Luisteren op C1', 'C1 listening', 'Lectures, debates and dialect-tinted speech.'],
    ['Spreekplein', 'Spreken en schrijven op C1', 'C1 speaking and writing', 'Presentation, discussion and a formal text on one topic.']]],
];
const PLAN_TOWNS_EXTRA = PLAN_ROWS.filter(r => r[2]).map(([id, arc, name, gram, gramEn, theme, themeEn, can, canEn]) => ({id, arc, name, gram, gramEn, theme, themeEn, can, canEn, built: false}));
/* Plan indexes: every town and every square, built or planned */
const PLAN_TOWNS = UNITS.concat(PLAN_TOWNS_EXTRA);
const PT = Object.fromEntries(PLAN_TOWNS.map(t => [t.id, t]));
const PLAN_SQ = SQUARES.map(q => Object.assign({built: true}, q));
(function () {
  const count = {}; SQUARES.forEach(q => { count[q.u] = Math.max(count[q.u] || 0, q.n); });
  const push = (u, name, title, en, rule, review) => { count[u] = (count[u] || 0) + 1; PLAN_SQ.push({id: u + 'q' + count[u], u, n: count[u], name, title, en, rule, review: !!review, built: false, words: [], sents: [], ex: []}); };
  const rows = Object.fromEntries(PLAN_ROWS.map(r => [r[0], r[9]]));
  PLAN_TOWNS.forEach(t => {
    (SQUARES.some(q => q.u === t.id) ? [] : rows[t.id] || []).forEach(([name, title, en, rule]) => push(t.id, name, title, en, rule));
    push(t.id, 'Grote Markt', 'Alles van ' + t.name, 'Town review and field mission', 'Mixes every square of ' + t.name + ' (' + t.gramEn + '), with the field mission: ' + t.canEn, true);
  });
  PLAN_SQ.sort((a, b) => PLAN_TOWNS.indexOf(PT[a.u]) - PLAN_TOWNS.indexOf(PT[b.u]) || a.n - b.n);
})();
const PSQ = Object.fromEntries(PLAN_SQ.map(q => [q.id, q]));
const townIndexInArc = u => PLAN_TOWNS.filter(t => t.arc === PT[u].arc).indexOf(PT[u]) + 1;
const arcOf = u => ARCS.find(a => a.id === PT[u].arc);
const squareCount = u => PLAN_SQ.filter(q => q.u === u).length;
function planText() {
  return 'Each line is one town; its squares are listed as id: topic.\n' + PLAN_TOWNS.map(t => { const a = arcOf(t.id);
    return `Arc ${a.n} (${a.level}) · Town ${townIndexInArc(t.id)} ${t.name} — ${t.gramEn}; ${t.themeEn || t.theme}: ` + PLAN_SQ.filter(q => q.u === t.id && !q.review).map(q => `${q.id} ${q.en}`).join(' | '); }).join('\n');
}
