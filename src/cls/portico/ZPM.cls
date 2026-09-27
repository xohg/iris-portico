Class portico.ZPM
{

/// IPM/ZPM module descriptor for the `portico` package.
///
/// A standard ZPM module extends %IPM.Module, but that class is not present in
/// the Community Edition build this runs on (the IPM install here provides the
/// CLI + package tooling but not the %IPM.Module base class), so this is a
/// plain class. `ipm load` (which runs the full Initialize/Reload/Validate/
/// Compile/Activate lifecycle and commits the result) works with this form —
/// that is the only IPM command the setup script uses.

}
