// Compare /v2/web-apps under Basic vs JWT(Bearer) auth to find why Enabled differs.
'use strict';
const BASE = 'http://localhost:80/api/admin';
const BASIC = 'Basic ' + Buffer.from('Portico:Portico123').toString('base64');

async function login() {
  const res = await fetch(BASE + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: 'Portico', password: 'Portico123' }),
  });
  const d = await res.json();
  const p = d && 'result' in d ? d.result : d;
  return p;
}

async function listApps(authHeader) {
  const res = await fetch(BASE + '/v2/web-apps', { headers: { Authorization: authHeader } });
  let d; try { d = JSON.parse(await res.text()); } catch { d = await res.text(); }
  if (d && typeof d === 'object' && 'result' in d) d = d.result;
  return { status: res.status, data: d };
}

(async () => {
  const basic = await listApps(BASIC);
  const basicArr = Array.isArray(basic.data) ? basic.data : [];
  console.log(`Basic: ${basic.status}, ${basicArr.length} apps`);
  console.log('  first 3 Enabled:', basicArr.slice(0, 3).map((a) => `${a.Name}=${a.Enabled}`).join('  '));

  const tok = await login();
  console.log('\nlogin token type:', typeof tok.access_token, 'len', tok.access_token ? tok.access_token.length : 0);
  const bearer = await listApps('Bearer ' + tok.access_token);
  const bearerArr = Array.isArray(bearer.data) ? bearer.data : [];
  console.log(`Bearer: ${bearer.status}, ${bearerArr.length} apps`);
  console.log('  first 3 Enabled:', bearerArr.slice(0, 3).map((a) => `${a.Name}=${a.Enabled}`).join('  '));

  // Full comparison of Enabled across all apps
  console.log('\n=== Enabled comparison (Basic vs Bearer) ===');
  const max = Math.max(basicArr.length, bearerArr.length);
  for (let i = 0; i < max; i++) {
    const b = basicArr[i] ? basicArr[i].Enabled : 'n/a';
    const r = bearerArr[i] ? bearerArr[i].Enabled : 'n/a';
    const name = (basicArr[i] || bearerArr[i] || {}).Name || `#${i}`;
    const diff = b !== r ? '  <-- DIFFERS' : '';
    console.log(`  ${name}: basic=${b}  bearer=${r}${diff}`);
  }
  process.exit(0);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });
