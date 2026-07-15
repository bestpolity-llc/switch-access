// ============================================================
// SwitchMate Predictor — statistical word prediction
// Bigram context + prefix frequency + personal adaptation.
// Pure JS, fully offline, works on every browser/device.
// Requires predict-data.js loaded first (PREDICT_DATA).
// ============================================================
const Predictor = (function () {
  const V = PREDICT_DATA.vocab;
  const LF = PREDICT_DATA.logFreq;
  const BG = PREDICT_DATA.bigrams;
  const IDX = new Map(V.map((w, i) => [w, i]));

  // --- Sorted vocab index for fast prefix range scans ---
  // sortedIds: vocab indices ordered alphabetically by word
  const sortedIds = V.map((_, i) => i).sort((a, b) => (V[a] < V[b] ? -1 : 1));
  const sortedWords = sortedIds.map(i => V[i]);

  function lowerBound(prefix) {
    let lo = 0, hi = sortedWords.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sortedWords[mid] < prefix) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  // All vocab ids whose word starts with prefix
  function prefixRange(prefix) {
    const out = [];
    let i = lowerBound(prefix);
    while (i < sortedWords.length && sortedWords[i].startsWith(prefix)) {
      out.push(sortedIds[i]); i++;
    }
    return out;
  }

  // --- Personal adaptation (localStorage) ---
  // Learns the user's own unigrams + bigrams. AAC users repeat
  // themselves constantly — personal history is the strongest signal.
  const LS_KEY = 'sm_personal_v1';
  let personal = { uni: {}, bi: {} };
  try {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) personal = JSON.parse(saved);
  } catch (e) {}

  let saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        // Cap growth: keep top 400 unigrams, 800 bigrams
        const uniE = Object.entries(personal.uni).sort((a, b) => b[1] - a[1]).slice(0, 400);
        const biE = Object.entries(personal.bi).sort((a, b) => b[1] - a[1]).slice(0, 800);
        personal = { uni: Object.fromEntries(uniE), bi: Object.fromEntries(biE) };
        localStorage.setItem(LS_KEY, JSON.stringify(personal));
      } catch (e) {}
    }, 1000);
  }

  function learn(text) {
    const words = text.toLowerCase().match(/[a-z']+/g);
    if (!words) return;
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w.length < 2 && w !== 'i' && w !== 'a') continue;
      personal.uni[w] = (personal.uni[w] || 0) + 1;
      if (i > 0) {
        const key = words[i - 1] + ' ' + w;
        personal.bi[key] = (personal.bi[key] || 0) + 1;
      }
    }
    persist();
  }

  // --- Scoring ---
  // score = base log-frequency
  //       + bigram bonus (rank-weighted) when word continues prev word
  //       + personal unigram/bigram bonuses (dominant when present)
  const MAX_LF = 24; // log(23e9) ~ 23.9
  function scoreCandidates(prefix, prevWord, limit) {
    const cands = new Map(); // id-or-word -> {w, score}

    function bump(w, s) {
      const cur = cands.get(w);
      if (!cur || s > cur) cands.set(w, s);
    }

    // 1. Corpus prefix matches (frequency prior)
    for (const id of prefixRange(prefix)) {
      bump(V[id], LF[id]);
    }

    // 2. Corpus bigram continuations of prevWord that match prefix
    const pid = prevWord ? IDX.get(prevWord) : undefined;
    if (pid !== undefined && BG[pid]) {
      const conts = BG[pid];
      for (let r = 0; r < conts.length; r++) {
        const w = V[conts[r]];
        if (w.startsWith(prefix)) {
          // rank-weighted bonus: strong enough to beat raw web frequency
          bump(w, LF[conts[r]] + Math.max(4, 18 - r));
        }
      }
    }

    // 3. Personal unigrams (user's own vocabulary — names, places)
    for (const [w, c] of Object.entries(personal.uni)) {
      if (w.startsWith(prefix)) {
        const base = IDX.has(w) ? LF[IDX.get(w)] : 8;
        bump(w, base + Math.min(10, 3 + Math.log2(c) * 2));
      }
    }

    // 4. Personal bigrams (strongest signal of all)
    if (prevWord) {
      const pfx = prevWord + ' ';
      for (const [key, c] of Object.entries(personal.bi)) {
        if (key.startsWith(pfx)) {
          const w = key.slice(pfx.length);
          if (w.startsWith(prefix)) {
            const base = IDX.has(w) ? LF[IDX.get(w)] : 12;
            bump(w, base + Math.min(22, 14 + Math.log2(c) * 2));
          }
        }
      }
    }

    const arr = [...cands.entries()].sort((a, b) => b[1] - a[1]);
    return arr.slice(0, limit).map(e => e[0]);
  }

  // --- Public API ---
  return {
    // Next-word + completion prediction.
    // text: full composed text; returns up to n suggestions.
    predict(text, n = 3) {
      const t = text.toLowerCase();
      const m = t.match(/([a-z']+)$/);
      const prefix = m ? m[1] : '';
      // previous completed word (before current prefix)
      const before = prefix ? t.slice(0, t.length - prefix.length) : t;
      const pm = before.match(/([a-z']+)[^a-z']*$/);
      const prevWord = pm ? pm[1] : '';

      if (!prefix) {
        // NEXT-WORD mode: nothing typed yet — predict from context alone
        const out = [];
        const seen = new Set();
        // personal bigrams first
        if (prevWord) {
          const pfx = prevWord + ' ';
          const pers = Object.entries(personal.bi)
            .filter(([k]) => k.startsWith(pfx))
            .sort((a, b) => b[1] - a[1]);
          for (const [k] of pers) {
            const w = k.slice(pfx.length);
            if (!seen.has(w)) { out.push(w); seen.add(w); }
            if (out.length >= n) return out;
          }
          // corpus bigrams
          const pid = IDX.get(prevWord);
          if (pid !== undefined && BG[pid]) {
            for (const cid of BG[pid]) {
              const w = V[cid];
              if (!seen.has(w)) { out.push(w); seen.add(w); }
              if (out.length >= n) return out;
            }
          }
        }
        // sentence start / no context: personal favorites then corpus top
        const pers = Object.entries(personal.uni).sort((a, b) => b[1] - a[1]);
        for (const [w] of pers) {
          if (!seen.has(w) && w.length > 1) { out.push(w); seen.add(w); }
          if (out.length >= n) return out;
        }
        for (const w of ['i', 'the', 'you', 'we', 'it', 'can', 'what']) {
          if (!seen.has(w)) { out.push(w); seen.add(w); }
          if (out.length >= n) break;
        }
        return out;
      }

      // COMPLETION mode
      return scoreCandidates(prefix, prevWord, n);
    },

    // Call when a message is spoken/finished to learn from it.
    learn,

    // Expose for letter-frequency scanning optimizations later
    vocabSize: V.length
  };
})();
