import { SCENES, SCENE_MAP, ROLE_VOICES } from "./mission.js";
import { ART } from "./art.js";

const $ = selector => document.querySelector(selector);
const KEY = "switchmate.rift-signal.settings.v1";
const DEFAULTS = { mode: "full", scan: 3000, choice: 8000, sound: true, scale: 1 };
const OPTIONS = { mode: ["full", "bottom", "external"], scan: [2000, 3000, 5000, 8000], choice: [5000, 8000, 12000, 20000], scale: [1, 1.2, 1.4] };
let settings = { ...DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem(KEY));
  for (const key of Object.keys(OPTIONS)) if (OPTIONS[key].includes(saved?.[key])) settings[key] = saved[key];
  if (typeof saved?.sound === "boolean") settings.sound = saved.sound;
} catch { /* Storage may be blocked; the mission still works. */ }

let currentId = "welcome", panel = null, commands = [], scanIndex = 0;
let timer, generation = 0, lastInput = -Infinity, keyHeld = null, pointer = null;
let suppressClickUntil = 0, manual = false, speakingToken = 0, speechTimer;
const modeNames = { full: "Full-screen", bottom: "Bottom-quarter", external: "External switch" };
const scene = () => SCENE_MAP[currentId];

function applySettings() {
  document.body.dataset.mode = settings.mode;
  document.documentElement.style.setProperty("--scale", settings.scale);
  $("#modeHint").textContent = settings.mode === "full"
    ? "Tap anywhere or press Space / Enter"
    : settings.mode === "bottom" ? "Tap this bottom quarter or press Space / Enter" : "Press Space / Enter on your switch";
}
function save() {
  applySettings();
  try { localStorage.setItem(KEY, JSON.stringify(settings)); $("#saveStatus").textContent = "Settings saved on this device."; }
  catch { $("#saveStatus").textContent = "Storage is unavailable. Settings apply until you close this page."; }
}
function stopNarration() {
  speakingToken++;
  clearTimeout(speechTimer);
  try { window.speechSynthesis?.cancel(); } catch {}
}
function narrate(text = scene().narration, role = scene().role) {
  stopNarration();
  if (!settings.sound) { $("#audioStatus").textContent = "Narration off. The full message is shown above."; return; }
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    $("#audioStatus").textContent = "Voice is unavailable. Read the message above."; return;
  }
  const token = speakingToken;
  const unavailable = () => {
    if (token !== speakingToken) return;
    $("#audioStatus").textContent = "Voice did not play. Read the message or select Replay to try again.";
  };
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = ROLE_VOICES[role]?.rate || 0.92;
    // Query on every replay: voices may arrive after page load.
    const voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
    const voice = voices.find(v => v.localService) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.onstart = () => { if (token === speakingToken) { clearTimeout(speechTimer); $("#audioStatus").textContent = "Narration playing."; } };
    utterance.onend = () => { if (token === speakingToken) { clearTimeout(speechTimer); $("#audioStatus").textContent = "Message complete. Select Replay to hear it again."; } };
    utterance.onerror = () => { if (token === speakingToken) { clearTimeout(speechTimer); unavailable(); } };
    $("#audioStatus").textContent = "Starting narration…";
    speechTimer = setTimeout(unavailable, 5000);
    speechSynthesis.speak(utterance);
  } catch { unavailable(); }
}
function visual(s) {
  const image = $("#sceneImage");
  const fallback = $("#sceneFallback");
  $("#sceneMedia").dataset.visual = s.visual;
  const labels = { planet: "BLUE PLANET", stars: "STAR FIELD", signal: "SIGNAL OPERATIONS", choice: "PLANET OR STARS", crew: "ASTERION CREW" };
  $("#fallbackLabel").textContent = labels[s.visual] || "ASTERION";
  fallback.setAttribute("aria-label", s.visual === "planet" ? "A blue planet with white cloud bands" : s.visual === "stars" ? "A field of stars in deep space" : "Signal Operations in deep space");
  const art = ["planet", "stars", "signal", "choice"].includes(s.visual) ? null : ART[s.visual] || ART.hero;
  image.hidden = !art;
  fallback.hidden = !!art;
  image.onerror = () => { image.hidden = true; fallback.hidden = false; };
  if (art) { image.alt = art.alt; image.src = art.src; }
}
function renderStory() {
  const s = scene();
  $("#sceneTitle").textContent = s.title;
  $("#sceneProgress").textContent = "Scene " + (SCENES.indexOf(s) + 1) + " of 22 · two story paths";
  $("#speakerRole").textContent = s.role;
  $("#speakerName").textContent = ROLE_VOICES[s.role].label;
  $("#narration").textContent = s.narration;
  $("#sceneHint").textContent = s.timed
    ? "Planet, stars, then mission controls take turns. Select when your choice has the gold outline. Choices keep coming back."
    : s.end ? "Your first shift is complete. Replay, restart, or exit whenever you are ready." : "Select the highlighted control when you are ready. There is no time limit.";
  visual(s);
}
function clearScan() { clearTimeout(timer); }
function schedule() {
  clearScan();
  if (manual || document.hidden) return;
  const delay = commands[scanIndex]?.choice ? settings.choice : settings.scan;
  timer = setTimeout(() => {
    if (keyHeld || pointer) { schedule(); return; }
    scanIndex = (scanIndex + 1) % commands.length;
    highlight();
    schedule();
  }, delay);
}
function highlight() {
  const buttons = [...$("#controls").querySelectorAll("button")];
  buttons.forEach((button, i) => {
    button.classList.toggle("scan-focus", !manual && i === scanIndex);
    if (!manual && i === scanIndex) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  });
  const command = commands[scanIndex];
  if (!command) return;
  if (!panel && command.choice && currentId !== command.choice) {
    currentId = command.choice;
    renderStory();
  }
  $("#padLabel").textContent = command.label;
  $("#scanStatus").textContent = manual ? "Keyboard navigation: Tab to a control, then Space or Enter." : "Highlighted: " + command.label;
  if (!manual) buttons[scanIndex]?.scrollIntoView({ block: "nearest", behavior: "instant" });
}
function utilityCommands() {
  return [
    { label: "Help", run: () => openPanel("help") },
    { label: "Settings", run: () => openPanel("settings") },
    { label: "Replay", run: () => { narrate(); resetScan(); } },
    { label: "Restart", run: () => openPanel("restart") },
    { label: "Exit", run: () => openPanel("exit") }
  ];
}
function resetScan(index = 0) {
  scanIndex = index;
  manual = false;
  highlight();
  schedule();
}
function mount(next, index = 0) {
  generation++;
  clearScan();
  commands = next;
  $("#controls").replaceChildren(...commands.map((command, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = command.label;
    button.dataset.command = i;
    if (command.primary) button.className = "primary";
    return button;
  }));
  resetScan(index);
}
function render({ speak = true } = {}) {
  panel = null;
  $("#panel").hidden = true;
  $("#mission").hidden = false;
  renderStory();
  const s = scene();
  const actions = s.timed ? ["choose_planet", "choose_stars"].map(id => ({
    label: SCENE_MAP[id].action, choice: id, primary: true,
    run: () => { currentId = SCENE_MAP[id].choose; render(); }
  })) : [{
    label: s.action, primary: true,
    run: () => { if (s.end) openPanel("restart"); else { currentId = s.next; render(); } }
  }];
  mount([...actions, ...utilityCommands()], s.id === "choose_stars" ? 1 : 0);
  if (speak) narrate();
}
function cycle(key) {
  const options = OPTIONS[key];
  settings[key] = options[(options.indexOf(settings[key]) + 1) % options.length];
  save();
  const index = scanIndex;
  openPanel("settings", index);
}
function openPanel(name, index = 0) {
  stopNarration();
  panel = name;
  $("#mission").hidden = true;
  $("#panel").hidden = false;
  $("#audioStatus").textContent = "Mission paused.";
  const back = { label: "Return to mission", primary: true, run: () => render() };
  let title, copy, actions;
  if (name === "help") {
    title = "How to play";
    copy = "<p>You are the Asterion’s Signal Operator. Read or listen to each message, then make a choice.</p><p>The gold outline moves through every control. Press once when the control you want is highlighted. All choices repeat; waiting never loses the mission.</p><p>Full-screen mode: tap anywhere to select the highlighted control. Bottom-quarter mode: use the large pad at the bottom. External-switch mode: use a switch that sends Space or Enter. You can always tap a labeled control directly.</p><p>Settings lets you change input mode, scan speed, picture-choice time, narration, and text size using the same switch. Tab pauses scanning for ordinary keyboard navigation. Escape opens Help or returns to the mission.</p><p>Replay repeats the current message. Restart and Exit ask you to confirm. The mission pauses while these pages are open or the browser is hidden.</p>";
    actions = [back, { label: "Read help aloud", run: () => narrate($("#panelCopy").textContent, "ship") }, { label: "Settings", run: () => openPanel("settings") }];
  } else if (name === "settings") {
    title = "Your settings";
    copy = "<p>Select a setting to cycle through its options. Changes save automatically on this device. All input modes accept Space and Enter. Picture-choice time applies to each picture’s highlighted turn.</p>";
    actions = [
      back,
      { label: "Input: " + modeNames[settings.mode], run: () => cycle("mode") },
      { label: "Control scan: " + settings.scan / 1000 + " seconds", run: () => cycle("scan") },
      { label: "Picture choice: " + settings.choice / 1000 + " seconds", run: () => cycle("choice") },
      { label: "Narration: " + (settings.sound ? "on" : "off"), run: () => { settings.sound = !settings.sound; save(); openPanel("settings", scanIndex); } },
      { label: "Text: " + Math.round(settings.scale * 100) + "%", run: () => cycle("scale") },
      { label: "Reset settings", run: () => { settings = { ...DEFAULTS }; save(); openPanel("settings"); } }
    ];
  } else {
    const restart = name === "restart";
    title = restart ? "Restart First Shift?" : "Exit to SwitchMate?";
    copy = "<p>" + (restart ? "Start again at Welcome aboard. Your accessibility settings will stay saved." : "Return to the SwitchMate home page. Your mission progress will not be saved.") + "</p>";
    actions = [
      { label: "Keep playing", primary: true, run: () => render() },
      { label: restart ? "Yes, restart" : "Yes, exit", run: () => { stopNarration(); if (restart) { currentId = "welcome"; render(); } else location.assign("../../"); } }
    ];
  }
  $("#panelTitle").textContent = title;
  $("#panelCopy").innerHTML = copy;
  mount(actions, index);
}
function selected(target) {
  const direct = target?.closest?.("button[data-command]");
  return direct ? Number(direct.dataset.command) : scanIndex;
}
function activate(index, version = generation) {
  if (document.hidden || version !== generation || performance.now() - lastInput < 650) return;
  const command = commands[index];
  if (!command) return;
  lastInput = performance.now();
  command.run();
}
function surfaceAllowed(target) {
  return !!target.closest("button[data-command],#switchPad") || settings.mode === "full";
}
// One pointer stream handles touch, pen and mouse. Compatibility clicks are suppressed.
document.addEventListener("pointerdown", event => {
  if (!event.isPrimary || event.button !== 0 || !surfaceAllowed(event.target)) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, index: selected(event.target), version: generation };
});
document.addEventListener("pointermove", event => {
  if (pointer?.id === event.pointerId && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 15) pointer = null;
});
document.addEventListener("pointerup", event => {
  if (pointer?.id !== event.pointerId) return;
  const press = pointer;
  pointer = null;
  suppressClickUntil = performance.now() + 700;
  activate(press.index, press.version);
});
document.addEventListener("pointercancel", () => { pointer = null; });
document.addEventListener("click", event => {
  if (performance.now() < suppressClickUntil) { event.preventDefault(); return; }
  // Native / assistive-technology clicks have no pointer stream.
  if (event.target.closest("button[data-command],#switchPad")) activate(selected(event.target));
});
window.addEventListener("keydown", event => {
  if (event.key === "Tab") { manual = true; clearScan(); highlight(); return; }
  if (event.key === "Escape" && !event.repeat) { event.preventDefault(); if (panel) render(); else openPanel("help"); return; }
  if (!["Space", "Enter", "NumpadEnter"].includes(event.code)) return;
  event.preventDefault();
  if (event.repeat || keyHeld) return;
  keyHeld = { code: event.code, index: manual ? selected(document.activeElement) : scanIndex, version: generation };
});
window.addEventListener("keyup", event => {
  if (!["Space", "Enter", "NumpadEnter"].includes(event.code)) return;
  event.preventDefault();
  if (!keyHeld || keyHeld.code !== event.code) return;
  const press = keyHeld;
  keyHeld = null;
  suppressClickUntil = performance.now() + 700;
  activate(press.index, press.version);
});
window.addEventListener("blur", () => { keyHeld = null; pointer = null; clearScan(); stopNarration(); });
window.addEventListener("focus", () => { schedule(); });
document.addEventListener("visibilitychange", () => {
  keyHeld = null; pointer = null;
  if (document.hidden) { clearScan(); stopNarration(); }
  else { highlight(); schedule(); $("#audioStatus").textContent = "Select Replay to hear the current message."; }
});
window.addEventListener("pagehide", () => { clearScan(); stopNarration(); });
applySettings();
render({ speak: false });
