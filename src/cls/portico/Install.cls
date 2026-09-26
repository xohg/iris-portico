Class portico.Install Extends %RegisteredObject
{

/// One-time setup. Idempotent — safe to re-run.
///
/// Registers the two web applications in the current namespace:
///   - portico      : serves the built Angular frontend (static files) at /portico/
///   - portico-api  : serves the ObjectScript BFF (portico.Web.Api) at /portico-api/
///
/// The BFF is a bonus (health + server-side log aggregation). The frontend's
/// primary path is the system /api/admin, so a BFF registration failure is
/// non-fatal — the app degrades to client-side log aggregation.
Method Run()
{
    write !,"[portico.Install] Setting up IRIS Portico in namespace ", $system.Namespace.Current(), !

    // 1. Angular frontend (critical — the UI is served from here).
    do ..EnsureWebApp("portico", "/portico/", "/irisdev/web", "")

    // 2. BFF (best-effort; non-fatal on failure).
    try {
        do ..EnsureWebApp("portico-api", "/portico-api/", "", "portico.Web.Api")
    } catch ex {
        write !,"[portico.Install] BFF web app registration skipped (non-fatal): ", ex.Message
    }

    write !,"[portico.Install] Setup complete."
}

/// Create a web application if it does not already exist.
/// `dispatch` is the CSP class to dispatch to (empty for static-file apps).
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
