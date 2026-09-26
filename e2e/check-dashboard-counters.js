// Confirm dashboard counters accumulate after restart (timing, not a bug).
// Load dashboard now (minutes after restart) and read the stat values.
'use strict';
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:80/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3500);
  }
  await page.waitForTimeout(2000);
  const stats = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.stat').forEach((s) => {
      const v = s.querySelector('.value');
      const l = s.querySelector('.label');
      out.push(`${l ? l.innerText.trim() : '?'}=${v ? v.innerText.trim() : '?'}`);
    });
    return out;
  });
  console.log('=== dashboard stats (minutes after restart) ===');
  console.log(stats.join('  |  '));
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
