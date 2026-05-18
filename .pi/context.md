# Session Context
<!-- Saved 2026-05-18 -->

## Project Anchor
- Project: `eeshans-portfolio` — Portfolio rebuild for eeshans.com
- Working directory: `/Users/eeshans/dev/eeshans-portfolio`
- Branch: `main`
- Latest commit: `e9e6943 feat: build visual layer and all 4 pages (Phase 2 & 3)`
- Working tree at save: clean

## User Preferences / Constraints (still active)
- Production portfolio (`eeshans.com`) still works; this repo is the rebuild
- No hidden fallbacks or redundant implementations; one clear way to do things
- User controls the dev server. Do not start one unless asked
- Do not push commits without asking
- Projects detail pages are not wanted — `/projects/` is the single project experience
- Prefer content-driven data; no manufactured frontmatter
- Content must be separated from presentation
- Minimize custom code; maximize use of libraries/frameworks/tools (see AGENTS.md)
- More dependencies is fine as long as they reduce code
- DRY principles, reusability (see AGENTS.md)
- Think root causes, not patches (see AGENTS.md)
- Minimize conditionals (see AGENTS.md)
- No hidden fallbacks; one way to do things; fail loudly (see AGENTS.md)
- Dark mode is required (light + dark)
- No Brewfolio
- No analysis route — link to external sites
- No Pagefind/search in V1

## What Was Done This Session

### Phase 1 — Foundation ✅ (committed as ba8e434)
- Initialized Astro 6 with React, MDX, Sitemap, Expressive Code
- Installed Tailwind CSS v4 + shadcn/ui (New York, zinc, CSS variables)
- 7 shadcn components: Button, Card, Badge, Separator, DropdownMenu, Sheet, Tooltip
- ModeToggle React component for dark/light/system
- Base layout with dark mode script + Google Fonts
- Content collections: projects, posts, experience, impact, other
- All content MDX files (6 projects, 9 posts, 7 experience, 5 impact, about)
- Site config + series metadata
- Build verified passing

### Phase 2 — Visual Layer ✅ (committed as e9e6943)
- 8 Astro components: ProjectCard, PostItem, SeriesCard, RecogItem, TimelineItem, SubscribeBox, SectionTitle, VideoShimmer
- Tailwind v4 @theme tokens (warm paper palette, accent, fonts)
- shadcn light + dark CSS variable themes
- @tailwindcss/typography plugin added

### Phase 3 — Pages ✅ (committed as e9e6943)
- Homepage (`/`) — intro, projects, writing, recognition, about teaser, subscribe
- Projects (`/projects`) — all projects grouped by category
- Writing (`/writing`) — series card + essays + publication
- About (`/about`) — bio, recognition, timeline, interests, social links
- All 4 pages build and render from content collections

### Not Yet Done (Phase 4+)
- Substack refresh pipeline (port from datascienceapps)
- PostHog analytics integration
- GitHub Activity system (port from datascienceapps)
- RSS feed
- robots.txt + sitemap
- 404 page
- Fly.io Dockerfile + fly.toml (reuse existing soma-portfolio app)
- GitHub Actions workflow (port from datascienceapps)
- Demo videos (Phase 5)
- DNS cutover (Phase 6)

## Key Technical Decisions
- Astro 6 + React islands (for shadcn/ui)
- Tailwind CSS v4 via @tailwindcss/vite
- shadcn/ui component library
- Dark mode via shadcn CSS variables + inline script + ModeToggle
- Content Collections with Zod (not Keystatic)
- lucide-react icons
- Google Fonts CDN (Instrument Serif, Inter, JetBrains Mono)
- Reuse existing Fly.io app `soma-portfolio` from datascienceapps
- GitHub Actions workflow to be ported from datascienceapps
- PostHog via PUBLIC_POSTHOG_KEY env var + api-v2.eeshans.com proxy
- GitHub Activity via GITHUB_TOKEN at build time, cached in .cache/
- Substack proxy via substack.eeshans.com
- Substack posts will be sourced from pipeline, not hardcoded MDX (placeholder MDX files exist now, to be replaced in Phase 4)

## Known Issues to Address
- Recognition items don't show years (impact collection doesn't have year data yet)
- Typography spacing and proportions need tuning against mockups
- Shimmer placeholders are functional but not pixel-matched to mockups
- The about page renders MDX content via `render()` — verify it looks correct in browser
- 404 page not yet created

## Important Files
- `internal_docs/portfolio-architecture.md` — Full architecture doc (updated this session)
- `internal_docs/portfolio-rebuild-analysis.md` — PM analysis (from prior session)
- `AGENTS.md` — Working principles (work in chunks, DRY, minimize code, root causes, no fallbacks)
- `mockups/` — HTML mockups for reference
- `src/content.config.ts` — Zod schemas for all collections
- `src/data/config.ts` — Site config
- `src/data/series.ts` — Series metadata
- `src/layouts/Base.astro` — Main layout with dark mode
- `src/styles/globals.css` — Tailwind + shadcn theme tokens

## Resume Plan
1. Run dev server and review visual output against mockups
2. Tune typography, spacing, and proportions
3. Begin Phase 4: Substack pipeline, PostHog, GitHub Activity, RSS, 404, Dockerfile, GitHub Actions
4. Address known issues (years in recognition, etc.)

## Notes
- `.env` not yet created; `.env.example` exists with required vars
- The `soma-portfolio` Fly.io app is already live serving eeshans.com
- `.cache/` directory will hold substack-feed.json and github-data.json at build time
- Final cutover = point existing Fly app to new repo, not a new app