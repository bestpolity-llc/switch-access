import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = p => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const html = read('games/solitaire.html');
assert.match(html, /src="\.\.\/shared\/solitaire-services\.js\?v=/);
assert(!/<script[^>]+src=["'][^"']*(firebase|switchmate-tracker)/.test(html));
function session(search, pref) {
  const scripts = [], events = {};
  let initialized = 0;
  const auth = () => ({onAuthStateChanged() {}, getRedirectResult: () => Promise.resolve()});
  auth.GoogleAuthProvider = function() {};
  const c = {URL, URLSearchParams, console, Date,
    location: {search, pathname: '/games/solitaire.html', hostname: 'switch.bestpolity.com', origin: 'https://switch.bestpolity.com'},
    localStorage: {getItem: () => pref},
    document: {currentScript: {src: 'https://switch.bestpolity.com/shared/solitaire-services.js'}, referrer: '',
      createElement: () => ({}), head: {appendChild: s => scripts.push(s)}},
    firebase: {initializeApp() { initialized++; }, auth, firestore: () => ({})},
    addEventListener: (name, fn) => events[name] = fn};
  c.window = c; vm.createContext(c);
  const run = path => vm.runInContext(read(path), c);
  run('shared/solitaire-services.js');
  return {c, run, scripts, events, count: () => initialized, set: v => pref = v};
}
for (const search of ['?app=1', '?foo=bar&app=1', '?app=%31']) {
  for (const pref of [null, '0', '1']) {
    const b = session(search, pref);
    assert.equal(b.scripts.length, 0, 'No SDK or tracker requested');
    // Even stale markup/direct script loading cannot initialize services.
    b.run('firebase-init.js'); b.run('switchmate-tracker.js');
    b.set('1'); b.c.SwitchMateAnalytics.refresh(); b.events.storage({key: 'switchaac_analytics'});
    b.events.storage({key: null});
    assert.equal(b.count(), 0); assert.equal(b.scripts.length, 0);
    assert.equal(b.c.dataLayer, undefined);
    assert.equal(b.c['ga-disable-G-K6HGF1692H'], true);
  }
}
for (const search of ['', '?app=0']) {
  const b = session(search, '1');
  assert.equal(b.scripts.length, 5);
  assert(b.scripts.every(s => s.async === false));
  b.run('firebase-init.js'); b.run('switchmate-tracker.js');
  assert.equal(b.count(), 1); assert.equal(b.scripts.length, 6);
  assert(b.c.dataLayer.length > 0);
}
console.log('PASS: app-mode loader, stale script guards, preferences/storage changes, normal browser services.');
