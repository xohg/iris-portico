# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 — build the frontend (API client, then Angular)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS web
WORKDIR /app

# 1. Build the framework-agnostic API client. Its dist/ (index.js + index.d.ts)
#    is what the frontend imports via the `file:../../api-client` reference.
COPY api-client/ ./api-client
RUN cd api-client && npm install --no-audit --no-fund && npm run build

# 2. Build the Angular frontend. package.json is copied first for layer
#    caching; only package.json (not the host-generated lockfile) is used to
#    avoid npm's lockfile-version "reading 'extraneous'" bug.
COPY src/web/package.json ./src/web/
RUN cd src/web && npm install --no-audit --no-fund
COPY src/web/ ./src/web/
RUN cd src/web && npm run build:prod

# ---------------------------------------------------------------------------
# Stage 2 — InterSystems IRIS Community Edition
#
# NOTE: pinned to 2026.2 (NOT :latest, which resolves to 2026.1). The SysAdmin
# v2 API (mainspec_v2.json — 276 operations, /v2/* paths, and the JWT /login
# endpoint) is only present in IRIS 2026.2+. On 2026.1 the /v2/* endpoints
# return 404 (the API reports apiVersion:1 and only exposes /info + /login), so
# the six task-area screens would have nothing to call. 2026.2 is the version
# the v2 spec targets ("Available starting in IRIS 2026.2").
# ---------------------------------------------------------------------------
FROM intersystemsdc/iris-community:2026.2 AS app

# Deployment modes (build arg):
#   INSTALL_NGINX=1 (default, production) — nginx serves the Angular SPA on
#   :80 and proxies /api/admin to the built-in IRIS web server on :52773.
#   This decouples frontend delivery from IRIS web-app registration
#   (unreliable on some builds): the frontend and the API share the same
#   origin (port 80), so the frontend calls /api/admin and no CORS is
#   involved.
#   INSTALL_NGINX=0 (demo, minimal install) — no nginx; the IRIS built-in web
#   server serves everything: the SPA via the "portico" web app
#   (http://host:52773/csp/portico/, Fallback=index.html for SPA deep links)
#   and the API at /api/admin — same origin, no proxy, no extra packages.
ARG INSTALL_NGINX=1

# curl is used by the HEALTHCHECK in both modes.
#
# The IRIS image's default user is irisowner (non-root), so apt-get must run as
# root; switch back to irisowner for the remaining (IRIS-owned) steps.
#
# This apt step is placed BEFORE the source COPYs so it is cached independently
# of source changes — otherwise every .cls/web edit would invalidate it and
# re-hit the (flaky) Ubuntu archive.
USER root
# The Ubuntu archive intermittently returns 502 Bad Gateway (on both the
# metadata update and the .deb downloads), so the whole update+install sequence
# is wrapped in a retry loop.
RUN ok=0; for i in 1 2 3 4 5 6; do \
        pkgs="curl"; \
        if [ "$INSTALL_NGINX" = "1" ]; then pkgs="nginx curl"; fi; \
        if apt-get update \
           && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $pkgs; then \
            ok=1; break; \
        else \
            echo "apt failed (attempt $i), retrying in 5s..."; sleep 5; \
        fi; \
    done; \
    [ "$ok" = "1" ] \
    && rm -rf /var/lib/apt/lists/* \
    && if [ "$INSTALL_NGINX" = "1" ]; then \
         ln -sf /dev/null /var/log/nginx/access.log \
         && ln -sf /dev/null /var/log/nginx/error.log; \
       fi
# ObjectScript source. The setup script loads these directly (load + compile),
# so no IPM/ZPM module descriptor is needed.
COPY src/cls /irisdev/src

# Angular build output (served by nginx as the static SPA at /, and also kept
# at /irisdev/web in case an IRIS web app is registered to serve it).
COPY --from=web /app/src/web/dist/portico-web/browser /irisdev/web
COPY nginx-portico.conf /etc/nginx/sites-available/portico
# nginx is started by the (non-root) setup script, so it must run as the
# default user (irisowner). Two adjustments make that work:
#   - CAP_NET_BIND_SERVICE lets a non-root process bind privileged port 80
#   - the pid file moves from /run (root-only) to /tmp (world-writable)
# (Skipped entirely in demo mode, where nginx is not installed.)
RUN if [ "$INSTALL_NGINX" = "1" ]; then \
      ln -sf /etc/nginx/sites-available/portico /etc/nginx/sites-enabled/portico \
      && rm -f /etc/nginx/sites-enabled/default \
      && setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx \
      && sed -i 's|pid /run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
      && chown -R irisowner:irisowner /var/lib/nginx; \
    fi
# Back to the image's default user: IRIS's registry files are owned by
# irisowner, and the `iris` CLI refuses to start an instance whose registry
# ownership does not match the running user ("Invalid registry ownership").
USER irisowner

# One-time setup runs at container start (NOT at build time — the IRIS instance
# data is created at container start, so a build-time `iris session` would hit a
# throwaway instance). This script starts nginx, creates the Portico user (so
# /api/admin Basic auth works), and best-effort registers the web apps.
# Idempotent — safe to run on every start.
COPY --chmod=755 portico-setup.sh /docker-entrypoint-initdb.d/00-portico-setup.sh

# Wrapper entrypoint (see entrypoint-portico.sh): starts /iris-main directly
# WITHOUT the -a hook, so the base image's broken docker_setup_* (irissqlcli /
# dbapi.connect) never runs and FATALs the container. It waits for the instance
# to be ready, then runs the setup script above.
COPY --chmod=755 entrypoint-portico.sh /entrypoint-portico.sh
ENTRYPOINT ["/tini", "--", "/entrypoint-portico.sh"]

EXPOSE 52773
EXPOSE 80

# Production: the nginx front on :80 must answer. Demo: nginx is absent, so
# probe the IRIS built-in web server on :52773 (any non-5xx response — even a
# 404 page — proves the web server is up).
HEALTHCHECK --interval=30s --timeout=15s --start-period=90s --retries=5 \
  CMD sh -c 'if command -v nginx >/dev/null 2>&1; then curl -sf http://localhost:80/ >/dev/null; else code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:52773/ 2>/dev/null); [ "$code" -lt 500 ]; fi'

# (No CMD: the wrapper ENTRYPOINT starts /iris-main directly and runs the setup
# script. The base image's "iris --after ..." CMD is NOT used — its
# iris-after-start branch runs the broken docker_setup_* (irissqlcli /
# dbapi.connect) which FATALs the container on some 2026.2 builds. See
# entrypoint-portico.sh.)
