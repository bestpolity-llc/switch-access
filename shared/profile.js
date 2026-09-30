/* Browser-local, versioned access profiles. No account or network dependency. */
(function (root) {
  'use strict';
  const KEY = 'switchmate.access.v1';
  const DEFAULTS = Object.freeze({scanMs:2000, pointerMode:'full', keys:['Space','Enter','NumpadEnter'], minimumPressMs:0, debounceMs:250, menuHoldMs:2000, sound:true, spokenLabels:false});
  const copy = value => JSON.parse(JSON.stringify(value));
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const safeId = id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/.test(id) && !['constructor','prototype','__proto__'].includes(id);
  const validKey = code => /^(Space|Enter|NumpadEnter|Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Numpad[0-9])$/.test(code);
  function access(value, partial = false) {
    const out = partial ? {} : copy(DEFAULTS);
    if (!object(value)) return out;
    for (const [key,min,max] of [['scanMs',500,10000],['minimumPressMs',0,1500],['debounceMs',0,2000],['menuHoldMs',2000,10000]]) {
      if (Number.isFinite(value[key])) out[key] = Math.round(Math.max(min,Math.min(max,value[key])));
    }
    if (['full','bottom','external'].includes(value.pointerMode)) out.pointerMode=value.pointerMode;
    if (Array.isArray(value.keys)) {
      const keys = [...new Set(value.keys.filter(k => typeof k === 'string' && validKey(k)))].slice(0,8);
      if (keys.length) out.keys=keys;
    }
    for (const key of ['sound','spokenLabels']) if (typeof value[key] === 'boolean') out[key]=value[key];
    return out;
  }
  function fresh() { return {version:1,activeProfileId:'default',profiles:{default:{name:'Default',access:copy(DEFAULTS),apps:{}}}}; }
  function normalize(raw) {
    const out=fresh();
    if (!object(raw) || raw.version !== 1 || !object(raw.profiles)) return out;
    for (const [id,p] of Object.entries(raw.profiles)) {
      if (!safeId(id) || !object(p)) continue;
      const apps={};
      if (object(p.apps)) for (const [appId,a] of Object.entries(p.apps)) {
        if (!safeId(appId) || !object(a)) continue;
        apps[appId]={settings:object(a.settings)?copy(a.settings):{}};
        if (object(a.access)) apps[appId].access=access(a.access,true);
      }
      out.profiles[id]={name:typeof p.name==='string'?p.name.slice(0,80):id,access:access(p.access),apps};
    }
    if (safeId(raw.activeProfileId) && out.profiles[raw.activeProfileId]) out.activeProfileId=raw.activeProfileId;
    return out;
  }
  function create(storage, changed = () => {}) {
    let data=fresh(), persistent=true, future=false;
    function read() {
      try {
        const text=storage.getItem(KEY);
        const raw=text?JSON.parse(text):null;
        future=!!(raw && raw.version>1);
        data=normalize(raw);
        return !!text;
      } catch { persistent=false; return false; }
    }
    function persist() {
      try { if (future) throw Error('Newer profile format'); storage.setItem(KEY,JSON.stringify(data)); persistent=true; }
      catch { persistent=false; }
    }
    if (!read()) {
      // Import the former site-wide typing preference once; activity-specific
      // preferences cannot silently choose a different site default on each visit.
      try { const speed=Number(storage.getItem('switchaac_speed')); if (speed>=500 && speed<=10000) data.profiles.default.access.scanMs=speed; } catch {}
      persist();
    }
    function profile() { return data.profiles[data.activeProfileId]; }
    function edit(fn) { if (persistent && !future) read(); fn(profile()); persist(); changed(); }
    function app(id) { return profile().apps[id] || {settings:{}}; }
    return {
      get persistent(){return persistent&&!future;}, get future(){return future;},
      snapshot:()=>copy(data),
      effective:id=>({...copy(profile().access),...copy(app(id).access||{})}),
      overridden:id=>!!app(id).access,
      reload(){read();changed();},
      update(id,patch,local=false){edit(p=>{
        if (local && safeId(id)) { p.apps[id] ||= {settings:{}}; p.apps[id].access={...p.apps[id].access,...access(patch,true)}; }
        else p.access={...p.access,...access(patch,true)};
      });},
      override(id,enabled){if(safeId(id)) edit(p=>{p.apps[id] ||= {settings:{}}; if(enabled) p.apps[id].access={...copy(p.access),...p.apps[id].access}; else delete p.apps[id].access;});},
      reset(id,local){edit(p=>{if(local&&safeId(id)){p.apps[id] ||= {settings:{}};delete p.apps[id].access;}else p.access=copy(DEFAULTS);});},
      appSettings(id,definitions,legacy={}) {
        const saved=app(id).settings, result={};
        for(const [key,def] of Object.entries(definitions)) {
          const v=Object.hasOwn(saved,key)?saved[key]:legacy[key];
          result[key]=def.values.includes(v)?v:def.default;
        }
        return result;
      },
      setApp(id,patch){if(safeId(id)) edit(p=>{p.apps[id] ||= {settings:{}};p.apps[id].settings={...p.apps[id].settings,...copy(patch)};});}
    };
  }
  root.SwitchProfile={KEY,DEFAULTS,access,normalize,create,validKey};
})(typeof window==='undefined'?globalThis:window);
