// Phase 2 verification: unauthenticated = clean login (no sidebar);
// authenticated = full shell; logout = back to clean login.
'use strict';
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // 1. Unauthenticated: / should redirect to /login with NO sidebar
  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const unauth = await page.evaluate(() => ({
    url: location.pathname,
    hasSidebar: !!document.querySelector('.sidebar'),
    hasNavLinks: document.querySelectorAll('.sidebar nav a').length,
    hasLoginCard: !!document.querySelector('.login-card'),
    bodyText: document.body.innerText.slice(0, 200),
  }));
  console.log('=== 1. unauthenticated ===');
  console.log(JSON.stringify(unauth, null, 2));

  // 2. Log in
  await page.fill('input[name="user"]', 'Portico');
  await page.fill('input[name="password"]', 'Portico123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  const authed = await page.evaluate(() => ({
    url: location.pathname,
    hasSidebar: !!document.querySelector('.sidebar'),
    navLinks: [...document.querySelectorAll('.sidebar nav a')].map((a) => a.innerText.trim()),
  }));
  console.log('=== 2. after login ===');
  console.log(JSON.stringify(authed, null, 2));

  // 3. Walk all pages — shell must persist
  const pages = ['/webapps', '/permissions', '/security', '/tasks', '/system', '/logs', '/async'];
  for (const p of pages) {
    await page.goto('http://localhost:80' + p, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => ({
      url: location.pathname,
      hasSidebar: !!document.querySelector('.sidebar'),
      content: !!document.querySelector('.content'),
    }));
    console.log(`=== 3. ${p} ===`, JSON.stringify(r));
  }

  // 4. Direct access to a protected page while logged out (fresh context)
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await ctx2.newPage();
  await page2.goto('http://localhost:80/tasks', { waitUntil: 'networkidle', timeout: 30000 });
  await page2.waitForTimeout(1000);
  const direct = await page2.evaluate(() => ({
    url: location.pathname,
    hasSidebar: !!document.querySelector('.sidebar'),
    hasLoginCard: !!document.querySelector('.login-card'),
  }));
  console.log('=== 4. direct /tasks while logged out ===');
  console.log(JSON.stringify(direct, null, 2));

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
