/* Optional browser services. Decide before requesting any SDK or tracker. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('app') === '1') return;
  const base = new URL('../', document.currentScript.src);
  for (const src of [
    'https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore-compat.js',
    'firebase-init.js?v=20261004-2',
    'switchmate-tracker.js?v=20261004-2',
  ]) {
    const script = document.createElement('script');
    script.async = false; // Preserve Firebase dependency order.
    script.src = new URL(src, base).href;
    document.head.appendChild(script);
  }
})();
