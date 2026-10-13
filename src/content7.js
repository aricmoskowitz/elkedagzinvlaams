/* ===== 2026-10-12: gap words, Algemeen words, more parts of speech =====
   Basic words the user already uses that the plan did not list, so reports kept
   flagging them as new. New ids only. The square words live in SQUARES;
   the four Algemeen words (u: 0) belong to no square. */
Object.assign(POS, {pron: 'vnw', conj: 'vw', prep: 'vz', num: 'telw', int: 'tw'});
Object.assign(POS_EN, {pron: 'pronoun', conj: 'conjunction', prep: 'preposition', num: 'number', int: 'interjection'});
LEX.push(
{id:'stad',u:1,w:'stad',p:'n',g:'de',pl:'steden',dim:'stadje',d:'een grote plaats met veel straten en huizen',en:'city, town',s:'Antwerpen is een mooie stad.',se:'Antwerp is a beautiful city.'},
{id:'dag',u:1,w:'dag',p:'n',g:'de',pl:'dagen',dim:'dagje',d:'een periode van vierentwintig uur',en:'day',s:'Vandaag is een mooie dag.',se:'Today is a beautiful day.'},
{id:'weg',u:1,w:'weg',p:'n',g:'de',pl:'wegen',dim:'weggetje',d:'een straat, of de route naar een plek',en:'way, road',s:'Mag ik u de weg vragen?',se:'May I ask you the way?'},
{id:'cafe',u:4,w:'café',p:'n',g:'het',pl:'cafés',dim:'cafeetje',d:'een plek waar je iets gaat drinken',en:'café, pub',s:'We drinken een koffie in het café.',se:'We have a coffee in the café.',why:'Many words borrowed from French are <i>het</i>: het café, het station.'},
{id:'week',u:5,w:'week',p:'n',g:'de',pl:'weken',dim:'weekje',d:'zeven dagen',en:'week',s:'Vorige week heb ik veel gewerkt.',se:'Last week I worked a lot.'},
{id:'goed',u:7,w:'goed',p:'adj',e:'goede',d:'zoals het moet; niet slecht',en:'good',s:'Ik vind het een goed idee.',se:'I think it is a good idea.'},
{id:'leuk',u:7,w:'leuk',p:'adj',e:'leuke',d:'fijn, plezant',en:'nice, fun',s:'Ik vind Antwerpen leuk omdat er veel te doen is.',se:'I like Antwerp because there is a lot to do.'},
{id:'buur',u:7,w:'buur',p:'n',g:'de',pl:'buren',dim:null,d:'iemand die naast je woont',en:'neighbour',s:'Ik denk dat de buren op vakantie zijn.',se:'I think the neighbours are on holiday.'},
{id:'buurvrouw',u:7,w:'buurvrouw',p:'n',g:'de',pl:'buurvrouwen',dim:null,d:'een vrouw die naast je woont',en:'(female) neighbour',s:'Ik weet niet of de buurvrouw thuis is.',se:'I don’t know whether the neighbour is home.',why:'Words for people are almost always <i>de</i>.'},
{id:'warm',u:7,w:'warm',p:'adj',e:'warme',d:'met een hoge temperatuur',en:'warm',s:'Als het warm is, fiets ik naar het werk.',se:'When it is warm, I cycle to work.'},
{id:'koud',u:7,w:'koud',p:'adj',e:'koude',d:'met een lage temperatuur',en:'cold',s:'Toen het koud was, bleef ik thuis.',se:'When it was cold, I stayed at home.'},
{id:'les',u:0,w:'les',p:'n',g:'de',pl:'lessen',dim:'lesje',d:'een uur waarin je iets leert',en:'lesson, class',s:'Vanavond heb ik les Nederlands.',se:'Tonight I have Dutch class.'},
{id:'taal',u:0,w:'taal',p:'n',g:'de',pl:'talen',dim:'taaltje',d:'wat mensen spreken, zoals Nederlands of Engels',en:'language',s:'Nederlands is een mooie taal.',se:'Dutch is a beautiful language.'},
{id:'nederlands',u:0,w:'Nederlands',p:'n',g:'het',pl:null,dim:null,d:'de taal van Vlaanderen en Nederland',en:'Dutch (language)',s:'Hoe zeg je dat in het Nederlands?',se:'How do you say that in Dutch?',why:'Names of languages are <i>het</i>: het Nederlands, het Engels, het Frans.'},
{id:'leren',u:0,w:'leren',p:'v',d:'iets nieuws te weten komen of kunnen',en:'to learn',s:'Ik leer elke dag Nederlands.',se:'I learn Dutch every day.',v:{t:'w',st:'leer',im:['leerde','leerden'],pp:'geleerd',aux:'h'}},
);
// words that belong to no square: the app's Algemeen group
const ALGEMEEN_WORDS = LEX.filter(l => !l.u).map(l => l.id);
