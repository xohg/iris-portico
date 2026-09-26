// Deterministic client-side test of the 401 auto-refresh fix.
// Uses a mock fetch (no flaky server) to verify the AuthManager + AdminClient
// refresh behavior end-to-end.
'use strict';
const { AdminClient } = require('../api-client/dist/index.js');

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

// Build a ResponseLike from a status + body.
function resp(status, body) {
  return {
    status,
    ok: status < 400,
    headers: { get: (n) => (n.toLowerCase() === 'content-type' ? 'application/json' : null) },
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

// A mock server with controllable token validity.
function makeMock() {
  const validAccess = new Set();
  const calls = { refresh: 0, login: 0 };
  const refreshTokens = new Set();
  const fetchImpl = async (url, init) => {
    const method = init.method;
    const path = url.replace('http://mock/api/admin', '');
    const auth = (init.headers && init.headers.Authorization) || '';
    const bearer = auth.replace('Bearer ', '');
    const body = init.body ? JSON.parse(init.body) : undefined;

    if (path === '/login' && method === 'POST') {
      calls.login++;
      const at = 'AT' + calls.login;
      validAccess.add(at);
      refreshTokens.add('RT' + calls.login);
      return resp(200, { access_token: at, refresh_token: 'RT' + calls.login, sub: body.user });
    }
    if (path === '/refresh' && method === 'POST') {
      calls.refresh++;
      const rt = body.refresh_token;
      if (refreshTokens.has(rt)) {
        const at = 'AT' + (calls.login + calls.refresh);
        validAccess.add(at);
        refreshTokens.add('RT' + (calls.login + calls.refresh));
        return resp(200, { access_token: at, refresh_token: 'RT' + (calls.login + calls.refresh) });
      }
      return resp(401, { status: { summary: 'invalid refresh token' } });
    }
    // Any other endpoint: 200 iff the bearer token is currently valid.
    if (validAccess.has(bearer)) {
      return resp(200, { status: { summary: 'OK' }, result: { ok: true, path } });
    }
    return resp(401, { status: { summary: 'unauthorized' } });
  };
  return { fetchImpl, validAccess, refreshTokens, calls, invalidate: (at) => validAccess.delete(at) };
}

const BASE = 'http://mock/api/admin';

(async () => {
  // ---- Scenario 1: normal call with a valid token -> 200 ----
  {
    console.log('Scenario 1: valid token -> 200');
    const m = makeMock();
    const c = new AdminClient({ baseUrl: BASE, fetch: m.fetchImpl });
    await c.auth.login('u', 'p');
    const r = await c.getInfo();
    check('login sets a token', !!c.auth.state.accessToken);
    check('valid call returns 200 result', r && r.ok === true);
  }

  // ---- Scenario 2: expired token -> 401 -> auto-refresh -> retry -> 200 ----
  {
    console.log('Scenario 2: expired token -> auto-refresh -> retry succeeds');
    const m = makeMock();
    const c = new AdminClient({ baseUrl: BASE, fetch: m.fetchImpl });
    await c.auth.login('u', 'p');
    const at1 = c.auth.state.accessToken;
    m.invalidate(at1); // simulate the 60 s TTL elapsing
    const r = await c.getInfo(); // should 401, refresh, and retry -> 200
    check('recovered call returns 200', r && r.ok === true, JSON.stringify(r));
    check('token was rotated after refresh', c.auth.state.accessToken !== at1, `still ${c.auth.state.accessToken}`);
    check('refresh happened exactly once', m.calls.refresh === 1, `refresh=${m.calls.refresh}`);
  }

  // ---- Scenario 3: refresh failure -> state cleared -> isAuthenticated false ----
  {
    console.log('Scenario 3: refresh failure -> session cleared');
    const m = makeMock();
    const c = new AdminClient({ baseUrl: BASE, fetch: m.fetchImpl });
    await c.auth.login('u', 'p');
    const at1 = c.auth.state.accessToken;
    m.invalidate(at1);
    m.refreshTokens.clear(); // make the refresh token unusable
    let threw = false;
    try { await c.getInfo(); } catch { threw = true; }
    check('failed refresh throws', threw);
    check('state cleared after failed refresh', c.auth.state.accessToken === undefined && c.auth.state.refreshToken === undefined);
    check('isAuthenticated false after failed refresh', c.auth.isAuthenticated === false);
  }

  // ---- Scenario 4: concurrent 401s -> single-flight refresh (one /refresh) ----
  {
    console.log('Scenario 4: concurrent 401s -> single-flight refresh');
    const m = makeMock();
    const c = new AdminClient({ baseUrl: BASE, fetch: m.fetchImpl });
    await c.auth.login('u', 'p');
    const at1 = c.auth.state.accessToken;
    m.invalidate(at1);
    const results = await Promise.all([c.getInfo(), c.getInfo(), c.getInfo(), c.getInfo(), c.getInfo()]);
    check('all 5 concurrent calls recovered', results.every((r) => r && r.ok === true), JSON.stringify(results.map((r) => r && r.ok)));
    check('refresh called exactly once (single-flight)', m.calls.refresh === 1, `refresh=${m.calls.refresh}`);
  }

  // ---- Scenario 5: restore() recovers the refresh token (page-reload case) ----
  {
    console.log('Scenario 5: restore() recovers refresh token');
    const m = makeMock();
    const c = new AdminClient({ baseUrl: BASE, fetch: m.fetchImpl });
    await c.auth.login('u', 'p');
    const saved = c.auth.state; // { accessToken, refreshToken, username }
    // Simulate a page reload: fresh client, restore the persisted state.
    const c2 = new AdminClient({ baseUrl: BASE, fetch: m.fetchImpl });
    c2.auth.restore(saved);
    check('restore recovers access token', c2.auth.state.accessToken === saved.accessToken);
    check('restore recovers refresh token', c2.auth.state.refreshToken === saved.refreshToken);
    const at1 = c2.auth.state.accessToken;
    m.invalidate(at1); // access token expires
    const r = await c2.getInfo(); // should refresh using the restored refresh token
    check('restored session refreshes and recovers', r && r.ok === true, JSON.stringify(r));
  }

  console.log(failures === 0 ? 'ALL PASSED' : `${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('FATAL: ' + e.stack); process.exit(2); });

