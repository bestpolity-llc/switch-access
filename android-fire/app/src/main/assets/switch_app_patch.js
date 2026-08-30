(function () {
  'use strict';

  if (window.__switchAccessFirePatchV3) return;
  window.__switchAccessFirePatchV3 = true;

  var nativeBridge = window.SwitchAccessNative || null;
  var pageName = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var isKeyboard = pageName === 'keyboard.html';
  var lastAnnouncementKey = '';
  var lastAnnouncementAt = 0;
  var announcementTimer = null;
  var modalState = false;

  function visible(el) {
    if (!el || !el.isConnected) return false;
    var style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function textOf(el) {
    if (!el) return '';
    var aria = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title'));
    var text = aria || el.innerText || el.textContent || '';
    return String(text).replace(/\s+/g, ' ').trim();
  }

  function predictionWord(el) {
    return textOf(el).replace(/\s+AI$/i, '').trim();
  }

  function spokenKeyLabel(text) {
    var names = {
      ' ': 'Space',
      '⌫': 'Backspace',
      '↵': 'Enter',
      '⚙': 'Settings',
      '.': 'period',
      ',': 'comma',
      '!': 'exclamation mark',
      '?': 'question mark',
      "'": 'apostrophe',
      '"': 'quotation mark',
      '`': 'backtick',
      '\\': 'backslash',
      '/': 'slash',
      '#+=': 'symbols',
      'ABC': 'letters',
      '123': 'numbers',
      '✕': 'Clear message'
    };
    return names[text] || text;
  }

  function elementLabel(el) {
    if (!el) return '';
    var text = textOf(el);
    if (el.classList && el.classList.contains('pred-btn')) {
      var word = predictionWord(el);
      return word ? 'Prediction ' + word : 'Prediction';
    }
    if (el.classList && el.classList.contains('speak-btn')) return 'Speak message';
    if (el.classList && el.classList.contains('clear-btn')) return 'Clear message';
    if (el.id === 'helpBtn' || (el.classList && el.classList.contains('help-btn'))) return 'Help';
    if (el.id === 'cgBtn' || (el.classList && el.classList.contains('cg-btn'))) return 'Caregiver setup';
    if (el.matches && el.matches('.layers button')) return spokenKeyLabel(text);
    if (el.classList && el.classList.contains('key')) return spokenKeyLabel(text);
    return spokenKeyLabel(text);
  }

  function groupLabel(elements) {
    if (!elements.length) return '';
    if (elements.every(function (el) { return el.classList.contains('pred-btn'); })) {
      return 'Predictions';
    }
    if (elements.every(function (el) { return el.matches('.layers button'); })) {
      return 'Keyboard layers';
    }
    if (elements.every(function (el) { return el.matches('.text-actions button'); })) {
      return 'Message actions';
    }
    if (elements.every(function (el) { return el.classList.contains('key'); })) {
      var labels = elements.map(elementLabel).filter(Boolean);
      if (labels.length > 0) return 'Keyboard row ' + labels.join(', ');
      return 'Keyboard row';
    }
    if (elements.length === 1) return elementLabel(elements[0]);
    return elements.map(elementLabel).filter(Boolean).slice(0, 4).join(', ');
  }

  function announce(text, key) {
    text = String(text || '').trim();
    if (!text || !nativeBridge || typeof nativeBridge.announce !== 'function') return;
    var nextKey = key || text;
    var now = Date.now();
    if (nextKey === lastAnnouncementKey && now - lastAnnouncementAt < 250) return;
    lastAnnouncementKey = nextKey;
    lastAnnouncementAt = now;
    try { nativeBridge.announce(text); } catch (error) { /* native speech is best-effort */ }
  }

  function activeHighlights() {
    var cell = Array.prototype.filter.call(
      document.querySelectorAll('.switch-app-aac-cell, .switch-app-focus'),
      visible
    );
    if (cell.length) return { kind: 'cell', elements: [cell[cell.length - 1]] };

    var row = Array.prototype.filter.call(
      document.querySelectorAll('.switch-app-aac-row'),
      visible
    );
    if (row.length) return { kind: 'row', elements: row };

    return null;
  }

  function announceCurrentHighlight() {
    announcementTimer = null;
    var highlight = activeHighlights();
    if (!highlight) return;
    var text = highlight.kind === 'row'
      ? groupLabel(highlight.elements)
      : elementLabel(highlight.elements[0]);
    if (!text) return;
    var key = highlight.kind + ':' + text;
    announce(text, key);
  }

  function scheduleAnnouncement() {
    if (announcementTimer !== null) return;
    announcementTimer = window.setTimeout(announceCurrentHighlight, 40);
  }

  function visibleModal() {
    var selectors = [
      '.settings-dialog.active',
      '.help-overlay.show',
      '.cg-overlay.show',
      '.feedback-overlay.show',
      '.help-overlay.active',
      '[role="dialog"][aria-hidden="false"]'
    ];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (visible(el)) return true;
    }
    return false;
  }

  function syncModalState() {
    var open = visibleModal();
    if (open === modalState) return;
    modalState = open;
    if (nativeBridge && typeof nativeBridge.setDialogOpen === 'function') {
      try { nativeBridge.setDialogOpen(open); } catch (error) { /* no-op */ }
    }
  }

  function currentMessage() {
    try {
      if (typeof state !== 'undefined' && state && typeof state.text === 'string') return state.text;
    } catch (error) { /* lexical state may not be exposed by an older page */ }
    var display = document.getElementById('textDisplay');
    return display ? (display.innerText || display.textContent || '') : '';
  }

  function installNativeSpeak() {
    if (!isKeyboard) return;
    var originalSpeakText = typeof window.speakText === 'function' ? window.speakText : null;
    window.speakText = function () {
      var text = currentMessage().trim();
      if (!text) {
        announce('Message is empty', 'message-empty');
        return;
      }
      var accepted = false;
      if (nativeBridge && typeof nativeBridge.speak === 'function') {
        try { accepted = !!nativeBridge.speak(text); } catch (error) { accepted = false; }
      }
      if (!accepted && originalSpeakText) originalSpeakText();
    };

    var speakButton = document.querySelector('.speak-btn');
    if (speakButton) {
      speakButton.setAttribute('aria-label', 'Speak message');
      speakButton.setAttribute('title', 'Speak message');
    }
    var clearButton = document.querySelector('.clear-btn');
    if (clearButton) {
      clearButton.setAttribute('aria-label', 'Clear message');
      clearButton.setAttribute('title', 'Clear message');
    }
  }

  function predictionCell() {
    var cells = Array.prototype.filter.call(
      document.querySelectorAll('.switch-app-aac-cell'),
      function (el) { return visible(el) && el.classList.contains('pred-btn'); }
    );
    return cells.length ? cells[cells.length - 1] : null;
  }

  function installPredictionActivationRepair() {
    if (!isKeyboard || !window.SwitchAccessApp || typeof window.SwitchAccessApp.activate !== 'function') return;
    if (window.SwitchAccessApp.__predictionRepairV3) return;

    var originalActivate = window.SwitchAccessApp.activate.bind(window.SwitchAccessApp);
    window.SwitchAccessApp.activate = function () {
      var prediction = predictionCell();
      if (!prediction) {
        originalActivate();
        return;
      }

      var before = currentMessage();
      var word = predictionWord(prediction);
      var clicked = false;

      try { originalActivate(); } catch (error) { /* repair below remains available */ }

      window.setTimeout(function () {
        if (!prediction.isConnected || !word) return;
        var after = currentMessage();
        var normalizedWord = word.toLowerCase();
        var selected = after !== before &&
          after.toLowerCase().replace(/\s+$/g, '').slice(-normalizedWord.length) === normalizedWord;
        if (!selected) {
          prediction.click();
          clicked = true;
        }
        if (clicked) {
          lastAnnouncementKey = '';
          window.setTimeout(scheduleAnnouncement, 60);
        }
      }, 0);
    };
    window.SwitchAccessApp.__predictionRepairV3 = true;
  }

  function installAudioApiRepair() {
    if (!window.SwitchAccessApp || window.SwitchAccessApp.__audioRepairV3) return;
    var originalSetScanAudio = typeof window.SwitchAccessApp.setScanAudio === 'function'
      ? window.SwitchAccessApp.setScanAudio.bind(window.SwitchAccessApp)
      : null;
    window.SwitchAccessApp.setScanAudio = function (enabled) {
      if (originalSetScanAudio) {
        try { originalSetScanAudio(!!enabled); } catch (error) { /* optional legacy hook */ }
      }
      document.documentElement.classList.toggle('switch-app-scan-audio-on', !!enabled);
      lastAnnouncementKey = '';
      lastAnnouncementAt = 0;
      scheduleAnnouncement();
    };
    window.SwitchAccessApp.__audioRepairV3 = true;
  }

  function annotatePredictions() {
    if (!isKeyboard) return;
    var predictions = document.querySelectorAll('.pred-btn');
    Array.prototype.forEach.call(predictions, function (button) {
      var word = predictionWord(button);
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '-1');
      button.setAttribute('aria-label', word ? 'Prediction ' + word : 'Prediction');
    });
  }

  function observe() {
    var observer = new MutationObserver(function (mutations) {
      var shouldAnnounce = false;
      var shouldAnnotate = false;
      for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];
        if (mutation.type === 'attributes') {
          var target = mutation.target;
          if (target.classList && (
              target.classList.contains('switch-app-focus') ||
              target.classList.contains('switch-app-aac-row') ||
              target.classList.contains('switch-app-aac-cell'))) {
            shouldAnnounce = true;
          }
          if (target.id === 'settingsDialog' || target.id === 'helpOverlay' ||
              target.id === 'cgOverlay' || target.id === 'feedbackOverlay') {
            syncModalState();
          }
        } else if (mutation.type === 'childList') {
          shouldAnnounce = true;
          shouldAnnotate = isKeyboard;
          syncModalState();
        }
      }
      if (shouldAnnotate) annotatePredictions();
      if (shouldAnnounce) scheduleAnnouncement();
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
    });
  }

  function init() {
    document.documentElement.classList.add('switch-app-fire-audio');
    installNativeSpeak();
    installPredictionActivationRepair();
    installAudioApiRepair();
    annotatePredictions();
    syncModalState();
    observe();
    scheduleAnnouncement();

    if (isKeyboard) {
      window.setInterval(function () {
        annotatePredictions();
        installPredictionActivationRepair();
      }, 700);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
