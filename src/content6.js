/* ===== 2.0: a measurable goal (doel) per scene, for the opdracht start block =====
   Scene ids stay the same; this only adds the doel field. */
Object.entries({
  'sc-u1': 'stel 2 vragen met het werkwoord vooraan (Waar is…? Welke tram…?) en begin 1 zin met een tijd of een plaats',
  'sc-u2': 'gebruik 3 scheidbare werkwoorden (uitkiezen, meenemen, afrekenen) en vraag 1 keer de prijs',
  'sc-u3': 'bestel 3 dingen met het juiste lidwoord en gebruik 1 verkleinwoord (een pintje)',
  'sc-u4': 'vraag 3 keer beleefd iets met een modaal werkwoord (Mag ik…? Kan ik…? Ik wil…)',
  'sc-u5': 'vertel 3 dingen in de voltooide tijd, 1 keer met zijn (ik ben … gegaan)',
  'sc-u6': 'beschrijf 3 dingen met een bijvoeglijk naamwoord op -e (een grote kamer, de oude trap)',
  'sc-u7': 'zeg 3 keer waarom (omdat/want) en gebruik 1 keer "als"',
  'sc-free': 'vertel 3 dingen over je dag en stel 1 vraag terug',
}).forEach(([id, doel]) => { const sc = SCENARIOS.find(s => s.id === id); if (sc) sc.doel = doel; });
