Class portico.Web.Api Extends %CSP.Page
{

/// BFF entry point. Routes on the ?action= query parameter.
///   ?action=health
///   ?action=logcenter&limit=N[&source=journal|audit|system|all]
Method OnExit()
{
    set ..Response.ContentType = "application/json"
    set action = ..Request.GetParameter("action")
    set limit  = ..Request.GetParameter("limit")
    set source = ..Request.GetParameter("source")
    if limit = "" { set limit = 100 }
    if source = "" { set source = "all" }

    try {
        if action = "health" {
            do .%Health()
        } else if action = "logcenter" {
            do ##class(portico.Service.LogAggregator).Render($zhval(limit), source)
        } else {
            write "{\"error\":\"unknown action. use ?action=health or ?action=logcenter\"}"
        }
    } catch ex {
        write "{\"error":"_..jsonEscape(ex.Message)_"}"
    }
}

/// Emit the health JSON.
Method %Health()
{
    set ns   = $system.Namespace.Current()
    set ver  = $system.OSystem.GetVersion()
    set prod = $system.OSystem.GetProductName()
    set mode = $system.Status.GetMode()

    set out = "{\"status":"_..jsonEscape("ok")_"
    set out = out ",\"app":"_..jsonEscape("IRIS Portico BFF")_"
    set out = out ",\"namespace":"_..jsonEscape(ns)_"
    set out = out ",\"product":"_..jsonEscape(prod)_"
    set out = out ",\"version":"_..jsonEscape(ver)_"
    set out = out ",\"systemMode":"_..jsonEscape(mode)_"
    set out = out ",\"time":"_..jsonEscape($ztimestamp)_"
    set out = out "}"
    write out
}

/// Escape a string for safe embedding in a JSON string literal.
Function jsonEscape(s As %String) As %String
{
    set s = $replace(s, "\", "\\")
    set s = $replace(s, """", ""\"""")
    set s = $replace(s, $char(10), "\n")
    set s = $replace(s, $char(13), "\r")
    set s = $replace(s, $char(9), "\t")
    quit s
}

}
