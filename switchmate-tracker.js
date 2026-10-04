/* Shared, optional usage reporting. No account or Firebase dependency. */
(() => {
  'use strict';
  if (window.SwitchMateAnalytics) return;
  const ID = 'G-K6HGF1692H';
  const KEY = 'switchaac_analytics';
  const pages = {
    '/': ['library', 'SwitchMate Library'],
    '/keyboard.html': ['type', 'Type'],
    '/calc.html': ['calc', 'Calc'],
    '/guide.html': ['guide', 'SwitchMate Guide'],
    '/games/pop.html': ['pop', 'Pop!'],
    '/games/choose.html': ['choose', 'Pick'],
    '/games/tap.html': ['tap', 'Tap'],
    '/games/maker.html': ['maker', 'Game Maker'],
    '/games/hellgate.html': ['hellgate', 'Hellgate'],
    '/games/solitaire.html': ['solitaire', 'Solitaire'],
    '/games/rift-signal/': ['rift-signal', 'Rift-Signal'],
    '/games/drift-signal/': ['drift-signal', 'Drift-Signal'],
    '/games/american-big-rigs/': ['american-big-rigs', 'American Big Rigs'],
    '/games/warehouse-forklift/': ['warehouse-forklift', 'Warehouse Forklift'],
  };
  const path = location.pathname.replace(/\/index\.html$/, '/');
  const page = pages[path];
  let initialized = false, viewed = false;
  const allowed = () => {
    if (location.hostname !== 'switch.bestpolity.com' || !page) return false;
    try {
      const storage = window.SwitchAccess?.storage || window.localStorage;
      return storage.getItem(KEY) !== '0';
    } catch { return false; }
  };
  function tag() { window.dataLayer.push(arguments); }
  function refresh() {
    const enabled = allowed();
    window['ga-disable-' + ID] = !enabled;
    if (!enabled) return;
    if (!initialized) {
      initialized = true;
      window.dataLayer = window.dataLayer || [];
      tag('consent', 'default', {
        ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
        analytics_storage: 'granted',
      });
      tag('js', new Date());
      let referrer = '';
      try { referrer = new URL(document.referrer).origin; } catch {}
      tag('config', ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: location.origin + path,
        page_referrer: referrer,
        page_title: page[1],
      });
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
      document.head.appendChild(script);
    }
    if (!viewed) {
      viewed = true;
      tag('event', 'page_view', {send_to: ID});
      if (!['library', 'guide'].includes(page[0])) {
        tag('event', 'activity_open', {send_to: ID, activity_id: page[0]});
      }
    }
  }
  window.SwitchMateAnalytics = {
    refresh,
    // Only predefined Game Maker actions and numeric seeds can be reported.
    makerEvent(type, seed) {
      if (!allowed() || !initialized || page[0] !== 'maker') return;
      if (!['play', 'love'].includes(type) || !Number.isSafeInteger(seed)) return;
      tag('event', 'maker_' + type, {send_to: ID, activity_id: 'maker', game_seed: seed});
    },
  };
  window.addEventListener('storage', event => {
    if (event.key === KEY || event.key === null) refresh();
  });
  refresh();
})();
