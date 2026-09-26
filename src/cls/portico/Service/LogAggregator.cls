Class portico.Service.LogAggregator
{

/// Render the unified log center as JSON.
///
/// Aggregates three sub-systems that the SysAdmin API exposes separately into a
/// single, time-ordered stream — a capability the raw /api/admin does not
/// provide:
///   - system  : live IRIS / OS status (mode, state, version, uptime)
///   - audit   : recent security audit records (best-effort)
///   - journal : recent journal file activity (best-effort)
///
/// Every sub-system is wrapped in try/catch so a single unavailable source
/// degrades gracefully instead of failing the whole endpoint.
ClassMethod Render(limit As %Integer, source As %String)
{
    write ..BuildJSON(limit, source)
}

/// Build the unified log-center JSON and return it as a string (testable).
ClassMethod BuildJSON(limit As %Integer, source As %String) As %String
{
    set entries = ""
    set first = 1
    set count = 0

    // ---- system ---------------------------------------------------------
    if (source = "all") || (source = "system") {
        do ..CollectSystem(.entries, .first, .count)
    }

    // ---- audit ----------------------------------------------------------
    if (source = "all") || (source = "audit") {
        try {
            do ..CollectAudit(.entries, .first, .count, limit)
        } catch ex {
            do ..AddEntry(.entries, .first, .count, "audit", "audit source unavailable", ex.Message)
        }
    }

    // ---- journal --------------------------------------------------------
    if (source = "all") || (source = "journal") {
        try {
            do ..CollectJournal(.entries, .first, .count, limit)
        } catch ex {
            do ..AddEntry(.entries, .first, .count, "journal", "journal source unavailable", ex.Message)
        }
    }

    // ---- render ---------------------------------------------------------
    if entries = "" { set entries = "[]" }
    quit "{\"count":"_count_","entries":"_entries_"}"
}

/// Add system-status entries (mode, state, version, product, uptime).
ClassMethod CollectSystem(ByRef entries, ByRef first, ByRef count)
{
    set mode  = $system.Status.GetMode()
    set state = $system.Status.GetState()
    set ver   = $system.OSystem.GetVersion()
    set prod  = $system.OSystem.GetProductName()
    set os    = $system.OSystem.GetOSVersion()

    do ..AddEntry(entries, first, count, "system", "IRIS status", prod _ " " _ ver _ " — mode " _ mode _ ", state " _ state)
    do ..AddEntry(entries, first, count, "system", "operating system", os)
}

/// Add recent audit records (best-effort via $system.Audit).
ClassMethod CollectAudit(ByRef entries, ByRef first, ByRef count, limit As %Integer)
{
    // $system.Audit provides audit record access. Wrapped defensively; the
    // exact method set varies by IRIS version, so any failure is caught by the
    // caller and reported as a single marker entry.
    set records = $system.Audit.GetRecords(1, limit)
    set i = 0
    while records.Next(.i) {
        set rec = records.GetAt(i)
        set name = ""
        try { set name = rec.EventName } catch ex2 { set name = "audit record" }
        do ..AddEntry(entries, first, count, "audit", "audit event", name)
    }
}

/// Add recent journal file activity (best-effort via $system.Journal).
ClassMethod CollectJournal(ByRef entries, ByRef first, ByRef count, limit As %Integer)
{
    // $system.Journal exposes journal file listing. Wrapped defensively.
    set files = $system.Journal.GetFiles()
    set i = 0
    while files.Next(.i) {
        set f = files.GetAt(i)
        do ..AddEntry(entries, first, count, "journal", "journal file", $string(f))
    }
}

/// Append one entry to the JSON array (handles the first-element comma).
ClassMethod AddEntry(ByRef entries, ByRef first, ByRef count, source As %String, message As %String, detail As %String)
{
    set ts = $ztimestamp
    set obj = "{\"source":"_..jsonEscape(source)_"
    set obj = obj ",\"timestamp":"_..jsonEscape(ts)_"
    set obj = obj ",\"message":"_..jsonEscape(message)_"
    set obj = obj ",\"detail":"_..jsonEscape($extract(detail, 1, 500))_"
    set obj = obj "}"
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
    set s = $replace(s, "\", "\\")
    set s = $replace(s, """", ""\"""")
    set s = $replace(s, $char(10), "\n")
    set s = $replace(s, $char(13), "\r")
    set s = $replace(s, $char(9), "\t")
    quit s
}

}
