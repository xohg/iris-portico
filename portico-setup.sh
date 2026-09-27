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
# works), installs the IPM (ZPM) client, loads the BFF as a ZPM package
# (`ipm load` compiles + activates + commits the portico.* classes), and
# registers the web apps (frontend + BFF with its DispatchClass). All of these
# persist. Idempotent — safe to re-run on every start.
#
# NOTE on the `iris session` shell: it is a limited command processor. It
# supports set/write/do/if/halt, but NOT try/catch, if/else, or
# commit/rollback. It executes the heredoc line-by-line, so the statements
# below are kept flat (no unsupported structure). Class compilation is done by
# `ipm load` (which commits), not by this shell.

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

# 1b. Never cache index.html. The default server sends `Expires: +1h` with no
#     Cache-Control, so a plain F5 keeps serving the stale index (and with it
#     the stale main bundle + lazy chunks) for an hour after a redeploy —
#     users see the OLD app. `no-cache` forces a revalidation on every load;
#     the content-hashed chunks remain long-cacheable. headers_module is
#     statically built into the IRIS httpd, so this needs no LoadModule.
grep -q 'Header set Cache-Control "no-cache"' /usr/irissys/httpd/conf/httpd-local.conf 2>/dev/null || \
    printf '<Location "/csp/portico/index.html">\n    Header set Cache-Control "no-cache"\n</Location>\n' \
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

# 3. Install the IPM (ZPM) client. The IRIS instance data is ephemeral
#    (recreated on every container start), so the client must be installed on
#    every start. The installer is baked into the image (no internet needed at
#    start); loading it self-commits and persists the client. Idempotent.
echo "[portico-setup] installing IPM client..."
iris session $ISC_PACKAGE_INSTANCENAME -U%SYS <<-'EOSESS' > /dev/null 2>&1
do $system.OBJ.Load("/irisdev/ipm-installer.xml","ck")
halt
EOSESS
echo "[portico-setup] IPM client step done."

# 4. Load the ZPM package (the BFF). `ipm load` runs the full
#    Initialize/Reload/Validate/Compile/Activate lifecycle and COMMITS, so the
#    portico.* classes are compiled and persist — unlike the old direct-load
#    flow, which never compiled them. Idempotent.
export PATH="$HOME/.local/bin:$PATH"
echo "[portico-setup] loading ZPM package (BFF)..."
ipm -U %SYS "load -verbose /irisdev/src" 2>&1 | sed 's/^/[portico-setup] ipm: /'
echo "[portico-setup] ZPM load done."

# 5. Register the web apps (frontend + BFF with its DispatchClass). The BFF
#    registration sets spec("DispatchClass") = portico.Web.Api — the property
#    the old setup omitted, which is why the BFF used to 404. Idempotent.
echo "[portico-setup] registering web apps..."
iris session $ISC_PACKAGE_INSTANCENAME -U%SYS <<-'EOSESS' > /dev/null 2>&1
do ##class(portico.Install).Run()
halt
EOSESS
echo "[portico-setup] done."
