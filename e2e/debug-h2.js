// Debug: what does the dashboard h2 actually render in zh?
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

  const info = await page.evaluate(() => {
    const allH2 = Array.from(document.querySelectorAll('h2')).map((h) => h.textContent.trim());
    const pageHead = document.querySelector('.page-head');
    return {
      url: location.href,
      allH2,
      pageHeadHTML: pageHead ? pageHead.innerHTML.slice(0, 600) : null,
      lang: document.documentElement.lang,
      storedLang: localStorage.getItem('portico-lang'),
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Now force a fresh reload with explicit lang
  await page.evaluate(() => { localStorage.setItem('portico-lang', 'zh'); });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const info2 = await page.evaluate(() => {
    const allH2 = Array.from(document.querySelectorAll('h2')).map((h) => h.textContent.trim());
    return { allH2, lang: document.documentElement.lang };
  });
  console.log('after forced zh reload:', JSON.stringify(info2, null, 2));

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
