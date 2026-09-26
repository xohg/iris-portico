// In-browser: raw window.fetch of /api/admin/v2/web-apps vs what the component got.
// Determines if the discrepancy is browser HTTP caching or client-side mutation.
'use strict';
const { chromium } = require('playwright-core');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EDGE, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:80/webapps', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }
  // Wait for the component to have loaded (DIAG already ran on first load)
  await page.waitForTimeout(2000);

  // Raw in-browser fetch (same origin, same as the client)
  const raw = await page.evaluate(async () => {
    const auth = window.__DSH_TEST_AUTH || 'Basic ' + btoa(unescape(encodeURIComponent('Portico:Portico123')));
    const res = await fetch('/api/admin/v2/web-apps', { headers: { Authorization: auth, Accept: 'application/json' } });
    const cc = res.headers.get('cache-control');
    const etag = res.headers.get('etag');
    const d = await res.json();
    const arr = d && 'result' in d ? d.result : d;
    return {
      status: res.status,
      cacheControl: cc,
      etag,
      count: Array.isArray(arr) ? arr.length : 'n/a',
      first3: Array.isArray(arr) ? arr.slice(0, 3).map((a) => `${a.Name}=${a.Enabled}`) : arr,
    };
  });
  console.log('=== raw in-browser window.fetch ===');
  console.log(JSON.stringify(raw, null, 2));

  // Now the component's rendered badge
  const first = await page.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    const badge = tr ? tr.querySelector('.badge') : null;
    return badge ? { text: badge.innerText, cls: badge.className } : null;
  });
  console.log('=== component rendered badge ===');
  console.log(JSON.stringify(first));
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
