/* ===== 2.2: synonyms (ook) and antonyms (tegenovergestelde), per lemma =====
   Only where a good one exists, in Belgian Dutch (verlof, plezant, verstaan, wenen).
   Matched on the lemma, so the user's own words with the same lemma get them too (this list
   also covers the set "Mijn woorden 1"). A word list may bring its own "syn" and "ant". */
const REL_BY_W = {};
[
  // [lemma, synonyms, antonyms]
  ['halte', 'stopplaats', ''], ['fiets', 'rijwiel', ''], ['werk', 'job, arbeid', ''], ['links', '', 'rechts'], ['rechts', '', 'links'],
  ['ver', 'veraf', 'dichtbij'], ['dichtbij', 'vlakbij', 'ver'], ['vaak', 'dikwijls', 'zelden'], ['morgen', '', 'gisteren'], ['nemen', 'pakken', 'geven'],
  ['gaan', '', 'komen'], ['komen', '', 'gaan'], ['zoeken', '', 'vinden'], ['zak', 'tas', ''], ['verkoper', 'handelaar', 'koper'],
  ['goedkoop', '', 'duur'], ['duur', '', 'goedkoop'], ['vroeg', '', 'laat'], ['altijd', '', 'nooit'], ['meenemen', '', 'achterlaten'],
  ['opbellen', 'bellen, telefoneren', ''], ['afrekenen', 'betalen', ''], ['uitkiezen', 'kiezen', ''], ['terugkomen', 'terugkeren', ''], ['uitstappen', '', 'instappen'],
  ['ophalen', 'afhalen', 'wegbrengen'], ['aankomen', '', 'vertrekken'], ['opstaan', '', 'gaan liggen'], ['frietkot', 'frituur', ''], ['pak', 'portie', ''],
  ['meisje', '', 'jongen'], ['koekje', 'biscuit', ''], ['huis', 'woning', ''], ['lekker', 'smakelijk', 'vies'], ['liggen', '', 'staan'],
  ['krijgen', 'ontvangen', 'geven'], ['taart', 'gebak', ''], ['kopen', '', 'verkopen'], ['vertrekken', 'weggaan', 'aankomen'], ['boot', 'schip', ''],
  ['straks', 'zo meteen', ''], ['samen', '', 'alleen'], ['gisteren', '', 'morgen'], ['wandelen', 'stappen', ''], ['vorig', '', 'volgend'],
  ['blijven', '', 'weggaan'], ['vakantie', 'verlof', ''], ['vriend', '', 'vijand'], ['oud', '', 'nieuw, jong'], ['nieuw', '', 'oud'],
  ['groot', '', 'klein'], ['klein', '', 'groot'], ['mooi', 'prachtig', 'lelijk'], ['hoog', '', 'laag'], ['smal', '', 'breed'],
  ['wit', '', 'zwart'], ['raam', 'venster', ''], ['donker', '', 'licht'], ['licht', '', 'donker'], ['appartement', 'flat', ''],
  ['moe', 'vermoeid', 'uitgerust'], ['druk', 'bezig', 'rustig'], ['mening', 'opinie', ''], ['vinden', 'denken', ''], ['denken', 'vinden', ''],
  ['vragen', '', 'antwoorden'], ['begrijpen', 'snappen, verstaan', ''], ['zeker', '', 'onzeker'], ['vrij', '', 'bezet'], ['stad', '', 'dorp'],
  ['dag', '', 'nacht'], ['weg', 'baan', ''], ['goed', '', 'slecht'], ['leuk', 'plezant', 'saai'], ['buur', 'buurman', ''],
  ['warm', '', 'koud'], ['koud', '', 'warm'], ['les', 'cursus', ''],
  // Mijn woorden 1
  ['weinig', '', 'veel'], ['rand', 'kant', 'midden'], ['kalken', 'witten', ''], ['verandering', 'wijziging', ''], ['beeld', 'afbeelding', ''],
  ['niveau', 'peil', ''], ['breed', '', 'smal'], ['geduld', '', 'ongeduld'], ['genoeg', 'voldoende', 'te weinig'], ['klaar', 'gereed', ''],
  ['wens', 'verlangen', ''], ['periferie', 'rand', 'centrum'], ['sluw', 'listig, slim', ''], ['schuw', 'verlegen, bang', 'tam'], ['arbeid', 'werk', ''],
  ['gevaarlijk', '', 'veilig'], ['ooit', '', 'nooit'], ['voortbrengen', 'maken, produceren', ''], ['alleen', '', 'samen'], ['inschatten', 'schatten', ''],
  ['scherp', '', 'bot'], ['mededeling', 'bericht', ''], ['krijger', 'strijder', ''], ['overschot', '', 'tekort'], ['zwaar', '', 'licht'],
  ['voorspelbaar', '', 'onvoorspelbaar'], ['onvoorspelbaar', '', 'voorspelbaar'], ['halen', 'ophalen', 'brengen'], ['vatten', 'grijpen', 'loslaten'], ['hervatten', 'hernemen', 'onderbreken'],
  ['starten', 'beginnen', 'stoppen'], ['blijkbaar', 'kennelijk', ''], ['iemand', '', 'niemand'], ['gewoon', 'normaal', 'ongewoon'], ['matroos', 'zeeman', ''],
  ['peinzen', 'nadenken', ''], ['voorzichtig', '', 'onvoorzichtig'], ['vaart', 'snelheid', ''], ['verschillend', '', 'gelijk'], ['plooien', 'vouwen', ''],
  ['lachen', '', 'wenen'], ['nadenken', 'peinzen', ''], ['rennen', 'lopen', ''], ['geven', '', 'krijgen'], ['sluiten', 'dichtdoen', 'openen'],
  ['vouwen', 'plooien', ''],
].forEach(([w, syn, ant]) => { REL_BY_W[w] = {syn: syn ? syn.split(', ') : [], ant: ant ? ant.split(', ') : []}; });
