// FINAL: take the browser's actual JWT and send it from Node (unpatched fetch).
// If Node + browser-JWT => Enabled=false, the TOKEN/session is the cause.
// If Node + browser-JWT => Enabled=true, the client is mutating the response.
'use strict';
const { chromium } = require('playwright-core');
const BASE = 'http://localhost:80/api/admin';
const BASIC = 'Basic ' + Buffer.from('Portico:Portico123').toString('base64');

async function listApps(authHeader) {
  const res = await fetch(BASE + '/v2/web-apps', { headers: { Authorization: authHeader, Accept: 'application/json' } });
  let d; try { d = JSON.parse(await res.text()); } catch { d = await res.text(); }
  if (d && typeof d === 'object' && 'result' in d) d = d.result;
  const arr = Array.isArray(d) ? d : [];
  return { status: res.status, count: arr.length, first3: arr.slice(0, 3).map((a) => `${a.Name}=${a.Enabled}`) };
}

(async () => {
  // 1. Launch browser, log in, capture the JWT the app actually uses
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  let browserJwt = null;
  page.on('request', (req) => {
    if (req.url().includes('/v2/web-apps')) {
      const a = req.headers()['authorization'];
      if (a && a.startsWith('Bearer ')) browserJwt = a.slice(7);
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
  await page.waitForTimeout(1500);
  await browser.close();

  if (!browserJwt) { console.log('No browser JWT captured'); process.exit(1); }
  // Decode the JWT payload
  const payload = JSON.parse(Buffer.from(browserJwt.split('.')[1], 'base64url').toString());
  console.log('=== browser JWT payload ===');
  console.log(JSON.stringify(payload, null, 2));

  // 2. Send the browser's exact JWT from Node
  const withBrowserJwt = await listApps('Bearer ' + browserJwt);
  console.log('\n=== Node + browser-JWT ===');
  console.log(JSON.stringify(withBrowserJwt, null, 2));

  // 3. Control: Node + Basic
  const withBasic = await listApps(BASIC);
  console.log('=== Node + Basic ===');
  console.log(JSON.stringify(withBasic, null, 2));

  // 4. Fresh Node-issued JWT
  const loginRes = await fetch(BASE + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user: 'Portico', password: 'Portico123' }) });
  const ld = await loginRes.json();
  const freshTok = (ld && 'result' in ld ? ld.result : ld).access_token;
  const freshPayload = JSON.parse(Buffer.from(freshTok.split('.')[1], 'base64url').toString());
  console.log('\n=== fresh Node JWT payload ===');
  console.log(JSON.stringify(freshPayload, null, 2));
  const withFreshJwt = await listApps('Bearer ' + freshTok);
  console.log('=== Node + fresh-JWT ===');
  console.log(JSON.stringify(withFreshJwt, null, 2));

  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
