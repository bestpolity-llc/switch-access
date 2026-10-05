import {chromium} from '../work/hvac-tests/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true,args:['--no-sandbox']});
const page=await browser.newPage();
await page.addInitScript(()=>{window.spoken=[];Object.defineProperty(window,'speechSynthesis',{value:{speaking:false,cancel(){this.speaking=false},speak(u){window.spoken.push(u.text);this.speaking=true;}}});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};});
const url=(process.env.HVAC_BASE_URL||'http://127.0.0.1:8876')+'/games/hvac-service-calls/';
await page.goto(url);await page.getByRole('button',{name:'Start new shift',exact:true}).click();await page.reload();
let speech=await page.evaluate(()=>spoken.at(-1));assert.match(speech,/Help customers/);assert(!speech.includes('Resume saved shift'));assert(!speech.includes('Choices:'));
assert.equal(await page.locator('#choices [aria-current=true]').count(),0);
await page.waitForTimeout(600);assert.equal(await page.locator('#choices [aria-current=true]').count(),0);
await page.evaluate(()=>speechSynthesis.speaking=false);
await page.waitForFunction(()=>spoken.at(-1)==='Resume saved shift');
assert.equal(await page.locator('#choices [aria-current=true]').textContent(),'Resume saved shift');
await page.evaluate(()=>SwitchAccess.update({scanMs:500}));
for(const label of ['Start new shift','Help','Settings','Return to library','Read scenario and choices again','Resume saved shift']){
 await page.evaluate(()=>speechSynthesis.speaking=false);
 await page.waitForFunction(label=>spoken.at(-1)===label,label);
 assert.equal(await page.locator('#choices [aria-current=true]').textContent(),label);
}
await page.getByRole('button',{name:'Read scenario and choices again',exact:true}).click();assert.match(await page.evaluate(()=>spoken.at(-1)),/Help customers/);assert.equal(await page.locator('#choices [aria-current=true]').count(),0);await page.evaluate(()=>speechSynthesis.speaking=false);await page.waitForFunction(()=>spoken.at(-1)==='Resume saved shift');
await page.getByRole('button',{name:'Resume saved shift',exact:true}).click();assert.match(await page.evaluate(()=>spoken.at(-1)),/air from my vents feels weak/);await page.evaluate(()=>speechSynthesis.speaking=false);await page.waitForFunction(()=>spoken.at(-1)==='Hear customer complaint');assert(!await page.evaluate(()=>spoken.at(-1).includes('Preview:')));
await page.locator('#choices button').first().click();assert.match(await page.evaluate(()=>spoken.at(-1)),/filter is covered with dust/);
await page.getByRole('button',{name:'Look closer',exact:true}).click();assert.match(await page.evaluate(()=>spoken.at(-1)),/Catches dust before air reaches the blower/);
await page.evaluate(()=>SwitchAccess.update({sound:false}));const count=await page.evaluate(()=>spoken.length);await page.getByRole('button',{name:'Next component',exact:true}).click();assert.equal(await page.evaluate(()=>spoken.length),count);
await browser.close();console.log('PASS scenario first, first choice spoken, one highlighted label per utterance, complete looping order, replay restarts scenario/scan, repair information and mute');
