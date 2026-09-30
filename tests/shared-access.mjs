import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=await readFile(new URL('../shared/profile.js',import.meta.url),'utf8');
const controller=await readFile(new URL('../shared/switch-access.js',import.meta.url),'utf8');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
function setup(seed={},denied=false){
  const values=new Map(Object.entries(seed)),events={},docEvents={},jobs=new Map();let time=0,next=0,selected=0;
  const nodes=new Map();
  class Element {
    constructor(tag='div',id=''){this.tagName=tag.toUpperCase();this.id=id;this.children=[];this.attrs={};this.events={};this.style={};this.hidden=false;this.isConnected=true;this.textContent='';this.classes=new Set();}
    get classList(){return{toggle:(n,on)=>on?this.classes.add(n):this.classes.delete(n),contains:n=>this.classes.has(n)};}
    setAttribute(k,v){this.attrs[k]=v;} removeAttribute(k){delete this.attrs[k];}
    addEventListener(k,fn){this.events[k]=fn;}
    append(...els){for(const el of els){el.parent=this;this.children.push(el);if(el.id)nodes.set(el.id,el);}}
    replaceChildren(...els){this.children=[];this.append(...els);}
    contains(el){return el===this||this.children.some(c=>c.contains(el));}
    set innerHTML(_){if(this.id==='sa-dialog')for(const id of ['sa-title','sa-description','sa-options','sa-status'])this.append(new Element(id==='sa-title'?'h1':'div',id));}
    querySelector(s){return s==='h1'?nodes.get('sa-title'):nodes.get(s.slice(1));}
    closest(s){if((s.includes('button')&&this.tagName==='BUTTON')||(s.includes('input')&&this.tagName==='INPUT')||(s.includes('#switchPad')&&this.id==='switchPad'))return this;return this.parent?.closest(s)||null;}
    focus(){document.activeElement=this;}
    showModal(){this.open=true;}close(){this.open=false;}
  }
  const document={body:new Element('body'),hidden:false,activeElement:null,createElement:t=>new Element(t),addEventListener:(k,fn)=>docEvents[k]=fn};
  const localStorage={getItem(k){if(denied)throw Error('denied');return values.get(k)??null;},setItem(k,v){if(denied)throw Error('denied');values.set(k,v);},removeItem:k=>values.delete(k)};
  const context={document,localStorage,performance:{now:()=>time},innerHeight:1000,location:{assign(){}},setTimeout(fn,ms){const id=++next;jobs.set(id,{fn,at:time+ms});return id;},clearTimeout:id=>jobs.delete(id),addEventListener:(k,fn)=>events[k]=fn};context.window=context;
  vm.createContext(context);vm.runInContext(source,context);vm.runInContext(controller,context);
  const sa=context.SwitchAccess;
  sa.register({id:'test',home:'/',activate:()=>selected++,settings:{rounds:{label:'Rounds',values:[1,2,3],default:3}}});
  function advance(ms){const end=time+ms;let loops=0;while(true){const pending=[...jobs].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!pending)break;if(++loops>10000)throw Error('Timer runaway');time=pending[1].at;jobs.delete(pending[0]);pending[1].fn();}time=end;}
  function fire(name,props={}){const event={target:document.body,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...props};(events[name]||docEvents[name])?.(event);return event;}
  function press(code='Space',ms=40){fire('keydown',{key:code==='Space'?' ':code,code});advance(ms);fire('keyup',{code});}
  return{sa,values,context,document,nodes,advance,fire,press,get selected(){return selected;},newElement:tag=>new Element(tag)};
}
check('one default survives navigation; app settings and overrides stay isolated',()=>{
  const s=setup();s.sa.update({scanMs:4000,keys:['ArrowRight']});s.sa.setApp({rounds:1});
  const p=s.context.SwitchProfile.create(s.context.localStorage);
  assert.equal(p.effective('new-activity').scanMs,4000);
  p.override('test',true);p.update('test',{scanMs:7000},true);
  assert.equal(p.effective('test').scanMs,7000);assert.equal(p.effective('another').scanMs,4000);
  p.override('test',false);assert.equal(p.effective('test').scanMs,4000);
  assert.equal(p.snapshot().profiles.default.apps.test.settings.rounds,1);
});
check('validation, legacy import once, malformed and denied storage',()=>{
  const s=setup({switchaac_speed:'3200'});assert.equal(s.sa.access.scanMs,3200);
  s.sa.update({scanMs:999999,keys:['Escape','F5'],sound:'false'});assert.equal(s.sa.access.scanMs,10000);assert.equal(s.sa.access.sound,true);assert.equal(s.sa.access.keys[0],'Space');
  s.values.set('switchaac_speed','700');assert.equal(setup(Object.fromEntries(s.values)).sa.access.scanMs,10000);
  assert.equal(setup({'switchmate.access.v1':'{bad'}).sa.access.scanMs,2000);
  const denied=setup({},true);denied.sa.update({scanMs:5000});denied.sa.open();assert.equal(denied.sa.access.scanMs,5000);assert.match(denied.nodes.get('sa-status').textContent,/unavailable/);
});
check('newer schemas are never overwritten; cross-tab changes and clear reload',()=>{
  const future=JSON.stringify({version:2,profiles:{}}),s=setup({'switchmate.access.v1':future});s.sa.update({scanMs:3000});assert.equal(s.values.get('switchmate.access.v1'),future);
  const t=setup();const saved=JSON.parse(t.values.get('switchmate.access.v1'));saved.profiles.default.access.scanMs=6000;t.values.set('switchmate.access.v1',JSON.stringify(saved));t.fire('storage',{key:'switchmate.access.v1'});assert.equal(t.sa.access.scanMs,6000);
  t.values.clear();t.fire('storage',{key:null});assert.equal(t.sa.access.scanMs,2000);
});
check('short press, repeat suppression and configurable acceptance / recovery',()=>{
  const s=setup();s.fire('keydown',{code:'Space'});s.fire('keydown',{code:'Space',repeat:true});assert.equal(s.selected,0);s.advance(100);s.fire('keyup',{code:'Space'});assert.equal(s.selected,1);s.press();assert.equal(s.selected,1);
  s.sa.update({minimumPressMs:500,debounceMs:750});s.advance(800);s.press('Space',100);assert.equal(s.selected,1);s.press('Space',600);assert.equal(s.selected,2);
});
check('a held switch opens the menu without selecting through on release',()=>{
  const s=setup();s.fire('keydown',{code:'Space'});s.advance(2100);assert.equal(s.nodes.get('sa-dialog').open,true);s.fire('keyup',{code:'Space'});assert.equal(s.selected,0);assert.equal(s.nodes.get('sa-dialog').open,true);
  s.advance(300);s.press();assert.equal(s.nodes.get('sa-dialog').open,false);assert.equal(s.selected,0);
});
check('key mapping, fields, modifiers and Tab keep ordinary keyboard input',()=>{
  const s=setup();s.sa.update({keys:['ArrowRight']});s.press();assert.equal(s.selected,0);s.press('ArrowRight');assert.equal(s.selected,1);
  s.advance(300);assert.equal(s.fire('keydown',{code:'ArrowRight',ctrlKey:true}).prevented,undefined);
  assert.equal(s.fire('keydown',{code:'ArrowRight',target:s.newElement('input')}).prevented,undefined);
  s.fire('keydown',{key:'Tab'});assert.equal(s.sa.manual,true);assert.equal(s.fire('keydown',{code:'ArrowRight',target:s.newElement('button')}).prevented,undefined);
});
check('menu and hidden-tab pauses preserve remaining timer time',()=>{
  const s=setup();let hits=0,scan=0;s.sa.clock.setTimeout(()=>hits++,1000);s.sa.scanClock.setTimeout(()=>scan++,1000);s.advance(400);s.sa.open();s.advance(60000);assert.equal(hits,0);s.sa.close();s.advance(599);assert.equal(hits,0);s.advance(1);assert.equal(hits,1);assert.equal(scan,1);
  s.sa.clock.setTimeout(()=>hits++,1000);s.document.hidden=true;s.fire('visibilitychange');s.advance(9000);assert.equal(hits,1);s.document.hidden=false;s.fire('visibilitychange');s.advance(1000);assert.equal(hits,2);
});
check('Tab freezes scan only; interrupted presses cannot activate after blur',()=>{
  const s=setup();let scan=0,game=0;s.sa.scanClock.setTimeout(()=>scan++,100);s.sa.clock.setTimeout(()=>game++,100);s.fire('keydown',{key:'Tab'});s.advance(1000);assert.equal(scan,0);assert.equal(game,1);s.sa.resumeScanning();s.advance(100);assert.equal(scan,1);
  s.fire('keydown',{code:'Space'});s.fire('blur');s.advance(3000);s.fire('focus');s.fire('keyup',{code:'Space'});assert.equal(s.selected,0);
});
check('pointer region, scroll cancellation, multitouch and click-only input',()=>{
  const s=setup();s.sa.update({pointerMode:'bottom',debounceMs:0});
  const pointer={pointerId:1,isPrimary:true,button:0,clientX:20,clientY:200};s.fire('pointerdown',pointer);s.fire('pointerup',pointer);assert.equal(s.selected,0);
  pointer.clientY=800;s.fire('pointerdown',pointer);s.advance(20);s.fire('pointerup',pointer);assert.equal(s.selected,1);s.fire('click',{detail:1,clientY:800});assert.equal(s.selected,1);
  s.fire('pointerdown',pointer);s.fire('pointermove',{...pointer,clientY:900});s.fire('pointerup',pointer);assert.equal(s.selected,1);
  s.fire('pointerdown',pointer);s.fire('pointerdown',{...pointer,isPrimary:false,pointerId:2});s.fire('pointerup',pointer);assert.equal(s.selected,1);
  s.fire('click',{detail:0,clientY:800});assert.equal(s.selected,2);
});
check('new activity settings use validated defaults and retain unrelated fields',()=>{
  const s=setup();const store=s.context.SwitchProfile.create(s.context.localStorage);store.setApp('test',{rounds:99,futureOption:'kept'});assert.equal(store.appSettings('test',{rounds:{values:[1,2,3],default:3}}).rounds,3);store.update('test',{sound:false});assert.equal(store.snapshot().profiles.default.apps.test.settings.futureOption,'kept');
});
console.log(`${passed} shared access checks passed`);
