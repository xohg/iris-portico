// Isolate: from Node, send the browser's Bearer token WITH the browser's full
// header set (UA + sec-ch-ua* + referer + accept). If Enabled flips to false,
// the headers are the cause. If it stays true, it's transport-level.
'use strict';
const { chromium } = require('playwright-core');
const BASE = 'http://localhost:80/api/admin';

async function listApps(authHeader, extraHeaders) {
  const res = await fetch(BASE + '/v2/web-apps', { headers: { Authorization: authHeader, Accept: 'application/json', ...extraHeaders } });
  let d; try { d = JSON.parse(await res.text()); } catch { d = await res.text(); }
  if (d && typeof d === 'object' && 'result' in d) d = d.result;
  const arr = Array.isArray(d) ? d : [];
  return { status: res.status, first3: arr.slice(0, 3).map((a) => `${a.Name}=${a.Enabled}`) };
}

(async () => {
  // Capture the browser's real Bearer token + its exact headers
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  let captured = null;
  page.on('request', (req) => {
    if (req.url().includes('/v2/web-apps')) captured = { auth: req.headers()['authorization'], headers: req.headers() };
  });
  await page.goto('http://localhost:80/webapps', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);
  if (page.url().includes('/login')) {
    await page.fill('input[name="user"]', 'Portico');
    await page.fill('input[name="password"]', 'Portico123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
  }
  await page.waitForTimeout(1500);
  await browser.close();

  if (!captured) { console.log('no request captured'); process.exit(1); }
  const browserHeaders = captured.headers;
  console.log('browser headers:', JSON.stringify(browserHeaders, null, 2));

  const auth = browserHeaders['authorization'];

  // A. Node + browser-auth, minimal headers
  console.log('\nA. Node + browser-auth (minimal): ', JSON.stringify(await listApps(auth, {})));
  // B. Node + browser-auth, full browser headers
  const full = { ...browserHeaders };
  delete full['authorization']; // we pass auth separately
  console.log('B. Node + browser-auth (full hdrs): ', JSON.stringify(await listApps(auth, full)));
  // C. Node + browser-auth, only sec-ch-ua*
  const secOnly = {
    'sec-ch-ua': browserHeaders['sec-ch-ua'],
    'sec-ch-ua-mobile': browserHeaders['sec-ch-ua-mobile'],
    'sec-ch-ua-platform': browserHeaders['sec-ch-ua-platform'],
  };
  console.log('C. Node + browser-auth (sec-ch-ua*): ', JSON.stringify(await listApps(auth, secOnly)));
  // D. Node + browser-auth, only user-agent
  console.log('D. Node + browser-auth (UA only): ', JSON.stringify(await listApps(auth, { 'user-agent': browserHeaders['user-agent'] })));
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
