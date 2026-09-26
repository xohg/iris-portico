// Decisive: does the language toggle update BOTH shell nav and dashboard h2?
'use strict';
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }

  const snap = () => page.evaluate(() => ({
    lang: document.documentElement.lang,
    navFirst: document.querySelector('.sidebar nav a')?.textContent.trim(),
    h2: document.querySelector('.page-head h2')?.textContent.trim(),
    refreshBtn: document.querySelector('.page-head button')?.textContent.trim(),
  }));

  console.log('initial:', JSON.stringify(await snap(), null, 2));

  // Click the lang toggle (title depends on current lang)
  const title = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.topbar button'));
    const b = btns.find((x) => x.title === 'Switch to Chinese' || x.title === 'Switch to English');
    return b ? b.title : null;
  });
  console.log('toggle button title:', title);
  await page.click('.topbar button[title*="Switch to"]');
  await page.waitForTimeout(800);
  console.log('after toggle:', JSON.stringify(await snap(), null, 2));

  // Toggle back
  await page.click('.topbar button[title*="Switch to"]');
  await page.waitForTimeout(800);
  console.log('after toggle back:', JSON.stringify(await snap(), null, 2));

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
