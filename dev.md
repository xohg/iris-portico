# IRIS Portico — Developer Notes

Quick reference for building and running IRIS Portico.

## One-command run (Docker)

```bash
docker compose up --build
# → http://localhost:52773/csp/portico/
```

Stop:
```bash
docker compose down
```

## Frontend (Angular)

```bash
cd src/web
npm install
npm start            # dev server (proxies to IRIS at :52773)
npm run build:prod   # production build → dist/portico-web/browser
```

## API client (framework-agnostic, shared)

The `api-client/` package is framework-agnostic TypeScript (no Angular/React/Vue
imports). It is the single source of truth for the `/api/admin` client and the
types generated from `mainspec_v2.json`. All three frontend variants consume it.

```bash
cd api-client
npm install
npm run gen-types    # regenerate src/types from ../mainspec_v2.json
npm test             # type-check + unit tests
```

## ObjectScript (BFF)

The BFF lives in the `PORTICO` namespace, package `portico.*`.

```bash
# The Docker build runs this automatically (see iris.script). Manually:
#   create namespace portico
#   set $namespace = "portico"
#   load /irisdev/src/portico/Install.cls
#   load /irisdev/src/portico/Web/Api.cls
#   load /irisdev/src/portico/Service/LogAggregator.cls
#   load /irisdev/src/portico/UnitTest.cls
#   do ##class(portico.Install).Run()
```

Run unit tests (inside IRIS, PORTICO namespace):
```
do ##class(%UnitTest.Run).Run("portico.UnitTest")
```

## Key URLs (inside the container)

| URL | What |
|-----|------|
| `/csp/portico/` | Angular Management Portal |
| `/csp/portico-api/` | ObjectScript BFF (log center, health) |
| `/api/admin/` | IRIS system SysAdmin API (called directly by the frontend) |
| `/csp/management/` | Native IRIS Management Portal (reference) |

## Namespace / user

- Namespace: `PORTICO`
- Superuser (container default): `Portico` / `Portico123`
- The app's login form authenticates against `/api/admin/login` (JWT) and falls
  back to basic auth on pre-2026.2 instances.
