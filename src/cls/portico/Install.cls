Class portico.Install Extends %RegisteredObject
{

/// One-time setup. Idempotent — safe to re-run.
///
/// Registers (or updates) the two web applications in the current namespace:
///   - portico      : serves the built Angular frontend (static files) at
///                    /csp/portico/ with Fallback=index.html, so SPA deep links
///                    (e.g. /csp/portico/tasks) resolve when the IRIS built-in
///                    web server serves the UI (demo / minimal mode)
///   - portico-api  : serves the ObjectScript BFF (portico.Web.Api) at /csp/portico-api/
///
/// The BFF is a bonus (health + server-side log aggregation). The frontend's
/// primary path is the system /api/admin, so a BFF registration failure is
/// non-fatal — the app degrades to client-side log aggregation.
Method Run()
{
    write !,"[portico.Install] Setting up IRIS Portico in namespace ", $system.Namespace.Current(), !

    // 1. Angular frontend (the UI is served from here in demo mode; in
    //    production nginx serves the same files, so this is a bonus there).
    do ..EnsureWebApp("portico", "/portico/", "/irisdev/web", "", "index.html")

    // 2. BFF (best-effort; non-fatal on failure).
    try {
        do ..EnsureWebApp("portico-api", "/portico-api/", "", "portico.Web.Api")
    } catch ex {
        write !,"[portico.Install] BFF web app registration skipped (non-fatal): ", ex.Message
    }

    write !,"[portico.Install] Setup complete."
}

/// Create a web application if it does not already exist, and update it
/// either way (idempotent) — so re-runs also fix stale settings such as the
/// SPA fallback. `dispatch` is the CSP class to dispatch to (empty for
/// static-file apps); `fallback` is the file served for unknown paths (SPA
/// deep-link support).
Method EnsureWebApp(name As %String, wpath As %String, ppath As %String, dispatch As %String, fallback As %String = "")
{
    if $system.WebApplication.GetApplication(name) {
        write "  - ", name, " exists; updating settings."
    } else {
        write "  - creating ", name, " (", wpath, ")"
    }
    // Positional args: name, wpath, ppath, web, ssl, https, dispatch, fallback.
    do $system.WebApplication.UpdateApplication(name, wpath, ppath, 1, 0, 0, dispatch, fallback)
}

}
