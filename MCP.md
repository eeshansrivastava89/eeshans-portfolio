# MCP servers — status and evidence

Companion to the MCP rules in `AGENTS.md`. Detail lives here so the instructions stay short.

| Service | Type | Guard | Status |
|---|---|---|---|
| PostHog | remote (`mcp.posthog.com/mcp`) | read-only personal key: every `*:write` scope missing | ✅ connected; gap: data-quality create/update/delete are not scope-gated |
| Supabase | remote (`mcp.supabase.com/mcp`) | `?project_ref=nazioidbiydxduonenmb&read_only=true&features=database,debugging,docs` | ✅ connected; session reports `transaction_read_only=on` |
| Cloudflare | remote, Code Mode (`mcp.cloudflare.com/mcp`) | "Read all resources" API token | ✅ connected; writes refused |
| WordPress | remote (`public-api.wordpress.com/wpcom/v2/mcp/v1`) | MCP per-tool toggles at wordpress.com/me/mcp | ⚠️ connected; the admin REST token bypasses the toggles |
| Substack | none official | — | ✗ not connected |

## Verified tool surfaces

- **Supabase:** `execute_sql`, `list_tables`, `list_extensions`, `list_migrations`, `get_advisors`, `query_logs`, `search_docs`. No migration/deploy/create-project/branching/storage/account tools.
- **Cloudflare:** reads `200` for Workers scripts, KV namespaces, DNS records, account + zone. Write probes refused (`No access to the specified resource`, `10000 auth`). Zone Analytics is `1015` (API sunset → GraphQL), not auth.
- **WordPress:** MCP refuses `posts.delete` / `pages.delete` ("disabled in your MCP settings"). The same token, used directly, created a post, force-deleted it, and wrote to a real draft — all via `/rest/v1`. Toggles are policy, not a boundary.

## Why the WordPress bypass exists

WordPress.com issues one OAuth token with the account's full role authority and no audience binding. The MCP server accepts it as-is, so it is equally valid against the REST API. That is the "token passthrough" the MCP spec forbids — servers MUST reject tokens not issued for them. No local fix: DSH's bash sandbox confines file effects only, and the token is readable by the same user who runs the shell.

## Pinned reminder plugin

`tools/dsh-plugins/pinned-api-rule` re-injects the MCP/write rule every N steps, because AGENTS.md is loaded once per session and can compact away.

- Installed through the DSH **Plugins** page as a bundle (`dsh.bundle.patch` → `cordis.patch.yml`).
- Configured by `~/.dsh/pinned-api-rule.json`, re-read every step: `{ "text": "...", "everySteps": 3 }`. Missing file uses the defaults; an invalid file keeps the defaults and says so in the injected message.
- The plugin must declare `inject = ["agents"]`, or it registers before the pre-step service exists.
- Verified 2026-10-17: loads from the profile, 4 `pinned-api-rule` messages in the session log.

## Open work

1. **PostHog tightening** — add `?features=core,product_analytics,insights,sql,flags,experiments,web_analytics,dashboards` to drop the unguarded data-quality tools. Installer: `.pi/tools/dsh-mcp.py posthog`.
2. **Substack** — no official server; needs a local read-only MCP over the public API/snapshot.
3. **WordPress issue report** — spec quotes + repro, to `Automattic/mcp-wordpress-remote` or WordPress.com support.
4. **WordPress local proxy (optional)** — a Worker holding the token and exposing taxonomy-only operations would be the only deterministic fix that keeps MCP usable.
