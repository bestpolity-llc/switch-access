import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root = new URL('../', import.meta.url);
const source = fs.readFileSync(new URL('switchmate-tracker.js', root), 'utf8');
function browser(path = '/games/drift-signal/', pref = null, host = 'switch.bestpolity.com') {
  const events = {}, scripts = [];
  const c = {location:{pathname:path, hostname:host, origin:'https://'+host},
    document:{referrer:'https://example.org/private?email=secret',createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}},
    localStorage:{getItem:()=>pref}, URL, Date, addEventListener:(n,f)=>events[n]=f};
  c.window=c;vm.createContext(c);vm.runInContext(source,c);
  return {c,events,scripts,set:v=>pref=v,commands:()=>Array.from(c.dataLayer||[],a=>Array.from(a))};
}
const b=browser();const config=b.commands().find(c=>c[0]==='config')[2];
assert.equal(config.page_title,'Drift-Signal');
assert.equal(config.page_location,'https://switch.bestpolity.com/games/drift-signal/');
assert.equal(config.page_referrer,'https://example.org');
assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false);
assert(!JSON.stringify(b.commands()).includes('secret'));
vm.runInContext(source,b.c);b.c.SwitchMateAnalytics.refresh();
assert.equal(b.scripts.length,1);
assert.equal(b.commands().filter(c=>c[1]==='page_view').length,1);
assert.equal(b.commands().filter(c=>c[1]==='activity_open').length,1);
b.set('0');b.c.SwitchMateAnalytics.refresh();assert.equal(b.c['ga-disable-G-K6HGF1692H'],true);
b.set('1');b.events.storage({key:'switchaac_analytics'});assert.equal(b.c['ga-disable-G-K6HGF1692H'],false);
assert.equal(b.commands().filter(c=>c[1]==='page_view').length,1);
const off=browser('/keyboard.html','0');assert.equal(off.scripts.length,0);
off.set('1');off.c.SwitchMateAnalytics.refresh();assert.equal(off.scripts.length,1);
off.set('0');off.events.storage({key:null});assert.equal(off.c['ga-disable-G-K6HGF1692H'],true);
assert.equal(browser('/',null,'localhost').scripts.length,0);assert.equal(browser('/unknown').scripts.length,0);
const blocked=browser('/','0');blocked.c.localStorage.getItem=()=>{throw Error('blocked')};blocked.c.SwitchMateAnalytics.refresh();assert.equal(blocked.scripts.length,0);
const maker=browser('/games/maker.html');maker.c.SwitchMateAnalytics.makerEvent('play',123);
maker.c.SwitchMateAnalytics.makerEvent('love',123);const count=maker.commands().length;
maker.c.SwitchMateAnalytics.makerEvent('play','private');maker.c.SwitchMateAnalytics.makerEvent('private',1);
maker.set('0');maker.c.SwitchMateAnalytics.makerEvent('play',1);assert.equal(maker.commands().length,count);
assert.deepEqual(JSON.parse(JSON.stringify(maker.commands().find(c=>c[1]==='maker_play')[2])),{send_to:'G-K6HGF1692H',activity_id:'maker',game_seed:123});
const paths=['index.html','guide.html','keyboard.html','calc.html',
 ...['pop','choose','tap','maker','hellgate','solitaire'].map(p=>`games/${p}.html`),
 ...['rift-signal','drift-signal','american-big-rigs','warehouse-forklift'].map(p=>`games/${p}/index.html`)];
for(const path of paths){const html=fs.readFileSync(new URL(path,root),'utf8');
 assert.equal((html.match(/src="[^"]*switchmate-tracker\.js/g)||[]).length,1,path);
 assert(!html.includes('googletagmanager.com/gtag/js'),path);
 assert.equal(browser('/'+path).scripts.length,1,path);
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){if(!m[0].includes('application/ld+json'))new vm.Script(m[1],{filename:path});}
}
console.log('PASS: 14 pages, payload filtering, opt-out/re-enable, duplicate loads, blocked storage, inline JS syntax.');
