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
            ; Embedded quotes are doubled (ObjectScript has no backslash
            ; escapes — a bare backslash in a string literal is literal).
            write "{"error"":""unknown action. use ?action=health or ?action=logcenter""}"
        }
    } catch ex {
        write "{"error"":""_..jsonEscape(ex.Message)_""}"
    }
}

/// Emit the health JSON.
Method %Health()
{
    set ns   = $system.Namespace.Current()
    set ver  = $system.OSystem.GetVersion()
    set prod = $system.OSystem.GetProductName()
    set mode = $system.Status.GetMode()

    ; Precompute the escaped values into variables — a quoted string literal
    ; cannot be nested inside a _..._ interpolation that is itself inside a
    ; quoted string, so we escape first, then interpolate the variable.
    set ok    = ..jsonEscape("ok")
    set app   = ..jsonEscape("IRIS Portico BFF")
    set nse   = ..jsonEscape(ns)
    set prodE = ..jsonEscape(prod)
    set verE  = ..jsonEscape(ver)
    set modeE = ..jsonEscape(mode)
    set timeE = ..jsonEscape($ztimestamp)

    ; Embedded quotes are doubled (ObjectScript has no backslash escapes).
    set out = "{"status"":""_ok_"""
    set out = out ","app"":""_app_"""
    set out = out ","namespace"":""_nse_"""
    set out = out ","product"":""_prodE_"""
    set out = out ","version"":""_verE_"""
    set out = out ","systemMode"":""_modeE_"""
    set out = out ","time"":""_timeE_"""
    set out = out "}"
    write out
}

/// Escape a string for safe embedding in a JSON string literal.
Function jsonEscape(s As %String) As %String
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
