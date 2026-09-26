// Verify the Sentinel -> Portico rename end-to-end:
// login prefill, branding (tab title + shell brand), page loads, no JS errors.
'use strict';
const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // 1. Login page: prefill + title
  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  const login = await page.evaluate(() => ({
    tabTitle: document.title,
    prefillUser: (document.querySelector('input[name="user"]') || {}).value,
    h1: (document.querySelector('h1') || {}).innerText,
  }));
  console.log('=== 1. login page ===');
  console.log(JSON.stringify(login));
  const loginOk = login.prefillUser === 'Portico' && /IRIS Portico/.test(login.tabTitle);
  console.log('prefill=Portico & title has "IRIS Portico":', loginOk ? 'OK' : 'FAIL');

  // 2. Log in
  await page.fill('input[name="user"]', 'Portico');
  await page.fill('input[name="password"]', 'Portico123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  const after = await page.evaluate(() => ({
    url: location.pathname,
    tabTitle: document.title,
    brand: (document.querySelector('.brand, .sidebar .brand, h1') || {}).innerText,
    navCount: document.querySelectorAll('.sidebar nav a, .topnav a').length,
  }));
  console.log('=== 2. after login (dashboard) ===');
  console.log(JSON.stringify(after));
  const brandOk = /IRIS Portico/.test(after.tabTitle) && after.navCount >= 14;
  console.log('brand "IRIS Portico" & >=14 nav items:', brandOk ? 'OK' : 'FAIL');

  // 3. Walk a few pages — no error card
  const pages = [['/webapps', 'Web'], ['/security', 'Security'], ['/tasks', 'Tasks'], ['/namespaces', '命名空间']];
  let allOk = true;
  for (const [path, tag] of pages) {
    await page.goto('http://localhost:80' + path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const err = [...document.querySelectorAll('.card p.error, p.error')].map((e) => e.innerText).filter(Boolean);
      return { url: location.pathname, errorCards: err, bodyLen: document.body.innerText.length };
    });
    const ok = r.errorCards.length === 0;
    allOk = allOk && ok;
    console.log(`=== 3. ${path} (${tag}) === ${ok ? 'OK' : 'FAIL'}`, JSON.stringify(r.errorCards));
  }
  console.log('all pages error-free:', allOk ? 'OK' : 'FAIL');

  // 4. JS errors
  console.log('=== 4. JS errors captured:', errors.length ? errors.length : 'none');
  if (errors.length) console.log(errors.slice(0, 10).join('\n'));

  await browser.close();
  const pass = loginOk && brandOk && allOk && errors.length === 0;
  console.log('\n=== RESULT:', pass ? 'PASS' : 'FAIL', '===');
  process.exit(pass ? 0 : 1);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
