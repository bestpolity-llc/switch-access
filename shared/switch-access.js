/* Shared switch input, pause-aware clocks and a switch-scannable settings menu. */
(() => {
  "use strict";
  const nativeSet = window.setTimeout.bind(window),
    nativeClear = window.clearTimeout.bind(window);
  const realNow = () => performance.now();
  function makeClock() {
    let paused = false,
      stoppedAt = 0,
      offset = 0,
      sequence = 0;
    const jobs = new Map();
    const now = () => (paused ? stoppedAt : realNow()) - offset;
    function arm(id, job) {
      if (paused) return;
      job.handle = nativeSet(
        () => {
          if (!jobs.has(id)) return;
          if (!job.interval) jobs.delete(id);
          job.fn();
          if (job.interval && jobs.has(id)) {
            job.due = now() + job.delay;
            arm(id, job);
          }
        },
        Math.max(0, job.due - now()),
      );
    }
    function add(fn, ms, interval, args) {
      const id = ++sequence,
        delay = Math.max(interval ? 1 : 0, Number(ms) || 0),
        job = { fn: () => fn(...args), delay, interval, due: now() + delay };
      jobs.set(id, job);
      arm(id, job);
      return id;
    }
    const clear = (id) => {
      nativeClear(jobs.get(id)?.handle);
      jobs.delete(id);
    };
    return {
      now,
      setTimeout: (fn, ms, ...args) => add(fn, ms, false, args),
      setInterval: (fn, ms, ...args) => add(fn, ms, true, args),
      clearTimeout: clear,
      clearInterval: clear,
      pause(value) {
        if (value === paused) return;
        if (value) {
          stoppedAt = realNow();
          paused = true;
          for (const job of jobs.values()) nativeClear(job.handle);
        } else {
          offset += realNow() - stoppedAt;
          paused = false;
          for (const [id, job] of jobs) arm(id, job);
        }
      },
    };
  }
  const clock = makeClock(),
    scanClock = makeClock();
  let adapter = null,
    access = SwitchProfile.access(),
    appSettings = {},
    menu = null,
    page = "main",
    manual = false,
    held = null;
  let background = document.hidden,
    blurred = false,
    lastActivation = -Infinity,
    suppressClickUntil = 0,
    capture = false,
    menuTimer,
    menuIndex = 0,
    menuActions = [];
  let dialog,
    options,
    heading,
    copy,
    status,
    toolbar,
    resumeButton,
    previousFocus,
    testCount = 0;
  let storage;
  try {
    storage = window.localStorage;
  } catch {
    storage = {
      getItem() {
        throw Error("Storage unavailable");
      },
      setItem() {
        throw Error("Storage unavailable");
      },
    };
  }
  const store = SwitchProfile.create(storage, apply);
  const legacyMemory = new Map();
  const legacyStorage = {
    getItem(key) {
      try {
        return storage.getItem(key);
      } catch {
        return legacyMemory.get(key) ?? null;
      }
    },
    setItem(key, value) {
      legacyMemory.set(key, String(value));
      try {
        storage.setItem(key, String(value));
      } catch {}
    },
    removeItem(key) {
      legacyMemory.delete(key);
      try {
        storage.removeItem(key);
      } catch {}
    },
  };
  const editable = (target) =>
    !!target?.closest?.(
      'input,textarea,select,[contenteditable="true"],[contenteditable=""],[role="textbox"]',
    );
  const direct = (target) =>
    !!target?.closest?.(
      'button,a,input,select,textarea,[onclick],[role="button"],.menu-btn,.hist-item',
    );
  const pad = (target) => !!target?.closest?.("#switchPad,#appSwitchBtn");
  function updatePause() {
    const pause = !!menu || background || blurred || !!held;
    clock.pause(pause);
    scanClock.pause(pause || manual);
    document.body?.classList.toggle("sa-paused", pause);
    document.body?.classList.toggle("sa-manual", manual);
    if (resumeButton) resumeButton.hidden = !manual;
  }
  function apply() {
    if (!adapter) return;
    access = store.effective(adapter.id);
    document.body?.classList.toggle(
      "sa-external",
      access.pointerMode === "external",
    );
    appSettings = store.appSettings(
      adapter.id,
      adapter.settings || {},
      adapter.legacy || {},
    );
    adapter.apply?.({ ...access }, { ...appSettings });
    if (!access.sound || !access.spokenLabels)
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    if (menu) renderMenu(false);
  }
  function announce(text) {
    if (
      !access.sound ||
      !access.spokenLabels ||
      !window.speechSynthesis ||
      window.speechSynthesis.speaking ||
      !window.SpeechSynthesisUtterance
    )
      return;
    try {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    } catch {}
  }
  function paintMenu() {
    [...options.children].forEach((button, i) => {
      button.classList.toggle("sa-current", !manual && i === menuIndex);
      if (!manual && i === menuIndex)
        button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    });
    if (!manual) {
      options.children[menuIndex]?.scrollIntoView?.({ block: "nearest" });
      announce(menuActions[menuIndex]?.label || "");
    }
  }
  function scheduleMenu() {
    nativeClear(menuTimer);
    if (
      !menu ||
      manual ||
      background ||
      blurred ||
      held ||
      capture ||
      page === "test"
    )
      return;
    menuTimer = nativeSet(() => {
      menuIndex = (menuIndex + 1) % menuActions.length;
      paintMenu();
      scheduleMenu();
    }, access.scanMs);
  }
  function changePage(next) {
    capture = false;
    page = next;
    menuIndex = 0;
    renderMenu();
  }
  function option(label, run) {
    return { label, run };
  }
  function setting(key, label, values, format = (v) => String(v)) {
    return option(label + ": " + format(access[key]), () => {
      const index = values.indexOf(access[key]);
      store.update(
        adapter.id,
        { [key]: values[(index + 1) % values.length] },
        store.overridden(adapter.id),
      );
    });
  }
  const seconds = (v) => (v / 1000).toFixed(v % 1000 ? 1 : 0) + " seconds";
  const yesNo = (v) => (v ? "on" : "off");
  function renderMenu(focus = true) {
    if (!menu || !dialog) return;
    const local = store.overridden(adapter.id),
      back = option("Back to access menu", () => changePage("main"));
    let title = "Switch access",
      description = "",
      items = [];
    if (page === "main") {
      description =
        "Press and release to select. Hold your switch for " +
        seconds(access.menuHoldMs) +
        " to open this menu. Tab pauses scanning for keyboard navigation. Settings save on this browser and device.";
      items = [
        option("Continue activity", close),
        option(
          "Switch settings" + (local ? " · this activity" : " · site default"),
          () => changePage("access"),
        ),
        option("Activity options", () => changePage("activity")),
        option("Test my switch", () => {
          testCount = 0;
          changePage("test");
        }),
        option(
          "Usage statistics: " +
            yesNo(legacyStorage.getItem("switchaac_analytics") !== "0"),
          () => {
            legacyStorage.setItem(
              "switchaac_analytics",
              legacyStorage.getItem("switchaac_analytics") === "0" ? "1" : "0",
            );
            renderMenu(false);
          },
        ),
      ];
      if (!adapter.isolated && adapter.id !== "library")
        items.push(option("Return to library", () => changePage("exit")));
    } else if (page === "access") {
      title = local
        ? "Switch settings for this activity"
        : "Switch settings for the site";
      description = local
        ? "These access settings apply only here. Turn off the override to follow your site default again."
        : "Changes follow you through all activities that use the site default.";
      items = [
        back,
        setting(
          "scanMs",
          "Scan time",
          [
            500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000,
            10000,
          ],
          seconds,
        ),
        setting(
          "pointerMode",
          "Touch / mouse switch area",
          ["full", "bottom", "external"],
          (v) =>
            ({
              full: "page background",
              bottom: "bottom quarter",
              external: "keyboard switch only",
            })[v],
        ),
        option(
          "Switch keys: " +
            access.keys
              .map((k) => (k === "Space" ? "Space" : k.replace(/^Key/, "")))
              .join(" / "),
          () => changePage("keys"),
        ),
        setting(
          "minimumPressMs",
          "Minimum press",
          [0, 100, 250, 500, 750, 1000, 1500],
          (v) => v + " ms",
        ),
        setting(
          "debounceMs",
          "Ignore repeat presses for",
          [0, 100, 250, 500, 750, 1000, 1500, 2000],
          (v) => v + " ms",
        ),
        setting(
          "menuHoldMs",
          "Hold to open menu",
          [2000, 3000, 4000, 5000, 8000, 10000],
          seconds,
        ),
        setting("sound", "Activity sounds", [true, false], yesNo),
        setting("spokenLabels", "Spoken choices", [false, true], yesNo),
      ];
      if (adapter.id !== "library")
        items.push(
          option("Use different switch settings here: " + yesNo(local), () =>
            store.override(adapter.id, !local),
          ),
        );
      items.push(option("Reset switch settings…", () => changePage("reset")));
    } else if (page === "keys") {
      title = "Switch keys";
      description =
        "Choose a common adapter key or learn a key sent by your switch. Escape cancels learning. Browser shortcuts and typing in fields are kept available.";
      const keys = (label, value) =>
        option(label, () => {
          store.update(adapter.id, { keys: value }, local);
          changePage("access");
        });
      items = [
        option("Back to switch settings", () => changePage("access")),
        keys("Space and Enter", ["Space", "Enter", "NumpadEnter"]),
        keys("Space only", ["Space"]),
        keys("Enter only", ["Enter", "NumpadEnter"]),
        keys("Arrow right", ["ArrowRight"]),
        option(
          capture ? "Press the key your switch sends…" : "Learn my switch key",
          () => {
            capture = true;
            nativeClear(menuTimer);
            renderMenu(false);
          },
        ),
      ];
    } else if (page === "activity") {
      title = "Activity options";
      description =
        "These choices stay with this activity and do not change other games.";
      items = [back];
      for (const [key, def] of Object.entries(adapter.settings || {}))
        items.push(
          option(
            def.label +
              ": " +
              (def.format
                ? def.format(appSettings[key])
                : typeof appSettings[key] === "boolean"
                  ? yesNo(appSettings[key])
                  : appSettings[key]),
            () => {
              store.setApp(adapter.id, {
                [key]:
                  def.values[
                    (def.values.indexOf(appSettings[key]) + 1) %
                      def.values.length
                  ],
              });
            },
          ),
        );
      for (const action of adapter.actions || [])
        items.push(
          option(action.label, () => {
            close();
            action.run();
          }),
        );
      if (items.length === 1)
        description =
          "This activity has no separate options. Your shared switch settings apply here.";
    } else if (page === "test") {
      title = "Test my switch";
      description =
        "Press and release your switch. Each accepted press adds one. Short presses below your minimum and rapid repeat presses are ignored. Hold the switch or press Escape to leave the test.";
      items = [option("Back to access menu", () => changePage("main"))];
    } else if (page === "exit") {
      title = "Return to the library?";
      description =
        "Your switch settings stay saved. Current activity progress may be lost.";
      items = [
        back,
        option("Leave activity", () => location.assign(adapter.home)),
      ];
    } else if (page === "reset") {
      title = "Reset switch settings?";
      description = local
        ? "Remove this activity’s override and follow the site default."
        : "Restore the site default. Activity options and other activity overrides are kept.";
      items = [
        option("Keep my settings", () => changePage("access")),
        option("Reset switch settings", () => {
          store.reset(adapter.id, local);
          changePage("access");
        }),
      ];
    }
    const focused = options.contains(document.activeElement)
      ? [...options.children].indexOf(document.activeElement)
      : -1;
    heading.textContent = title;
    copy.textContent = description;
    menuActions = items;
    menuIndex = Math.min(menuIndex, items.length - 1);
    options.replaceChildren(
      ...items.map((item, i) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = item.label;
        button.addEventListener("click", () => {
          menuIndex = i;
          item.run();
        });
        return button;
      }),
    );
    status.textContent =
      page === "test"
        ? "Accepted presses: " + testCount
        : store.persistent
          ? "Saved on this device."
          : store.future
            ? "A newer settings format is saved. Changes here last for this page only."
            : "Storage is unavailable. Changes last for this page only.";
    paintMenu();
    scheduleMenu();
    if (focus || focused >= 0)
      options.children[
        focused >= 0 ? Math.min(focused, items.length - 1) : menuIndex
      ]?.focus({ preventScroll: true });
  }
  function open(next = "main") {
    if (!adapter) return;
    buildUI();
    if (!menu) {
      previousFocus = document.activeElement;
      menu = true;
      dialog.showModal();
      try {
        window.speechSynthesis?.cancel();
      } catch {}
    }
    manual = false;
    updatePause();
    changePage(next);
  }
  function close() {
    menu = null;
    capture = false;
    nativeClear(menuTimer);
    dialog.close();
    updatePause();
    previousFocus?.isConnected &&
      previousFocus.focus?.({ preventScroll: true });
    adapter.resume?.();
  }
  function buildUI() {
    if (dialog) return;
    toolbar = document.createElement("div");
    toolbar.id = "sa-toolbar";
    toolbar.setAttribute("aria-label", "Switch access");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Switch settings";
    button.addEventListener("click", () => open());
    resumeButton = document.createElement("button");
    resumeButton.type = "button";
    resumeButton.id = "sa-resume";
    resumeButton.textContent = "Resume switch scanning";
    resumeButton.hidden = true;
    resumeButton.addEventListener("click", resumeScanning);
    toolbar.append(button, resumeButton);
    document.body.append(toolbar);
    dialog = document.createElement("dialog");
    dialog.id = "sa-dialog";
    dialog.setAttribute("aria-labelledby", "sa-title");
    dialog.setAttribute("aria-describedby", "sa-description");
    dialog.innerHTML =
      '<div id="sa-content"><h1 id="sa-title"></h1><p id="sa-description"></p><div id="sa-options"></div><p id="sa-status" role="status" aria-live="polite"></p></div>';
    document.body.append(dialog);
    heading = dialog.querySelector("h1");
    copy = dialog.querySelector("#sa-description");
    options = dialog.querySelector("#sa-options");
    status = dialog.querySelector("#sa-status");
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
  }
  function resumeScanning() {
    manual = false;
    updatePause();
    adapter?.resume?.();
    if (menu) {
      paintMenu();
      scheduleMenu();
    }
  }
  function activate() {
    if (background || blurred || realNow() - lastActivation < access.debounceMs)
      return;
    lastActivation = realNow();
    if (menu) {
      if (page === "test") {
        testCount++;
        status.textContent = "Accepted presses: " + testCount;
      } else menuActions[menuIndex]?.run();
    } else adapter?.activate();
  }
  function begin(kind, id, event) {
    if (held || background || blurred) return;
    if (manual) {
      manual = false;
      updatePause();
      if (menu) paintMenu();
    }
    held = {
      kind,
      id,
      time: realNow(),
      x: event.clientX,
      y: event.clientY,
      fired: false,
    };
    updatePause();
    nativeClear(menuTimer);
    held.timer = nativeSet(() => {
      if (!held) return;
      held.fired = true;
      if (menu && page === "test") changePage("main");
      else open();
    }, access.menuHoldMs);
  }
  function release(kind, id) {
    if (!held || held.kind !== kind || held.id !== id) return;
    const press = held;
    nativeClear(press.timer);
    held = null;
    updatePause();
    if (!press.fired && realNow() - press.time >= access.minimumPressMs)
      activate();
    scheduleMenu();
  }
  function cancel() {
    if (held) nativeClear(held.timer);
    held = null;
    updatePause();
    scheduleMenu();
  }
  function consume(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  const code = (event) =>
    event.code ||
    (event.key === " " ? "Space" : event.key === "Enter" ? "Enter" : event.key);
  window.addEventListener(
    "keydown",
    (event) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        editable(event.target)
      )
        return;
      if (event.key === "Escape") {
        if (event.repeat) return;
        consume(event);
        cancel();
        if (capture) {
          capture = false;
          renderMenu();
        } else if (menu && page === "test") changePage("main");
        else if (menu) close();
        else open();
        return;
      }
      if (event.key === "Tab") {
        manual = true;
        updatePause();
        nativeClear(menuTimer);
        if (menu) paintMenu();
        return;
      }
      if (capture) {
        consume(event);
        if (!event.repeat && SwitchProfile.validKey(code(event))) {
          store.update(
            adapter.id,
            { keys: [code(event)] },
            store.overridden(adapter.id),
          );
          capture = false;
          changePage("access");
        }
        return;
      }
      if (!access.keys.includes(code(event))) return;
      if (manual && direct(event.target)) return;
      consume(event);
      if (!event.repeat) begin("key", code(event), event);
    },
    true,
  );
  window.addEventListener(
    "keyup",
    (event) => {
      if (held?.kind === "key" && held.id === code(event)) {
        consume(event);
        release("key", code(event));
      }
    },
    true,
  );
  function surface(event) {
    if (pad(event.target)) return access.pointerMode !== "external";
    if (direct(event.target) || editable(event.target)) return false;
    return (
      access.pointerMode === "full" ||
      (access.pointerMode === "bottom" && event.clientY >= innerHeight * 0.75)
    );
  }
  window.addEventListener(
    "pointerdown",
    (event) => {
      if (event.isPrimary === false) {
        cancel();
        return;
      }
      if (event.button !== 0) return;
      if (!surface(event)) {
        suppressClickUntil = 0;
        return;
      }
      consume(event);
      begin("pointer", event.pointerId, event);
    },
    { capture: true, passive: false },
  );
  window.addEventListener(
    "pointermove",
    (event) => {
      if (
        held?.kind === "pointer" &&
        held.id === event.pointerId &&
        Math.hypot(event.clientX - held.x, event.clientY - held.y) > 15
      ) {
        suppressClickUntil = realNow() + 800;
        cancel();
      }
    },
    true,
  );
  window.addEventListener(
    "pointerup",
    (event) => {
      if (held?.kind === "pointer" && held.id === event.pointerId) {
        consume(event);
        suppressClickUntil = realNow() + 800;
        release("pointer", event.pointerId);
      }
    },
    true,
  );
  window.addEventListener(
    "pointercancel",
    () => {
      suppressClickUntil = realNow() + 800;
      cancel();
    },
    true,
  );
  window.addEventListener(
    "click",
    (event) => {
      if (realNow() < suppressClickUntil && event.detail !== 0) {
        consume(event);
        return;
      }
      if (surface(event) && event.detail === 0) {
        consume(event);
        resumeScanning();
        activate();
      }
    },
    true,
  );
  window.addEventListener("blur", () => {
    blurred = true;
    cancel();
    try {
      window.speechSynthesis?.cancel();
    } catch {}
  });
  window.addEventListener("focus", () => {
    blurred = false;
    updatePause();
    scheduleMenu();
  });
  document.addEventListener("visibilitychange", () => {
    background = document.hidden;
    cancel();
    if (background)
      try {
        window.speechSynthesis?.cancel();
      } catch {}
  });
  window.addEventListener("pagehide", cancel);
  window.addEventListener("storage", (event) => {
    if (event.key === SwitchProfile.KEY || event.key === null) store.reload();
  });
  window.SwitchAccess = {
    clock,
    scanClock,
    open,
    close,
    announce,
    storage: legacyStorage,
    register(config) {
      if (adapter) throw Error("Only one activity per page");
      adapter = config;
      store.setApp(
        config.id,
        store.appSettings(
          config.id,
          config.settings || {},
          config.legacy || {},
        ),
      );
      buildUI();
      updatePause();
    },
    get access() {
      return { ...access, keys: [...access.keys] };
    },
    get paused() {
      return !!menu || background || blurred || !!held;
    },
    get manual() {
      return manual;
    },
    update(patch) {
      store.update(adapter.id, patch, store.overridden(adapter.id));
    },
    setApp(patch) {
      store.setApp(adapter.id, patch);
    },
    getApp() {
      return { ...appSettings };
    },
    resumeScanning,
    // All app timers use the shared clocks, without replacing browser globals.
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    setInterval: clock.setInterval,
    clearInterval: clock.clearInterval,
  };
})();
