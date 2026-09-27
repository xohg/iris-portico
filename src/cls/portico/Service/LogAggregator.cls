Class portico.Service.LogAggregator
{

/// Render the unified log center as JSON.
///
/// Aggregates the sub-systems the SysAdmin API exposes separately into a single
/// stream — a capability the raw /api/admin does not provide.
///
/// Build notes (this IRIS 2026.2 CE build — verified empirically):
///   * String interpolation (_var_) does NOT expand, so all JSON is built with
///     `_` concatenation and $char(34) for quotes.
///   * $system.OSystem / $system.Namespace are absent and
///     $system.Status.GetMode() does not exist, so the "system" source reports
///     what is reliably available ($namespace, $ztimestamp).
///   * A ByRef argument does NOT propagate through two nested calls in this
///     build (BuildJSON -> CollectX -> AddEntry lost the value), so AddEntry is
///     invoked directly from BuildJSON (one level of ByRef, which works).
///   * $system.Audit / $system.Journal may be absent, and the exception object
///     exposes neither .Message nor .DisplayMessage, so every best-effort source
///     is wrapped in try/catch and any failure degrades to a single marker entry
///     whose detail is the $ze error text.
ClassMethod Render(limit As %Integer, source As %String)
{
    write ..BuildJSON(limit, source)
}

/// Build the unified log-center JSON and return it as a string (testable).
ClassMethod BuildJSON(limit As %Integer, source As %String) As %String
{
    set q = $char(34)
    set entries = ""
    set first = 1
    set count = 0

    // ---- system (reliably available subset) ------------------------------
    if (source = "all") || (source = "system") {
        do ..AddEntry(.entries, .first, .count, "system", "IRIS namespace", $namespace)
        do ..AddEntry(.entries, .first, .count, "system", "server time", $ztimestamp)
    }

    // ---- audit (best-effort; $system.Audit may be absent) ----------------
    if (source = "all") || (source = "audit") {
        try {
            set records = $system.Audit.GetRecords(1, limit)
            set i = 0
            while records.Next(.i) {
                do ..AddEntry(.entries, .first, .count, "audit", "audit event", $ze)
            }
        } catch ex {
            do ..AddEntry(.entries, .first, .count, "audit", "audit source unavailable", $ze)
        }
    }

    // ---- journal (best-effort; $system.Journal may be absent) ------------
    if (source = "all") || (source = "journal") {
        try {
            set files = $system.Journal.GetFiles()
            set i = 0
            while files.Next(.i) {
                set f = files.GetAt(i)
                do ..AddEntry(.entries, .first, .count, "journal", "journal file", f)
            }
        } catch ex {
            do ..AddEntry(.entries, .first, .count, "journal", "journal source unavailable", $ze)
        }
    }

    // ---- render ---------------------------------------------------------
    if entries = "" { set entries = "[]" }
    quit "{" _ q _ "count" _ q _ ":" _ count _ "," _ q _ "entries" _ q _ ":" _ entries _ "}"
}

/// Append one entry to the JSON array (handles the first-element comma).
/// Called directly from BuildJSON so the ByRef chain stays one level deep.
ClassMethod AddEntry(ByRef entries, ByRef first, ByRef count, source As %String, message As %String, detail As %String)
{
    set q = $char(34)
    set ts = $ztimestamp
    set sE = ..jsonEscape(source)
    set mE = ..jsonEscape(message)
    set dE = ..jsonEscape($extract(detail, 1, 500))
    set tE = ..jsonEscape(ts)
    set obj = "{" _ q _ "source" _ q _ ":" _ q _ sE _ q
    set obj = obj _ "," _ q _ "timestamp" _ q _ ":" _ q _ tE _ q
    set obj = obj _ "," _ q _ "message" _ q _ ":" _ q _ mE _ q
    set obj = obj _ "," _ q _ "detail" _ q _ ":" _ q _ dE _ q
    set obj = obj _ "}"
    if first {
        set entries = obj
        set first = 0
    } else {
        set entries = entries _ "," _ obj
    }
    set count = count + 1
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
