# Session Context
<!-- Saved 2026-05-17 -->

## Project Anchor
- Project: `es-portfolio` — Astro/Spectre-derived migration of `eeshans.com`.
- Working directory: `/Users/eeshans/dev/es-portfolio`
- Branch: `main`
- Latest commit at save: `f938b9c feat: polish portfolio UX`
- Working tree at save: clean.

## User Preferences / Constraints (still active)
- Production portfolio (`eeshans.com`) still works; this repo is the experiment, so we can pivot freely.
- No hidden fallbacks or redundant implementations; one clear way to do things.
- User controls the dev server. Do not start one unless asked.
- Do not push commits.
- Projects detail pages are not wanted — `/projects/` is the single project experience.
- Prefer content-driven data; no manufactured frontmatter.
- About page is the accepted layout baseline.

## What This Session Was
A long design discussion that started narrow (drawer polish) and walked all the way out to "what if the portfolio were a fleet of unified apps," then walked back in. No code was written. Only design exploration.

### The path we walked
1. **Start:** polish the `/projects` drawer (Sidequests-inspired layout, sticky header, SectionCards, slide-in animation, scroll lock, focus management). ~1 hr slice.
2. **Pivot 1:** instead of just porting visuals, bring Sidequests' data in. Build the portfolio from Sidequests' local SQLite (`/Users/eeshans/dev/sidequests/dev.db`) via a `--public` JSON export. Mac Mini cron runs scans, portfolio reads the snapshot. "Powered by Sidequests" framing makes the page market the app.
3. **Pivot 2:** broaden to the whole dev folder — federated portfolio. Each app (`sidequests`, `howiprompt`, `local-llm-visual-benchmark`, `quizzard`, `ab-simulator`) drops a `portfolio/` directory with `manifest.json` + optional `data.json` + optional `embed/` static bundle. Portfolio is a curator/aggregator. Iframes for live demos. Astro stays as the right tool (3 of 5 apps are already Astro).
4. **Pivot 3 (aspirational):** the "ideal" architecture — VS Code-style plugin shell. One repo, one React SPA shell (Vite + TanStack Router), one design system, one ~50-line `Module` contract. Each module registers routes/widgets/commands/server-routers. Backend optional via tRPC. Reference points: VS Code extension API, Vercel dashboard, Notion.
5. **Final scope-down:** user decided none of the above is happening near-term. Real plan: **improve the existing project gallery using screen-share demo videos** for each app.

### Final decision on what to actually build
- **Better project gallery with polished demo videos** for each app (Sidequests, HowIPrompt, LLM-Bench, Quizzard, AB-Simulator).
- **Tool recommendation:** Screen Studio (Mac, $89 one-time or trial) — 90% of polished demo videos online are made with it. Auto-zoom on clicks, smooth cursor, easy export.
- **Programmatic path (Playwright + Remotion) was explained but explicitly not chosen** — too much investment for one-time portfolio refresh; revisit only if regenerating 20+ videos per release.
- Per-video workflow: 45s take, 2–3 attempts, pick best, 1080p MP4 + WebM fallback + poster JPG, ~10–20 min per app. Whole gallery is 2 afternoons.

### Practical recording tips captured for later
- 1920×1200 viewport at 2x DPR; hide menu bar/dock; neutral wallpaper; mute notifications.
- Pre-populate test data so empty state isn't the first frame.
- No voiceover, no music — visual flow only.
- Loop-friendly endings so autoplay-loop thumbnails feel seamless.
- WebM/AV1 for thumbnails, MP4/H.264 for click-to-expand.

### Portfolio markup pattern for the gallery (sketch, not coded)
```html
<video autoplay muted loop playsinline preload="metadata" poster="…">
  <source src="…webm" type="video/webm" />
  <source src="…mp4"  type="video/mp4"  />
</video>
```
Card thumbnail = the autoplay loop. Click → drawer with higher-res version + caption. Existing drawer structure in `src/pages/projects.astro` is the host.

## Drawer Polish Plan (still on the table if user revisits)
From earlier in the session, recommended slice (all CSS + small JS, no deps):
1. Slide-in animation via `@starting-style` + transitions on `transform` / `opacity` for `.project-drawer` + `::backdrop`.
2. Body scroll lock — toggle `overflow: hidden` on `<html>` when any drawer is open.
3. Focus management — focus close button on open; restore focus to triggering row on close.
4. Meta row in drawer (Status · Date · Tech).
5. Drop the 720×440 image placeholder when `project.data.image` is missing.

(Not started. Skipped in favor of the architecture discussion, then deprioritized in favor of demo videos.)

## Sidequests Data Findings (for future reference, not for current work)
- SQLite at `/Users/eeshans/dev/sidequests/dev.db`. Prisma schema in `/Users/eeshans/dev/sidequests/prisma/schema.prisma`.
- Tables: `Project`, `Scan`, `Derived`, `Llm`, `Override`, `Metadata`, `GitHub`, `Activity` — covers everything the Sidequests drawer renders.
- `Metadata.publishTarget` field already exists — the natural hook for an opt-in "show on portfolio" flag.
- Drawer component reference: `/Users/eeshans/dev/sidequests/src/components/project-detail-pane.tsx` (687 LOC, React/Tailwind/Radix Sheet).

## Important Files (still relevant)
- Project index/drawer: `src/pages/projects.astro`
- Shared card treatment: `src/components/Card.astro`
- Shared list styling: `src/styles/globals.css`
- Writing page styling: `src/styles/article-list.css`
- Theme tokens: `src/styles/theme.css`
- Homepage project links: `src/pages/index.astro`
- Search fallback: `src/pages/pagefind/pagefind.js.ts`
- Content schema (projects collection): `src/content.config.ts`
- Migration plan: `internal_docs/migration-plan.md`

## Recent Commits
- `9da7e7e feat: port migration systems`
- `4be1d89 fix: polish homepage and writing UX`
- `f938b9c feat: polish portfolio UX`

## Next Steps When Resuming
1. **Primary:** record demo videos with Screen Studio for each app; update `/projects` to use video thumbnails + drawer with full-res playback.
2. Optional: do the small drawer polish slice (animation/scroll-lock/focus) if it'll improve how the videos feel inside the drawer.
3. Aspirational and deferred: Sidequests data integration, federated `portfolio/` contract, plugin-shell unification. All discussed at length, all parked.

## Notes
- `.env` exists locally and is ignored; do not print or commit secrets.
- Final cutover remains intended for Fly app `soma-portfolio`.
- User explicitly noted they're "ambitious and do a lot of stuff" — when a future session reaches a fork, default to the more ambitious option *and* the time-honest scope-down, present both.
