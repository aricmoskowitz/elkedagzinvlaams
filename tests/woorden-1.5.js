const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const mock=`<script>window.claude={use:async n=>{if(n!=='sample')return null;const f=async()=>({text:'x'});f.json=async()=>({});return f;}};</script>`;
 fs.writeFileSync('/tmp/claude-0/t7.html','<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+mock+fs.readFileSync('goesting.html','utf8')+'</body></html>');
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 const errs=[];p.on('pageerror',e=>errs.push('PAGE '+e.message));
 await p.goto('file:///tmp/claude-0/t7.html');await p.waitForTimeout(700);
 const r={}; r.tourFirst=!!(await p.$('#tour'));await p.click('[data-act=tour-end]');
 await p.reload();await p.waitForTimeout(900);r.feedOnStart=!!(await p.$('#feed'));
 await p.evaluate(()=>closeFeed());await p.waitForTimeout(200);r.tab=await p.evaluate(()=>TAB);
 await p.evaluate(()=>{S.coach={tour:1,pad:1,woorden:1,naslag:1,cards:1,ontdek:1};S.settings.test=true;render();});
 await p.screenshot({path:'/tmp/claude-0/g_pad.png'});
 await p.evaluate(()=>document.querySelector('.floatcard').scrollIntoView());await p.screenshot({path:'/tmp/claude-0/g_pad2.png'});
 // woorden
 await p.click('#tabs [data-tab=woorden]');await p.waitForTimeout(200);await p.screenshot({path:'/tmp/claude-0/g_woorden.png'});
 for(const id of ['station','nemen','groot','duur']){await p.evaluate(id=>showWord(id),id);await p.waitForTimeout(150);await p.screenshot({path:`/tmp/claude-0/g_w_${id}.png`});await p.evaluate(()=>closeSheet());}
 r.adj=await p.evaluate(()=>['groot','klein','duur','ver','smal','wit','goedkoop','lekker','moe','druk','vrij','zeker','graag','vorig','gezellig','hoog','rood'].map(w=>{const l=LEX.find(x=>x.w===w);const a=adjForms(l);return w+':'+(a?a.join('/'):'-')}).join(' '));
 r.verbs=await p.evaluate(()=>LEX.filter(l=>l.v).map(l=>{const v=Object.fromEntries(PERS.map((pp,i)=>[i,0]));let out=[];for(let i=0;i<3;i++){out.push(verbPair(l).nl+'='+verbPair(l).en)}return verbFacts(l).map(x=>x[1]).join(', ')}).slice(0,8).join(' || '));
 r.en=await p.evaluate(()=>LEX.filter(l=>l.v).map(l=>l.w+':'+enBase(l)+'/'+en3(enBase(l))).join(' '));
 // cards
 await p.click('[data-act=cards]');await p.waitForTimeout(150);await p.screenshot({path:'/tmp/claude-0/g_cardsheet.png'});
 await p.selectOption('#cd-deck','verbs');await p.click('#cd-go');await p.waitForTimeout(200);await p.screenshot({path:'/tmp/claude-0/g_card1.png'});
 await p.click('#fcard');await p.waitForTimeout(150);await p.screenshot({path:'/tmp/claude-0/g_card1b.png'});
 // swipe right via mouse drag
 const box=await (await p.$('#fcard')).boundingBox();await p.mouse.move(box.x+box.width/2,box.y+100);await p.mouse.down();await p.mouse.move(box.x+box.width/2+160,box.y+110,{steps:8});await p.screenshot({path:'/tmp/claude-0/g_swipe.png'});await p.mouse.up();await p.waitForTimeout(400);
 r.afterSwipe=await p.evaluate(()=>CARDS.known.length+'/'+CARDS.i);
 await p.click('[data-act=card-grade][data-ok="0"]');await p.waitForTimeout(300);
 await p.evaluate(()=>{CARDS.i=CARDS.ids.length;cardRender()});await p.screenshot({path:'/tmp/claude-0/g_cardend.png'});
 await p.evaluate(()=>{closeOverlay('cards');startCards(['station','groot','nemen'],{mode:'full',dir:'nl',name:'t'})});await p.waitForTimeout(150);await p.click('#fcard');await p.waitForTimeout(150);await p.screenshot({path:'/tmp/claude-0/g_full.png'});
 await p.evaluate(()=>closeOverlay('cards'));
 // naslag
 await p.click('#tabs [data-tab=naslag]');await p.waitForTimeout(300);await p.screenshot({path:'/tmp/claude-0/g_naslag.png'});
 await p.evaluate(()=>{document.querySelector('#nt-u7').open=true;document.querySelector('#ns-u7q1').open=true;document.querySelector('#ng-u7').open=true;document.querySelector('#nt-u7').scrollIntoView()});await p.screenshot({path:'/tmp/claude-0/g_naslag2.png'});
 await p.fill('#nsearch','verkleinwoord');await p.waitForTimeout(200);r.search=await p.evaluate(()=>$$('#ncur details.nsq:not([hidden])').map(d=>d.id).join(' '));await p.screenshot({path:'/tmp/claude-0/g_nsearch.png'});
 // quick add from a sentence
 await p.evaluate(()=>{TAB='pad';render();openLesson('u7q1',true)});await p.waitForTimeout(200);
 const nw=await p.$('#lesson .rw.new');r.newWordBtn=nw?await nw.textContent():null;if(nw){await nw.click();await p.waitForTimeout(150);await p.screenshot({path:'/tmp/claude-0/g_qadd.png'});await p.click('#qa-go');await p.waitForTimeout(150);await p.fill('#nw-d','test uitleg');await p.click('#wform button[type=submit]');}
 r.custom=await p.evaluate(()=>Object.values(S.custom).map(l=>l.w).join(','));
 // size check per tab
 console.log(JSON.stringify(r,null,1));console.log(errs);await b.close();})();
