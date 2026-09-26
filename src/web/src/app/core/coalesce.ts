/**
 * Nullish coalescing helper for Angular templates.
 *
 * The Angular AOT compiler + esbuild pipeline (Angular 18.2 / esbuild 0.23) has a
 * bug where a `??` (nullish coalescing) expression inside a template is lowered
 * to a temporary variable (`tmp_N_M`) whose declaration is dropped, producing
 * `ReferenceError: tmp_N_M is not defined` at runtime. The bug is latent — it
 * only throws when the surrounding `@for` actually iterates (i.e. when data
 * exists), which is why some screens appeared to "have no data".
 *
 * `coalesce` is a plain function call, so the compiler emits it verbatim and
 * esbuild has no `??` to lower. It preserves the original defensive behaviour
 * (first non-null/undefined value wins) for any number of arguments.
 */
export function coalesce<T>(...values: (T | null | undefined)[]): T | null | undefined {
  for (const v of values) {
    if (v !== null && v !== undefined) return v;
  }
  return undefined;
}
