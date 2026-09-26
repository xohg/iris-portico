#!/bin/bash
# IRIS Portico — one-time setup.
#
# Runs at container start via the wrapper entrypoint (entrypoint-portico.sh),
# which starts /iris-main WITHOUT the base image's -a hook — so the broken
# docker_setup_* (irissqlcli / dbapi.connect) never runs. This is the ONLY
# reliable place to provision the instance. The entrypoint waits for SIGN-ON
# to be ready before calling this, so the `iris session` calls below succeed.
#
# It creates the Portico user with %All privileges (so /api/admin Basic auth
# works) and registers the web apps. Both are security operations — they
# auto-commit and PERSIST. Idempotent — safe to re-run on every start.
#
# NOTE on the `iris session` shell: it is a limited command processor. It
# supports set/write/do/if/halt, but NOT try/catch, if/else, or
# commit/rollback. It executes the heredoc line-by-line, so the statements
# below are kept flat (no unsupported structure).

# 0. Start nginx (serves the Angular SPA on :80 and proxies /api/admin to the
#    built-in IRIS web server on :52773). Production only — absent in demo.
if command -v nginx >/dev/null 2>&1; then
    nginx -t >/dev/null 2>&1 && nginx >/dev/null 2>&1 \
        && echo "[portico-setup] nginx started on :80" \
        || echo "[portico-setup] nginx not started (already running or config error)"
fi

# 1. Prepare the gateway. The IRIS web gateway does not auto-serve an index
#    file for a directory request, so map the app root to the SPA entry point.
#    Idempotent append to the local config (included by httpd.conf).
grep -q 'RedirectMatch 302 ^/csp/portico/?$ /csp/portico/index.html' \
    /usr/irissys/httpd/conf/httpd-local.conf 2>/dev/null || \
    echo 'RedirectMatch 302 ^/csp/portico/?$ /csp/portico/index.html' \
        >> /usr/irissys/httpd/conf/httpd-local.conf

# Start the IRIS built-in web server (gateway) on :52773 if it is not already
# listening (the instance's private webserver may have started it during
# startup). Idempotent.
if (exec 3<> /dev/tcp/127.0.0.1/52773) 2>/dev/null; then
    exec 3>&- 3<&- 2>/dev/null
    echo "[portico-setup] httpd already listening on :52773"
else
    nohup /usr/irissys/httpd/bin/httpd -f /usr/irissys/httpd/conf/httpd.conf \
        -d /usr/irissys/httpd -c "Listen 52773" >/dev/null 2>&1 &
    echo "[portico-setup] httpd started on :52773"
fi

# Reload the httpd so it picks up the RedirectMatch appended above. The
# instance's private webserver starts during IRIS startup — BEFORE this script
# appends the RedirectMatch — so it loaded httpd-local.conf without it and must
# be told to re-read the config. A graceful HUP re-reads the config and
# restarts the workers (keeping :52773). Harmless if we just started it.
hpid=$(pgrep -f '/usr/irissys/httpd/bin/httpd' | head -1)
if [ -n "$hpid" ]; then
    kill -HUP "$hpid" 2>/dev/null
    echo "[portico-setup] httpd reloaded (picked up RedirectMatch)"
else
    echo "[portico-setup] httpd reload skipped (no master found)"
fi

# 2. Create the Portico user with %All privileges. Security operation —
#    persists. Idempotent (create-or-update).
echo "[portico-setup] creating user Portico..."
iris session $ISC_PACKAGE_INSTANCENAME -U%SYS <<-'EOSESS' > /dev/null
set exists = ##class(Security.Users).Exists("Portico", .user)
if 'exists { set sc = ##class(Security.Users).Create("Portico", "%All", "Portico123") }
if exists,$isobject(user) { set user.PasswordExternal = "Portico123", sc = user.%Save() }
halt
EOSESS
echo "[portico-setup] user step done."

# 3. Register the frontend web app (serves the Angular SPA from /irisdev/web).
#    Security operation — persists. Idempotent (re-saving leaves it intact).
#    Does NOT depend on the portico.* classes (which do not persist via this
#    CLI: the `iris session` shell has no `commit`, so class compilation
#    rolls back at `halt`).
echo "[portico-setup] registering /csp/portico web app..."
iris session $ISC_PACKAGE_INSTANCENAME -U%SYS <<-'EOSESS' > /dev/null 2>&1
set app = ##class(Security.Applications).%New()
set app.Name = "/csp/portico"
set app.Path = "/irisdev/web"
do app.%Save()
halt
EOSESS
echo "[portico-setup] web app step done."

# 4. Best-effort: register the BFF web app (bonus). The dispatch class
#    (portico.Web.Api) does not persist in this build, so this is informational
#    only — the frontend above is the primary deliverable. Non-fatal.
iris session $ISC_PACKAGE_INSTANCENAME -U%SYS <<-'EOSESS' > /dev/null 2>&1
set app = ##class(Security.Applications).%New()
set app.Name = "/csp/portico-api"
set app.Path = ""
do app.%Save()
halt
EOSESS
echo "[portico-setup] done."
