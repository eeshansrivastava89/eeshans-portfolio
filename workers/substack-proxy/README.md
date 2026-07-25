# substack-proxy worker

Cloudflare Worker serving `https://substack.eeshans.com/substack/posts` for the
portfolio's CI builds. Substack's Cloudflare blocks datacenter IPs (403), so
GitHub Actions cannot fetch the Substack API directly — this worker is the only
fetch path. There is intentionally no direct-API fallback in
`scripts/refresh-substack.mjs`.

- Caches upstream responses (1h fresh, serves stale up to 7 days on upstream
  errors like 429). Substack sees at most ~1 request/hour.
- **Deploy only from this repo:** `pnpm deploy:worker` (requires
  `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` in `.env.local`, gitignored).
- Dashboard edits are NOT a deploy pathway — they will be overwritten by the
  next repo deploy.
- `legacy-dashboard-worker.js` is the pre-migration dashboard code, kept for
  reference only. Do not deploy it.
