Class portico.Install Extends %RegisteredObject
{

/// One-time setup. Idempotent — safe to re-run.
///
/// Registers (or updates) the two web applications in %SYS:
///   - /csp/portico      : serves the built Angular frontend (static files)
///                         from /irisdev/web — the IRIS built-in web server
///                         serves the SPA in demo / minimal mode; in production
///                         nginx serves the same files, so this is a bonus there
///   - /csp/portico-api  : dispatches every request to the ObjectScript BFF
///                         (portico.Web.Api) via the DispatchClass property
///
/// The BFF is a bonus (health + server-side log aggregation). The frontend's
/// primary path is the system /api/admin, so a BFF registration failure is
/// non-fatal — the app degrades to client-side log aggregation.
///
/// Uses the documented Security.Applications API (Create/Modify with a spec
/// array). The dispatch class is set with spec("DispatchClass"); the previous
/// setup omitted it, which is why the BFF used to 404.
///
/// Note: IRIS web-application definitions have no "fallback" setting, so SPA
/// deep links (e.g. /csp/portico/tasks) are not auto-redirected to index.html
/// by the built-in web server. In demo mode, enter via the app root
/// /csp/portico/ (which serves index.html); the client-side router then
/// handles in-app navigation.
ClassMethod Run()
{
    write !,"[portico.Install] Setting up IRIS Portico in %SYS"

    // 1. Angular frontend (static files). In demo mode the built-in web
    //    server serves the SPA from here; in production nginx serves the same
    //    files, so this registration is a bonus there. Type 3 = CSP (file
    //    serving).
    do ..EnsureWebApp("/csp/portico", "/irisdev/web", "", 3)

    // 2. BFF (dispatch class; best-effort, non-fatal on failure). Type 2 =
    //    REST — required, because the DispatchClass property only applies to
    //    REST web applications (per the Security.Applications documatic).
    try {
        do ..EnsureWebApp("/csp/portico-api", "", "portico.Web.Api", 2)
    } catch ex {
        write !,"[portico.Install] BFF web app registration skipped (non-fatal): ", ex.Message
    }

    write !,"[portico.Install] Setup complete."
}

/// Create (or update) a web application with the documented spec-array form.
/// `ppath` is the physical path for static files (empty for the BFF);
/// `dispatch` is the class to dispatch all requests to (empty for the
/// static-file frontend app); `type` is 2 (REST, for the dispatch-class BFF)
/// or 3 (CSP, for the static-file frontend).
ClassMethod EnsureWebApp(name As %String, ppath As %String, dispatch As %String, type As %Integer)
{
    // Build the spec array. AutheEnabled=64 is AutheUnauthenticated (bit 6);
    // MatchRoles ":%All" grants the %All role so the demo is reachable.
    kill spec
    set spec("NameSpace") = "%SYS"
    set spec("Type") = type
    set spec("AutheEnabled") = 64
    set spec("MatchRoles") = ":%All"
    if ppath '= "" {
        set spec("Path") = ppath
    }
    if dispatch '= "" {
        set spec("DispatchClass") = dispatch
    }

    if ##class(Security.Applications).Exists(name) {
        do ##class(Security.Applications).Modify(name, .spec)
        write "  - updated ", name
    } else {
        do ##class(Security.Applications).Create(name, .spec)
        write "  - created ", name
    }
}

}
