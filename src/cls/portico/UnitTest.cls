Class portico.UnitTest Extends %UnitTest.TestCase
{

/// The BFF health endpoint returns a well-formed, non-empty JSON payload.
Method TestHealth()
{
    // We exercise the aggregator's system collection directly (no HTTP needed).
    set entries = ""
    set first = 1
    set count = 0
    do ##class(portico.Service.LogAggregator).CollectSystem(.entries, .first, .count)
    do $assert:true(count >= 2, "expected at least 2 system entries")
    do $assert:1($extract(entries, 1, 1) = "{", "entries should be a JSON array/object")
}

/// The log center build returns a valid JSON object with a count field.
Method TestRender()
{
    set result = ""
    try {
        set result = ##class(portico.Service.LogAggregator).BuildJSON(10, "system")
    } catch ex {
        do $assert:0("BuildJSON threw: "_ex.Message)
    }
    do $assert:true(result'="", "render output should be non-empty")
    do $assert:1($find("count", result) > 0, "output should contain a count field")
    do $assert:1($find("entries", result) > 0, "output should contain an entries field")
}

/// jsonEscape escapes quotes and backslashes.
Method TestJsonEscape()
{
    set out = ##class(portico.Service.LogAggregator).jsonEscape("""hello""")
    do $assert:1($find("\\"", out) > 0, "quote should be escaped")
    set out2 = ##class(portico.Service.LogAggregator).jsonEscape("a\b")
    do $assert:1($find("\\\\", out2) > 0, "backslash should be escaped")
}

}
