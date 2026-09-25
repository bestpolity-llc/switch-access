
function runControllerChecks(missionSource, artSource, appSource) {
  const assert = (value, message) => { if (!value) throw Error(message); };
  function setup(saved = {}, speech = "missing", storageFails = false) {
    let time = 0, nextTimer = 1, timers = new Map(), assigned = null;
    const nodes = new Map(), events = {}, windowEvents = {}, values = new Map();
    values.set("switchmate.rift-signal.settings.v1", typeof saved === "string" ? saved : JSON.stringify({sound:false,...saved}));
    class Element {
      constructor(id) { this.id=id; this.dataset={}; this.textContent=""; this.hidden=false; this.children=[]; this.attributes={}; this.style={setProperty(){}}; this.className=""; }
      get classList() { return { toggle: (name, on) => { const all = new Set(this.className.split(" ").filter(Boolean)); if(on) all.add(name); else all.delete(name); this.className=[...all].join(" "); } }; }
      setAttribute(k,v) {this.attributes[k]=v;}
      removeAttribute(k) {delete this.attributes[k];}
      replaceChildren(...children) {this.children=children;}
      querySelectorAll() {return this.children;}
      closest(selector) {if(selector.includes("button[data-command]") && this.dataset.command !== undefined)return this; if(selector.includes("#switchPad") && this.id==="switchPad")return this; return null;}
    }
    const node = id => {if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id);};
    const document = {
      hidden:false, activeElement:null, body:node("body"), documentElement:node("html"),
      querySelector: selector => node(selector.slice(1)),
      createElement: () => new Element("button"),
      addEventListener: (name, callback) => {events[name]=callback;}
    };
    const window = {addEventListener:(name,callback)=>{windowEvents[name]=callback;}};
    const utterances=[];
    const speechSynthesis=speech==="missing" ? undefined : {cancel(){},getVoices(){return[];},speak(u){utterances.push(u);if(speech==="error")u.onerror();else if(speech==="working"){u.onstart();u.onend();}}};
    class Utterance {constructor(text){this.text=text;}}
    window.speechSynthesis=speechSynthesis;window.SpeechSynthesisUtterance=Utterance;
    const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{if(storageFails)throw Error("denied");values.set(k,v);}};
    const setTimeout=(fn,ms)=>{const id=nextTimer++;timers.set(id,{fn,at:time+ms});return id;};
    const clearTimeout=id=>timers.delete(id);
    Function("document","window","localStorage","performance","setTimeout","clearTimeout","location","speechSynthesis","SpeechSynthesisUtterance",
      missionSource.replaceAll("export const","const")+"\n"+artSource.replaceAll("export const","const")+"\n"+appSource.replace(/^import .*;\n/gm,"")
    )(document,window,localStorage,{now:()=>time},setTimeout,clearTimeout,{assign:url=>{assigned=url;}},speechSynthesis,Utterance);
    const advance=ms=>{const end=time+ms;while(true){const pending=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!pending)break;time=pending[1].at;timers.delete(pending[0]);pending[1].fn();}time=end;};
    const fire=(name,extra={},win=false)=>{(win?windowEvents:events)[name]?.({preventDefault(){},...extra});};
    const button=label=>node("controls").children.find(b=>b.textContent===label);
    const click=label=>{advance(700);const target=button(label);assert(target,"Missing control: "+label);fire("click",{target});};
    const key=(code="Space")=>{fire("keydown",{code},true);fire("keyup",{code},true);};
    const title=()=>node("sceneTitle").textContent;
    return {node,document,advance,fire,button,click,key,title,values,utterances,get assigned(){return assigned;}};
  }
  let passed=0;
  const initial=["BEGIN FIRST SHIFT","CONTINUE","CONTINUE","OPEN CHANNEL","ACCEPT REQUEST","CONTINUE","START CHOICE"];
  for(const branch of ["planet","stars"]){
    const s=setup();initial.forEach(s.click);
    assert(s.title()==="Blue planet","Initial picture");
    if(branch==="stars"){s.advance(8000);assert(s.title()==="Star field","Alternating picture");}
    s.advance(700);s.key();assert(s.title()===(branch==="planet"?"Planet view":"Star view"),"Selected branch");
    ["CONTINUE","CAPTURE PICTURE","CONNECT","CONTINUE","RETURN TO CREW","END SHIFT","CONTINUE"].forEach(s.click);
    assert(s.title()==="First Shift complete","Complete "+branch);
    s.click("Restart");s.click("Keep playing");assert(s.title()==="First Shift complete","Cancel restart");
    s.click("Restart");s.click("Yes, restart");assert(s.title()==="Welcome aboard","Confirm restart");passed++;
  }
  for(const mode of ["full","bottom","external"]){
    const s=setup({mode});s.fire("keydown",{code:"Space"},true);s.fire("keydown",{code:"Space",repeat:true},true);s.advance(9000);
    assert(s.title()==="Welcome aboard","Held key must wait for release");
    s.fire("keyup",{code:"Space"},true);assert(s.title()==="Captain Marcus Vale","Release selects once");
    s.key();assert(s.title()==="Captain Marcus Vale","Debounce second key");
    s.advance(700);
    const target=s.node(mode==="full"?"brand":"switchPad");
    if(mode==="external")s.key("Enter");
    else {s.fire("pointerdown",{target,isPrimary:true,button:0,pointerId:1,clientX:10,clientY:10});s.fire("pointerup",{pointerId:1});s.fire("click",{target});}
    assert(s.title()==="Meet your mentor","Input mode "+mode);
    s.advance(3000);assert(s.node("padLabel").textContent==="Help","Scan Help");
    s.key();assert(s.node("panelTitle").textContent==="How to play","Open Help by switch");
    s.advance(6000);assert(s.node("padLabel").textContent==="Settings","Scan Settings");
    s.key();s.advance(3000);s.key();
    assert(JSON.parse(s.values.get("switchmate.rift-signal.settings.v1")).mode!==mode,"Save changed mode");
    s.click("Picture choice: 8 seconds");s.click("Return to mission");
    s.click("Exit");s.click("Keep playing");assert(s.title()==="Meet your mentor","Exit cancel");
    s.click("Exit");s.click("Yes, exit");assert(s.assigned==="../../","Exit target");passed++;
  }
  for(const speech of ["missing","error","working","silent"]){
    const s=setup({sound:true},speech);s.click("Replay");
    if(speech==="silent")s.advance(5000);
    const status=s.node("audioStatus").textContent;
    assert(speech==="missing"?status.includes("unavailable"):speech==="working"?status.includes("Message complete"):status.includes("did not play"),"Speech fallback "+speech);passed++;
  }
  {
    const s=setup({mode:"bottom"});s.fire("pointerdown",{target:s.node("brand"),isPrimary:true,button:0,pointerId:1,clientX:5,clientY:5});s.fire("pointerup",{pointerId:1});
    assert(s.title()==="Welcome aboard","Outside bottom pad ignored");
    s.fire("keydown",{key:"Tab"},true);s.advance(30000);assert(s.node("scanStatus").textContent.includes("Keyboard navigation"),"Tab stops scan");
    s.document.activeElement=s.button("Settings");s.key();assert(s.node("panelTitle").textContent==="Your settings","Tab-selected command");
    s.click("Return to mission");initial.forEach(s.click);s.click("Settings");s.advance(60000);assert(s.title()==="Blue planet","Panel pauses story");
    s.click("Return to mission");s.document.hidden=true;s.fire("visibilitychange");s.advance(60000);assert(s.title()==="Blue planet","Hidden pauses choices");
    s.document.hidden=false;s.fire("visibilitychange");s.advance(8000);assert(s.title()==="Star field","Visible resumes choices");passed++;
  }
  {const s=setup("{broken");assert(s.node("body").dataset.mode==="full","Corrupt storage default");passed++;}
  {const s=setup({}, "missing", true);s.click("Settings");s.click("Input: Full-screen");assert(s.node("saveStatus").textContent.includes("Storage is unavailable"),"Storage denial");passed++;}
  return {passed, environment:"V8 controller with simulated DOM/events/timers; not a browser or layout test"};
}

const { readFile } = await import("node:fs/promises");
const sources = await Promise.all(["mission.js","art.js","app.js"].map(name => readFile(new URL("../games/rift-signal/" + name, import.meta.url), "utf8")));
console.log(JSON.stringify(runControllerChecks(...sources), null, 2));
