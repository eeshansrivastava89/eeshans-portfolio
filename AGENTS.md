# Working Principles

## Work in chunks, pause after each one

Never sprint through multiple phases in one go. Work in discrete chunks — one logical unit of work at a time. After each chunk, pause and tell the user what was done, what's next, and whether anything needs a decision before continuing. The user decides when to proceed.

## Phase workflow (agreed with Eeshan, 2026-10-17)

The design/product audit runs phase by phase, tracked in `internal-docs/active/2026-10-17-design-product-audit.html`.

- Work through every task inside the **current phase**, chunk by chunk; never start the next phase on your own.
- Verify every visual change yourself: build, serve, then measure the DOM and take Playwright screenshots (390/640/960/1280/1920, light and dark). Never report a visual result you have not measured or seen.
- At the end of a phase run the full sweep (overflow, console errors, headings, type inventory, screenshots), update the tracker's checkboxes and done-notes, then **stop and wait for Eeshan's validation**.
- Only Eeshan's explicit approval starts the next phase.
- Keep `.pi/context.md` current at the end of each phase so a fresh session can resume.

## Maximize DRY, reusability, and composability

Every piece of logic should exist in exactly one place. If two components share behavior, extract it into a shared component, utility, or config. If a pattern appears more than once, generalize it. Reusable > repeated.

## Minimize code and custom implementations

Always reach for an existing library, framework, or tool before writing custom code. More dependencies is fine if they reduce the amount of code we own. The goal is to own as little custom logic as possible. Only write custom code when no off-the-shelf solution does what we need.

## Think in root causes, not patches

When something breaks or behaves unexpectedly, trace it to the root cause. Don't stack workarounds on top of symptoms. Fix the underlying issue — whether that's a schema mismatch, a config error, a wrong abstraction, or a structural problem. One correct fix is better than three compensating patches.

## Minimize conditionals

When fixing bugs or adding features, don't solve problems by adding `if/else` branches. Conditionals accumulate complexity. Instead, restructure so the correct path is the only path. A function that handles two cases cleanly is better than a function that handles five cases with nested guards.

## No hidden fallbacks. One way to do things. Fail loudly.

Every feature should have exactly one implementation path. No silent fallbacks, no "try X, then Y, then Z" chains that mask which path actually ran. If something fails, it should fail with a clear error — not fall through to a default that hides the problem. Implicit behavior is a bug waiting to happen. Make the happy path explicit and the error path visible.

## MCPs are the only path to their services (2026-10-17)

When an MCP server exists for a service, **every read and write goes through that server**. Never call the service's REST/GraphQL API directly — not with `curl`, not from a script, not by reading the credential out of `cordis.patch.yml` or any other config.

That includes the case where the MCP **refuses** an operation. A refusal is the answer, not an obstacle to route around. If the MCP cannot do what is needed, say so and stop.

- **Only exception:** explicit, per-call approval from Eeshan for a named operation. State the exact call, get a yes, then report the result.
- **Why:** MCP write-toggles are policy on that server, while the stored token is usually a broader credential. A direct API call silently bypasses the guard the user configured. Proven on WordPress: `posts.delete` was refused by MCP, and the same token force-deleted a post via `/rest/v1`.
- **Diagnostics are not an exception.** Probing an API to check scope must go through the MCP, or be approved first.

## MCP servers — environment contract (2026-10-17)

Goal: Substack, WordPress, PostHog, Supabase and Cloudflare available to agents on this machine, with **no ability to mutate data by accident**. Protection must be deterministic — enforced by a credential, a server-side filter, or a server we own — never by the model choosing not to call something.

DSH enforces **no per-tool allow/deny for MCP**. Its permission presets govern only the shell/file sandbox and approval prompt. So every guarantee must live in one of these three layers:

1. **Credential scope** — read-only tokens, enforced by the vendor.
2. **MCP URL filters** — server-side read-only mode or feature/tool allowlists.
3. **A server we own** — a local stdio MCP exposing only read tools.

Status at the last review:

| Service | Server | Endpoint | Guard | Status |
|---|---|---|---|---|
| PostHog | official remote | `mcp.posthog.com/mcp` | read-only personal key: every `*:write` scope missing | **connected**; gap: `data-quality-check-{create,update,delete}` are not scope-gated |
| WordPress | wpcom MCP | `public-api.wordpress.com/wpcom/v2/mcp/v1` | MCP per-tool toggles (wordpress.com/me/mcp) — but the admin REST token can bypass them | **connected — two pathways** 2026-10-17: MCP refuses `posts.delete`; the same token creates + force-deletes posts via `/rest/v1` |
| Substack | none official | — | — | **not connected** |
| Supabase | official remote | `mcp.supabase.com/mcp` | `?project_ref=nazioidbiydxduonenmb&read_only=true&features=database,debugging,docs` | **connected & verified** 2026-10-17: `transaction_read_only=on`, 7 read tools, no write tools |
| Cloudflare | official remote (Code Mode) | `mcp.cloudflare.com/mcp` | "Read all resources" API token (read-only by construction) | **connected & verified** 2026-10-17: writes denied, reads 200 |

Rules:

1. **Read-only is the default.** Never add write scopes to an everyday key. When a task genuinely needs a write (creating an experiment or a flag), mint a **second, task-narrow key**, use it, then revoke it.
2. **A server with no enforceable read-only mode gets replaced by one we own.** That is the plan for Substack, and for WordPress if its token cannot be narrowed. Both feeds are public and already fetched unauthenticated by `scripts/refresh-wordpress.mjs` / `refresh-substack.mjs`, so a local read-only MCP needs no credentials at all.
3. **"Enabled" means verified, not configured.** Enumerate the server's tools and assert no create/update/delete/archive/publish tool is visible. Record the date and the visible write surface in this section.
4. **Secrets** live only in `~/.dsh/profiles/desktop/cordis.patch.yml` (mode 0600) or the process environment — never in the repo, a commit, or chat.
5. **Prefer the vendor's read-only switch** over our own filtering. Custom filtering is a last resort and must be documented here.

Verified tool surfaces (re-check these when a server reconnects; drift means a new guard is needed):

- **Supabase:** `execute_sql`, `list_tables`, `list_extensions`, `list_migrations`, `get_advisors`, `query_logs`, `search_docs`. No `apply_migration`, `deploy_edge_function`, `create_project`, `create_branch`, storage-config or account tools. Session reports `transaction_read_only = on`.
- **WordPress (dual pathway, verified 2026-10-17):** MCP reports `posts.delete`/`pages.delete` as "disabled in your MCP settings" and refuses them. But the stored OAuth token is an admin REST credential: `POST /rest/v1/sites/<id>/posts/new` created a post, `.../delete?force=true` permanently removed it, and a no-op `POST .../posts/1743` updated a real draft — all outside MCP. Toggles are policy, not a boundary.
- **Cloudflare:** reads `200` for Workers scripts, KV namespaces, DNS records, account + zone detail. Write probes both refused (`No access to the specified resource`, `10000 auth`), so the token is read-only. Zone Analytics is `1015` (API sunset → GraphQL), not an auth failure.

Known exceptions (re-check before trusting "read-only"):

- **PostHog:** `data-quality-check-create`, `-update` (and `-delete`, `destructiveHint: true`) are visible because those endpoints are not scope-gated. Close it with `?features=core,product_analytics,insights,sql,flags,experiments,web_analytics,dashboards` on the URL (drops the data-quality tools) or an explicit `?tools=` allowlist.

Enablement order — one server per chunk, verify before moving on:

1. **PostHog** — tighten the existing connection with the features allowlist.
2. **Supabase** — project-scoped, `read_only=true`, `features=database,docs`.
3. **Cloudflare** — read-only API token.
4. **WordPress** — replace the authenticated wpcom MCP with a local read-only MCP, or narrow the token if WordPress.com supports scoped tokens.
5. **Substack** — local read-only MCP over the public API / committed snapshot.

Each step ends with: tools enumerated, destructive surface empty or explicitly documented, the table above updated, and `.pi/context.md` refreshed.