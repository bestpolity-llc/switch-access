// Run: npm install --prefix work/rift-tests playwright@1.51.1
//      node tests/rift-signal.mjs
import { chromium } from "../work/rift-tests/node_modules/playwright/index.mjs";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const root = process.cwd();
const server = createServer(async (req, res) => {
  try {
    let file = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (file.endsWith("/")) file += "index.html";
    const full = path.resolve(root, "." + file);
    if (!full.startsWith(root + path.sep)) throw Error("outside root");
    const data = await readFile(full);
    res.setHeader("Content-Type", ({".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml"})[path.extname(file)] || "application/octet-stream");
    res.end(data);
  } catch { res.writeHead(404); res.end("Not found"); }
});
await new Promise(resolve => server.listen(8765, "127.0.0.1", resolve));
const browser = await chromium.launch();
await mkdir("work/rift-results", { recursive: true });
let count = 0;
const url = "http://127.0.0.1:8765/games/rift-signal/";
const settingsKey = "switchmate.rift-signal.settings.v1";
async function session(viewport, settings = {}, speech = "missing") {
  const context = await browser.newContext({ viewport, hasTouch: viewport.width < 700 });
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", error => failures.push(error.message));
  page.on("response", response => { if (response.status() >= 400) failures.push(response.url()); });
  await page.route("**/*", route => route.request().url().startsWith("http://127.0.0.1:8765/") ? route.continue() : route.abort());
  await page.addInitScript(({ settings, settingsKey, speech }) => {
    localStorage.setItem(settingsKey, JSON.stringify({ mode:"external", scan:3000, choice:8000, sound:false, scale:1, ...settings }));
    if (speech === "missing") Object.defineProperty(window, "speechSynthesis", { value: undefined });
    else {
      window.spoken = [];
      Object.defineProperty(window, "speechSynthesis", { value: {
        cancel() {}, getVoices() { return []; },
        speak(utterance) { window.spoken.push(utterance.text); if (speech === "error") utterance.onerror?.(); else { utterance.onstart?.(); utterance.onend?.(); } }
      } });
    }
  }, { settings, settingsKey, speech });
  await page.clock.install();
  await page.goto(url);
  await page.waitForSelector("#controls button");
  return { page, context, failures };
}
async function click(page, label) {
  await page.clock.fastForward(700);
  await page.getByRole("button", { name: label, exact: true }).click();
}
async function expectTitle(page, title) { assert.equal(await page.locator("#sceneTitle").textContent(), title); }
async function layout(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
  const buttons = await page.locator("#controls button").first().boundingBox();
  assert.ok(buttons && buttons.width > 0);
}
async function completePath(page, branch) {
  for (const action of ["BEGIN FIRST SHIFT", "CONTINUE", "CONTINUE", "OPEN CHANNEL", "ACCEPT REQUEST", "CONTINUE", "START CHOICE"]) await click(page, action);
  await expectTitle(page, "Blue planet");
  if (branch === "stars") {
    await page.clock.fastForward(8000);
    await expectTitle(page, "Star field");
  }
  await page.clock.fastForward(700);
  await page.keyboard.press("Space");
  await expectTitle(page, branch === "planet" ? "Planet view" : "Star view");
  for (const action of ["CONTINUE","CAPTURE PICTURE","CONNECT","CONTINUE","RETURN TO CREW","END SHIFT","CONTINUE"]) await click(page, action);
  await expectTitle(page, "First Shift complete");
}
try {
  // Validate the untouched mission graph, including every alternate and end edge.
  const source = await readFile("games/rift-signal/mission.js", "utf8");
  const { SCENES, SCENE_MAP } = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
  assert.equal(SCENES.length, 22);
  assert.equal(new Set(SCENES.map(s => s.id)).size, 22);
  for (const scene of SCENES) for (const key of ["next","choose","alternate"]) if (scene[key]) assert.ok(SCENE_MAP[scene[key]]);
  count++;
  for (const viewport of [{ width:1440, height:900 }, { width:390, height:844 }]) {
    for (const branch of ["planet","stars"]) {
      const { page, context, failures } = await session(viewport);
      await layout(page);
      assert.equal(await page.locator("#sceneImage").evaluate(img => img.complete && img.naturalWidth > 0), true);
      await completePath(page, branch);
      await layout(page);
      await page.screenshot({ path: "work/rift-results/" + viewport.width + "-" + branch + "-complete.png", fullPage:true });
      await click(page, "Restart");
      assert.equal(await page.locator("#panelTitle").textContent(), "Restart First Shift?");
      await click(page, "Keep playing");
      await expectTitle(page, "First Shift complete");
      await click(page, "Restart");
      await click(page, "Yes, restart");
      await expectTitle(page, "Welcome aboard");
      assert.deepEqual(failures, []);
      await context.close(); count++;
    }
    for (const mode of ["full","bottom","external"]) {
      const { page, context, failures } = await session(viewport, { mode });
      // Duplicate clicks and held keys cannot skip scenes.
      await page.keyboard.down("Space");
      await page.keyboard.down("Space");
      await page.clock.fastForward(6000);
      await expectTitle(page, "Welcome aboard");
      await page.keyboard.up("Space");
      await expectTitle(page, "Captain Marcus Vale");
      await page.keyboard.press("Enter");
      await expectTitle(page, "Captain Marcus Vale");
      await page.clock.fastForward(700);
      if (mode === "external") await page.keyboard.press("Enter");
      else if (mode === "bottom") await page.locator("#switchPad").click();
      else await page.locator(".brand").click();
      await expectTitle(page, "Meet your mentor");
      await page.locator("#controls button").first().dispatchEvent("click");
      await expectTitle(page, "Meet your mentor");
      // Scan reaches every utility using a single key.
      await page.clock.fastForward(3000);
      assert.equal(await page.locator(".scan-focus").textContent(), "Help");
      await page.keyboard.press("Space");
      assert.equal(await page.locator("#panelTitle").textContent(), "How to play");
      await page.clock.fastForward(6000); // fastForward fires one interval; use two explicit steps below.
      await page.clock.fastForward(3000);
      assert.equal(await page.locator(".scan-focus").textContent(), "Settings");
      await page.keyboard.press("Space");
      assert.equal(await page.locator("#panelTitle").textContent(), "Your settings");
      await page.clock.fastForward(3000);
      await page.keyboard.press("Space");
      const changed = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).mode, settingsKey);
      assert.notEqual(changed, mode);
      await click(page, "Picture choice: 8 seconds");
      assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).choice, settingsKey), 12000);
      await click(page, "Text: 100%");
      await click(page, "Text: 120%");
      await layout(page);
      await page.screenshot({ path:"work/rift-results/" + viewport.width + "-" + mode + "-settings.png", fullPage:true });
      await click(page, "Return to mission");
      await expectTitle(page, "Meet your mentor");
      await click(page, "Exit");
      await click(page, "Keep playing");
      await expectTitle(page, "Meet your mentor");
      await click(page, "Exit");
      assert.deepEqual(failures, []);
      await click(page, "Yes, exit");
      await page.waitForURL("http://127.0.0.1:8765/");
      await context.close(); count++;
    }
  }
  // A reload without init-script writes verifies settings persistence and corrupt-storage recovery.
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.clock.install(); await page.goto(url);
    await click(page, "Settings"); await click(page, "Input: Full-screen");
    await page.reload();
    assert.equal(await page.locator("body").getAttribute("data-mode"), "bottom");
    await page.evaluate(key => localStorage.setItem(key, "{broken"), settingsKey);
    await page.reload();
    assert.equal(await page.locator("body").getAttribute("data-mode"), "full");
    await context.close(); count++;
  }
  // Narration fallback, synchronous error, stale callbacks and no speech support.
  for (const speech of ["missing","error","working"]) {
    const { page, context } = await session({width:390,height:844}, {sound:true}, speech);
    await click(page, "Replay");
    const status = await page.locator("#audioStatus").textContent();
    assert.match(status, speech === "missing" ? /unavailable/ : speech === "error" ? /did not play/ : /Message complete/);
    await click(page, "BEGIN FIRST SHIFT");
    await expectTitle(page, "Captain Marcus Vale");
    await context.close(); count++;
  }
  // Storage denial, Tab navigation, touch outside bottom zone, timed-choice panel pause.
  {
    const { page, context } = await session({width:390,height:844}, {mode:"bottom"});
    await page.locator(".brand").tap(); await expectTitle(page, "Welcome aboard");
    await page.keyboard.press("Tab");
    await page.clock.fastForward(20000);
    assert.equal(await page.locator(".scan-focus").count(), 0);
    await page.getByRole("button", {name:"Settings",exact:true}).focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#panelTitle").textContent(), "Your settings");
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw Error("denied"); }; });
    await click(page, "Control scan: 3 seconds");
    assert.match(await page.locator("#saveStatus").textContent(), /Storage is unavailable/);
    await click(page, "Return to mission");
    for (const action of ["BEGIN FIRST SHIFT","CONTINUE","CONTINUE","OPEN CHANNEL","ACCEPT REQUEST","CONTINUE","START CHOICE"]) await click(page, action);
    await click(page, "Settings");
    await page.clock.fastForward(60000);
    await expectTitle(page, "Blue planet");
    await click(page, "Return to mission");
    await expectTitle(page, "Blue planet");
    await context.close(); count++;
  }
  console.log("PASS: " + count + " mission, viewport/input, settings and narration scenarios.");
} finally { await browser.close(); server.close(); }
