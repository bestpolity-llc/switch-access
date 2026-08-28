// ============================================================
// SwitchMate Analytics Tracker
// Writes page view events to Firestore for dashboard consumption.
// Include after firebase-init.js on any page you want tracked.
// ============================================================

(function() {
  // Respect the user's opt-out (set via caregiver panel on keyboard.html)
  try { if (localStorage.getItem('switchaac_analytics') === '0') return; } catch (e) {}

  const TRACKING_COLLECTION = 'switchmate_analytics';
  const PAGE_NAME = getPageName();
  const SESSION_KEY = 'switchmate_session_id';

  function getPageName() {
    const path = window.location.pathname;
    const file = path.split('/').pop();
    if (!file || file === '' || file === 'index.html') return 'home';
    return file.replace('.html', '');
  }

  function getSessionId() {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }

  function trackPageView() {
    // Wait for Firebase to be ready, but give up after a bounded number of
    // attempts so a missing SDK (offline / blocked CDN / ad-blocker) doesn't
    // reschedule itself forever and drain battery on low-power switch devices.
    const MAX_ATTEMPTS = 6;
    const RETRY_MS = 500;
    let attempts = 0;

    function tryTrack() {
      attempts++;
      try {
        if (typeof DB === 'undefined' || typeof firebase === 'undefined') {
          // Firebase not loaded yet — retry up to MAX_ATTEMPTS
          if (attempts < MAX_ATTEMPTS) {
            setTimeout(tryTrack, RETRY_MS);
          }
          return;
        }

        const entry = {
          page: PAGE_NAME,
          sessionId: getSessionId(),
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          userAgent: navigator.userAgent.slice(0, 200),
          referrer: document.referrer.slice(0, 500) || '',
          viewport: `${window.innerWidth}x${window.innerHeight}`,
        };

        // Add user id if signed in
        if (typeof currentUser !== 'undefined' && currentUser) {
          entry.uid = currentUser.uid;
          entry.email = currentUser.email || '';
        }

        DB.collection(TRACKING_COLLECTION).add(entry)
          .then(function() {
            // Silently tracked
          })
          .catch(function(err) {
            // Fail silently — tracking is non-critical
            console.debug('[SwitchMate] Track failed:', err.message);
          });
      } catch (e) {
        // Fail silently
        console.debug('[SwitchMate] Track error:', e.message);
      }
    }

    // Try immediately, with retries
    tryTrack();
  }

  // Track on page load
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }
})();
