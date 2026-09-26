// DECISIVE: is the app patching window.fetch to mutate the RESPONSE?
// Capture the wire bytes (Playwright response.body()) vs the client-side
// res.text() for the SAME /v2/web-apps request. If they differ, the app
// is mutating the response in the browser.
'use strict';
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Capture wire bytes of every /v2/web-apps response
  const wireBodies = [];
  page.on('response', async (res) => {
    if (res.url().includes('/v2/web-apps')) {
      try { wireBodies.push({ url: res.url(), status: res.status(), body: await res.body() }); } catch (e) { wireBodies.push({ err: String(e) }); }
    }
  });

  await page.goto('http://localhost:80/webapps', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
  }
  await page.waitForTimeout(2000);

  // Now make a fresh client-side fetch and get its res.text()
  const clientSide = await page.evaluate(async () => {
    const auth = 'Basic ' + btoa(unescape(encodeURIComponent('Portico:Portico123')));
    const res = await fetch('/api/admin/v2/web-apps', { headers: { Authorization: auth, Accept: 'application/json' } });
    const text = await res.text();
    // Also report whether window.fetch has been wrapped (heuristic)
    const fetchSrc = window.fetch.toString().slice(0, 200);
    return { status: res.status, text, fetchSrc, len: text.length };
  });

  await page.waitForTimeout(1000); // let the wire capture settle

  console.log('=== window.fetch source (first 200 chars) ===');
  console.log(clientSide.fetchSrc);
  console.log('\n=== client-side res.text() ===');
  console.log('status:', clientSide.status, ' len:', clientSide.len);
  console.log('first 300:', clientSide.text.slice(0, 300));

  console.log('\n=== wire bodies captured (Playwright) ===');
  wireBodies.forEach((w, i) => {
    if (w.body) {
      const s = w.body.toString();
      console.log(`[${i}] ${w.status} len=${s.length}`);
      console.log('   first 300:', s.slice(0, 300));
      // Compare with client-side
      const same = s === clientSide.text;
      console.log(`   === client-side text? ${same ? 'YES (no mutation)' : 'NO (MUTATED by app!)'}`);
    } else {
      console.log(`[${i}] capture error: ${w.err}`);
    }
  });
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
