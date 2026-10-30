import {chromium} from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/');await p.waitForTimeout(1500);await p.click('#go');await p.click('#tutSkip');
const r=await p.evaluate(async()=>{const s=window.__dyn.filter(d=>d.type==='spark'&&!d.taken);const d=s[0];const g=window.__game.birdPos;g.copy(d.o.position);await new Promise(r=>setTimeout(r,400));return [s.length,!!d.im,d.taken,window.__game.sparks];});
console.log(r);await p.screenshot({path:'s6.png'});await b.close();
