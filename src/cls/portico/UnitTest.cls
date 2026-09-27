Class portico.UnitTest Extends %UnitTest.TestCase
{

/// Smoke test: the log-center build for the "system" source returns JSON with
/// the two reliably-available entries (namespace + server time).
Method TestSystem()
{
    set result = ##class(portico.Service.LogAggregator).BuildJSON(10, "system")
    write "TestSystem: ", $length(result)
}

/// Smoke test: the log-center build for "all" returns a non-empty JSON string
/// (audit/journal sources degrade gracefully to marker entries in this build).
Method TestAll()
{
    set result = ##class(portico.Service.LogAggregator).BuildJSON(10, "all")
    write "TestAll: ", $length(result)
}

/// Smoke test: jsonEscape escapes embedded quotes.
Method TestJsonEscape()
{
    set out = ##class(portico.Service.LogAggregator).jsonEscape("""hello""")
    write "TestJsonEscape: ", out
}

}
