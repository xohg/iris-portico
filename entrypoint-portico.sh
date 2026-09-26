#!/usr/bin/env bash
# IRIS Portico — wrapper entrypoint.
#
# The base image's entrypoint (/docker-entrypoint.sh) runs the `iris-after-start`
# branch, which — after eval'ing our --after setup script — calls
# docker_setup_namespace / docker_setup_username. Those use `docker_process_sql`
# (irissqlcli), which is broken on some 2026.2 builds ("Cannot call an
# iris.package wrapper ... dbapi.connect"). Because the base entrypoint runs
# under `set -Eeo pipefail`, that failure makes the iris-after-start command exit
# 256, /iris-main treats it as FATAL, and the container is shut down — even
# though our setup script (which runs FIRST via the --after hook) already
# succeeded.
#
# This wrapper avoids the broken docker_setup_* entirely: it starts /iris-main
# directly WITHOUT the -a hook (so docker_setup_* never runs), waits for the
# instance to be ready, then runs our idempotent setup script. The broken
# irissqlcli is never invoked.
set -u

# Start IRIS in the background (no -a hook, so docker_setup_* doesn't run).
# Mirror the base entrypoint's home/log setup.
pushd ~ >/dev/null 2>&1
touch iris-main.log
/iris-main --ISCAgent false &
PID=$!
popd >/dev/null 2>&1

# Clean shutdown on signals (mirror the base entrypoint's traps).
trap 'while kill -s SIGTERM "$PID" > /dev/null 2>&1; do wait "$PID"; done' TERM
trap 'while kill -s SIGINT  "$PID" > /dev/null 2>&1; do wait "$PID"; done' INT

# Wait for IRIS to be ready: the superserver listens on 1972 once the instance
# is up. Poll until it accepts a connection (timeout after ~180s).
ready=0
for i in $(seq 1 180); do
  if (exec 3<> /dev/tcp/127.0.0.1/1972) 2>/dev/null; then
    exec 3>&- 3<&- 2>/dev/null
    ready=1
    break
  fi
  sleep 1
done
if [ "$ready" = "1" ]; then
  echo "[entrypoint] IRIS superserver ready on 1972"
else
  echo "[entrypoint] WARNING: IRIS superserver not ready after 180s; running setup anyway"
fi

# Wait for SIGN-ON to be ready. The superserver (1972) comes up BEFORE the
# instance enables logons ("Enabling logons" is later in startup), so an
# `iris session` run too early fails with "Sign-on inhibited: Startup or
# Installation in progress" (exit 239). Retry a trivial session until it
# succeeds. A per-attempt timeout guards against a hung session; the loop cap
# is a safety net (sign-on is normally ready well before it is reached).
signon=0
for i in $(seq 1 120); do
  if timeout 10 iris session $ISC_PACKAGE_INSTANCENAME -U%SYS <<'EOSIGNON' 2>/dev/null
write "ok", !
halt
EOSIGNON
  then
    signon=1
    break
  fi
  sleep 1
done
if [ "$signon" = "1" ]; then
  echo "[entrypoint] IRIS sign-on ready"
else
  echo "[entrypoint] WARNING: IRIS sign-on not ready after 120 attempts; running setup anyway"
fi

# Run the one-time setup: starts nginx (if present), creates the Portico user,
# loads the portico.* classes, and best-effort registers the web apps.
# Idempotent — safe to run on every start.
if [ -x /docker-entrypoint-initdb.d/00-portico-setup.sh ]; then
  /docker-entrypoint-initdb.d/00-portico-setup.sh
fi

# Keep the container alive (IRIS runs as the background process).
wait "$PID"
