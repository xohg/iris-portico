/**
 * Minimal, framework-agnostic HTTP transport.
 *
 * Uses an injectable `fetch` so the same client runs in the browser (Angular /
 * React / Vue) and in Node (tests / BFF). No framework imports.
 */

export type FetchLike = (url: string, init?: RequestInitLike) => Promise<ResponseLike>;

// We define our own minimal request/response shapes so we do not depend on the
// DOM lib at compile time (the client must also type-check in a Node context).
export interface RequestInitLike {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

export interface ResponseLike {
  status: number;
  ok: boolean;
  headers: { get(name: string): string | null };
  json(): Promise<any>;
  text(): Promise<string>;
}

/** Build a URL from a base path + optional query parameters. */
export function buildUrl(base: string, path: string, query?: Record<string, unknown>): string {
  let url = base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path);
  if (query) {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
    if (parts.length) url += (url.includes('?') ? '&' : '?') + parts.join('&');
  }
  return url;
}

/** Perform a request and return the parsed JSON body (or raw text on non-JSON). */
export async function request(
  fetchImpl: FetchLike,
  method: string,
  url: string,
  opts: { headers?: Record<string, string>; body?: unknown; signal?: AbortSignal } = {},
): Promise<{ status: number; data: any; location: string | null }> {
  const init: RequestInitLike = {
    method,
    headers: { Accept: 'application/json', ...(opts.headers || {}) },
  };
  if (opts.body !== undefined) {
    init.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body);
    init.headers = { ...init.headers, 'Content-Type': 'application/json' };
  }
  if (opts.signal) init.signal = opts.signal;

  const res = await fetchImpl(url, init);
  const ct = res.headers.get('content-type') || '';
  let data: any;
  if (ct.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = text;
    }
  }
  // `location` carries the async task id for `202 + Location` responses.
  return { status: res.status, data, location: res.headers.get('location') };
}
