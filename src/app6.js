/* ===== LONG-PRESS ENGLISH ===== */
(function () {
  let timer = null, tip = null, fired = false;
  const hide = () => { if (tip) { tip.remove(); tip = null; } };
  document.addEventListener('pointerdown', e => {
    hide(); fired = false;
    const el = e.target.closest('[data-en]'); if (!el || !el.dataset.en) return;
    timer = setTimeout(() => {
      fired = true; tip = document.createElement('div'); tip.id = 'tip'; tip.textContent = el.dataset.en; document.body.appendChild(tip);
      const r = el.getBoundingClientRect(); const tw = tip.offsetWidth;
      tip.style.left = Math.max(8, Math.min(innerWidth - tw - 8, r.left + r.width / 2 - tw / 2)) + 'px';
      tip.style.top = Math.max(8, r.top - tip.offsetHeight - 8) + 'px';
      setTimeout(hide, 2200);
    }, 480);
  }, {passive: true});
  ['pointerup', 'pointercancel', 'pointermove'].forEach(t => document.addEventListener(t, e => { if (t === 'pointermove' && Math.abs(e.movementX) + Math.abs(e.movementY) < 4) return; clearTimeout(timer); }, {passive: true}));
  document.addEventListener('click', e => { if (fired) { fired = false; e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('contextmenu', e => { if (e.target.closest('[data-en]')) e.preventDefault(); });
})();

/* ===== EVENTS ===== */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, d = el.dataset;
  switch (a) {
    case 'tab': if (d.tab === 'pad' && TAB === 'pad') PAD.lvl = 'arc'; TAB = d.tab; render(); $('#main').scrollTop = 0; break;
    case 'pad-go': TAB = 'pad'; PAD.lvl = 'arc'; render(); $('#main').scrollTop = 0; break;
    case 'pad-up': PAD.lvl = 'arc'; render(); $('#main').scrollTop = 0; break;
    case 'pad-town': PAD.lvl = 'town'; PAD.u = d.u; render(); $('#main').scrollTop = 0; break;
    case 'square': goSquare(d.q); break;
    case 'arc-next': toast('Boog 2 volgt later. Je steekt de bergen over als boog 1 klaar is.'); break;
    case 'testout': startTestout(d.qs.split(',')); break;
    case 'help': openHelp(); break;
    case 'talk-view': viewTalkHistory(d.id); break;
    case 'extra-open': openExtra(d.id); break;
    case 'extra-practise': { const x = S.extras.find(y => y.id === d.id); if (x) { closeOverlay('extra'); startSession({keys: x.examples.map((_, i) => 'e:' + x.id + '~' + i + ':tr'), intros: false}); } break; }
    case 'plan-open': openPlan(); break;
    case 'read-ans': readAnswer(+d.i, +d.j); break;
    case 'read-close': closeOverlay('read'); READING = null; render(); break;
    case 'read-again': openRead(d.q); break;
    case 'markt': TAB = 'pad'; PAD.lvl = 'markt'; PAD.u = d.u; render(); $('#main').scrollTop = 0; break;
    case 'markt-review': if (!marktOpen(d.u)) { toast('Doe eerst alle pleinen van deze stad.'); break; } { const ks = marktKeys(d.u); ks.forEach(k => introduce(k)); startSession({keys: ks, markt: d.u, intros: false}); } break;
    case 'round': startRound(d.q, +d.r); break;
    case 'plan-go': openPlan(d.id); break;
    case 'plan-sq': openPlanSquare(d.id); break;
    case 'mine-practise': practiseMine(d.id); break;
    case 'extra-del': confirmBox('Dit toegevoegde plein verwijderen? Je fouten blijven bewaard onder Algemeen.', 'Verwijder', () => { closeSheet(); closeOverlay('plan'); Object.values(S.fix).forEach(f => { if (f.plan === d.id) f.plan = null; }); S.extras = S.extras.filter(x => x.id !== d.id); Object.keys(S.items).filter(k => k.startsWith('e:' + d.id)).forEach(k => delete S.items[k]); Store.mark('words', 'items', 'state'); closeOverlay('extra'); render(); }); break;
    case 'sic-sq': TAB = 'pad'; PAD.lvl = 'sq'; PAD.q = d.id; PAD.u = d.u; render(); $('#main').scrollTop = 0; break;
    case 'sic-town': if (UNIT[d.u].built) { TAB = 'pad'; PAD.lvl = 'town'; PAD.u = d.u; render(); $('#main').scrollTop = 0; } else toast(UNIT[d.u].name + ' volgt later'); break;
    case 'then': thenAndNow(); break;
    case 'coach-ok': S.coach[d.id] = 1; Store.mark('state'); { const t = el.closest('.tip'); if (t) t.remove(); } break;
    case 'tour-next': openTour(TOURI + 1); break;
    case 'tour-prev': openTour(TOURI - 1); break;
    case 'tour-end': S.coach.tour = 1; Store.mark('state'); closeOverlay('tour'); render(); break;
    case 'tour-again': closeOverlay('help'); openTour(0); break;
    case 'tips-again': S.coach = {tour: 1}; Store.mark('state'); closeOverlay('help'); render(); toast('Alle tips staan weer aan'); break;
    case 'review': startReview(); break;
    case 'step': closeSheet(); if (TAB === 'pad' && PAD.lvl === 'sq') goStep(d.q, d.step); else startStep(d.q, d.step); break;
    case 'feed': openFeed(); break;
    case 'mission': missionToggle(d.u); break; // app17: one opdracht per town, the same box on the stad page and the Grote Markt
    case 'town': goTown(d.u); break;
    case 'naslag': NASLAG = d.seg; render(); break;
    case 'cards': closeOverlay('setpage'); openCards(d.set); break;
    case 'set-review': closeOverlay('setpage'); reviewSet(d.id); break;
    case 'wview': S.settings.wview = d.v; Store.mark('state'); render(); break;
    case 'wgroup': if (WOPEN.has(d.id)) WOPEN.delete(d.id); else WOPEN.add(d.id); render(); break;
    case 'wng': WNG = d.g; render(); break;
    case 'set-rename': renameSet(d.id); break;
    case 'set-export': exportSet(d.id); break;
    case 'theme-pick': themePicker(d.id); break;
    case 'theme-set': setTheme(d.id, d.t); break;
    case 'word-import': openWordImport(); break;
    case 'fix-del': deleteFix(d.id); break;
    case 'fix-hint': { const w = $('#ses-body .fixw'); if (w) w.classList.add('hint'); el.remove(); break; }
    case 'card-grade': cardGrade(d.ok === '1'); break;
    case 'cards-again': startCards(shuffle(CARDS.unknown), {mode: CARDS.mode, dir: CARDS.dir, name: CARDS.name}); break;
    case 'word-add': closeSheet(); quickAdd(d.w); break;
    case 'word-look': closeSheet(); lookupWord(d.w); break;
    case 'dict-word': { const l = dictById(d.id); if (l) { closeSheet(); openDictCard(l); } break; }
    case 'word': showWord(d.id); break;
    case 'lesson-ro': openLesson(d.q, true); break;
    case 'lesson-done': closeOverlay('lesson'); startStep(d.q, 'oefen'); break;
    case 'overlay-close': Audio.stop(); closeOverlay(d.id); if (d.id === 'flash') FLASH = null; render(); break;
    case 'ses-close': closeSession(); break;
    case 'ses-next': sesNext(); break;
    case 'ans': submitAnswer(d.v); break;
    case 'check': submitAnswer(''); break;
    case 'tok': {
      if (!SES || SES.answered) break;
      if (el.closest('#tok-pool')) { el.classList.add('used'); const b = document.createElement('button'); b.className = 'tok'; b.dataset.act = 'tok'; b.dataset.j = d.j; b.textContent = el.textContent; $('#tok-ans').appendChild(b); }
      else { const p = $(`#tok-pool .tok[data-j="${d.j}"]`); if (p) p.classList.remove('used'); el.remove(); }
      break;
    }
    case 'say': Audio.say(d.text, el); break;
    case 'reveal-en': el.textContent = d.enText || '—'; el.style.borderStyle = 'solid'; el.style.color = 'var(--ink)'; break;
    case 'add-to-set': addToSetSheet(d.id); break;
    case 'set-add': { const set = S.sets.find(s => s.id === d.set); if (set && !set.ids.includes(d.id)) { set.ids.push(d.id); Store.mark('words'); toast('Toegevoegd aan ' + set.name); } if (d.close) closeSheet(); else setEditor(d.set); render(); break; }
    case 'set-remove': { const set = S.sets.find(s => s.id === d.set); if (set) { set.ids = set.ids.filter(x => x !== d.id); Store.mark('words'); openSetPage(d.set); render(); } break; }
    case 'set-delete': deleteSet(d.id); break;
    case 'set-new': newSet(); break;
    case 'set-new-with': newSet(d.id); break;
    case 'set-edit': setEditor(d.id); break;
    case 'set-study': studySet(d.id, d.mode); break;
    case 'unit-set': openSheet(`<div class="stack"><h2>Woorden van ${esc(UNIT[d.u].name)}</h2><div class="small">${lexOfUnit(UNIT[d.u].n).length} woorden, elk met een zin, het lidwoord en een Nederlandse uitleg.</div><div class="grid2"><button class="btn line" data-act="set-study" data-id="unit-${d.u}" data-mode="flip">Kaarten</button><button class="btn line" data-act="set-study" data-id="unit-${d.u}" data-mode="type">Typen</button></div></div>`); break;
    case 'word-new': closeSheet(); wordForm(d.set); break;
    case 'flip': FLASH.flipped = true; flashRender(); break;
    case 'flash-grade': grade('w:' + FLASH.ids[FLASH.i] + ':rec', d.ok === '1'); if (d.ok === '1') FLASH.knew++; FLASH.i++; FLASH.flipped = false; flashRender(); break;
    case 'export': exportData(); break;
    case 'praten': if (el.getAttribute('aria-disabled') === 'true') { toast('Doe eerst alle pleinen van deze stad.'); break; } closeSheet(); openPraten({mode: d.mode, q: d.q, u: d.u}); break;
    case 'verslag': openReport(); break;
    case 'docs': closeOverlay('welcome'); openDocs(); break;
    case 'doc-save': saveDoc(d.id); break;
    case 'export-text': copyBackup(); break;
    case 'import': $('#imp-file').click(); break;
    case 'reset': confirmBox('Alle voortgang, sets en eigen woorden wissen?', 'Wis alles', () => { S = blankState(); Store.mark('state', 'items', 'words'); render(); toast('Alles gewist'); }); break;
    case 'sheet-close': closeSheet(); break;
    case 'fclose': closeFeed(); break;
    case 'faudio': S.settings.autoAudio = !S.settings.autoAudio; el.textContent = S.settings.autoAudio ? 'Geluid aan' : 'Geluid uit'; Store.mark('state'); break;
    case 'fans': feedAnswer(d.fid, d.v); break;
    case 'flis': feedListen(d.fid, d.j); break;
    case 'freveal': { const sec = el.closest('.fcard'); $('.fback', sec).hidden = false; el.hidden = true; const g = $('.fgrade', sec); if (g) g.hidden = false; break; }
    case 'fknew': feedKnew(d.fid, d.ok === '1'); break;
  }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', {bubbles: true})); }
  if (e.key === 'Escape') { if ($('#sheetback')) closeSheet(); }
});
document.addEventListener('submit', e => { if (e.target.id === 'ex-form') { e.preventDefault(); submitAnswer($('#ex-in').value); } });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'ex-in') { const er = $('#ex-err'); if (er) er.hidden = true; }
  if (t.id === 'wsearch') { WQ = t.value; $('#wlist').innerHTML = wordList() + dictHits(WQ); }
  if (t.id === 'nw-w') { clearTimeout(t._dt); t._dt = setTimeout(() => dictFillForm(t), 350); }
  if (t.id === 'nsearch') { NQ = t.value; naslagFilter(); }
  if (t.id === 'set-rate') { S.settings.rate = Number(t.value); $('#rate-out').textContent = t.value; Store.mark('state'); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'set-voice') { S.settings.voice = t.value; Store.mark('state'); Audio.say('Hallo, ik ben je stem.'); }
  if (t.id === 'set-cap') { S.settings.cap = Number(t.value); Store.mark('state'); }
  if (t.id === 'set-start') { S.settings.startView = t.value; Store.mark('state'); }
  if (t.id === 'set-tour') { S.settings.tourOnStart = t.checked; Store.mark('state'); }
  if (t.id === 'set-tips') { S.settings.tips = t.checked; Store.mark('state'); render(); }
  if (t.id === 'set-test') { S.settings.test = t.checked; Store.mark('state'); render(); toast(t.checked ? 'Testmodus aan: alles is open' : 'Testmodus uit: pleinen gaan in volgorde open'); }
  if (t.id === 'imp-file' && t.files[0]) importData(t.files[0]);
});

/* ===== INIT ===== */
(function init() {
  let first = false; try { first = !localStorage.getItem(LS_KEY) && !localStorage.getItem(LS_OLD); } catch (e) {}
  Store.loadLocal(); Audio.load(); dripRelease();
  if (first) Store.persist();
  registerSW();
  render();
  setTimeout(() => { if (TAB === 'ik') render(); }, 800);
  if (location.hash === '#feed') { openFeed(); return; }
  if (!S.coach.tour && !S.savedAt) openWelcome(); else if (S.settings.tourOnStart) openTour(0); else if (S.settings.startView !== 'pad' && !$('.overlay')) openFeed();
})();
