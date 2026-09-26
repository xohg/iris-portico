// Phase 3 verification: theme toggle flips tokens; persists across reload.
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

  const snapshot = () => page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      dataTheme: document.documentElement.dataset.theme,
      bg: cs.getPropertyValue('--bg').trim(),
      text: cs.getPropertyValue('--text').trim(),
      accent: cs.getPropertyValue('--accent').trim(),
      bodyBg: getComputedStyle(document.body).backgroundColor,
    };
  });

  console.log('=== initial ===');
  console.log(JSON.stringify(await snapshot(), null, 2));

  // Toggle to light
  await page.click('.topbar button[title*="theme"]');
  await page.waitForTimeout(400);
  console.log('=== after toggle (expect light) ===');
  console.log(JSON.stringify(await snapshot(), null, 2));

  // Reload — must persist
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('=== after reload (expect still light) ===');
  console.log(JSON.stringify(await snapshot(), null, 2));

  // Toggle back to dark + reload
  await page.click('.topbar button[title*="theme"]');
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('=== back to dark + reload ===');
  console.log(JSON.stringify(await snapshot(), null, 2));

  // Light theme on a data page (tables, badges readable)
  await page.evaluate(() => { localStorage.setItem('portico-theme', 'light'); });
  await page.goto('http://localhost:80/system', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const sys = await page.evaluate(() => ({
    dataTheme: document.documentElement.dataset.theme,
    rows: document.querySelectorAll('table tbody tr').length,
    badges: document.querySelectorAll('.badge').length,
  }));
  console.log('=== /system in light ===');
  console.log(JSON.stringify(sys, null, 2));

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
