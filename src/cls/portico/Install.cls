Class portico.Install Extends %RegisteredObject
{

/// One-time setup. Idempotent — safe to re-run.
///
/// Registers the two web applications in the current namespace if they do not
/// already exist (skips any that already exist, so re-runs are safe):
///   - portico      : serves the built Angular frontend (static files) at
///                    /csp/portico/ — the IRIS built-in web server serves the
///                    SPA in demo / minimal mode; in production nginx serves
///                    the same files, so this registration is a bonus there
///   - portico-api  : serves the ObjectScript BFF (portico.Web.Api) at /csp/portico-api/
///
/// The BFF is a bonus (health + server-side log aggregation). The frontend's
/// primary path is the system /api/admin, so a BFF registration failure is
/// non-fatal — the app degrades to client-side log aggregation.
///
/// Note: IRIS web-application definitions (Security.Applications) have no
/// "fallback" setting, so SPA deep links (e.g. /csp/portico/tasks) are not
/// auto-redirected to index.html by the built-in web server. In demo mode,
/// enter via the app root /csp/portico/ (which serves index.html); the
/// client-side router then handles in-app navigation.
Method Run()
{
    write !,"[portico.Install] Setting up IRIS Portico in namespace ", $system.Namespace.Current(), !

    // 1. Angular frontend (the UI is served from here in demo mode; in
    //    production nginx serves the same files, so this is a bonus there).
    do ..EnsureWebApp("portico", "/portico/", "/irisdev/web", "")

    // 2. BFF (best-effort; non-fatal on failure).
    try {
        do ..EnsureWebApp("portico-api", "/portico-api/", "", "portico.Web.Api")
    } catch ex {
        write !,"[portico.Install] BFF web app registration skipped (non-fatal): ", ex.Message
    }

    write !,"[portico.Install] Setup complete."
}

/// Register a web application if it does not already exist (idempotent —
/// skips any that already exist). `dispatch` is the CSP class to dispatch to
/// (empty for static-file apps).
///
/// Uses the validated positional form of $system.WebApplication.Create:
///   (name, wpath, ppath, web, ssl, https, dispatch)
/// Only these seven arguments are used, so no unverified trailing argument is
/// passed (Security.Applications has no "fallback" property).
Method EnsureWebApp(name As %String, wpath As %String, ppath As %String, dispatch As %String)
{
    if $system.WebApplication.GetApplication(name) {
        write "  - ", name, " already exists; skipping."
        quit
    }
    if dispatch = "" {
        do $system.WebApplication.Create(name, wpath, ppath)
    } else {
        // 7th positional argument is the DispatchClass.
        do $system.WebApplication.Create(name, wpath, ppath, 1, 0, 0, dispatch)
    }
    write "  - created ", name, " (", wpath, ")"
}

}
