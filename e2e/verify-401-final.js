// Final verification of the 401 fix (two scenarios):
//  A. access token expires (70 s) -> auto-refresh recovers -> 0 UI errors
//  B. session fully dead (IRIS restart invalidates tokens) -> reload -> redirect to /login
'use strict';
const { chromium } = require('playwright-core');
const { execSync } = require('child_process');

const PAGES = ['/', '/webapps', '/permissions', '/security', '/tasks', '/system', '/logs', '/async'];

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, ms);

function waitApiReady(timeoutMs = 180000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try {
      const code = execSync('docker exec iris-portico curl -s -o /dev/null -w "%{http_code}" http://localhost:80/', { encoding: 'utf8' }).trim();
      if (code === '200') return true;
    } catch { /* not ready yet */ }
    sleepSync(3000);
  }
  return false;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ---------- Scenario A: login, wait 70s, click through -> auto-refresh recovers ----------
  console.log('=== Scenario A: access token expires -> auto-refresh recovers ===');
  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }
  console.log('  logged in at', new Date().toISOString().slice(11, 19));
  console.log('  waiting 70s for the access token (TTL 60s) to expire...');
  await page.waitForTimeout(70000);

  let aErrors = 0, a401s = 0;
  page.on('response', (r) => { if (r.status() === 401) a401s++; });
  for (const p of PAGES) {
    await page.goto('http://localhost:80' + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const errs = await page.evaluate(() => document.querySelectorAll('.error').length);
    aErrors += errs;
  }
  console.log(`  A: ${PAGES.length} pages, UI errors=${aErrors}, raw 401s=${a401s}`);
  console.log(aErrors === 0 ? '  A PASS (auto-refresh recovered, no UI errors)' : '  A FAIL');

  // ---------- Scenario B: kill the session (IRIS restart), reload -> redirect to /login ----------
  console.log('\n=== Scenario B: session fully dead (IRIS restart) -> reload -> /login ===');
  console.log('  restarting IRIS (invalidates all issued tokens)...');
  try { execSync('docker exec iris-portico iris restart IRIS', { stdio: 'ignore', timeout: 120000 }); } catch { /* may take a while */ }
  const ready = waitApiReady(180000);
  console.log('  API ready:', ready);
  if (!ready) { console.log('  B SKIP (API did not come back)'); await browser.close(); process.exit(1); }

  // Reload the page: the app restores the now-DEAD tokens from localStorage.
  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  const url = page.url();
  const onLogin = url.includes('/login');
  const bErrors = await page.evaluate(() => document.querySelectorAll('.error').length).catch(() => -1);
  console.log(`  B: after reload url=${url}`);
  console.log(onLogin ? '  B PASS (dead session -> redirected to /login)' : `  B FAIL (stranded, errors=${bErrors})`);

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
