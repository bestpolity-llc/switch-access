(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const art = ['00-start','01-gear-1','02-gear-2','03-gear-3','04-gear-4','05-gear-5','06-run-complete'];
  const dwell = [1500,2500,4000,6000];
  const storageKey = 'switchmate.drift-signal.settings.v1';
  let settings = {speed:2500,speech:false,scanPenalty:false};
  try {
    const saved=JSON.parse(localStorage.getItem(storageKey));
    if(saved && typeof saved==='object') {
      if(dwell.includes(saved.speed)) settings.speed=saved.speed;
      for(const key of ['speech','scanPenalty']) if(typeof saved[key]==='boolean') settings[key]=saved[key];
    }
  } catch (_) { /* Storage is optional. */ }
  let mode='menu', returnMode='menu', gear=0, errors=0, extraCycles=0, wraps=0;
  let actions=[], index=0, scanTimer=null, transitionTimer=null, keyboardMode=false;
  let heldKey=null, lockedIndex=null, lastInput=-Infinity, loadToken=0, feedback='';
  let roundPenalty=false;
  function save(){try{localStorage.setItem(storageKey,JSON.stringify(settings));}catch(_){}}
  function stopScan(){clearTimeout(scanTimer);scanTimer=null;}
  function say(text){
    if(!settings.speech || !window.speechSynthesis || !window.SpeechSynthesisUtterance)return;
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.9;u.onerror=()=>{};speechSynthesis.speak(u);}catch(_){}
  }
  function highlight(){
    [...$('controls').children].forEach((b,i)=>{b.classList.toggle('scan',!keyboardMode&&i===index);if(!keyboardMode&&i===index)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
    $('padLabel').textContent=keyboardMode?'Resume scanning':(actions[index]?.label || 'Moving down the track…');
  }
  function schedule(){stopScan();if(keyboardMode||document.hidden||!actions.length||heldKey)return;scanTimer=setTimeout(()=>{
    index=(index+1)%actions.length;
    if(mode==='race'&&index===0){wraps++;if(wraps>1)extraCycles++;}
    highlight();say(actions[index].label);schedule();
  },settings.speed);}
  function controls(items,keepIndex=false){stopScan();actions=items;if(!keepIndex)index=0;index=Math.min(index,Math.max(0,items.length-1));$('controls').replaceChildren();
    items.forEach((item,i)=>{const b=document.createElement('button');b.type='button';b.textContent=item.label;if(item.gear)b.dataset.gear=item.gear;b.addEventListener('click',()=>activate(i));$('controls').appendChild(b);});
    $('switchPad').disabled=!items.length;highlight();schedule();
  }
  function message(title,text){$('title').textContent=title;$('message').textContent=text;}
  function image(n){$('sceneImage').src='assets/'+art[n]+'.webp';$('sceneImage').alt=n===6?'The dragster is past the finish line, continuing down the runoff with the wheel visible.':n===0?'At the starting line, steering wheel and silver dragster nose visible.':'Moving down the strip in gear '+n+', steering wheel visible.';$('gear').textContent=gear||'N';$('finishBanner').hidden=n!==6;}
  function showMenu(){mode='menu';gear=0;image(0);$('stage').textContent='Five gears. Your run.';message('You make the shifts.','Choose gears 1, 2, 3, 4, then 5. The car moves each time you get the next gear.');controls([{label:'Start race',run:start},{label:'Settings',run:()=>showSettings('menu')},{label:'Return to library',run:()=>confirmExit('menu')}]);$('status').textContent='Gold outline = highlighted choice. Press and release to select.';}
  function start(){gear=0;errors=0;extraCycles=0;wraps=0;feedback='';roundPenalty=settings.scanPenalty;image(0);race();}
  function race(){mode='race';$('stage').textContent='Shift '+(gear+1)+' of 5';message(gear===0?'Ready to launch?':'Time for the next gear.',feedback||(gear===0?'Start with gear 1.':'You are in gear '+gear+'. Choose the next gear.'));const correct=gear+1,wrong=gear===0?2:gear;
    const pair=gear%2===0?[correct,wrong]:[wrong,correct];
    controls([...pair.map(n=>({label:'Gear '+n,gear:n,run:()=>choose(n)})),{label:'Pause',run:pause}]);$('status').textContent='Choose a gear. Scanning repeats for as long as you need.';
  }
  function choose(n){
    if(n!==gear+1){errors++;feedback='That gear does not move us up. +2 seconds. Try gear '+(gear+1)+'.';say('Try gear '+(gear+1));race();return;}
    gear++;wraps=0;feedback='';say('Gear '+gear);moveTo(gear);
  }
  function moveTo(n){mode='moving';controls([]);message(n===5?'Fifth gear. Take it through the line!':'Good shift. Gear '+n+'.','Moving down the strip…');$('stage').textContent='Gear '+n+' engaged';
    loadScene(n,()=>{transitionTimer=setTimeout(()=>{transitionTimer=null;if(mode!=='moving')return;if(gear===5)crossFinish();else race();},1100);});
  }
  function loadScene(n,done){
    const token=++loadToken;const pic=new Image();let settled=false;
    const loaded=()=>{if(settled||token!==loadToken)return;settled=true;image(n);done();};
    pic.onload=loaded;pic.onerror=()=>{if(token!==loadToken||settled)return;settled=true;mode='load-error';message('The next picture could not load.','Your progress is safe. Retry to continue.');controls([{label:'Retry picture',run:()=>n===6?crossFinish():moveTo(n)},{label:'Return to library',run:()=>confirmExit('load-error')}]);};pic.src='assets/'+art[n]+'.webp';
  }
  function crossFinish(){mode='moving';controls([]);message('Crossing the finish line…','Keep going beyond the gantry.');loadScene(6,finish);}
  function finish(){mode='finish';const scan=roundPenalty?extraCycles*.5:0,total=10+errors*2+scan;$('stage').textContent='Run complete';message('You crossed the line! '+total.toFixed(1)+' seconds','Game time: 10.0 base + '+(errors*2).toFixed(1)+' gear penalties + '+scan.toFixed(1)+' scan penalties. '+errors+' wrong '+(errors===1?'gear':'gears')+'.');say('You crossed the line. '+total.toFixed(1)+' seconds.');controls([{label:'Race again',run:start},{label:'Settings',run:()=>showSettings('finish')},{label:'Return to library',run:()=>confirmExit('finish')}]);$('status').textContent=roundPenalty?'Extra completed scan cycles: '+extraCycles+'.':'Extra-scan penalty was off for this run.';}
  function pause(){if(!['race','moving'].includes(mode))return;returnMode=mode;clearTimeout(transitionTimer);transitionTimer=null;loadToken++;heldKey=null;lockedIndex=null;showPaused();}
  function showPaused(){mode='paused';message('Race paused.','Take your time. No time penalties accrue here.');controls([{label:'Resume race',run:resume},{label:'Settings',run:()=>showSettings('paused')},{label:'Restart race',run:confirmRestart},{label:'Return to library',run:()=>confirmExit('paused')}]);$('status').textContent='Select Resume race when you are ready.';}
  function resume(){feedback='';if(returnMode==='moving'){if(gear===5)crossFinish();else moveTo(gear);}else race();}
  function showSettings(from){mode='settings';message('Make it comfortable.','Select a setting to cycle it. Scan penalties apply to the next race.');controls([{label:'Scan speed: '+settings.speed/1000+' seconds',run:()=>{settings.speed=dwell[(dwell.indexOf(settings.speed)+1)%dwell.length];save();showSettings(from);}},{label:'Spoken choices: '+(settings.speech?'on':'off'),run:()=>{settings.speech=!settings.speech;save();showSettings(from);say('Spoken choices on');}},{label:'Extra-scan penalty: '+(settings.scanPenalty?'on':'off'),run:()=>{settings.scanPenalty=!settings.scanPenalty;save();showSettings(from);}},{label:'Back',run:()=>restore(from)}]);$('status').textContent='Speech depends on available browser voices. All choices remain visible.';}
  function restore(from){if(from==='finish')finish();else if(from==='paused')showPaused();else if(from==='load-error'){gear===5?crossFinish():moveTo(gear);}else showMenu();}
  function confirmRestart(){mode='confirm';message('Start this run again?','Your current score will reset.');controls([{label:'Keep this run',run:()=>restore('paused')},{label:'Restart',run:start}]);}
  function confirmExit(from){mode='confirm';message('Return to the library?','You can start another run whenever you like.');controls([{label:'Stay here',run:()=>restore(from)},{label:'Leave game',run:()=>{window.location.href='../../';}}]);}
  function activate(i){if(document.hidden||!actions[i]||performance.now()-lastInput<450)return;lastInput=performance.now();const action=actions[i];stopScan();action.run();}
  $('switchPad').addEventListener('click',()=>{if(keyboardMode){keyboardMode=false;highlight();schedule();return;}activate(index);});
  document.addEventListener('keydown',e=>{
    if(e.key==='Tab'){keyboardMode=true;stopScan();highlight();return;}
    if(e.key==='Escape'){e.preventDefault();pause();return;}
    if(![' ','Enter'].includes(e.key)||e.altKey||e.ctrlKey||e.metaKey)return;
    if(keyboardMode)return;
    e.preventDefault();if(e.repeat||heldKey)return;heldKey=e.key;lockedIndex=index;stopScan();
  });
  document.addEventListener('keyup',e=>{if(e.key!==heldKey)return;e.preventDefault();const chosen=lockedIndex;heldKey=null;lockedIndex=null;activate(chosen);schedule();});
  function interrupt(){heldKey=null;lockedIndex=null;if(mode==='race'||mode==='moving')pause();stopScan();try{speechSynthesis.cancel();}catch(_){}}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();else schedule();});
  window.addEventListener('blur',interrupt);window.addEventListener('focus',schedule);
  art.forEach(name=>{const preload=new Image();preload.src='assets/'+name+'.webp';});
  showMenu();
})();
