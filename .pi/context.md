# Session Context
<!-- Saved 2026-05-18 -->

## Project Anchor
- Project: `eeshans-portfolio` — Portfolio rebuild for eeshans.com
- Working directory: `/Users/eeshans/dev/eeshans-portfolio`
- Branch: `main`
- Latest commit at save: empty repo (only internal_docs/ and mockups/ exist)
- Working tree at save: untracked files only (mockups/, internal_docs/, .pi/, .claude/, .codex/)

## User Preferences / Constraints (still active)
- Production portfolio (`eeshans.com`) still works; this repo is the rebuild
- No hidden fallbacks or redundant implementations; one clear way to do things
- User controls the dev server. Do not start one unless asked
- Do not push commits
- Projects detail pages are not wanted — `/projects/` is the single project experience
- Prefer content-driven data; no manufactured frontmatter
- Content must be separated from presentation (key architectural requirement)
- Minimize custom code; maximize use of libraries/frameworks/tools
- Minimize custom implementation over out-of-the-box solutions
- More dependencies is fine as long as they reduce code
- DRY principles, reusability
- Dark mode is required (light-only was just for mockups)
- No Brewfolio in project list
- No analysis route — link to external sites
- No Pagefind/search in V1

## What This Session Was

Continued from a previous session that produced PM analysis, design mockups, and architecture docs. This session focused on refining the architecture plan based on updated user preferences:

### Key changes from previous plan
1. **Tailwind v4** — User explicitly wants Tailwind, not custom CSS. Zero custom CSS files, all utility classes.
2. **shadcn/ui** — User wants shadcn for future extensibility. This means React islands for interactive components.
3. **React** — Added as a dependency (required by shadcn/ui). Only ships JS for interactive islands (ModeToggle, Sheet, etc.).
4. **Dark mode** — Required, not optional. shadcn's built-in dark mode system.
5. **No Keystatic** — Content Collections are sufficient. Git + MDX workflow.
6. **No Brewfolio** — Removed from project list.
7. **No analysis route** — Links to external sites only.
8. **No Pagefind** — Skipped for V1.
9. **lucide-react** — Icon library (shadcn default).
10. **No project detail pages** — Confirmed.

### Mockups (from previous session, still valid)
- `mockups/index.html` — Homepage (light editorial)
- `mockups/projects.html` — Full projects page
- `mockups/writing.html` — Full writing page
- `mockups/about.html` — Full about page

### Architecture doc updated
- `internal_docs/portfolio-architecture.md` — Updated with all tech stack decisions, Tailwind + shadcn + Content Collections, dark mode, no Brewfolio, no analysis route, no search.

## Important Files (still relevant)
- `internal_docs/portfolio-rebuild-analysis.md` — Full PM analysis (unchanged)
- `internal_docs/portfolio-architecture.md` — Architecture doc (UPDATED with new tech stack)
- `mockups/index.html` — Homepage mockup (reference for design)
- `mockups/projects.html` — Projects page mockup
- `mockups/writing.html` — Writing page mockup
- `mockups/about.html` — About page mockup

## Key Decisions (currently active)
- Fresh Astro 6 project with React integration (for shadcn islands)
- Tailwind CSS v4 (no custom CSS)
- shadcn/ui component library
- Astro Content Collections with Zod schemas
- Dark mode via shadcn's CSS variable system + inline script + ModeToggle
- Instrument Serif + Inter + JetBrains Mono via Google Fonts CDN
- lucide-react for icons
- Video shimmer placeholders (videos deferred to Phase 5)
- Fly.io + GitHub Actions for deployment

## Open Items
- Phase 1 has not started yet (no code in repo)
- Demo videos have not been recorded
- DNS cutover to new site has not happened
- Old repos (datascienceapps, es-portfolio) are still live in production
- Need to port Substack refresh script from datascienceapps

## Resume Plan
1. Initialize Astro 6 project with React + Tailwind v4 + MDX + shadcn/ui
2. Configure Tailwind theme tokens matching mockup palette
3. Set up content collections with Zod schemas
4. Create all content MDX files
5. Build visual layer (Phase 2)
6. Build pages (Phase 3)
7. Integration (Phase 4)
8. Demo videos (Phase 5)
9. Cutover (Phase 6)

## Notes
- `.env` exists locally in datascienceapps; do not print or commit secrets
- Final cutover remains intended for Fly app `soma-portfolio`
- User explicitly noted they're "ambitious and do a lot of stuff" — when a future session reaches a fork, default to the more ambitious option *and* the time-honest scope-down, present both