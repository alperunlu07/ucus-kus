import {chromium} from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});const p=await ctx.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/');await p.evaluate(()=>{localStorage.setItem('kk_tut','1');localStorage.setItem('kk_set',JSON.stringify({gfx:'high'}));localStorage.setItem('kk_q','manual')});await p.reload();await p.waitForTimeout(1200);await p.click('#go');
for(const [bi,name] of [[0,'v0'],[1,'v1'],[3,'v3'],[5,'v5']]){
 await p.evaluate(bi=>{const g=window.__game.birdPos;let z=g.z-200;for(let i=0;i<4000;i++){if(window.__biome(z)===bi&&window.__biome(z-150)===bi)break;z-=20;}g.z=z-60;},bi);
 await p.waitForTimeout(4000);await p.screenshot({path:name+'.png'});}
await b.close();
