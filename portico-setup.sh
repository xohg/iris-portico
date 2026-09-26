#!/bin/bash
# IRIS Portico — one-time setup.
#
# Runs at container start via the entrypoint's --after hook, which executes
# BEFORE the docker_setup_* functions (docker_setup_namespace FATALs on the
# broken irissqlcli, and docker_setup_username is skipped because IRIS_PASSWORD
# is unset). So this is the ONLY reliable place to provision the instance.
#
# It creates the Portico user with %All privileges so that /api/admin Basic
# auth works, then best-effort registers the web apps (may fail; non-fatal).
# Idempotent — safe to re-run on every start.

# 0. Start nginx (serves the Angular SPA on :80 and proxies /api/admin to the
#    built-in IRIS web server on :52773). Runs before the docker_setup FATAL so
#    the frontend is available even if the image's setup functions fail.
if command -v nginx >/dev/null 2>&1; then
    nginx -t >/dev/null 2>&1 && nginx >/dev/null 2>&1 \
        && echo "[portico-setup] nginx started on :80" \
        || echo "[portico-setup] nginx not started (already running or config error)"
fi

echo "[portico-setup] creating user Portico (runs before docker_setup FATAL)..."
iris session $ISC_PACKAGE_INSTANCENAME -U%SYS <<-'EOSESS' > /dev/null
set exists = ##class(Security.Users).Exists("Portico", .user)
if 'exists { set sc = ##class(Security.Users).Create("Portico", "%All", "Portico123") }
if exists,$isobject(user) { set user.PasswordExternal = "Portico123", sc = user.%Save() }
halt
EOSESS
echo "[portico-setup] user step done."

# 2. Load + compile the portico.* classes (best-effort). Uses the same `iris session`
#    heredoc form that reliably created the user above. A timeout guards against
#    a session that hangs (some image builds block on the session prompt): if
#    it does, the BFF is simply unavailable (non-fatal) and the frontend still
#    works via nginx.
echo "[portico-setup] loading portico.* classes (load + compile)..."
timeout 60 iris session $ISC_PACKAGE_INSTANCENAME -U%SYS <<-'EOSESS' > /dev/null
load /irisdev/src/portico/Install.cls
compile portico.Install
load /irisdev/src/portico/Service/LogAggregator.cls
compile portico.Service.LogAggregator
load /irisdev/src/portico/Web/Api.cls
compile portico.Web.Api
load /irisdev/src/portico/UnitTest.cls
compile portico.UnitTest
halt
EOSESS
echo "[portico-setup] class load done (exit $?)."

# 3. Register the web apps (frontend + BFF). Non-fatal on failure.
iris session $ISC_PACKAGE_INSTANCENAME -U%SYS <<-'EOSESS' > /dev/null
try {
  do ##class(portico.Install).Run()
  write "web apps registered", !
} catch (e) {
  write "web-app registration failed (non-fatal): ", e.GetMessage(), !
}
halt
EOSESS
echo "[portico-setup] done."
