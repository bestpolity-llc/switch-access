// npm install --prefix work/rift-tests playwright@1.51.1
// work/rift-tests/node_modules/.bin/playwright install chromium
import {chromium} from '../work/rift-tests/node_modules/playwright/index.mjs';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),origin='http://127.0.0.1:8765',key='switchmate.access.v1';
const server=createServer(async(req,res)=>{try{let file=decodeURIComponent(new URL(req.url,origin).pathname);if(file.endsWith('/'))file+='index.html';const full=path.resolve(root,'.'+file);if(!full.startsWith(root+path.sep))throw Error('outside root');const data=await readFile(full);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
await mkdir('work/rift-results',{recursive:true});
const browser=await chromium.launch();let count=0;
const apps=['keyboard.html','calc.html','games/pop.html','games/choose.html','games/tap.html','games/maker.html','games/hellgate.html','games/solitaire.html','games/rift-signal/','games/drift-signal/','games/american-big-rigs/'];
async function session(width=1440,init){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<700});
  await context.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  if(init)await context.addInitScript(init);
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install();return{page,context,errors};
}
async function click(page,label){await page.getByRole('button',{name:label,exact:true}).click();}
async function open(page){await page.locator('#sa-toolbar').getByRole('button',{name:'Switch settings',exact:true}).click();}
async function settings(page,local=false){await open(page);await click(page,'Switch settings · '+(local?'this activity':'site default'));}
async function press(page,key='Space',duration=40){await page.clock.runFor(300);await page.keyboard.down(key);await page.clock.runFor(duration);await page.keyboard.up(key);}
async function title(page,text){assert.equal(await page.locator('#sceneTitle').textContent(),text);}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow at '+page.url());}
try{
  for(const width of [1440,390]){
    const {page,context,errors}=await session(width);await page.goto(origin+'/');await settings(page);await click(page,'Scan time: 2 seconds');
    for(const app of apps){await page.goto(origin+'/'+app);await page.waitForSelector('#sa-toolbar');await noOverflow(page);await settings(page);assert.ok(await page.getByRole('button',{name:'Scan time: 2.5 seconds',exact:true}).isVisible(),app+' inherits profile');await noOverflow(page);await page.keyboard.press('Escape');}
    await page.reload();await settings(page);assert.ok(await page.getByRole('button',{name:'Scan time: 2.5 seconds',exact:true}).isVisible());
    await click(page,'Use different switch settings here: off');await click(page,'Scan time: 2.5 seconds');
    await page.goto(origin+'/games/drift-signal/');await settings(page);assert.ok(await page.getByRole('button',{name:'Scan time: 2.5 seconds',exact:true}).isVisible());
    await page.goto(origin+'/games/american-big-rigs/');await settings(page,true);assert.ok(await page.getByRole('button',{name:'Scan time: 3 seconds',exact:true}).isVisible());
    await click(page,'Use different switch settings here: on');assert.ok(await page.getByRole('button',{name:'Scan time: 2.5 seconds',exact:true}).isVisible());
    await page.screenshot({path:`work/rift-results/${width}-shared-settings.png`,fullPage:true});
    assert.deepEqual(errors,[]);await context.close();count+=12;
  }
  // Held keys, menu scanning, minimum duration and learning an adapter's key.
  {
    const {page,context,errors}=await session();await page.goto(origin+'/games/drift-signal/');
    await page.keyboard.down('Space');await page.keyboard.down('Space');await page.clock.runFor(2100);assert.ok(await page.locator('#sa-dialog').isVisible());assert.equal(await page.locator('#title').textContent(),'You make the shifts.');await page.keyboard.up('Space');
    await page.clock.runFor(2500);assert.match(await page.locator('#sa-options [aria-current]').textContent(),/Switch settings/);await press(page);assert.equal(await page.locator('#sa-title').textContent(),'Switch settings for the site');
    await click(page,'Minimum press: 0 ms');await click(page,'Minimum press: 100 ms');await click(page,'Minimum press: 250 ms');
    await click(page,'Switch keys: Space / Enter / NumpadEnter');await click(page,'Learn my switch key');await page.keyboard.press('a');assert.ok(await page.getByRole('button',{name:'Switch keys: A',exact:true}).isVisible());await page.keyboard.press('Escape');
    await press(page,'Space',700);assert.equal(await page.locator('#title').textContent(),'You make the shifts.');await press(page,'a',100);assert.equal(await page.locator('#title').textContent(),'You make the shifts.');
    await page.reload();await press(page,'a',600);assert.equal(await page.locator('#title').textContent(),'Ready to launch?');
    await open(page);await click(page,'Test my switch');await press(page,'a',600);assert.equal(await page.locator('#sa-status').textContent(),'Accepted presses: 1');await press(page,'a',100);assert.equal(await page.locator('#sa-status').textContent(),'Accepted presses: 1');
    await page.goto(origin+'/');await page.getByRole('link',{name:'Send feedback',exact:true}).click();await page.locator('#feedbackMessage').fill('a Space Enter');assert.equal(await page.locator('#feedbackMessage').inputValue(),'a Space Enter');
    assert.deepEqual(errors,[]);await context.close();count++;
  }
  // Complete both mission branches; shared settings preserve the current picture.
  for(const branch of ['planet','stars']){
    const {page,context,errors}=await session(390);await page.goto(origin+'/games/rift-signal/');
    for(const label of ['BEGIN FIRST SHIFT','CONTINUE','CONTINUE','OPEN CHANNEL','ACCEPT REQUEST','CONTINUE','START CHOICE'])await click(page,label);
    await title(page,'Blue planet');await open(page);await page.clock.runFor(30000);await title(page,'Blue planet');await click(page,'Continue activity');
    if(branch==='stars')await page.clock.runFor(8000);await press(page);await title(page,branch==='planet'?'Planet view':'Star view');
    for(const label of ['CONTINUE','CAPTURE PICTURE','CONNECT','CONTINUE','RETURN TO CREW','END SHIFT','CONTINUE'])await click(page,label);
    await title(page,'First Shift complete');await click(page,'Restart');await click(page,'Keep playing');await title(page,'First Shift complete');await click(page,'Restart');await click(page,'Yes, restart');await title(page,'Welcome aboard');
    await page.keyboard.press('Tab');await page.clock.runFor(30000);await page.getByRole('button',{name:'BEGIN FIRST SHIFT',exact:true}).focus();await page.keyboard.press('Enter');await title(page,'Captain Marcus Vale');
    assert.deepEqual(errors,[]);await context.close();count++;
  }
  // Finish five gears, opening settings during every move.
  {
    const {page,context,errors}=await session();await page.goto(origin+'/games/drift-signal/');await press(page);
    for(let gear=1;gear<=5;gear++){await click(page,'Gear '+gear);await open(page);await page.clock.runFor(30000);assert.match(await page.locator('#message').textContent(),/Moving down the strip/);await click(page,'Continue activity');await page.clock.runFor(1200);if(gear<5)await page.getByRole('button',{name:'Gear '+(gear+1),exact:true}).waitFor();}
    await page.getByRole('button',{name:'Race again',exact:true}).waitFor();assert.match(await page.locator('#title').textContent(),/crossed the line/);assert.deepEqual(errors,[]);await context.close();count++;
  }
  // Preserve an in-flight truck move across the shared overlay.
  {
    const {page,context,errors}=await session();await page.goto(origin+'/games/american-big-rigs/');await press(page);await page.locator('#choices button').nth(2).click();await page.clock.runFor(200);const before=await page.evaluate(()=>({...window.__abr.G.st}));await open(page);await page.clock.runFor(30000);assert.deepEqual(await page.evaluate(()=>({...window.__abr.G.st})),before);await click(page,'Continue activity');await page.clock.runFor(500);assert.equal(await page.evaluate(()=>window.__abr.G.steps),1);assert.equal(await page.evaluate(()=>window.__abr.G.phase),'scan');assert.deepEqual(errors,[]);await context.close();count++;
  }
  // AAC utility row, arithmetic and start/pause/resume in the six simpler games.
  {
    const {page,context,errors}=await session();await page.goto(origin+'/keyboard.html');await page.locator('#keyboard').getByRole('button',{name:'h',exact:true}).click();await page.locator('#keyboard').getByRole('button',{name:'i',exact:true}).click();assert.equal(await page.locator('#textDisplay').textContent(),'hi');
    await page.clock.runFor(12000);assert.ok((await page.locator('#keyboard .scan-row').allTextContents()).includes('Speak'),'utility row is scanned');await press(page);assert.equal(await page.locator('#keyboard .scan-col').getAttribute('aria-label'),'Speak message');await open(page);await page.clock.runFor(9000);await click(page,'Continue activity');assert.equal(await page.locator('#textDisplay').textContent(),'hi');
    await page.goto(origin+'/calc.html');for(const label of ['2','+','3','='])await page.locator('#grid button').filter({hasText:new RegExp('^'+label.replace('+','\\+')+'$')}).click();assert.equal(await page.locator('#result').textContent(),'5');
    for(const app of ['pop','tap','choose','maker','hellgate','solitaire']){await page.goto(origin+'/games/'+app+'.html');await press(page);await open(page);await page.clock.runFor(10000);await click(page,'Continue activity');}
    assert.deepEqual(errors,[]);await context.close();count++;
  }
  // Denied storage across all eleven; standalone Android Solitaire keeps isolation.
  {
    const {page,context,errors}=await session(390,()=>{Storage.prototype.getItem=()=>{throw Error('denied');};Storage.prototype.setItem=()=>{throw Error('denied');};});
    for(const app of apps){await page.goto(origin+'/'+app);await open(page);assert.match(await page.locator('#sa-status').textContent(),/unavailable/);await page.keyboard.press('Escape');}
    await page.goto(origin+'/games/solitaire.html?app=1');await open(page);assert.equal(await page.getByRole('button',{name:'Return to library',exact:true}).count(),0);assert.deepEqual(errors,[]);await context.close();count++;
  }
  // Cross-tab synchronization and corrupt JSON recovery.
  {
    const {page,context,errors}=await session();await page.goto(origin+'/games/pop.html');await settings(page);const second=await context.newPage();await second.goto(origin+'/games/tap.html');await settings(second);await click(second,'Scan time: 2 seconds');await page.getByRole('button',{name:'Scan time: 2.5 seconds',exact:true}).waitFor();await second.evaluate(key=>localStorage.setItem(key,'{broken'),key);await page.reload();await settings(page);assert.ok(await page.getByRole('button',{name:'Scan time: 2 seconds',exact:true}).isVisible());assert.deepEqual(errors,[]);await context.close();count++;
  }
  console.log('PASS '+count+' browser scenarios across all 11 activities, both mission paths and desktop/mobile viewports.');
}finally{await browser.close();server.close();}
