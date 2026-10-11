const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+fs.readFileSync('goesting.html','utf8')+'</body></html>';
 fs.writeFileSync('/tmp/claude-0/t.html',html);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 const errs=[];p.on('pageerror',e=>errs.push('PAGE '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('CON '+m.text())});
 await p.goto('file:///tmp/claude-0/t.html');await p.waitForTimeout(1500);
 // logic test: every key, every exercise: correct answer accepted
 const r=await p.evaluate(()=>{const bad=[];let n=0;
  UNITS.filter(u=>u.built).forEach(u=>unitKeys(u.id).forEach(k=>{introduce(k);
   for(let rep=0;rep<6;rep++){ if(rep==3) S.items[k].r=1; let ex;try{ex=makeEx(k,rep%2?'feed':'drill')}catch(e){bad.push(k+' make '+e.message);return}
    n++; let ans=ex.answer; const res=check(ex,ans); if(!res.ok) bad.push(k+' '+ex.type+' ans="'+ans+'" -> '+res.kind);
    if(ex.options && !ex.options.map(norm).includes(norm(ex.answer))) bad.push(k+' options missing answer');
    if(ex.options && new Set(ex.options.map(norm)).size!==ex.options.length) bad.push(k+' dup options '+ex.options);
    if(ex.type==='type'&&ex.whole){ const v=orderVariants(ex.sent); }
   }}));
  SENT.forEach(s=>{const v=orderVariants(s).map(norm); if(!v.includes(norm(s.nl))) bad.push(s.id+' variant0 '+v[0]); });
  const vars=SENT.map(s=>s.id+': '+orderVariants(s).slice(1).join(' | ')).filter(x=>!x.endsWith(': '));
  // wrong answer classification samples
  const ex1=makeEx('s:u1s2:ord'); const w1=check(ex1,'Morgen ik neem de tram.');
  const ex2={type:'type',accept:[norm('Het broodje is nog warm.')],whole:true}; const w2=check(ex2,'De broodje is nog warm');
  S=blankState(); return {n,bad:bad.slice(0,40),nbad:bad.length,vars,w1,w2};});
 console.log(JSON.stringify(r,null,1));
 await p.screenshot({path:'/tmp/claude-0/s1_today.png'});
 await p.click('#tabs [data-tab="pad"]');await p.waitForTimeout(300);await p.screenshot({path:'/tmp/claude-0/s2_map.png',fullPage:false});
 await p.click('[data-town="theater"]');await p.waitForTimeout(2600);await p.screenshot({path:'/tmp/claude-0/s3_town.png'});
 await p.click('.sheet [data-step="ontdek"].btn').catch(async()=>{await p.click('.sheet .btn')});await p.waitForTimeout(400);await p.screenshot({path:'/tmp/claude-0/s4_lesson.png'});
 await p.click('[data-act="lesson-done"]');await p.waitForTimeout(400);
 // walk through session
 for(let i=0;i<30;i++){
   const fin=await p.$('#ses-body .big-num'); if(fin) break;
   if(await p.$('#ses-body [data-act="ses-next"]:not(#ses-next)')){ if(i==0) await p.screenshot({path:'/tmp/claude-0/s5_intro.png'}); await p.click('#ses-body [data-act="ses-next"]'); continue;}
   const ex=await p.evaluate(()=>({type:SES.ex.type,ans:SES.ex.answer,toks:SES.ex.tokens}));
   if(ex.type==='order'){ // answer correctly via tokens order of chunks
     const order=await p.evaluate(()=>SES.ex.sent.ch.map((c,i)=>SES.ex.tokens.findIndex(t=>t.i===i)));
     for(const j of order) await p.click(`#tok-pool .tok[data-j="${j}"]`);
     await p.screenshot({path:'/tmp/claude-0/s6_order.png'}); await p.click('[data-act="check"]');
   } else if(ex.type==='type'){ await p.fill('#ex-in', i%4==0?'fout':ex.ans); await p.click('#ex-form button'); }
   else { await p.click(`#ses-body [data-act="ans"][data-v="${ex.ans.replace(/"/g,'\\"')}"]`); }
   await p.waitForTimeout(150); if(i==3||i==6) await p.screenshot({path:`/tmp/claude-0/s7_fb${i}.png`});
   await p.click('#ses-next');
 }
 await p.screenshot({path:'/tmp/claude-0/s8_end.png'});
 await p.click('#ses-body [data-act="ses-close"]');await p.waitForTimeout(200);
 await p.click('#tabs [data-tab="pad"]');await p.waitForTimeout(300);await p.screenshot({path:'/tmp/claude-0/s9_map2.png'});
 await p.click('#tabs [data-tab="vandaag"]');await p.click('[data-act="feed"]');await p.waitForTimeout(600);await p.screenshot({path:'/tmp/claude-0/s10_feed.png'});
 for(let k=0;k<3;k++){await p.evaluate(()=>{const f=document.getElementById('fscroll');f.scrollBy(0,f.clientHeight)});await p.waitForTimeout(400);}
 await p.screenshot({path:'/tmp/claude-0/s11_feed4.png'});
 await p.click('[data-act="fclose"]');
 await p.click('#tabs [data-tab="naslag"]');await p.click('[data-seg="werkwoorden"]');await p.click('[data-id="meenemen"]');await p.waitForTimeout(200);await p.screenshot({path:'/tmp/claude-0/s12_verb.png'});
 await p.click('#sheetback',{position:{x:10,y:10}});
 await p.click('#tabs [data-tab="ik"]');await p.waitForTimeout(200);await p.screenshot({path:'/tmp/claude-0/s13_ik.png',fullPage:true});
 console.log('ERRORS',errs);
 await b.close();})();
