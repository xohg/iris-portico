// TRUE user reproduction:
//  1. login in the browser
//  2. wait 70s (access token TTL is 60s)
//  3. click through pages back and forth
//  4. capture every 401 + what the UI shows
'use strict';
const { chromium } = require('playwright-core');

const PAGES = ['/', '/webapps', '/permissions', '/security', '/tasks', '/system', '/logs', '/async', '/', '/webapps', '/tasks', '/permissions'];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const failed = [];
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push({ url: r.url().replace('http://localhost:80', ''), status: r.status(), t: new Date().toISOString().slice(11, 19) });
  });

  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }
  console.log('1. logged in at', new Date().toISOString().slice(11, 19));

  console.log('2. waiting 70s for the access token (TTL 60s) to expire...');
  await page.waitForTimeout(70000);

  console.log('3. clicking through pages...');
  for (const p of PAGES) {
    await page.goto('http://localhost:80' + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const ui = await page.evaluate(() => {
      const errs = Array.from(document.querySelectorAll('.error')).map((e) => e.textContent.trim());
      const h2 = document.querySelector('.page-head h2, .page h2');
      return { h2: h2 ? h2.textContent.trim() : null, errs };
    });
    console.log(`   ${p} -> ${ui.h2} errors=[${ui.errs.join(' | ')}]`);
  }

  console.log('=== 401s observed (with timestamps) ===');
  for (const f of failed) console.log(`   ${f.t}  ${f.status}  ${f.url}`);
  console.log('total failed responses:', failed.length);

  // final auth state
  const auth = await page.evaluate(() => localStorage.getItem('portico.auth'));
  const decoded = auth ? JSON.parse(auth) : null;
  if (decoded && decoded.accessToken) {
    const c = JSON.parse(Buffer.from(decoded.accessToken.split('.')[1], 'base64url').toString('utf8'));
    console.log('stored access token exp:', c.exp, '(now ~', Math.floor(Date.now() / 1000), ')');
  }
  console.log('stored keys:', decoded ? Object.keys(decoded).join(', ') : 'null');

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
