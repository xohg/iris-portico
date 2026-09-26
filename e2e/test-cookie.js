// Test: does a session cookie (from /login) change /v2/web-apps Enabled?
'use strict';
const BASE = 'http://localhost:80/api/admin';
const BASIC = 'Basic ' + Buffer.from('Portico:Portico123').toString('base64');

async function listApps(headers) {
  const res = await fetch(BASE + '/v2/web-apps', { headers: { Authorization: BASIC, Accept: 'application/json', ...headers } });
  let d; try { d = JSON.parse(await res.text()); } catch { d = await res.text(); }
  if (d && typeof d === 'object' && 'result' in d) d = d.result;
  const arr = Array.isArray(d) ? d : [];
  return { status: res.status, first3: arr.slice(0, 3).map((a) => `${a.Name}=${a.Enabled}`) };
}

(async () => {
  // 1. Login, capture Set-Cookie
  const loginRes = await fetch(BASE + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'Portico', password: 'Portico123' }),
  });
  const setCookie = loginRes.headers.get('set-cookie');
  console.log('Set-Cookie from /login:', setCookie);
  const cookie = setCookie ? setCookie.split(';')[0] : null;

  // 2. Control: Basic only
  console.log('\nBasic only:        ', JSON.stringify(await listApps({})));
  // 3. With the session cookie
  console.log('Basic + cookie:    ', JSON.stringify(await listApps({ Cookie: cookie })));
  // 4. Cookie only (no Basic) — does the server accept cookie auth?
  const cookieOnly = await fetch(BASE + '/v2/web-apps', { headers: { Accept: 'application/json', Cookie: cookie } });
  let cd; try { cd = JSON.parse(await cookieOnly.text()); } catch { cd = await cookieOnly.text(); }
  if (cd && typeof cd === 'object' && 'result' in cd) cd = cd.result;
  const cArr = Array.isArray(cd) ? cd : [];
  console.log('Cookie only:       ', cookieOnly.status, cArr.length ? cArr.slice(0, 3).map((a) => `${a.Name}=${a.Enabled}`).join('  ') : JSON.stringify(cd));
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
