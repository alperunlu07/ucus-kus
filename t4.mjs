import {chromium} from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/');await p.evaluate(()=>localStorage.setItem('kk_set',JSON.stringify({gfx:'calm'})));await p.reload();await p.waitForTimeout(1500);
console.log(await p.textContent('#qual'), await p.evaluate(()=>window.__dyn.filter(d=>d.type==='tree').length));await b.close();
