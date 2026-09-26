# IRIS Portico — Management Portal

A **permission-aware Management Portal** for InterSystems IRIS, built for the
[InterSystems Programming Contest #48](https://openexchange.intersystems.com/contest/48)
(*"Build Your Own Management Portal"*).

IRIS Portico gives administrators a single, secure, role-aware console to manage
everything the IRIS SysAdmin API (`/api/admin`) exposes — with a focus on the
areas most existing portals under-serve: **security & secrets** and a unified
**log center**.

> **Original work.** This project is built from scratch against the public
> [`sysadmin-api-specification`](https://github.com/intersystems-community/sysadmin-api-specification).
> Nothing is copied from other contest entries.

---

## What it does

The portal covers all **six required task areas**, mapped to the SysAdmin API:

| Task area | What you can do | Backing API |
|-----------|-----------------|-------------|
| **Web Apps & REST** | List/create/enable web applications, inspect PCT access, manage web sessions & namespaces | `/v2/web-apps`, `/v2/web-sessions`, `/v2/namespaces` |
| **Permission management** | Manage users, roles, resources, services, SQL privileges, web authentication | `/v2/security/users`, `/roles`, `/resources`, `/services`, `/sql-privileges` |
| **Security & secrets** | Wallets, X.509 credentials, OAuth 2.0 (servers/clients/resource servers), SSL, encryption, MFT/LDAP, superservers | `/v2/wallet`, `/v2/security/x509-credentials`, `/oauth2`, `/ssl-configurations`, … |
| **Task management** | Create / edit / delete scheduled tasks, run / suspend / resume, view history & upcoming schedules, control the task manager | `/v2/tasks`, `/v2/task` (CRUD), `/v2/task/history`, `/v2/task/upcoming` |
| **System management** | Inspect & control processes, devices, system usage, locks, databases | `/v2/processes`, `/v2/devices`, `/v2/monitor/*`, `/v2/locks`, `/v2/databases` |
| **Logs** | A **unified Log Center** aggregating system status + security audit + journal activity into one time-ordered stream, plus **journal** (files, file detail, async record browser, settings) and **audit** (enable toggle, event definitions, async record query, purge) deep-dives | `/v2/journal/*`, `/v2/security/audit/*`, `/v2/monitor/*` |

Plus a first-class **Async Task Center** for long-running operations (the
`202 + Location` pattern) with cancel / pause / resume — and a full set of
management pages:

- **Databases** — local database directories (`/v2/database-dir*`): list,
  config, volumes, runtime info (async), maintenance (compact / defragment /
  integrity check / mount / dismount) and size management (truncate / expand /
  volume expansion / create / delete), plus config-database CRUD
  (`/v2/database`).
- **Namespaces** (`/v2/namespace*`) — list, detail, create/delete, and all
  three mapping types (routine / global / package: list, detail, create,
  delete) plus copy-mappings and enable-interop.
- **License** (`/v2/license/*`) — license key info / validate / activate,
  license server list / detail / upsert / delete, and usage.
- **WQM** (`/v2/wqm-category*`) — wait-queue category list, detail, upsert,
  delete.
- **ECP** (external client protocol, `/v2/ecp/*`) — settings, data servers
  (detail, databases, disconnect / disable / normal actions, create/delete),
  application servers, SSL connections (authorize / reject / remove).
- **Language Servers** (external language servers, `/v2/ext-lang-server*`) —
  list, detail (bind address, resource, timeouts, shared memory, SSL),
  activity, start / stop, and create / delete.

The **System** page also covers device detail + settings + subtype CRUD and
process **broadcast**, the **Tasks** page covers full task CRUD, and the
**Security** page covers the full write block: user / role / resource /
service CRUD, SQL admin + column privilege grant/revoke, wallet secret
upsert, X.509 credential CRUD, MFT / LDAP / superserver CRUD, privileged-
routine CRUD, web-auth SMTP password, audit-event CRUD, encryption key-file
management, and OAuth 2.0 AS / client / resource-server configuration.

### Internationalization & themes

- **Two languages — 中文 / English.** A runtime `I18nService` (≈ 1026 strings,
  `core/i18n/en.ts` + `core/i18n/zh.ts`) with a top-bar toggle. The choice
  persists in `localStorage` and defaults to `navigator.language`. Deliberately
  *not* `@angular/localize`: that requires a per-locale build pipeline, while
  the runtime dictionary keeps a single build and swaps at runtime.
- **Two themes — dark / light.** Every color is a CSS custom property on
  `:root`; the light theme is a full token override under
  `:root[data-theme='light']`. `ThemeService` flips the attribute, persists the
  choice, and defaults to the OS `prefers-color-scheme`.

### Permission-aware by design

The SysAdmin API gates every operation on a `%Admin_*` privilege. IRIS Portico
reads the current user's privileges from `GET /info` and **enables or hides each
action accordingly** — a user without `%Admin_Secure` simply won't see the user/
role management controls. The top bar shows how many privileges the session holds.

### API coverage (276-operation v2 surface)

The IRIS 2026.2 SysAdmin API exposes **276 operations** across 39 functional areas
(`mainspec_v2.json`). The portal now exercises **265 of them (96.0%)** — every
functional area is represented by a page. The full catalog, marked ✅/— per
operation, plus a feature-parity comparison against the official IRIS management
portal (`%CSP.UI.Portal`), lives in
**[`docs/API-CATALOG.md`](docs/API-CATALOG.md)**.

The 11 remaining unused operations are low-value: the three SQL-privilege
`HEAD` probes, `POST /v2/security/oauth2/revoke`, the four
`v2/fs-access-purpose` mutation endpoints (the portal leaves FS access
read-only), and the two `v2/monitor` dashboard sub-endpoints
(`dashboard/ecp`, `dashboard/globals-and-routines`).

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser — Angular 18 (standalone components, single build)          │
│                                                                    │
│   /login  ── standalone sign-in page (no shell chrome)             │
│                                                                    │
│   '' (authGuard) ── ShellComponent                                │
│     ├─ sidebar (collapsible) or top nav (toggleable): 14 items    │
│     ├─ top bar: 中文/EN toggle · 🌙/☀️ theme toggle · user box      │
│     └─ router-outlet ── 14 screens: dashboard + webapps,          │
│        permissions, security, tasks, system, databases, logs,     │
│        async, ecp, ext-lang-servers, namespaces, license, wqm     │
│                                                                    │
│   I18nService (runtime zh/en dictionaries)                        │
│   ThemeService (data-theme on <html>, CSS custom properties)       │
└──────────────┬──────────────────────────────────┬───────────────────┘
               │  same origin (port 80)           │  bonus (IRIS :52773)
               ▼                                  ▼
  ┌────────────────────────────────┐   ┌──────────────────────────────┐
  │  nginx  (port 80)             │   │  /csp/portico-api (BFF)     │
  │  · serves the Angular SPA     │   │  ObjectScript: health +       │
  │  · proxies /api/admin → IRIS  │   │  server-side log aggregation  │
  └───────────────┬────────────────┘   └──────────────────────────────┘
                  │
                  ▼
  ┌────────────────────────────────────────────────────────────────┐
  │  /api/admin (IRIS system API, port 52773)                     │
  │  276 operations · JWT (POST /login) + Basic auth              │
  └────────────────────────────────────────────────────────────────┘
                  ▲
                  │  shared, framework-agnostic
  ┌────────────────────────────────────────────────────────────────┐
  │  @iris-portico/api-client  (TypeScript)                      │
  │  142 generated types · auth (JWT + basic) · envelope unwrap   │
  │  error mapping · 13 domain groups · async helpers             │
  └────────────────────────────────────────────────────────────────┘
```

Two design decisions stand out.

**1. A framework-agnostic API client.** All the hard parts — authentication
(JWT with basic fallback), the `BaseResponse` envelope unwrapping, error
mapping (401/403/404/409), the 142 generated types, and the 13 domain groups —
live in `@iris-portico/api-client`. The Angular app is a thin layer on top.
This is what makes it easy to ship **React or Vue variants later** (see
[Roadmap](#roadmap)): they just consume the same client.

**2. nginx in front of IRIS.** The frontend is served as a static SPA by nginx
on port 80, which also proxies `/api/admin` to IRIS's built-in web server on
52773. Because the SPA and the API share the same origin (port 80), the browser
calls `/api/admin` directly with **JWT** (obtained from `POST /login`, with
Basic auth as a fallback for older instances) and no CORS is involved. This
deliberately decouples frontend delivery from IRIS web-app registration (which
is unreliable on some Community Edition image builds) — the portal works even
if the ObjectScript BFF never loads.

**3. The shell is a component, not the app root.** `app.component.ts` is a bare
`<router-outlet />`. The authenticated chrome (sidebar + top bar) lives in a
standalone `ShellComponent` that is the `loadComponent` of the guard-protected
`''` route, so unauthenticated visitors see *only* the login page — no sidebar,
no navigation, nothing to click. A direct hit on a protected URL (e.g.
`/tasks`) is redirected to `/login` by the `CanActivateFn` guard.

**4. The session survives the access token's 60 s TTL.** IRIS 2026.2 issues a
short-lived JWT: the **access token expires after ~60 s**, while the **refresh
token lives ~15 min**. The portal never asks the user to re-sign-in in that
window — on the first `401` the client calls `POST /refresh`, swaps in the new
access token, and retries the request once (the user sees no error). The whole
auth state (access **and** refresh token) is persisted to `localStorage`, so a
page reload restores a *refreshable* session, not a dead one. Refresh is
single-flight (concurrent `401`s share one `/refresh` call). When the session
finally dies (the refresh token is expired, rotated away, or invalidated by a
server restart), the client clears the state **and navigates to `/login`** —
the user is never stranded on a page full of `401` errors (the route guard only
runs on navigation, so it cannot react to a mid-page token death; `AuthService`
watches the authed flag and redirects on an authenticated → unauthenticated
transition).

> **Requires IRIS 2026.2 or later.** The `v2` SysAdmin API (the 276 `/v2/*`
> operations and the JWT `POST /login` endpoint) only exists in 2026.2+. On
> 2026.1 the API reports `apiVersion: 1` and the `/v2/*` paths return `404`,
> so the six task-area screens would have nothing to call. The Dockerfile is
> pinned to `intersystemsdc/iris-community:2026.2` for this reason.

### Known API limitations (2026.2)

A few SysAdmin API behaviors are worth knowing — the portal degrades gracefully
around all of them:

| Endpoint | Behavior | Portal handling |
|----------|----------|-----------------|
| `GET /v2/security/sql-privileges` | Returns `400` on a fresh instance (no grants exist yet) | The SQL Privileges tab shows the query/grant/revoke tools; the list loads only after the first grant exists |
| `POST /v2/security/audit/records` | Returns `202` with an empty body (asynchronous) | The Log Center treats it as "accepted, no inline result" and keeps polling the audit list |
| BFF web-app registration (`/csp/portico-api`) | A `404` on an *older* running container means that container was built from a previous image whose setup registered the then-current app names; a fresh `docker compose up --build` registers the current `portico` / `portico-api` names. Registration itself is a standard `Security.Applications` registry write and is reliable — the setup runs it best-effort (with a timeout guard) only because the `iris session` provisioning step can occasionally be interrupted on some image builds | By design: nginx serves the SPA and proxies `/api/admin`, so the BFF is a bonus, not a dependency |
| `Enabled` on `GET /v2/web-apps` | Runtime gateway state, not configuration: after a container restart IRIS takes ~1 minute to bring the web-server gateways up, so values flap `false → true` during startup | Expected, not a bug — the list refreshes and the badges settle to `on` |
 | `POST /login` (occasionally) | Intermittently returns `401` with an empty body under rapid repeated logins (a 2026.2 quirk; a single login is reliable) | The login form retries, and falls back to Basic auth if the JWT `401`s — the user is never locked out |

---

## Quick start (Docker, one command)

```bash
docker compose up --build
```

Then open:

```
http://localhost:80/
```

Sign in with the credentials the container creates:

```
username: Portico
password: Portico123
```

The container:
1. builds the Angular frontend (Node stage),
2. starts **nginx** (serves the SPA on `:80`, proxies `/api/admin` → IRIS `:52773`),
3. creates the `Portico` user (so `/api/admin` **JWT + Basic auth** work),
4. best-effort loads the ObjectScript BFF and registers `/csp/portico-api/`
   (health + server-side log aggregation).

> The BFF is a **bonus**. If it fails to load, the portal is fully functional —
> the Log Center falls back to client-side aggregation, and all CRUD + auth go
> straight to `/api/admin` (via the nginx proxy).

### Manual (without Docker)

1. **Start IRIS Community Edition 2026.2 or later** (the `v2` SysAdmin API —
   276 `/v2/*` operations + JWT `POST /login` — is only built in from 2026.2).
2. **Build the frontend:**
   ```bash
   cd api-client && npm install && npm run build
   cd ../src/web && npm install && npm run build:prod
   ```
3. **Load the BFF** (in an `iris` terminal):
   ```
   create namespace portico
   set $namespace = "portico"
   load <path>/src/cls/portico/Install.cls
   load <path>/src/cls/portico/Web/Api.cls
   load <path>/src/cls/portico/Service/LogAggregator.cls
   do ##class(portico.Install).Run()
   ```
   Point the `portico` web app's ppath at `dist/portico-web/browser`.
4. Open `http://localhost:52773/csp/portico/`.

> The BFF is a **bonus**. If you skip it, the portal is fully functional —
> the Log Center falls back to client-side aggregation, and all CRUD + auth go
> straight to `/api/admin`.

### Demo mode (minimal — IRIS built-in web server only)

For a minimal-footprint demo, skip nginx entirely and let IRIS's built-in web
server serve everything:

```bash
docker compose -f docker-compose.demo.yml up --build
```

Then open:

```
http://localhost:52773/csp/portico/
```

Sign in with the same `Portico / Portico123` credentials.

In this mode the `portico` web app serves the Angular SPA as static files
(the `ServeFiles` web-app setting, on by default, lets the IRIS built-in web
server serve files from the app's physical path) and the frontend calls
`/api/admin` directly on the same origin — no proxy, no extra packages. The
`Dockerfile` build arg `INSTALL_NGINX=0` skips the nginx install; the default
`docker-compose.yml` keeps the production layout (nginx on `:80`). The
frontend's `<base href="auto">` resolves asset paths correctly in both modes.

> **One demo-mode limitation:** IRIS web-application definitions
> (`Security.Applications`) have no "fallback" setting, so the built-in web
> server does not auto-redirect SPA deep links (e.g. `/csp/portico/tasks`)
> to `index.html`. Enter via the app root —
> `http://localhost:52773/csp/portico/` — which serves `index.html`; the
> client-side router then handles all in-app navigation. (In production,
> nginx's `try_files ... /index.html` provides the fallback, so deep links
> work there.)

---

## Repository layout

```
├── Dockerfile / docker-compose.yml   one-command run (nginx + IRIS, production)
├── docker-compose.demo.yml           demo mode (IRIS built-in web server only)
├── nginx-portico.conf               SPA on :80 + /api/admin proxy
├── portico-setup.sh                 start-of-container provisioning (user + BFF)
├── iris.script                       namespace + class load + web-app setup
├── mainspec_v2.json                  the SysAdmin OpenAPI 3.0 spec (source of truth)
├── api-client/                       framework-agnostic TS client (shared foundation)
│   ├── scripts/gen-types.js          spec → 142 TS types
│   ├── src/types/index.ts            generated types
│   ├── src/client/                   AdminClient, AuthManager, 13 domain groups, errors
│   └── test/client.test.js           13 unit tests (node:test, mock fetch)
├── src/cls/portico/                 ObjectScript BFF
│   ├── Install.cls                   one-time, idempotent web-app setup
│   ├── Web/Api.cls                   %CSP entry point (health + log center)
│   ├── Service/LogAggregator.cls     server-side log aggregation
│   └── UnitTest.cls                  %UnitTest cases (run inside IRIS)
└── src/web/                          Angular 18 frontend (standalone components)
    └── src/app/
        ├── core/                     AdminService, AuthService, PermissionService,
        │                               ThemeService, I18nService, coalesce, auth guard
        ├── core/i18n/                en.ts + zh.ts runtime dictionaries (~1026 keys)
        ├── areas/                    all 14 screens: dashboard + 6 task areas + async,
        │                               databases, ecp, ext-lang-servers, namespaces,
        │                               license, wqm
        ├── login/                    standalone sign-in page
        ├── shell.component.ts        authenticated shell (sidebar + top bar + outlet)
        ├── app.component.ts          bare <router-outlet />
        └── app.routes.ts             guard-protected '' route + standalone /login
```

---

## Running the tests

```bash
# API client (13 unit tests, mock fetch)
cd api-client && npm install && npm test

# Type-check the client
cd api-client && npm run typecheck

# Build the frontend (production)
cd src/web && npm install && npm run build:prod
```

The ObjectScript unit tests (`portico.UnitTest`) run inside IRIS:

```
set $namespace = "portico"
do ##class(%UnitTest.Run).Run("portico.UnitTest")
```

---

## Demo / video

A short walkthrough (≈ 4–5 min) that covers, in order:

1. **Sign in** — the login form authenticates against `/api/admin` (JWT, with
   basic-auth fallback for older instances); the top bar shows the session's
   held privileges.
2. **Dashboard** — server identity, live system usage, resource counts, and the
   privilege list that drives what's enabled.
3. **Security & Secrets** (the differentiator) — walk through Wallet → X.509 →
   OAuth 2.0 → SSL → Encryption, showing the permission gating (controls appear
   only when the session holds the matching `%Admin_*` privilege).
4. **Log Center** — the unified, time-ordered stream across system status,
   security audit, and journal activity, with source filtering and auto-refresh.
5. **Async Task Center** — a long-running operation's `202 + Location` result,
   polled live, with cancel / pause / resume.
6. **System & Tasks** — process control (suspend/resume/terminate) and task
   run/suspend/resume.

*(The video is recorded against `docker compose up --build` and the default
`Portico / Portico123` credentials.)*

---

## Roadmap

- ~~**Wider API coverage**~~ **✅ DONE** — the portal now uses 265 of 276 v2
  operations (96.0%); the full catalog is in
  [`docs/API-CATALOG.md`](docs/API-CATALOG.md). Built across this effort: the
  **Databases** page, **journal/audit deepening** (Logs), **device settings +
  process broadcast** (System), the **ECP** and **Language Servers** pages,
  **encryption keys / OAuth 2.0 config / filesystem access purposes**
  (Security), plus the **Namespaces**, **License**, and **WQM** pages, full
  **task CRUD**, and the complete **Security write block** (user/role/resource/
  service CRUD, SQL admin+column privileges, wallet secret upsert, X.509 / MFT /
  LDAP / superserver / privileged-routine CRUD, audit-event CRUD).
- **React and Vue variants** — consume the same `@iris-portico/api-client`
  (the shared foundation already exists; only the thin UI layer changes).
- **More locales** (the runtime-dictionary i18n makes adding a language a
  single JSON/TS file) and **more themes** (each theme is one CSS token block).
- **Stronger sign-in options**: MFA (TOTP), captcha, password-complexity policy,
  single-session enforcement, lockout after N failures, IP allow-listing.
- **Audit of portal actions** (who did what, from the portal).
- **Deeper log-center filters** (by event, user, time range) and export.

---

## License

[MIT](./LICENSE)
