# IRIS Portico — Management Portal

> **Language / 语言**: [English](README.md) · [简体中文](README.zh-CN.md)

A **permission-aware Management Portal** for InterSystems IRIS.

IRIS Portico gives administrators a single, secure, role-aware console to manage
everything the IRIS SysAdmin API (`/api/admin`) exposes — with a focus on the
areas most existing portals under-serve: **security & secrets** and a unified
**log center**.

> **Built from scratch** against the public
> [`sysadmin-api-specification`](https://github.com/intersystems-community/sysadmin-api-specification).

---

## What it does

The portal covers all **six core functional areas**, mapped to the SysAdmin API:

| Functional area | What you can do | Backing API |
|-----------|-----------------|-------------|
| **Web Apps & REST** | List/create/enable web applications, inspect PCT access, manage web sessions & namespaces | `/v2/web-apps`, `/v2/web-sessions`, `/v2/namespaces` |
| **Permission management** | Manage users, roles, resources, services, SQL privileges, web authentication | `/v2/security/users`, `/roles`, `/resources`, `/services`, `/sql-privileges` |
| **Security & secrets** | Wallets, X.509 credentials, OAuth 2.0 (servers/clients/resource servers), SSL, encryption, MFT/LDAP, superservers | `/v2/wallet`, `/v2/security/x509-credentials`, `/oauth2`, `/ssl-configurations`, … |
| **Task management** | Create / edit / delete scheduled tasks, run / suspend / resume, view history & upcoming schedules, control the task manager | `/v2/tasks`, `/v2/task` (CRUD), `/v2/task/history`, `/v2/task/upcoming` |
| **System management** | Inspect & control processes, devices, system usage, locks, databases | `/v2/processes`, `/v2/devices`, `/v2/monitor/*`, `/v2/locks`, `/v2/databases` |
| **Logs** | A **unified Log Center** aggregating system status + security audit + journal activity into one time-ordered stream, plus **journal** (files, file detail, async record browser, settings) and **audit** (enable toggle, event definitions, async record query, purge) deep-dives | `/v2/journal/*`, `/v2/security/audit/*`, `/v2/monitor/*` |

Plus a dedicated **Async Task Center** for long-running operations (the
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
               │  same origin (port 80)           │  optional (IRIS :52773)
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
This is what makes it easy to ship **React or Vue variants later**: they just
consume the same client.

**2. nginx in front of IRIS.** The frontend is served as a static SPA by nginx
on port 80, which also proxies `/api/admin` to IRIS's built-in web server on
52773. Because the SPA and the API share the same origin (port 80), the browser
calls `/api/admin` directly with **JWT** (obtained from `POST /login`, with
Basic auth as a fallback for older instances) and no CORS is involved. This
deliberately decouples frontend delivery from IRIS web-app registration — the
portal works even if the ObjectScript BFF never loads.

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
> so the six functional-area screens would have nothing to call. The Dockerfile is
> pinned to `intersystemsdc/iris-community:2026.2` for this reason.

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
4. installs the IPM (ZPM) client and loads the BFF as a ZPM package —
   `ipm load` compiles + activates + commits the `portico.*` classes, then
   registers the web apps (frontend + BFF with its `DispatchClass`).

> The BFF is **optional**. If it fails to load, the portal is fully functional —
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
3. **Install the BFF as a ZPM package** (the recommended path — `ipm load`
   compiles + activates + commits the classes, so they persist):
   ```
   ; one-time: install the IPM (ZPM) client
   do $system.OBJ.Load("<path>/ipm-installer.xml","ck")
   ; load the package (module.xml + portico/ live in src/cls/)
   ipm "load -verbose <path>/src/cls"
   ; register the web apps (frontend + BFF with its DispatchClass)
   do ##class(portico.Install).Run()
   ```
   Point the `portico` web app's ppath at `dist/portico-web/browser`.
4. Open `http://localhost:52773/csp/portico/`.

> The BFF is **optional**. If you skip it, the portal is fully functional —
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
├── portico-setup.sh                 start-of-container provisioning (user + IPM + ZPM)
├── api-client/                       framework-agnostic TS client (shared foundation)
│   ├── scripts/gen-types.js          spec → 142 TS types
│   ├── src/types/index.ts            generated types
│   ├── src/client/                   AdminClient, AuthManager, 13 domain groups, errors
│   └── test/client.test.js           13 unit tests (node:test, mock fetch)
├── src/cls/                         IPM/ZPM package (module.xml + portico/)
│   ├── module.xml                    ZPM module descriptor (portico 1.0.0)
│   └── portico/                      ObjectScript BFF
│       ├── ZPM.cls                   module descriptor class
│       ├── Install.cls               one-time, idempotent web-app setup
│       ├── Web/Api.cls               %CSP entry point (health + log center)
│       ├── Service/LogAggregator.cls server-side log aggregation
│       └── UnitTest.cls              %UnitTest cases (run inside IRIS)
└── src/web/                          Angular 18 frontend (standalone components)
    ├── public/                       static assets (favicon + logo, served at the app root)
    └── src/app/
        ├── core/                     AdminService, AuthService, PermissionService,
        │                               ThemeService, I18nService, coalesce, auth guard
        ├── core/i18n/                en.ts + zh.ts runtime dictionaries (~1026 keys)
        ├── areas/                    all 14 screens: dashboard + 6 functional areas + async,
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

## License

[MIT](./LICENSE)
