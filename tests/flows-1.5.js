const {chromium}=require('playwright');const fs=require('fs');
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
 const errs=[];p.on('pageerror',e=>errs.push('PAGE '+e.message));
 await p.goto('file:///tmp/claude-0/t4.html');await p.waitForTimeout(600);await p.click('[data-act=tour-end]');
 await p.evaluate(()=>{S.settings.test=false;['u7q1','u7q2','u7q3'].forEach(q=>sqstate(q).steps={ontdek:1,oefen:90,luister:90});S.coach={tour:1,pad:1,town:1,square:1,lees:1,markt:1,plan:1};render();});
 // Lees
 await p.evaluate(()=>{TAB='pad';PAD.lvl='sq';PAD.q='u7q1';PAD.u='u7';render();});await p.waitForTimeout(200);
 await p.screenshot({path:'/tmp/claude-0/e_sq7.png',fullPage:true});
 await p.click('.tapline[data-step=lees]');await p.waitForTimeout(400);await p.screenshot({path:'/tmp/claude-0/e_read.png'});
 for(const [i,j] of [[0,0],[1,1],[2,0]]){await p.click(`[data-act=read-ans][data-i="${i}"][data-j="${j}"]`);}
 await p.waitForTimeout(400);await p.screenshot({path:'/tmp/claude-0/e_read_end.png'});
 console.log('lees', await p.evaluate(()=>S.sq.u7q1.steps.lees));
 await p.click('[data-act=read-close]');
 // words in texts that are unknown to the plan (for info)
 console.log('reads', await p.evaluate(()=>Object.keys(READ).length+' / squares '+SQUARES.length+' missing '+SQUARES.filter(q=>!READ[q.id]).map(q=>q.id)));
 // Markt
 await p.evaluate(()=>{PAD.lvl='town';PAD.u='u7';render();});await p.waitForTimeout(300);await p.screenshot({path:'/tmp/claude-0/e_town7.png',fullPage:true});
 await p.click('[data-act=markt]');await p.waitForTimeout(200);await p.screenshot({path:'/tmp/claude-0/e_markt.png'});
 await p.click('[data-act=markt-review]');await p.waitForTimeout(300);
 const keys=await p.evaluate(()=>SES.keys);console.log('markt keys',keys.length,keys.join(' '));
 // answer everything correctly
 for(let i=0;i<60;i++){const done=await p.evaluate(()=>{if(!SES||SES.finished)return true;if(!SES.ex)return true;const ex=SES.ex;if(ex.type==='order')ex.type='type';submitAnswer(ex.answer);sesNext();return !!SES.finished;});if(done)break;}
 await p.screenshot({path:'/tmp/claude-0/e_markt_end.png'});
 console.log('markt score', await p.evaluate(()=>JSON.stringify(S.markt)));
 await p.evaluate(()=>{closeOverlay('session');SES=null;render()});
 // plan status
 console.log('plan', await p.evaluate(()=>['u7q4','u1q4','u8q1'].map(id=>id+':'+(PSQ[id]?locStatus(planLoc(id)):'none')).join(' ')));
 // storage
 console.log('shards', await p.evaluate(()=>{S.log.push({id:'l1',date:'2026-08-03',text:'x'});S.log.push({id:'l2',date:'2026-09-03',text:'y'});introduce('c:zzz:fix');return JSON.stringify(storageReport())}));
 console.log('plantext', await p.evaluate(()=>planText().length));
 console.log('note', await p.evaluate(()=>frameNote(SX['u7s1'])+' || '+frameNote(SX['u7s2'])));
 // usage
 await p.evaluate(async()=>{await AI.json('Review a Dutch conversation practice. xxx','default');await AI.json([{role:'user',content:'hallo'}],'quick');});
 await p.evaluate(()=>{TAB='ik';render();document.querySelector('[data-en="Claude usage this week"]').scrollIntoView()});await p.waitForTimeout(200);await p.screenshot({path:'/tmp/claude-0/e_ik.png'});
 // DB sharding round trip with a fake db
 const rt=await p.evaluate(async()=>{const store={};const db={doc:path=>({get:async()=>({exists:!!store[path],data:()=>JSON.parse(JSON.stringify(store[path]))}),set:async d=>{store[path]=d;}})};
   Store.db=db;Store.uid='me';Store.mode='db';['state','items','words','log'].forEach(n=>Store.dirty.add(n));Store.flush();await new Promise(r=>setTimeout(r,300));
   const names=Object.keys(store).map(k=>k.split('/').pop());const before=JSON.stringify([Object.keys(S.items).length,S.log.length,Object.keys(S.fix).length]);
   const snapshot=JSON.parse(JSON.stringify(S));S=blankState();S.savedAt=1;
   window.claude.use=async n=>n==='db'?db:n==='user'?{id:async()=>'me'}:null;Store.db=null;await Store.connect();
   const after=JSON.stringify([Object.keys(S.items).length,S.log.length,Object.keys(S.fix).length]);
   // second flush writes nothing new except state
   let writes=0;const oset=db.doc;db.doc=path=>{const d=oset(path);return {...d,set:async x=>{writes++;return d.set(x)}}};Store.mark('items');Store.flush();await new Promise(r=>setTimeout(r,200));
   return {names,before,after,writes};});
 console.log('roundtrip',JSON.stringify(rt));
 console.log(errs);await b.close();})();
