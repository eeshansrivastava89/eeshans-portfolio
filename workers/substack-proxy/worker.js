/**
 * substack-proxy — serves the Substack posts API to CI builds.
 *
 * Why this exists: Substack's Cloudflare hard-blocks datacenter IPs (GitHub
 * Actions gets 403 on every request), so the portfolio's refresh job cannot
 * fetch the API directly. This worker fetches from Cloudflare's network,
 * which Substack allows.
 *
 * Cache: ONE copy in KV (env.SUBSTACK_KV), readable from every Cloudflare
 * data center. The old Cache API store was per-data-center, so a request
 * landing somewhere that had never fetched the URL had nothing to fall back
 * on when Substack rate limited it, and returned 502 — roughly 1 in 10
 * scheduled CI runs. KV is global, so any data center can serve the last
 * good copy.
 *
 * Behaviour, in order:
 * - younger than FRESH_TTL_SECONDS -> serve the KV copy, no upstream call
 * - older, upstream OK             -> store the new copy and serve it
 * - older, upstream 429            -> wait Retry-After, retry once
 * - older, upstream failed         -> serve the stale KV copy
 * - no KV copy and upstream failed -> 502
 *
 * Deploy ONLY from this repo: pnpm deploy:worker
 * Edits made in the Cloudflare dashboard will be overwritten.
 */

const UPSTREAM_URL =
  "https://theasymptotic.substack.com/api/v1/posts?limit=50";
const CACHE_KEY = "posts";

// Longer than the ~6h the "4-hourly" schedule actually lands on, so most runs
// are answered from KV without touching Substack at all.
const FRESH_TTL_SECONDS = 6 * 3600;
// Ceiling on how stale a copy may get before KV drops it entirely.
const ENTRY_TTL_SECONDS = 30 * 24 * 3600;
// Honour Retry-After, but never stall a CI request longer than this.
const MAX_RETRY_WAIT_SECONDS = 5;

const UPSTREAM_HEADERS = {
  Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
};

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

function json(body, status, headers = {}) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * Returns { body } on success or { error } on failure. A 429 is retried once
 * after waiting, because the whole point of the KV copy is to make rate
 * limiting the caller's problem rather than CI's.
 */
async function fetchUpstream() {
  const errors = [];
  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    try {
      response = await fetch(UPSTREAM_URL, { headers: UPSTREAM_HEADERS });
    } catch (err) {
      errors.push(String(err));
      break;
    }

    if (response.ok) {
      return { body: await response.text() };
    }

    errors.push(`Upstream Substack error: ${response.status}`);
    if (response.status !== 429) break;

    const retryAfter = Number(response.headers.get("retry-after")) || 2;
    await sleep(Math.min(retryAfter, MAX_RETRY_WAIT_SECONDS));
  }
  return { error: errors.join("; ") };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/substack/posts") {
      return new Response("Not found", { status: 404 });
    }

    const stored = await env.SUBSTACK_KV.get(CACHE_KEY, "json");
    const ageSeconds = stored ? (Date.now() - stored.fetchedAt) / 1000 : Infinity;

    if (stored && ageSeconds < FRESH_TTL_SECONDS) {
      return json(stored.body, 200, { "x-cache": "fresh" });
    }

    const upstream = await fetchUpstream();

    if (upstream.body) {
      await env.SUBSTACK_KV.put(
        CACHE_KEY,
        JSON.stringify({ body: upstream.body, fetchedAt: Date.now() }),
        { expirationTtl: ENTRY_TTL_SECONDS }
      );
      return json(upstream.body, 200, { "x-cache": "refreshed" });
    }

    if (stored) {
      return json(stored.body, 200, { "x-cache": "stale" }); // stale beats down
    }

    return json(
      `No Substack copy available and upstream failed (${upstream.error})`,
      502
    );
  },
};
