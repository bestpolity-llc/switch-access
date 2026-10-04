import {chromium} from '../work/rift-tests/node_modules/playwright/index.mjs';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = 'https://switch.bestpolity.com';
const browser = await chromium.launch();
try {
  for (const pref of [null, '0', '1']) {
    const context = await browser.newContext();
    const requests = [], errors = [];
    await context.route('**/*', async route => {
      const url = new URL(route.request().url()); requests.push(url.href);
      if (url.origin !== origin) return route.fulfill({body: ''});
      const file = new URL('..' + url.pathname, import.meta.url);
      try { await route.fulfill({body: await readFile(file), contentType: url.pathname.endsWith('.js') ? 'text/javascript' : url.pathname.endsWith('.css') ? 'text/css' : 'text/html'}); }
      catch { await route.fulfill({status: 404, body: ''}); }
    });
    await context.addInitScript(pref => { if (pref !== null) localStorage.setItem('switchaac_analytics', pref); }, pref);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/games/solitaire.html?app=1');
    await page.waitForSelector('#sa-toolbar');
    await page.keyboard.press('Space');
    await page.locator('#sa-toolbar').getByRole('button', {name: 'Switch settings', exact: true}).click();
    assert(await page.locator('#sa-dialog').isVisible());
    assert.equal(await page.getByRole('button', {name: 'SwitchMate Home', exact: true}).count(), 0);
    await page.reload(); // Preferences and reload never enable standalone reporting.
    await page.waitForSelector('#sa-toolbar');
    assert.deepEqual(await page.evaluate(() => [typeof firebase, typeof SwitchMateAnalytics, typeof dataLayer]), ['undefined', 'undefined', 'undefined']);
    assert(!requests.some(url => /firebase|switchmate-tracker|googletagmanager|google-analytics/.test(url)), requests.join('\n'));
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('PASS: real app page makes no service requests and retains switch controls.');
} finally { await browser.close(); }
