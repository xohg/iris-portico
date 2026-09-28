# Changelog

All notable changes to IRIS Portico.

## [v0.0.2] - 2026-09-28

### Fixed

- **Quick Start fails on Windows (Issue #1)** — the production compose file now maps host port **8080** to container port 80 instead of `80:80`.
  - On Windows machines where port 80 is reserved at the kernel level by IIS / the http.sys driver (IIS's default site registers the full-port reservation `http://+:80/`), the Docker daemon (a user process) cannot bind port 80 and `docker compose up` failed with:
    `listen tcp 0.0.0.0:80: bind: An attempt was made to access a socket in a way forbidden by its access permissions` (WSA_EACCES / 10013).
  - 8080 is not an IIS/http.sys default, so the one-command run now works out of the box on every machine. The app inside the container is unchanged.
  - READMEs (EN + ZH) updated: Quick Start now opens **http://localhost:8080/**, with a note on how to use host port 80 instead (change the mapping to `80:80` and free port 80 first, e.g. stop IIS).
  - Root cause confirmed 1:1 by controlled experiment: with an `HttpListener` holding `http://+:80/` (the http.sys kernel driver — the same mechanism IIS uses), `docker run -p 80:80` fails with the identical error; a plain user-process socket holding 80 does **not** block Docker (SO_REUSEADDR coexistence), and the Windows firewall has no effect.

## [v0.0.1] - 2026-09-27

Initial release.

### Added

- IRIS Portico: a permission-aware management portal for InterSystems IRIS 2026.2 (Angular 18.2 SPA + ObjectScript BFF running inside the IRIS community image).
- Production mode: nginx serves the SPA on port 80 and proxies `/api/admin` to IRIS on 52773.
- Demo mode: the SPA is served by the IRIS built-in web server (no nginx, `INSTALL_NGINX=0`), with a self-provisioning container (reliable startup, redirect, healthcheck).
- Chinese (简体中文) README.
- Portico logo in the frontend; unified colored-emoji menu icons; theme and i18n controls on the login page.

### Changed

- Migrated the BFF to the ZPM/IPM packaging lifecycle: the IRIS instance installs the IPM client from the baked-in installer and runs `ipm load` (full Initialize → Reload → Validate → Compile → Activate) on every container start.
- Refined list types to array shapes (Superserver / Wallet / X509).

### Fixed

- REST dispatch: `%CSP.REST` UrlMap handlers are invoked as functions by `DispatchRequest` — each handler now ends with `quit 1`.
- CRLF shebang breakage on Windows clones (`core.autocrlf=true`): `.gitattributes` now forces LF for `*.sh` and `Dockerfile`, so `docker compose up` from a fresh Windows clone boots cleanly.
- Web-app 404: `Security.Applications` names must start with `/` (per official docs); registered `/csp/portico` and `/csp/portico-api`.
- Raw-JSON display bugs (audit / wallet / LDAP / MFT / superservers / locks).
- Missing i18n keys that rendered as raw key names.
- API response localization, mapping namespace parameter, and interaction-level bugs.
- Docs: noted the host-level metrics gap; fixed device-detail placeholder wording.
