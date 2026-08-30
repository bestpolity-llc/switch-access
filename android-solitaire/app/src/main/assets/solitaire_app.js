(function () {
  'use strict';

  if (window.__switchSolitaireStandaloneV2) return;
  window.__switchSolitaireStandaloneV2 = true;

  var nativeBridge = window.SolitaireNative || null;
  var originalSpeak = typeof window.speak === 'function' ? window.speak : null;
  var scanTimer = null;
  var scanIndex = 0;
  var scanContext = '';
  var lastKeyAt = 0;

  var HELP_SPEECH = [
    'Easy Play. Each quick switch press performs the best legal move available. There are no wrong choices, so the player can focus on cause and effect and enjoy completing the game.',
    'Choose Moves. Legal moves light up one at a time. Press the switch when the move you want is highlighted. Scanning speed can be changed in Settings.',
    'Switch controls. Quick press plays or selects. Hold for two seconds to open or close Settings. Hold for ten seconds to restart the game. Tap the lightning button four times to change between full screen, bottom twenty five percent, and external switch modes. The speaker button turns game sounds and spoken prompts on or off.'
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function isVisible(element) {
    if (!element || !element.isConnected) return false;
    var style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (element.hidden) return false;
    var rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function normalizeText(element) {
    if (!element) return '';
    var text = element.getAttribute('aria-label') || element.innerText || element.textContent || '';
    return String(text).replace(/\s+/g, ' ').trim();
  }

  function announce(text) {
    if (!window.__switchSolitaireAudio || !text) return;
    var used = false;
    try {
      if (nativeBridge && typeof nativeBridge.speak === 'function') {
        used = !!nativeBridge.speak(String(text));
      }
    } catch (error) {
      used = false;
    }
    if (!used && originalSpeak) originalSpeak(String(text));
  }

  function speakUnconditionally(text) {
    var used = false;
    if (window.__switchSolitaireAudio) {
      try {
        if (nativeBridge && typeof nativeBridge.speak === 'function') {
          used = !!nativeBridge.speak(String(text));
        }
      } catch (error) {
        used = false;
      }
    }
    if (!used && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(String(text));
        utterance.rate = 0.94;
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        // Speech is optional.
      }
    }
  }

  function sendKey(key, code, keyCode) {
    var options = {
      key: key,
      code: code,
      keyCode: keyCode,
      which: keyCode,
      bubbles: true,
      cancelable: true,
      repeat: false
    };
    document.dispatchEvent(new KeyboardEvent('keydown', options));
    document.dispatchEvent(new KeyboardEvent('keyup', options));
  }

  function settingsVisible() {
    return isVisible(byId('settingsOverlay'));
  }

  function helpVisible() {
    return isVisible(byId('standaloneHelpOverlay'));
  }

  function scanSpeed() {
    var selected = 'medium';
    try {
      selected = localStorage.getItem('switchaac_sol_speed') || 'medium';
    } catch (error) {
      selected = 'medium';
    }
    if (selected === 'slow') return 2600;
    if (selected === 'fast') return 1100;
    return 1700;
  }

  function currentItems() {
    var selector;
    if (helpVisible()) {
      selector = '#standaloneHelpPanel .standalone-help-action';
    } else if (settingsVisible()) {
      selector = '#settingsPanel .opt';
    } else {
      return [];
    }
    return Array.prototype.filter.call(document.querySelectorAll(selector), isVisible);
  }

  function clearScanPaint() {
    Array.prototype.forEach.call(
      document.querySelectorAll('.solitaire-app-scan'),
      function (element) {
        element.classList.remove('solitaire-app-scan');
      }
    );
  }

  function paintScan(announceCurrent) {
    var items = currentItems();
    clearScanPaint();
    if (!items.length) return;
    scanIndex = ((scanIndex % items.length) + items.length) % items.length;
    items[scanIndex].classList.add('solitaire-app-scan');
    if (typeof items[scanIndex].scrollIntoView === 'function') {
      items[scanIndex].scrollIntoView({ block: 'nearest' });
    }
    if (announceCurrent) announce(normalizeText(items[scanIndex]));
  }

  function stopPanelScan() {
    if (scanTimer !== null) {
      window.clearInterval(scanTimer);
      scanTimer = null;
    }
    scanContext = '';
    clearScanPaint();
  }

  function startPanelScan(contextName) {
    stopPanelScan();
    scanContext = contextName;
    scanIndex = 0;
    paintScan(true);
    scanTimer = window.setInterval(function () {
      var expectedVisible = contextName === 'help' ? helpVisible() : settingsVisible();
      if (!expectedVisible) {
        stopPanelScan();
        return;
      }
      var items = currentItems();
      if (!items.length) return;
      scanIndex = (scanIndex + 1) % items.length;
      paintScan(true);
    }, scanSpeed());
  }

  function refreshPanelScan() {
    if (helpVisible()) {
      if (scanContext !== 'help') startPanelScan('help');
      return;
    }
    if (settingsVisible()) {
      if (scanContext !== 'settings') startPanelScan('settings');
      return;
    }
    stopPanelScan();
  }

  function activatePanelItem() {
    var items = currentItems();
    if (!items.length) return false;
    scanIndex = ((scanIndex % items.length) + items.length) % items.length;
    var item = items[scanIndex];
    item.click();
    window.setTimeout(refreshPanelScan, 30);
    return true;
  }

  function closeHelp() {
    var overlay = byId('standaloneHelpOverlay');
    if (!overlay) return;
    overlay.hidden = true;
    stopPanelScan();
    if (typeof window.startScan === 'function') {
      try { window.startScan(); } catch (error) { /* optional */ }
    }
  }

  function openHelp() {
    var overlay = byId('standaloneHelpOverlay');
    if (!overlay) return;
    if (settingsVisible() && typeof window.closeSettings === 'function') {
      try { window.closeSettings(); } catch (error) { /* optional */ }
    }
    overlay.hidden = false;
    if (typeof window.stopScan === 'function') {
      try { window.stopScan(); } catch (error) { /* optional */ }
    }
    startPanelScan('help');
  }

  function addHelpUi() {
    if (byId('standaloneHelpOverlay')) return;

    var headerActions = document.querySelector('.bar-right');
    var gear = byId('gearBtn');
    if (headerActions && gear) {
      var helpButton = document.createElement('button');
      helpButton.type = 'button';
      helpButton.id = 'standaloneHelpButton';
      helpButton.className = 'gear standalone-help-button';
      helpButton.setAttribute('aria-label', 'Help and support');
      helpButton.textContent = '?';
      helpButton.addEventListener('click', function (event) {
        event.stopPropagation();
        openHelp();
      });
      headerActions.insertBefore(helpButton, gear);
    }

    var settingsPanel = byId('settingsPanel');
    var newGameButton = byId('optNewGame');
    if (settingsPanel && newGameButton && !byId('optStandaloneHelp')) {
      var helpRow = document.createElement('div');
      helpRow.className = 'btn-row footer-row';
      var settingsHelp = document.createElement('button');
      settingsHelp.type = 'button';
      settingsHelp.className = 'opt';
      settingsHelp.id = 'optStandaloneHelp';
      settingsHelp.innerHTML = '❓ Help &amp; support<small>Game modes, switch controls, free web version, and contact.</small>';
      settingsHelp.addEventListener('click', openHelp);
      helpRow.appendChild(settingsHelp);
      settingsPanel.insertBefore(helpRow, newGameButton.parentElement);
    }

    var overlay = document.createElement('div');
    overlay.className = 'overlay standalone-help-overlay';
    overlay.id = 'standaloneHelpOverlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="panel standalone-help-panel" id="standaloneHelpPanel" role="dialog" aria-modal="true" aria-labelledby="standaloneHelpTitle">' +
        '<h2 id="standaloneHelpTitle">How to Play</h2>' +
        '<p class="standalone-help-intro">SwitchMate Solitaire is designed for one-switch play. The rules are standard Klondike, but the app only offers legal moves.</p>' +
        '<button type="button" class="opt standalone-help-action standalone-help-card" data-help-speech="0">' +
          '<strong>Easy Play</strong><small>Each quick press performs the best legal move available. There are no wrong choices.</small>' +
        '</button>' +
        '<button type="button" class="opt standalone-help-action standalone-help-card" data-help-speech="1">' +
          '<strong>Choose Moves</strong><small>Legal moves light up one at a time. Press when the move you want is highlighted.</small>' +
        '</button>' +
        '<button type="button" class="opt standalone-help-action standalone-help-card" data-help-speech="2">' +
          '<strong>Switch controls</strong><small>Quick press: play/select. Hold 2 seconds: Settings. Hold 10 seconds: restart. Tap ⚡ four times to change switch mode.</small>' +
        '</button>' +
        '<a class="opt standalone-help-action standalone-help-link" href="mailto:support@bestpolity.com?subject=SwitchMate%20Solitaire%20Support" aria-label="Email support at support at bestpolity dot com">' +
          '<strong>✉ Email support</strong><small>support@bestpolity.com</small>' +
        '</a>' +
        '<a class="opt standalone-help-action standalone-help-link" href="https://switch.bestpolity.com/games/solitaire.html?openBrowser=1" aria-label="Open the free web version">' +
          '<strong>🌐 Free web version</strong><small>Play in a browser without purchasing the Appstore edition.</small>' +
        '</a>' +
        '<button type="button" class="opt primary standalone-help-action" id="standaloneHelpClose">Back to the game</button>' +
        '<p class="standalone-support-note">The one-time Appstore purchase supports continued maintenance of this Fire tablet edition and development of more accessible software. No ads and no subscription.</p>' +
      '</div>';
    document.body.appendChild(overlay);

    Array.prototype.forEach.call(
      overlay.querySelectorAll('[data-help-speech]'),
      function (button) {
        button.addEventListener('click', function () {
          var index = Number(button.getAttribute('data-help-speech')) || 0;
          speakUnconditionally(HELP_SPEECH[index]);
        });
      }
    );
    byId('standaloneHelpClose').addEventListener('click', closeHelp);
    overlay.addEventListener('click', function (event) {
      if (event.target === overlay) closeHelp();
    });
  }

  function applyAudio(enabled) {
    enabled = !!enabled;
    window.__switchSolitaireAudio = enabled;
    try {
      if (typeof window.settings !== 'undefined' && window.settings) {
        window.settings.voice = enabled;
        window.settings.sound = enabled;
        if (typeof window.saveSettings === 'function') window.saveSettings();
      }
    } catch (error) {
      // The page may expose settings lexically rather than on window.
    }
    try {
      if (typeof settings !== 'undefined' && settings) {
        settings.voice = enabled;
        settings.sound = enabled;
        if (typeof saveSettings === 'function') saveSettings();
        if (typeof syncSettingsUI === 'function') syncSettingsUI();
      }
    } catch (error) {
      // Older versions may not expose these symbols.
    }
  }

  window.SwitchSolitaireApp = {
    activate: function () {
      if (helpVisible() || settingsVisible()) {
        activatePanelItem();
        return;
      }
      sendKey(' ', 'Space', 32);
    },
    back: function () {
      if (helpVisible()) {
        closeHelp();
        return;
      }
      sendKey('Escape', 'Escape', 27);
    },
    setMode: function (name) {
      document.documentElement.setAttribute('data-switch-mode', name || 'full');
    },
    setAudio: applyAudio,
    openHelp: openHelp
  };

  if (originalSpeak) {
    window.speak = function (text) {
      if (!window.__switchSolitaireAudio) return;
      var used = false;
      try {
        if (nativeBridge && typeof nativeBridge.speak === 'function') {
          used = !!nativeBridge.speak(String(text || ''));
        }
      } catch (error) {
        used = false;
      }
      if (!used) originalSpeak(text);
    };
  }

  document.addEventListener('keydown', function (event) {
    if (!helpVisible() && !settingsVisible()) return;
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (helpVisible()) closeHelp();
      else sendKey('Escape', 'Escape', 27);
      return;
    }
    if (event.key === 'Tab' || event.key === 'F5' || event.key === 'F11' || event.key === 'F12') return;
    var now = Date.now();
    if (now - lastKeyAt < 250) return;
    lastKeyAt = now;
    event.preventDefault();
    event.stopImmediatePropagation();
    activatePanelItem();
  }, true);

  var observer = new MutationObserver(function () {
    window.setTimeout(refreshPanelScan, 20);
  });

  addHelpUi();
  var settingsOverlay = byId('settingsOverlay');
  if (settingsOverlay) {
    observer.observe(settingsOverlay, {
      attributes: true,
      attributeFilter: ['hidden', 'style', 'class']
    });
  }
  refreshPanelScan();
})();
