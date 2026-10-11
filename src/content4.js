/* ===== Batch 3 content: Town 7 · Waaromberg (subordinate clauses) ===== */
POS.conj = 'vw'; POS_EN.conj = 'conjunction';
LEX.push(
/* ---------- Square 1 · Omdatplein ---------- */
{id:'omdat',u:7,w:'omdat',p:'conj',d:'voegwoord: je geeft een reden; het werkwoord gaat naar het einde',en:'because',s:'Ik neem de tram omdat het regent.',se:'I take the tram because it is raining.',note:'After <i>omdat</i> the conjugated verb goes to the end of the clause.'},
{id:'want',u:7,w:'want',p:'conj',d:'voegwoord: je geeft een reden; de zin blijft gewoon',en:'because, for',s:'Ik neem de tram, want het regent.',se:'I take the tram, because it is raining.',note:'<i>Want</i> means the same as <i>omdat</i>, but the word order after it stays normal: <i>want het regent</i>.'},
{id:'waarom',u:7,w:'waarom',p:'q',d:'vraagwoord: om welke reden?',en:'why',s:'Waarom fiets je niet?',se:'Why aren’t you cycling?'},
{id:'regenen',u:7,w:'regenen',p:'v',d:'er valt water uit de lucht',en:'to rain',s:'Het regent vandaag.',se:'It is raining today.',v:{t:'w',st:'regen',im:['regende','regenden'],pp:'geregend',aux:'h'}},
{id:'moe',u:7,w:'moe',p:'adj',d:'je hebt weinig energie en wilt rusten',en:'tired',s:'Ik fiets niet omdat ik moe ben.',se:'I’m not cycling because I’m tired.'},
{id:'druk',u:7,w:'druk',p:'adj',e:'drukke',d:'met veel mensen, lawaai of werk',en:'busy',s:'De Meir is druk, want het is zaterdag.',se:'The Meir is busy, because it’s Saturday.'},
{id:'mening',u:7,w:'mening',p:'n',g:'de',pl:'meningen',dim:null,d:'wat je denkt of vindt over iets',en:'opinion',s:'Wat is jouw mening?',se:'What is your opinion?',why:'Words ending in <i>-ing</i> are always <i>de</i>.'},
{id:'vinden',u:7,w:'vinden',p:'v',d:'iets zoeken en krijgen; ook: een mening hebben over iets',en:'to find; to think (opinion)',s:'Ik vind Antwerpen mooi.',se:'I think Antwerp is beautiful.',v:{t:'s',st:'vind',im:['vond','vonden'],pp:'gevonden',aux:'h',fam:'i – o – o'}},
/* ---------- Square 2 · Denkplein ---------- */
{id:'weten',u:7,w:'weten',p:'v',d:'iets in je hoofd hebben; het is informatie die je hebt',en:'to know (a fact)',s:'Ik weet dat de halte dichtbij is.',se:'I know that the stop is nearby.',v:{t:'o',st:'weet',im:['wist','wisten'],pp:'geweten',aux:'h'},note:'<i>Weten</i> is for facts; <i>kennen</i> is for people and places.'},
{id:'denken',u:7,w:'denken',p:'v',d:'met je hoofd werken; ook: een mening hebben',en:'to think',s:'Ik denk dat het museum open is.',se:'I think the museum is open.',v:{t:'o',st:'denk',im:['dacht','dachten'],pp:'gedacht',aux:'h'}},
{id:'vragen',u:7,w:'vragen',p:'v',d:'iets zeggen omdat je een antwoord wilt',en:'to ask',s:'Ik vraag of de tram vandaag komt.',se:'I’m asking whether the tram is coming today.',v:{t:'o',st:'vraag',im:['vroeg','vroegen'],pp:'gevraagd',aux:'h'}},
{id:'begrijpen',u:7,w:'begrijpen',p:'v',d:'weten wat iets betekent',en:'to understand',s:'Ik begrijp niet wat hij zegt.',se:'I don’t understand what he is saying.',v:{t:'s',st:'begrijp',im:['begreep','begrepen'],pp:'begrepen',aux:'h',fam:'ij – ee – e'},why:'Starts with <i>be-</i>, so no extra <i>ge-</i>: <i>begrepen</i>.'},
{id:'zeggen',u:7,w:'zeggen',p:'v',d:'iets met woorden vertellen',en:'to say',s:'Wat zegt hij?',se:'What is he saying?',v:{t:'o',st:'zeg',im:['zei','zeiden'],pp:'gezegd',aux:'h'}},
{id:'hopen',u:7,w:'hopen',p:'v',d:'iets graag willen dat gebeurt',en:'to hope',s:'Ik hoop dat je morgen komt.',se:'I hope you’re coming tomorrow.',v:{t:'w',st:'hoop',im:['hoopte','hoopten'],pp:'gehoopt',aux:'h'}},
{id:'zeker',u:7,w:'zeker',p:'adj',e:'zekere',d:'je twijfelt niet; je weet het',en:'sure, certain',s:'Ik ben zeker dat deze buurt gezellig is.',se:'I’m sure this neighbourhood is cosy.',note:'In Vlaanderen: <i>ik ben zeker dat…</i>; in Nederland eerder <i>ik weet zeker dat…</i>.'},
{id:'buurt',u:7,w:'buurt',p:'n',g:'de',pl:'buurten',dim:'buurtje',d:'de straten en huizen rondom waar je woont',en:'neighbourhood',s:'Mijn buurt is rustig.',se:'My neighbourhood is quiet.'},
/* ---------- Square 3 · Alsplein ---------- */
{id:'als',u:7,w:'als',p:'conj',d:'voegwoord: op voorwaarde dat; of: telkens wanneer',en:'if, when(ever)',s:'Als het regent, neem ik de tram.',se:'If it rains, I take the tram.'},
{id:'wanneer',u:7,w:'wanneer',p:'q',d:'vraagwoord: op welk moment? Ook voegwoord: op het moment dat',en:'when',s:'Wanneer ben je vrij?',se:'When are you free?'},
{id:'toen',u:7,w:'toen',p:'conj',d:'voegwoord: op dat moment in het verleden',en:'when (one time in the past)',s:'Toen ik jong was, woonde ik in Gent.',se:'When I was young, I lived in Ghent.',note:'<i>Toen</i> for one moment in the past; <i>als</i> or <i>wanneer</i> for now, the future or every time.'},
{id:'zon',u:7,w:'zon',p:'n',g:'de',pl:null,dim:'zonnetje',d:'de grote ster die licht en warmte geeft',en:'sun',s:'Als de zon schijnt, wandel ik aan de Schelde.',se:'When the sun shines, I walk by the Scheldt.'},
{id:'weer',u:7,w:'weer',p:'n',g:'het',pl:null,dim:null,d:'hoe het buiten is: zon, regen, wind, warm of koud',en:'weather',s:'Het weer is mooi vandaag.',se:'The weather is nice today.'},
{id:'paraplu',u:7,w:'paraplu',p:'n',g:'de',pl:'paraplu’s',dim:'parapluutje',d:'iets dat je boven je hoofd houdt als het regent',en:'umbrella',s:'Neem een paraplu mee, want het gaat regenen.',se:'Take an umbrella, because it’s going to rain.'},
{id:'vrij',u:7,w:'vrij',p:'adj',e:'vrije',d:'je moet niet werken; je hebt tijd',en:'free (not busy)',s:'Wanneer ben je vrij?',se:'When are you free?'},
{id:'schijnen',u:7,w:'schijnen',p:'v',d:'licht geven, zoals de zon',en:'to shine',s:'De zon schijnt.',se:'The sun is shining.',v:{t:'s',st:'schijn',im:['scheen','schenen'],pp:'geschenen',aux:'h',fam:'ij – ee – e'}},
);
SENT.push(
/* Square 1 · omdat / want */
{id:'u7s1',u:7,nl:'Ik neem de tram omdat het regent.',en:'I take the tram because it is raining.',f:'Ik:s / neem:2 / de tram:3 / omdat:5 / het:5 / regent:5',k:['omdat','regent>regenen','tram']},
{id:'u7s2',u:7,nl:'Ik neem de tram, want het regent.',en:'I take the tram, because it is raining.',f:'Ik:s / neem:2 / de tram:3 / want:5 / het:5 / regent:5',k:['want','regent>regenen']},
{id:'u7s3',u:7,nl:'Waarom fiets je niet?',en:'Why aren’t you cycling?',f:'Waarom:1 / fiets:2 / je:s / niet:3',k:['waarom','fiets>fietsen']},
{id:'u7s4',u:7,nl:'Ik fiets niet omdat ik moe ben.',en:'I’m not cycling because I’m tired.',f:'Ik:s / fiets:2 / niet:3 / omdat:5 / ik:5 / moe:5 / ben:5',k:['moe','ben>zijn','omdat']},
{id:'u7s5',u:7,nl:'Ik vind Antwerpen mooi omdat de stad oud is.',en:'I think Antwerp is beautiful because the city is old.',f:'Ik:s / vind:2 / Antwerpen mooi:3 / omdat:5 / de stad:5 / oud:5 / is:5',k:['vind>vinden','omdat']},
{id:'u7s6',u:7,nl:'Wat vind jij van de Meir?',en:'What do you think of the Meir?',f:'Wat:1 / vind:2 / jij:s / van de Meir:3',k:['vind>vinden']},
{id:'u7s7',u:7,nl:'De Meir is druk, want het is zaterdag.',en:'The Meir is busy, because it’s Saturday.',f:'De Meir:s / is:2 / druk:3 / want:5 / het:5 / is:5 / zaterdag:5',k:['druk','want']},
{id:'u7s8',u:7,nl:'Wat is jouw mening?',en:'What is your opinion?',f:'Wat:1 / is:2 / jouw mening:s',k:['mening']},
/* Square 2 · dat / of / question words */
{id:'u7s9',u:7,nl:'Ik weet dat de halte dichtbij is.',en:'I know that the stop is nearby.',f:'Ik:s / weet:2 / dat:5 / de halte:5 / dichtbij:5 / is:5',k:['weet>weten','halte','dichtbij']},
{id:'u7s10',u:7,nl:'Ik denk dat het museum vandaag open is.',en:'I think the museum is open today.',f:'Ik:s / denk:2 / dat:5 / het museum:5 / vandaag:5 / open:5 / is:5',k:['denk>denken','museum','vandaag']},
{id:'u7s11',u:7,q:true,nl:'Weet u waar de Meir is?',en:'Do you know where the Meir is?',f:'Weet:2 / u:s / waar:5 / de Meir:5 / is:5',k:['weet>weten','waar']},
{id:'u7s12',u:7,nl:'Ik vraag of de tram vandaag komt.',en:'I’m asking whether the tram is coming today.',f:'Ik:s / vraag:2 / of:5 / de tram:5 / vandaag:5 / komt:5',k:['vraag>vragen','komt>komen']},
{id:'u7s13',u:7,nl:'Ik begrijp niet wat hij zegt.',en:'I don’t understand what he is saying.',f:'Ik:s / begrijp:2 / niet:3 / wat:5 / hij:5 / zegt:5',k:['begrijp>begrijpen','zegt>zeggen']},
{id:'u7s14',u:7,nl:'Ik hoop dat je morgen komt.',en:'I hope you’re coming tomorrow.',f:'Ik:s / hoop:2 / dat:5 / je:5 / morgen:5 / komt:5',k:['hoop>hopen','morgen']},
{id:'u7s15',u:7,nl:'Ik weet niet hoeveel het kost.',en:'I don’t know how much it costs.',f:'Ik:s / weet:2 / niet:3 / hoeveel:5 / het:5 / kost:5',k:['weet>weten','kost>kosten']},
{id:'u7s16',u:7,nl:'Ik ben zeker dat deze buurt gezellig is.',en:'I’m sure this neighbourhood is cosy.',f:'Ik:s / ben:2 / zeker:3 / dat:5 / deze buurt:5 / gezellig:5 / is:5',k:['zeker','buurt','gezellig']},
/* Square 3 · als / wanneer / toen */
{id:'u7s17',u:7,nl:'Als het regent, neem ik de tram.',en:'If it rains, I take the tram.',f:'Als het regent:1 / neem:2 / ik:s / de tram:3',k:['als','regent>regenen'],why:'The whole clause <i>Als het regent</i> is slot 1, so the verb <i>neem</i> comes straight after the comma, then <i>ik</i>: verb, comma, verb.'},
{id:'u7s18',u:7,nl:'Als de zon schijnt, wandel ik aan de Schelde.',en:'When the sun shines, I walk by the Scheldt.',f:'Als de zon schijnt:1 / wandel:2 / ik:s / aan de Schelde:3',k:['zon','schijnt>schijnen','wandel>wandelen'],why:'The <i>als</i>-clause fills slot 1: <i>…schijnt, wandel ik…</i>, two verbs meet at the comma.'},
{id:'u7s19',u:7,nl:'Wanneer ben je vrij?',en:'When are you free?',f:'Wanneer:1 / ben:2 / je:s / vrij:3',k:['wanneer','vrij']},
{id:'u7s20',u:7,nl:'Ik blijf thuis als het slecht weer is.',en:'I stay at home when the weather is bad.',f:'Ik:s / blijf:2 / thuis:3 / als:5 / het:5 / slecht weer:5 / is:5',k:['blijf>blijven','thuis','weer']},
{id:'u7s21',u:7,nl:'Toen ik jong was, woonde ik in Gent.',en:'When I was young, I lived in Ghent.',f:'Toen ik jong was:1 / woonde:2 / ik:s / in Gent:3',k:['toen','woonde>wonen'],why:'<i>Toen</i> is for one period in the past, so both verbs are in the simple past: <i>was</i>, <i>woonde</i>. The clause fills slot 1: <i>was, woonde ik</i>.'},
{id:'u7s22',u:7,nl:'Neem een paraplu mee, want het gaat regenen.',en:'Take an umbrella, because it’s going to rain.',f:'Neem:2 / een paraplu:3 / mee:4 / want:5 / het:5 / gaat:5 / regenen:5',k:['paraplu','want']},
{id:'u7s23',u:7,nl:'Wanneer het mooi weer is, zit ik op een terras.',en:'When the weather is nice, I sit on a terrace.',f:'Wanneer het mooi weer is:1 / zit:2 / ik:s / op een terras:3',k:['wanneer','weer','terras']},
{id:'u7s24',u:7,nl:'Ik wandel graag als ik vrij ben.',en:'I like walking when I’m free.',f:'Ik:s / wandel:2 / graag:3 / als:5 / ik:5 / vrij:5 / ben:5',k:['wandel>wandelen','vrij','als']},
);
SQUARES.push(
{id:'u7q1',u:'u7',n:1,name:'Omdatplein',title:'Omdat en want',en:'Omdat and want',
 rule:'Both give a reason. After <i>omdat</i> the conjugated verb goes to the <b>end</b>: <i>…omdat het <u>regent</u></i>. After <i>want</i> the order stays normal: <i>…want het <u>regent</u></i>, <i>…want het <u>is</u> zaterdag</i>.',ex:['u7s1','u7s2','u7s4'],
 words:['omdat','want','waarom','regenen','moe','druk','mening','vinden'],sents:['u7s1','u7s2','u7s3','u7s4','u7s5','u7s6','u7s7','u7s8']},
{id:'u7q2',u:'u7',n:2,name:'Denkplein',title:'Dat, of en vraagwoorden',en:'Dat, of and question words',
 rule:'<i>Ik weet / denk / hoop / vraag</i> + a clause with <i>dat</i>, <i>of</i> or a question word (<i>waar, wat, hoeveel</i>): the conjugated verb goes to the <b>end</b> of that clause. <i>Ik weet dat de halte dichtbij <u>is</u>.</i> <i>Weet u waar de Meir <u>is</u>?</i>',ex:['u7s9','u7s11','u7s13'],
 words:['weten','denken','vragen','begrijpen','zeggen','hopen','zeker','buurt'],sents:['u7s9','u7s10','u7s11','u7s12','u7s13','u7s14','u7s15','u7s16']},
{id:'u7q3',u:'u7',n:3,name:'Alsplein',title:'Als, wanneer, toen',en:'When and if clauses',
 rule:'In an <i>als / wanneer / toen</i>-clause the verb goes to the end. When that clause comes <b>first</b>, it fills slot 1, so the main clause starts with its verb: <i>Als het <u>regent</u>, <u>neem</u> ik de tram.</i> <i>Toen</i> is for one time in the past.',ex:['u7s17','u7s20','u7s21'],
 words:['als','wanneer','toen','zon','weer','paraplu','vrij','schijnen'],sents:['u7s17','u7s18','u7s19','u7s20','u7s21','u7s22','u7s23','u7s24']},
);
GRAM.u7 = {title:'Bijzinnen', en:'Subordinate clauses', body:[], why:'A subordinate clause is a sentence inside a sentence. Dutch marks it by sending the conjugated verb to the end, so you hear where the clause stops: <i>…dat het museum vandaag open <u>is</u>.</i> Only <i>want, maar, en, of</i> (“or”) and <i>dus</i> keep normal order. And when a whole clause stands in slot 1, the main verb still has to be second: <i>Als het regent, neem ik…</i>', ex:['u7s1']};
Object.assign(UNITS.find(x => x.id === 'u7'), {built: true, theme: 'Meningen en het weer', themeEn: 'Opinions and the weather',
  mission: 'Vraag een Antwerpenaar wat hij of zij van de stad vindt, en geef zelf je mening met “omdat”.', missionEn: 'Ask a local what they think of the city, and give your own opinion with “omdat”.'});
SCENARIOS.splice(SCENARIOS.findIndex(s => s.id === 'sc-free'), 0,
{id:'sc-u7',u:'u7',title:'Een babbel met de buurvrouw',role:'een nieuwsgierige buurvrouw in de trappenhal, die graag weet wat nieuwe buren van Antwerpen vinden',roleEn:'a curious neighbour on the stairs who wants to know what you think of Antwerp',goal:'Zeg wat je van Antwerpen vindt en waarom (omdat, want), en wat je doet als het regent.',goalEn:'Say what you think of Antwerp and why (omdat, want), and what you do when it rains.',open:'Dag buur! U woont hier nog niet lang, hé? Wat vindt u van Antwerpen?'});
WRITING.u7 = {prompt:'Schrijf 3 à 5 zinnen: wat vind je van Antwerpen en waarom? Wat doe je als het regent?', en:'Write 3–5 sentences: what do you think of Antwerp and why? What do you do when it rains? Use omdat, dat and als.'};
EXTRAS.push(
{t:'straat',title:'Het Steen',body:'Het oudste gebouw van Antwerpen staat aan de Schelde. Vroeger was het een gevangenis. Nu kun je er beginnen als je de stad wilt ontdekken.',en:'Antwerp’s oldest building, once a prison.'},
{t:'straat',title:'Waarom “Antwerpen”?',body:'Een legende zegt dat de reus Druon Antigoon de hand van schippers afhakte, en dat de held Brabo zijn hand in de Schelde gooide: “hand werpen”. Taalkundigen denken eerder aan <i>aanwerp</i>: aangeslibde grond.',en:'The legend of the giant’s hand, and the likelier origin of the name.'},
{t:'straat',title:'Seefhoek',body:'Een buurt in Antwerpen-Noord. Men zegt dat de naam komt van <i>seef</i>, een oud bier dat hier gebrouwen werd.',en:'A northern neighbourhood named after an old beer, “seef”.'},
);
