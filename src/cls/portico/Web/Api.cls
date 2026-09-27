Class portico.Web.Api Extends %CSP.REST
{

/// REST BFF. A REST web application's DispatchClass must be a %CSP.REST
/// subclass that defines a UrlMap (per the official "Creating REST Services"
/// doc) — a plain %CSP.Page subclass is not dispatched by a REST app, which
/// is why the earlier version 500'd. Routes (path-based):
///   GET /health
///   GET /logcenter?limit=N[&source=journal|audit|system|all]
///
/// Query parameters are read via %request.Data (the documented form for
/// query-string params in a REST service).
///
/// Build notes (this IRIS 2026.2 CE build — verified empirically):
///   * %CSP.REST.DispatchRequest invokes a UrlMap handler as a FUNCTION and
///     requires it to return a value (#5002 otherwise), so each handler ends
///     with `quit 1` (a valid %Status).
///   * String interpolation (_var_) does NOT expand in this build — JSON is
///     built with `_` concatenation and $char(34) for quotes.
///   * $system.OSystem / $system.Namespace are absent and
///     $system.Status.GetMode() does not exist, so the health payload reports
///     what is reliably available ($namespace, $ztimestamp). Runtime errors are
///     not swallowed here — they propagate to the framework, which renders a
///     structured 500 error body.

XData UrlMap
{
<Routes>
  <Route Url="/health" Method="GET" Call="Health" />
  <Route Url="/logcenter" Method="GET" Call="LogCenter" />
</Routes>
}

/// Emit the health JSON.
ClassMethod Health()
{
    set %response.ContentType = "application/json"
    set q = $char(34)
    set okE   = ..jsonEscape("ok")
    set appE  = ..jsonEscape("IRIS Portico BFF")
    set nseE  = ..jsonEscape($namespace)
    set timeE = ..jsonEscape($ztimestamp)
    set out = "{" _ q _ "status" _ q _ ":" _ q _ okE _ q
    set out = out _ "," _ q _ "app" _ q _ ":" _ q _ appE _ q
    set out = out _ "," _ q _ "namespace" _ q _ ":" _ q _ nseE _ q
    set out = out _ "," _ q _ "time" _ q _ ":" _ q _ timeE _ q
    set out = out _ "}"
    write out
    quit 1
}

/// Emit the log center JSON (delegates to the aggregator).
ClassMethod LogCenter()
{
    set %response.ContentType = "application/json"
    ; Query-string params via %request.Data(name, 1) — the 2nd arg is a numeric
    ; index (which occurrence), NOT a default. In this build Data() throws
    ; <UNDEFINED> when the param is absent (rather than returning ""), so each
    ; read is wrapped in try/catch. Defaults are applied with $select (plain if
    ; blocks raise <SYNTAX> in this build).
    set d = ""
    try {
        set d = %request.Data("limit", 1)
    } catch ex {
        set d = ""
    }
    set d = $select(d = "": "100", 1: d)
    set limit = +d
    set limit = $select(limit = 0: 100, 1: limit)
    set source = ""
    try {
        set source = %request.Data("source", 1)
    } catch ex {
        set source = ""
    }
    set source = $select(source = "": "all", 1: source)
    do ##class(portico.Service.LogAggregator).Render(limit, source)
    quit 1
}

/// Escape a string for safe embedding in a JSON string literal.
ClassMethod jsonEscape(s As %String) As %String
{
    ; Backslash and quote are built with $char() — a bare backslash in an
    ; ObjectScript string literal is literal (no escapes), so ""\""" would
    ; parse as an empty string followed by garbage.
    set s = $replace(s, $char(92), $char(92) _ $char(92))
    set s = $replace(s, $char(34), $char(92) _ $char(34))
    set s = $replace(s, $char(10), "\n")
    set s = $replace(s, $char(13), "\r")
    set s = $replace(s, $char(9), "\t")
    quit s
}

}
