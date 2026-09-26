/**
 * Unit tests for the framework-agnostic AdminClient.
 * Uses a mock fetch so no live IRIS is required.
 *
 * Run:  node --test test/
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { AdminClient, PrivilegeError, AuthError, NotFoundError, buildUrl } = require('../dist');

/** Build a mock fetch that returns a canned response. */
function mockFetch(responder) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url, init });
    const r = responder(url, init);
    return {
      status: r.status,
      ok: r.status < 400,
      headers: { get: (n) => (n.toLowerCase() === 'content-type' ? 'application/json' : null) },
      json: async () => r.body,
      text: async () => JSON.stringify(r.body),
    };
  };
  fn.calls = calls;
  return fn;
}

test('buildUrl appends query params and skips null/undefined', () => {
  const u = buildUrl('/api/admin', '/v2/security/users', { a: 1, b: undefined, c: null, d: 'x y' });
  assert.equal(u, '/api/admin/v2/security/users?a=1&d=x%20y');
});

test('unwraps the BaseResponse envelope and returns result', async () => {
  const fetch = mockFetch(() => ({
    status: 200,
    body: { status: { summary: 'OK', Errors: [] }, console: [], result: { Name: 'alice' } },
  }));
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  const user = await c.get('/v2/security/user', { name: 'alice' });
  assert.deepEqual(user, { Name: 'alice' });
});

test('returns the whole body when there is no result field', async () => {
  const fetch = mockFetch(() => ({ status: 200, body: { hello: 'world' } }));
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  const out = await c.get('/anything');
  assert.deepEqual(out, { hello: 'world' });
});

test('maps 403 to PrivilegeError with server errors', async () => {
  const fetch = mockFetch(() => ({
    status: 403,
    body: { status: { summary: 'Forbidden', Errors: ['%Admin_Secure'] }, console: [] },
  }));
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  await assert.rejects(c.get('/v2/security/users'), (e) => {
    assert.ok(e instanceof PrivilegeError);
    assert.equal(e.forbidden, true);
    assert.deepEqual(e.errors, ['%Admin_Secure']);
    return true;
  });
});

test('maps 401 to AuthError', async () => {
  const fetch = mockFetch(() => ({ status: 401, body: { status: { summary: 'Unauthorized', Errors: [] } } }));
  const c = new AdminClient({ fetch, baseUrl: '/api/admin', autoRefresh: false });
  await assert.rejects(c.get('/v2/security/users'), (e) => e instanceof AuthError);
});

test('maps 404 to NotFoundError', async () => {
  const fetch = mockFetch(() => ({ status: 404, body: { status: { summary: 'Not found', Errors: [] } } }));
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  await assert.rejects(c.get('/v2/security/user', { name: 'ghost' }), (e) => e instanceof NotFoundError);
});

test('login stores the JWT and attaches Bearer header on subsequent calls', async () => {
  let step = 0;
  const fetch = mockFetch((url) => {
    if (url.endsWith('/login')) {
      return {
        status: 200,
        body: { result: { access_token: 'AT', refresh_token: 'RT', sub: 'Superuser' } },
      };
    }
    step++;
    return { status: 200, body: { status: { summary: 'OK', Errors: [] }, console: [], result: { ok: true } } };
  });
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  await c.auth.login('Superuser', 'SYS');
  assert.equal(c.auth.state.accessToken, 'AT');
  await c.get('/v2/security/users');
  const authCall = fetch.calls.find((x) => x.url.includes('/v2/security/users'));
  assert.equal(authCall.init.headers.Authorization, 'Bearer AT');
});

test('login handles the BARE 2026.2 response (no result wrapper)', async () => {
  // IRIS 2026.2's POST /login returns { access_token, refresh_token, sub, iat, exp }
  // directly — NOT under a `result` key, despite what the spec schema implies.
  const fetch = mockFetch((url) => {
    if (url.endsWith('/login')) {
      return {
        status: 200,
        body: { access_token: 'AT2', refresh_token: 'RT2', sub: 'Portico', iat: 1, exp: 2 },
      };
    }
    return { status: 200, body: { status: { summary: 'OK', Errors: [] }, console: [], result: { ok: true } } };
  });
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  await c.auth.login('Portico', 'Portico123');
  assert.equal(c.auth.state.accessToken, 'AT2');
  assert.equal(c.auth.state.refreshToken, 'RT2');
  assert.equal(c.auth.state.username, 'Portico');
  await c.get('/v2/info');
  const call = fetch.calls.find((x) => x.url.includes('/v2/info'));
  assert.equal(call.init.headers.Authorization, 'Bearer AT2');
});

test('basic auth produces a Basic header', async () => {
  const fetch = mockFetch(() => ({ status: 200, body: { status: { summary: 'OK', Errors: [] }, console: [], result: [] } }));
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  c.auth.setBasicAuth('admin', 'pass');
  await c.get('/v2/security/users');
  const call = fetch.calls[0];
  assert.ok(call.init.headers.Authorization.startsWith('Basic '));
});

test('basic auth base64-encodes the credentials correctly', async () => {
  // base64("admin:pass") === "YWRtaW46cGFzcw==" — verifies the encoder works
  // identically in Node (Buffer) and the browser (btoa).
  const fetch = mockFetch(() => ({ status: 200, body: { status: { summary: 'OK', Errors: [] }, console: [], result: [] } }));
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  c.auth.setBasicAuth('admin', 'pass');
  await c.get('/v2/security/users');
  assert.equal(fetch.calls[0].init.headers.Authorization, 'Basic YWRtaW46cGFzcw==');
});

test('auto-refresh retries once after a 401', async () => {
  let usersAttempts = 0;
  let refreshCalls = 0;
  const fetch = mockFetch((url) => {
    if (url.endsWith('/login')) {
      return { status: 200, body: { result: { access_token: 'OLD', refresh_token: 'RT' } } };
    }
    if (url.endsWith('/refresh')) {
      refreshCalls++;
      return { status: 200, body: { result: { access_token: 'NEW', refresh_token: 'RT2' } } };
    }
    if (url.includes('/v2/security/users')) {
      usersAttempts++;
      // 1st attempt → 401; 2nd attempt (post-refresh) → 200
      return usersAttempts === 1
        ? { status: 401, body: { status: { summary: 'Unauthorized', Errors: [] } } }
        : { status: 200, body: { status: { summary: 'OK', Errors: [] }, console: [], result: [{ Name: 'x' }] } };
    }
    return { status: 200, body: { result: {} } };
  });
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  await c.auth.login('Superuser', 'SYS'); // seeds access + refresh token
  const out = await c.get('/v2/security/users');
  assert.equal(refreshCalls, 1);
  assert.equal(usersAttempts, 2);
  assert.equal(c.auth.state.accessToken, 'NEW');
  assert.deepEqual(out, [{ Name: 'x' }]);
});

test('domain helpers hit the correct endpoints', async () => {
  const fetch = mockFetch(() => ({ status: 200, body: { status: { summary: 'OK', Errors: [] }, console: [], result: [] } }));
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  await c.domains.permissions.listUsers();
  await c.domains.security.listWalletCollections();
  await c.domains.system.listProcesses();
  await c.domains.logs.listJournalFiles();
  const urls = fetch.calls.map((x) => x.url);
  assert.ok(urls.some((u) => u.includes('/v2/security/users')));
  assert.ok(urls.some((u) => u.includes('/v2/wallet/collections')));
  assert.ok(urls.some((u) => u.includes('/v2/processes')));
  assert.ok(urls.some((u) => u.includes('/v2/journal/files')));
});

test('new domain helpers (ecp / ext-lang / device / encryption / fs-access) hit the right endpoints', async () => {
  const fetch = mockFetch(() => ({ status: 200, body: { status: { summary: 'OK', Errors: [] }, console: [], result: [] } }));
  const c = new AdminClient({ fetch, baseUrl: '/api/admin' });
  await c.domains.ecp.getSettings();
  await c.domains.ecp.dataServerAction('srv', 1);
  await c.domains.extLang.list();
  await c.domains.extLang.start('gw');
  await c.domains.system.getDeviceSettings();
  await c.domains.system.broadcast('hello', [1, 2]);
  await c.domains.logs.listJournalRecords('file1');
  await c.domains.logs.listAuditRecords({ beginDateTime: '2026-09-01' });
  await c.domains.security.listEncryptionKeys();
  await c.domains.security.listFsAccessPurposes();
  await c.domains.security.getOAuth2ResourceServerMappings('svc');
  const urls = fetch.calls.map((x) => x.url);
  assert.ok(urls.some((u) => u.includes('/v2/ecp/settings')));
  assert.ok(urls.some((u) => u.includes('/v2/ecp/data-server/action?name=srv')));
  assert.ok(urls.some((u) => u.includes('/v2/ext-lang-servers')));
  assert.ok(urls.some((u) => u.includes('/v2/ext-lang-server/start?name=gw')));
  assert.ok(urls.some((u) => u.includes('/v2/device/settings')));
  assert.ok(urls.some((u) => u.includes('/v2/journal/file/records?file=file1')));
  assert.ok(urls.some((u) => u.includes('/v2/security/encryption/keys')));
  assert.ok(urls.some((u) => u.includes('/v2/fs-access-purposes')));
  assert.ok(urls.some((u) => u.includes('/v2/security/oauth2/resource-server/mappings?service=svc')));
  // broadcast sends {Message, PidList} (not {message})
  const bc = fetch.calls.find((x) => x.url.includes('/v2/process/broadcast'));
  assert.deepEqual(JSON.parse(bc.init.body), { Message: 'hello', PidList: [1, 2] });
  // journal + audit records are POSTs
  assert.equal(fetch.calls.find((x) => x.url.includes('/v2/journal/file/records')).init.method, 'POST');
  assert.equal(fetch.calls.find((x) => x.url.includes('/v2/security/audit/records')).init.method, 'POST');
});
