/**
 * substack-proxy — serves the Substack posts API to CI builds.
 *
 * Why this exists: Substack's Cloudflare hard-blocks datacenter IPs (GitHub
 * Actions gets 403 on every request), so the portfolio's refresh job cannot
 * fetch the API directly. This worker fetches from Cloudflare's network,
 * which Substack allows.
 *
 * Behavior:
 * - GET /substack/posts -> JSON array of posts
 * - Responses are stored in the Cache API for STALE_ENTRY_TTL_SECONDS, and
 *   served without touching Substack while younger than CACHE_TTL_SECONDS.
 *   Net effect: Substack is hit at most once per CACHE_TTL window instead
 *   of on every CI run.
 * - If the cached entry is expired and Substack errors (e.g. 429 rate
 *   limit), the stale entry is served anyway. 502 only when there is no
 *   cached copy at all.
 *
 * Deploy ONLY from this repo: pnpm deploy:worker
 * Edits made in the Cloudflare dashboard will be overwritten.
 */

const UPSTREAM_URL =
  "https://theasymptotic.substack.com/api/v1/posts?limit=50";
const CACHE_TTL_SECONDS = 3600; // serve from cache for 1 hour
const STALE_ENTRY_TTL_SECONDS = 7 * 24 * 3600; // keep stale copy for 7 days

const UPSTREAM_HEADERS = {
  Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
};

function ageSeconds(response) {
  const fetchedAt = Number(response.headers.get("x-fetched-at") || 0);
  return (Date.now() - fetchedAt) / 1000;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/substack/posts") {
      return new Response("Not found", { status: 404 });
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);

    const cached = await cache.match(cacheKey);
    if (cached && ageSeconds(cached) < CACHE_TTL_SECONDS) {
      return cached;
    }

    let upstream;
    try {
      upstream = await fetch(UPSTREAM_URL, { headers: UPSTREAM_HEADERS });
      if (!upstream.ok) {
        throw new Error(`Upstream Substack error: ${upstream.status}`);
      }
    } catch (err) {
      if (cached) {
        return cached; // stale is better than down
      }
      return new Response(String(err), { status: 502 });
    }

    const response = new Response(await upstream.text(), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, max-age=${STALE_ENTRY_TTL_SECONDS}`,
        "x-fetched-at": String(Date.now()),
      },
    });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  },
};
