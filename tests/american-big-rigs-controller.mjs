// Deterministic controller checks; canvas/layout and real devices need browser checks.
function runRigsChecks(html) {
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  function setup(saved, storageFails = false) {
    let now = 0, frame, assigned = null;
    const nodes = new Map(), winEvents = {}, docEvents = {}, stored = new Map();
    if (saved !== undefined) stored.set('switchmate.american-big-rigs.settings.v1', typeof saved === 'string' ? saved : JSON.stringify(saved));
    class Element {
      constructor(id, tag = 'div') { this.id=id; this.tag=tag; this.children=[]; this.events={}; this.attrs={}; this.hidden=false; this.style={}; this.textContent=''; this.classes=new Set(); }
      get classList() {return {toggle:(n,on)=>on?this.classes.add(n):this.classes.delete(n),add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)};}
      set innerHTML(s) {this.textContent=s.replace(/<[^>]+>/g,'');}
      addEventListener(n,cb) {this.events[n]=cb;}
      appendChild(e) {this.children.push(e);}
      replaceChildren(...els) {this.children=els;}
      setAttribute(k,v) {this.attrs[k]=v;}
      removeAttribute(k) {delete this.attrs[k];}
      querySelector() {return this.timer || (this.timer=new Element('timer'));}
      closest(selector) {
        if (selector.includes('button') && this.tag==='button') return this;
        if (selector.includes('.board') && this.id==='board') return this;
        if (selector.includes('#accessMenu') && this.id==='accessMenu') return this;
        return null;
      }
      scrollIntoView() {}
      focus() {document.activeElement=this;}
    }
    const node=id=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id);};
    const context=new Proxy({}, {get:()=>()=>context,set:()=>true});
    node('cv').getContext=()=>context;
    const document={hidden:false,body:node('body'),activeElement:null,getElementById:node,createElement:tag=>new Element('',tag),querySelector:s=>node(s==='.board'?'board':s),addEventListener:(n,cb)=>{docEvents[n]=cb;}};
    const location={set href(url){assigned=url;}};
    const window={location,addEventListener:(n,cb)=>{winEvents[n]=cb;}};
    const storage={getItem:k=>{if(storageFails)throw Error('denied');return stored.get(k)??null;},setItem:(k,v)=>{if(storageFails)throw Error('denied');stored.set(k,v);}};
    Function('window','document','localStorage','performance','requestAnimationFrame','setTimeout','clearTimeout',source)(window,document,storage,{now:()=>now},cb=>{frame=cb;},()=>0,()=>{});
    const advance=ms=>{now+=ms;frame(now);};
    const event=(name,extra={},doc=false)=>{(doc?docEvents:winEvents)[name]?.({target:document.body,preventDefault(){},...extra});};
    const key=()=>{event('keydown',{code:'Space',key:' '});event('keyup',{code:'Space',key:' '});};
    const choices=()=>node('choices').children;
    const buttons=()=>node('menuActions').children;
    const selectMenu=label=>{
      for(let i=0;i<10;i++) {
        const b=buttons().find(b=>b.attrs['aria-current']==='true');
        if(b?.textContent===label){advance(500);key();return;}
        advance(window.__abr.CFG.scanMs);
      }
      throw Error('Cannot scan to menu action: '+label);
    };
    const selectMove=i=>{
      advance(500);
      for(let n=0;n<8 && window.__abr.G.hl!==i;n++) advance(window.__abr.CFG.scanMs);
      key();
    };
    const clickMenu=label=>{advance(500);const b=buttons().find(b=>b.textContent===label);assert(b,'Missing '+label);b.events.click({target:b});};
    return {api:window.__abr,node,document,advance,event,key,selectMenu,selectMove,clickMenu,choices,buttons,stored,get assigned(){return assigned;}};
  }
  // Beam search uses the real pure movement function; execution uses switch events.
  function route(api,start) {
    let candidates=[{state:start,path:[]}];
    const seen=new Set();
    for(let depth=0;depth<50;depth++) {
      const next=[];
      for(const c of candidates) for(let i=0;i<6;i++) {
        const st=api.simulate(c.state,api.OPTIONS[i]);
        st.x=Math.max(128,Math.min(772,st.x));st.y=Math.max(62,Math.min(700,st.y));
        const path=c.path.concat(i);
        if(api.isParked(st))return path;
        const key=[Math.round(st.x/4),Math.round(st.y/4),Math.round((st.th-Math.PI)/.025)].join(',');
        if(seen.has(key))continue;
        seen.add(key);
        next.push({state:st,path,score:Math.abs(st.x-450)+Math.abs(st.y-140)*.5+Math.abs(st.th-Math.PI)*100});
      }
      candidates=next.sort((a,b)=>a.score-b.score).slice(0,600);
    }
    throw Error('No recovery route found');
  }
  let passed=0;
  {
    const s=setup({sound:false,rounds:5});
    s.selectMenu('Start driving');
    for(let dock=0;dock<5;dock++) {
      for(const i of route(s.api,s.api.G.st)) {s.selectMove(i);s.advance(700);}
      assert(s.api.isParked(s.api.G.st),'Dock '+(dock+1)+' reached');
      assert(!s.node('accessMenu').hidden,'Dock completion presents menu');
      if(dock<4)s.selectMenu('Next dock');
    }
    assert(s.node('menuTitle').textContent==='All docks done!','Final completion');
    s.selectMenu('Play again');assert(s.api.G.round===0 && s.api.G.steps===0,'Replay resets run');passed++;
  }
  {
    const s=setup({sound:false});
    s.event('keydown',{code:'Space',key:' '});s.event('keydown',{code:'Space',key:' ',repeat:true});s.advance(12000);
    assert(s.api.G.phase==='paused','Held switch does not start or repeat');
    s.event('keyup',{code:'Space',key:' '});assert(s.api.G.phase==='scan','Release starts once');
    s.key();assert(s.api.G.steps===0,'Duplicate activation suppressed');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Start driving');s.selectMove(2);s.advance(200);
    const before={...s.api.G.st};s.node('menuButton').events.click();s.advance(30000);
    assert(s.api.G.st.y===before.y && s.api.G.phase==='paused','Menu pauses moving truck');
    s.selectMenu('Resume game');s.advance(500);
    assert(s.api.G.steps===1 && s.api.G.st.y<before.y && s.api.G.phase==='scan','Interrupted move resumes exactly once');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Start driving');s.selectMove(6);
    s.selectMenu('Settings');s.selectMenu('Slower: 2.0 seconds');
    assert(s.api.CFG.scanMs===2200,'Switch changes speed');
    s.selectMenu('Docks next run: 3');assert(s.api.CFG.rounds===4 && s.api.G.rounds===3,'Dock count changes next run only');
    assert(JSON.parse(s.stored.get('switchmate.american-big-rigs.settings.v1')).scanMs===2200,'Preferences saved');
    s.selectMenu('Back');s.selectMenu('Return to library');s.selectMenu('Stay here');assert(s.assigned===null,'Exit cancellation');
    s.selectMenu('Return to library');s.selectMenu('Leave game');assert(s.assigned==='../../','Switch exits to library');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Start driving');s.selectMove(2);s.advance(700);s.selectMove(6);
    s.selectMenu('Restart run');s.selectMenu('Keep this run');assert(s.api.G.steps===1,'Restart cancellation keeps run');
    s.selectMenu('Restart run');s.selectMenu('Restart');assert(s.api.G.steps===0,'Confirmed restart resets');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Start driving');s.event('keydown',{code:'Space',key:' '});
    s.document.hidden=true;s.event('visibilitychange',{},true);s.advance(60000);
    s.document.hidden=false;s.event('visibilitychange',{},true);s.event('keyup',{code:'Space',key:' '});
    assert(s.api.G.phase==='paused' && s.api.G.steps===0,'Hidden tab cancels held press and pauses');passed++;
  }
  {
    const s=setup({sound:false});s.event('keydown',{key:'Tab'});s.advance(60000);
    assert(!s.buttons().some(b=>b.attrs['aria-current']),'Tab disables automatic scan');
    s.clickMenu('Start driving');s.advance(10000);assert(s.api.G.hl===0,'Keyboard navigation pauses game scanning');passed++;
  }
  {
    const s=setup({sound:false});const target=s.node('accessMenu');
    s.event('pointerdown',{target,isPrimary:true,button:0,pointerId:1,clientX:10,clientY:10},true);
    s.event('pointermove',{pointerId:1,clientX:10,clientY:50},true);s.event('pointerup',{pointerId:1},true);
    assert(s.api.G.phase==='paused','Scrolling cannot start game');
    s.event('click',{target,detail:0},true);assert(s.api.G.phase==='scan','Click-only assistive input starts game');passed++;
  }
  for(const saved of ['{bad',{scanMs:-1,rounds:999,preview:'bad',sound:false},undefined]) {
    const s=setup(saved,saved===undefined);
    assert(s.api.CFG.scanMs>=800 && s.api.CFG.scanMs<=5000 && s.api.CFG.rounds<=5 && typeof s.api.CFG.preview==='boolean','Safe settings defaults');
    s.selectMenu('Settings');s.clickMenu('Slower: '+(s.api.CFG.scanMs/1000).toFixed(1)+' seconds');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Start driving');
    s.api.G.st={x:128,y:62,th:Math.PI-.35};
    for(const i of route(s.api,s.api.G.st)){s.selectMove(i);s.advance(700);}
    assert(s.api.isParked(s.api.G.st),'Recovery from rear wall and far-left position');passed++;
  }
  return {passed,environment:'Simulated DOM/events/animation clock; not physical-device or rendered-browser validation'};
}

const { readFile } = await import('node:fs/promises');
console.log(JSON.stringify(runRigsChecks(await readFile(new URL('../games/american-big-rigs/index.html', import.meta.url),'utf8')),null,2));
