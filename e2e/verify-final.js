// Final verification: 3 new pages (namespaces/license/wqm) + shell UI work
// (icon unification, collapse, top/side layout toggle).
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

  // 1. Log in
  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(800);
  await page.fill('input[name="user"]', 'Portico');
  await page.fill('input[name="password"]', 'Portico123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const shell = await page.evaluate(() => ({
    url: location.pathname,
    hasSidebar: !!document.querySelector('.sidebar'),
    navCount: document.querySelectorAll('.sidebar nav a').length,
    navLabels: [...document.querySelectorAll('.sidebar nav a')].map((a) => a.innerText.trim().replace(/\s+/g, ' ')),
  }));
  console.log('=== 1. shell after login ===');
  console.log(JSON.stringify(shell, null, 2));

  // 2. Walk the 3 NEW pages — title + no error card + content present
  const newPages = [
    ['/namespaces', '命名空间'],
    ['/license', '许可证'],
    ['/wqm', 'WQM'],
  ];
  for (const [path, expectTitle] of newPages) {
    await page.goto('http://localhost:80' + path, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const h2 = document.querySelector('.page-head h2, .content h2');
      const errCard = [...document.querySelectorAll('.card p.error')].map((e) => e.innerText).filter(Boolean);
      return {
        url: location.pathname,
        title: h2 ? h2.innerText.trim() : '',
        hasSidebar: !!document.querySelector('.sidebar'),
        errorCards: errCard,
        bodyLen: document.body.innerText.length,
      };
    });
    const ok = r.title.includes(expectTitle) && r.errorCards.length === 0;
    console.log(`=== 2. ${path} (expect "${expectTitle}") === ${ok ? 'OK' : 'FAIL'}`);
    console.log(JSON.stringify(r));
  }

  // 3. Shell UI work — collapse toggle (side layout)
  await page.goto('http://localhost:80/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1200);
  const before = await page.evaluate(() => ({
    shellClass: document.querySelector('.shell').className,
    navLabelVisible: !!document.querySelector('.sidebar nav a span.icon + *') ||
      [...document.querySelectorAll('.sidebar nav a')].some((a) => a.innerText.trim().length > 2),
  }));
  await page.click('.topbar-left button'); // first toggle button = collapse
  await page.waitForTimeout(600);
  const afterCollapse = await page.evaluate(() => ({
    shellClass: document.querySelector('.shell').className,
    sidebarWidth: document.querySelector('.sidebar') ? document.querySelector('.sidebar').getBoundingClientRect().width : -1,
  }));
  console.log('=== 3. collapse toggle ===');
  console.log('before:', JSON.stringify(before));
  console.log('after :', JSON.stringify(afterCollapse));

  // 4. Layout toggle (side -> top)
  await page.click('.topbar-left button'); // expand back
  await page.waitForTimeout(400);
  await page.click('.topbar-left button:nth-child(2)'); // second toggle button = layout
  await page.waitForTimeout(800);
  const afterLayout = await page.evaluate(() => ({
    shellClass: document.querySelector('.shell').className,
    hasSidebar: !!document.querySelector('.sidebar'),
    hasTopNav: !!document.querySelector('.topnav'),
    topNavCount: document.querySelectorAll('.topnav a').length,
  }));
  console.log('=== 4. layout toggle (side -> top) ===');
  console.log(JSON.stringify(afterLayout));

  // 5. Toggle back to side
  await page.click('.topbar-left button:nth-child(2)');
  await page.waitForTimeout(600);
  const backSide = await page.evaluate(() => ({
    shellClass: document.querySelector('.shell').className,
    hasSidebar: !!document.querySelector('.sidebar'),
    hasTopNav: !!document.querySelector('.topnav'),
  }));
  console.log('=== 5. layout toggle (top -> side) ===');
  console.log(JSON.stringify(backSide));

  // 6. localStorage persistence
  const ls = await page.evaluate(() => localStorage.getItem('portico.layout'));
  console.log('=== 6. localStorage portico.layout ===', ls);

  console.log('=== JS errors captured ===', errors.length ? JSON.stringify(errors, null, 2) : 'none');

  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
