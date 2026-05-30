# Session Context
<!-- Last saved: 2026-05-29 -->

## Project Anchor
- Project: eeshans-portfolio (eeshans.com rebuild)
- Goal: Rebuild portfolio with Astro 6 + React + Tailwind v4 + shadcn/ui — demo-first, content-driven, dark+light modes
- Current phase: Phase 5 complete → Phase 6 (deploy) next

## What We Were Doing
- Completed Phase 5 (demo videos) — all 4 projects have videos
- Layout/typography overhaul: wider page, bigger text, Lora font, self-hosted fonts
- Deprecated post-enrichment layer (series, tags, relatedProject) — simplified posts pipeline
- Removed Quizzard and LLM Bench from projects

## Key Changes This Session
- [x] Removed `post-enrichment.ts`, `series.ts`, `SeriesCard.astro` — posts sourced directly from Substack with no enrichment
- [x] Posts schema simplified: dropped series, seriesOrder, tags, relatedProject fields
- [x] Writing page: flat post list (no series/essays/publications split)
- [x] PostItem: removed projectLink prop
- [x] Layout widened from `max-w-3xl` → `max-w-4xl`, spacing expanded throughout
- [x] All micro text sizes bumped up (nothing below text-xs/12px anywhere)
- [x] Font changed from Instrument Serif → Lora, self-hosted from public/fonts/
- [x] Google Fonts CDN removed, @font-face in globals.css with font-display: block
- [x] VideoShimmer CSS gradient fix (color-mix instead of broken var opacity)
- [x] Project categories moved to config.ts (single source of truth for slugs, labels, order)
- [x] "tool" category label changed from "Also" → "Tools"
- [x] Video fallback chain: video → poster image → shimmer
- [x] Sidequests demo video added and compressed
- [x] LLM Visual Bench demo video added and compressed
- [x] Quizzard project removed
- [x] LLM Bench project already removed by user
- [x] Architecture doc updated to match current state

## Current Projects (4)
1. Sidequests (featured) — has video
2. How I Prompt (featured) — has video
3. A/B Simulator (experimentation) — has video
4. LLM Visual Bench (local-ai) — has video

## Decisions
- Substack = source of truth for posts (titles, descriptions, dates, URLs)
- No enrichment layer — posts pipeline is Substack-only, no local metadata
- No series grouping — writing page shows flat list
- Categories defined in config.ts: featured, local-ai, experimentation, tool
- Badge system: status-driven ("Live"/"Building") with OKLCH colors
- Video UX: autoplay+loop, click-to-pause, IntersectionObserver scroll-pause
- Video compression: 1280px, VP9 CRF 35 (webm) + H264 CRF 28 (mp4), audio stripped
- Video fallback: video → videoPoster image → shimmer
- Fonts: Lora (display), Inter (body), JetBrains Mono (mono) — self-hosted, no CDN
- Layout: max-w-4xl, minimum text-xs everywhere, expanded spacing
- Config-driven: socials, subscribe, categories all in config.ts
- No h1 on homepage or about page
- Warm-tinted design (hue 30 muted/border in both modes)

## Open Items
- Phase 6: Deploy & cutover to eeshans.com
- Nav active state highlighting
- SEO OG images per page
- Project `relatedWriting` still in MDX frontmatter (one-directional: project → /writing)

## Notes
- User controls the dev server — do not start one unless asked
- Do not push commits without asking
- `.env` contains GITHUB_TOKEN + PostHog keys — never print or commit
- Substack refresh: `pnpm refresh:substack` — updates `.cache/substack-feed.json`
- Posts are Substack-sourced: content collection loader reads cache directly, no enrichment
- Content editing guide at CONTENT.md
- Architecture doc at internal_docs/portfolio-architecture.md
- Brand vision doc at internal_docs/portfolio-rebuild-analysis.md
- Demo video workflow: drop raw .mp4 in `public/videos/`, compress with ffmpeg (VP9 CRF 35 webm + H264 CRF 28 mp4 + poster jpg), update project MDX frontmatter