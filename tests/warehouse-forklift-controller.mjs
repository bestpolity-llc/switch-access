// Deterministic controller checks; canvas/layout and real devices need browser checks.
function runForkliftChecks(html) {
  const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  function setup(saved, storageFails = false) {
    let now = 0, frame, assigned = null;
    const nodes = new Map(), winEvents = {}, docEvents = {}, stored = new Map();
    if (saved !== undefined) stored.set('switchmate.warehouse-forklift.settings.v1', typeof saved === 'string' ? saved : JSON.stringify(saved));
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
    let adapter,opened=null;
    const SwitchAccess={storage,clock:{now:()=>now,setTimeout:()=>0,clearTimeout(){}},paused:false,manual:false,announce(){},open(page){opened=page;},register(config){adapter=config;const app={};for(const [key,def] of Object.entries(config.settings))app[key]=def.values.includes(config.legacy[key])?config.legacy[key]:def.default;config.apply({scanMs:2000,sound:false},app);}};
    Function('SwitchAccess','window','document','localStorage','performance','requestAnimationFrame','setTimeout','clearTimeout',source)(SwitchAccess,window,document,storage,{now:()=>now},cb=>{frame=cb;},()=>0,()=>{});
    const advance=ms=>{now+=ms;frame(now);};
    const event=(name,extra={},doc=false)=>{(doc?docEvents:winEvents)[name]?.({target:document.body,preventDefault(){},...extra});};
    const key=()=>adapter.activate();
    const choices=()=>node('choices').children;
    const buttons=()=>node('menuActions').children;
    const selectMenu=label=>{
      for(let i=0;i<10;i++) {
        const b=buttons().find(b=>b.attrs['aria-current']==='true');
        if(b?.textContent===label){advance(500);key();return;}
        advance(window.__forklift.CFG.scanMs);
      }
      throw Error('Cannot scan to menu action: '+label);
    };
    const selectMove=i=>{
      advance(500);
      for(let n=0;n<8 && window.__forklift.G.hl!==i;n++) advance(window.__forklift.CFG.scanMs);
      key();
    };
    const clickMenu=label=>{advance(500);const b=buttons().find(b=>b.textContent===label);assert(b,'Missing '+label);b.events.click({target:b});};
    return {shared:SwitchAccess,get opened(){return opened;},api:window.__forklift,node,document,advance,event,key,selectMenu,selectMove,clickMenu,choices,buttons,stored,get assigned(){return assigned;}};
  }
  function route(api,start,target) {
    const queue=[{state:start,path:[]}],seen=new Set();
    for(let n=0;n<queue.length;n++){
      const c=queue[n];
      if(c.state.x===target.x && c.state.y===target.y)return c.path;
      for(let i=0;i<4;i++){
        const st=api.simulate(c.state,api.OPTIONS[i]),key=st.x+","+st.y;
        if(st.blocked || seen.has(key))continue;
        seen.add(key);queue.push({state:st,path:c.path.concat(i)});
      }
    }
    throw Error('No route');
  }
  let passed=0;
  {
    const s=setup({sound:false,rounds:5});
    s.selectMenu('Start driving');
    for(let dock=0;dock<5;dock++) {
      for(const target of [s.api.JOBS[dock].pickup,s.api.JOBS[dock].drop]) {
        for(const i of route(s.api,s.api.G.st,target)){s.selectMove(i);s.advance(700);}
        s.selectMove(4);s.advance(700);
      }
      assert(s.api.isParked(s.api.G.st),'Dock '+(dock+1)+' reached');
      assert(!s.node('accessMenu').hidden,'Dock completion presents menu');
      if(dock<4)s.selectMenu('Next delivery');
    }
    assert(s.node('menuTitle').textContent==='Warehouse shift complete!','Final completion');
    s.selectMenu('Play again');assert(s.api.G.round===0 && s.api.G.steps===0,'Replay resets run');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Start driving');s.selectMove(0);s.advance(200);
    const before={...s.api.G.st};s.node('menuButton').events.click();s.advance(30000);
    assert(s.api.G.st.y===before.y && s.api.G.phase==='paused','Menu pauses moving truck');
    s.selectMenu('Resume game');s.advance(500);
    assert(s.api.G.steps===1 && s.api.G.st.y<before.y && s.api.G.phase==='scan','Interrupted move resumes exactly once');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Settings');assert(s.opened==='activity','Game settings delegate to shared menu');
    s.selectMenu('Return to library');s.selectMenu('Stay here');assert(s.assigned===null,'Exit cancellation');s.selectMenu('Return to library');s.selectMenu('Leave game');assert(s.assigned==='../../','Exit target');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Start driving');s.selectMove(0);s.advance(700);s.selectMove(5);
    s.selectMenu('Restart run');s.selectMenu('Keep this run');assert(s.api.G.steps===1,'Restart cancellation keeps run');
    s.selectMenu('Restart run');s.selectMenu('Restart');assert(s.api.G.steps===0,'Confirmed restart resets');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Start driving');s.shared.manual=true;s.advance(60000);assert(s.api.G.hl===0,'Manual navigation does not advance choices');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Start driving');s.shared.paused=true;s.advance(60000);assert(s.api.G.hl===0,'Shared access menu pauses game loop');passed++;
  }
  for(const saved of ['{bad',{scanMs:-1,rounds:999,preview:'bad',sound:false},undefined]) {
    const s=setup(saved,saved===undefined);
    assert(s.api.CFG.scanMs>=800 && s.api.CFG.scanMs<=5000 && s.api.CFG.rounds<=5 && typeof s.api.CFG.preview==='boolean','Safe settings defaults');
    s.selectMenu('Settings');assert(s.opened==='activity','Settings remain reachable');passed++;
  }
  {
    const s=setup({sound:false});s.selectMenu('Start driving');
    s.selectMove(4);s.advance(700);
    assert(!s.api.G.carrying && !s.api.G.delivered,'Cannot pick up away from pallet');
    s.api.G.st={x:450,y:325,th:0};s.selectMove(3);s.advance(700);
    assert(s.api.G.st.x===450 && s.api.G.bumps===1,'Shelf blocks travel');
    s.api.G.st={x:150,y:700,th:0};s.selectMove(2);s.advance(700);
    assert(s.api.G.st.y===700,'Warehouse wall blocks travel');passed++;
  }

  return {passed,environment:'Simulated DOM/events/animation clock; not physical-device or rendered-browser validation'};
}

const { readFile } = await import('node:fs/promises');
console.log(JSON.stringify(runForkliftChecks(await readFile(new URL('../games/warehouse-forklift/index.html', import.meta.url),'utf8')),null,2));
