import {chromium} from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
p.on('console',m=>console.log('C:',m.type(),m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://localhost:8765/');await p.waitForTimeout(2000);await p.screenshot({path:'s0.png'});
await p.click('#go');await p.waitForTimeout(500);await p.screenshot({path:'s5.png'});await p.click('#tutSkip');await p.mouse.move(195,600);await p.mouse.down();await p.mouse.move(260,560,{steps:10});
await p.waitForTimeout(5000);await p.mouse.up();await p.screenshot({path:'s1.png'});await p.evaluate(()=>{window.__game.birdPos.z=-2200});await p.waitForTimeout(3000);await p.screenshot({path:'s2.png'});await p.evaluate(()=>window.__setFly(200));await p.waitForTimeout(2500);await p.screenshot({path:'s4.png'});await p.click('#menuBtn');await p.click('#setBtn');await p.screenshot({path:'s7.png'});await p.click('#setClose');await p.click('#stop');await p.screenshot({path:'s3.png'});
console.log(await p.evaluate(()=>JSON.stringify(window.__game.birdPos)+' '+window.__game.sparks));await b.close();
