# Portfolio Rebuild — Architecture & Implementation Plan

> Updated 2026-05-29

---

## 1. Product Vision

### Why this exists

The current portfolio (eeshans.com) undersells what I've built. Projects are text cards with no demos, writing is a flat list with no series branding, and about is a wall of text. Meanwhile, every project is a live interactive web app, and there are real credibility signals (5 Under 35, UCLA talk, podcasts, publications) buried in sub-sections.

The rebuild makes the portfolio actually represent the work.

### Core goals

1. **Demo-first, never describe when you can show.** Every project is a live web app. A 10-second autoplay video thumbnail says more than 200 words of description. Record demo videos and embed them directly.

2. **Professional, not junior.** This is a portfolio for a senior data science leader. It should feel like a personal site from someone who's been doing this for 12 years — clean, restrained, editorial. Not a dashboard, not a card grid, not a startup landing page.

3. **Content-driven, not hard-coded.** Adding a new project or publishing a new post should mean creating an MDX file, not editing a component. The entire portfolio should be renderable from content collections and data files.

4. **Writing is a product, not an archive.** Posts sourced from Substack, displayed with visual hierarchy.

5. **Credibility needs visual weight.** An inline link to "5 Under 35" is forgettable. A recognition section with the award, the year, and a link is memorable.

### Brand positioning

The portfolio should convey: **I build things to test ideas, and I write about what holds up.** Not a hype person, not a resume, not a tutorial author — a practitioner who ships working software and publishes honest analysis.

The voice should be direct, specific, and opinionated. No AI slop. No "passionate about" or "excited to announce." Say what the thing does and why it matters in plain language.

### Voice rules (from humanizer pass)

- No manufactured taglines
- No em dash overuse, no rule of three, no inflated significance language
- Say what things do, not what they "empower" or "enable"
- Use first person when it fits
- Vary sentence length. Short punchy ones. Then longer ones that take their time.
- Let some mess in. Tangents and asides are human.

### Target audiences (in priority order)

1. **Hiring managers and recruiters** — need credibility fast, need to see live work
2. **Fellow data scientists and engineers** — looking for depth, open-source code, honest analysis
3. **AI/ML community on social** — evaluating whether to share or engage
4. **General tech-curious readers** — checking if something is usable

### What's not changing

- Custom domain (eeshans.com), Fly.io hosting, GitHub Actions deploys
- Substack as the writing source of truth (RSS snapshot, not API dependency)
- Pagefind for search — skipped for V1
- PostHog for analytics
- All projects remain live on their subdomains

---

## 2. Architecture

### Framework

**Astro 6** (static output) with **React** for interactive islands.

Why React: shadcn/ui requires React, and shadcn/ui is the component library we're using. React components only ship JavaScript where needed (via `client:load`, `client:visible`). The majority of pages remain static Astro HTML with zero client-side JS. This is the standard Astro + shadcn pattern.

### Styling: Tailwind CSS v4 + shadcn/ui

**Tailwind CSS v4** via `@tailwindcss/vite`. No custom CSS files. All styling through utility classes and shadcn's CSS custom properties.

Why this over custom CSS:
- **Maximizes code efficiency.** A mockup component that takes 20 lines of custom CSS takes 5 lines of Tailwind utilities.
- **shadcn/ui requires Tailwind.** The component library is built on Tailwind utilities. If we're using shadcn, we're using Tailwind.
- **Dark mode for free.** Tailwind's `dark:` prefix + shadcn's CSS variable system (`--background`, `--foreground`, `--card`, etc.) gives us light/dark themes with zero custom CSS.
- **Design tokens via `@theme`.** The mockup's palette (warm paper, amber accent, etc.) becomes `@theme` tokens in Tailwind v4, giving us `bg-paper`, `text-accent`, etc.
- **Future extensibility.** Adding responsive variants, animations, hover states — all one-line additions, never a new CSS file.

### Design system: shadcn/ui

shadcn/ui is the primary component library. It's not a dependency — it's copy-paste components that live in `src/components/ui/`. This gives us:

- **Accessible by default.** Radix UI primitives under every component. Keyboard nav, ARIA, focus management built in.
- **Dark mode built in.** Every component respects the theme variables. Light and dark look correct by default.
- **Composable.** Card, Badge, Separator, Button, Sheet (drawer), DropdownMenu, etc. All composable for project cards, recognition rows, etc.
- **Extensible.** Need a new UI pattern later? `npx shadcn@latest add [component]`. Zero refactoring.
- **No lock-in.** Components are source code in our repo. Modify anything, anytime.

### Dark mode

shadcn's standard dark mode implementation:

1. **CSS custom properties** for both light and dark themes (defined in `globals.css` via shadcn's theme system)
2. **Inline `<script is:inline>`** to detect `localStorage` theme or system preference and set `.dark` class on `<html>` before first paint (no FOUC)
3. **ModeToggle** React component (DropdownMenu with Sun/Moon icons) in the nav
4. **Tailwind's `dark:` variant** for any custom styling needs

Themes are defined by overriding shadcn's CSS variables. The light theme maps to the mockup's warm paper palette; the dark theme uses shadcn's default dark palette with warm amber accents.

### Content: Astro Content Collections

**Astro Content Collections** with Zod schemas — built into Astro, no external dependency, fully type-safe.

Why not Keystatic or another CMS:
- Content is managed through git and MDX files, which is already the workflow
- Content Collections give us schema validation, type generation, and IDE autocomplete for free
- No external database, no admin UI server process, no monthly bill
- Keystatic adds React as a dependency and a `/keystatic` admin route that we don't need — the user edits content in a code editor

**Philosophy: content in MDX frontmatter + body, never in components.** Components read from collections and render. The only hardcoded content is social profile URLs (in a config file).

### Content collections

**Projects** (`src/content/projects/*.mdx`)

```ts
schema: z.object({
  title: z.string(),
  hook: z.string(),                    // one-line why-should-I-care
  description: z.string(),             // full description (rendered in expanded view)
  date: z.coerce.date(),
  status: z.enum(["live", "archived", "draft"]).default("live"),
  featured: z.boolean().default(false),
  category: z.enum(["featured", "local-ai", "experimentation", "events", "tool"]).default("experimentation"),
  liveUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  analysisUrl: z.string().url().optional(),
  relatedWriting: z.array(z.string()).default([]),  // post slugs
  tech: z.array(z.string()).default([]),
  videoWebm: z.string().optional(),     // path in public/videos/
  videoMp4: z.string().optional(),
  videoPoster: z.string().optional(),   // also used as fallback image when no video
  image: z.string().optional(),        // fallback when no video
  stats: z.array(z.object({
    value: z.string(),
    label: z.string().optional(),
  })).optional(),
})
```

The MDX body is the project's expanded content.

**Posts** (sourced from Substack — no local MDX files)

```ts
schema: z.object({
  title: z.string(),
  createdAt: z.coerce.date(),
  description: z.string(),
  source: z.enum(["substack", "manual"]).default("substack"),
  externalUrl: z.string().url().optional(),      // required when source is "substack"
  draft: z.boolean().default(false),
})
```

Posts come from the Substack refresh pipeline:

1. **`scripts/refresh-substack.mjs`** fetches all posts from the Substack API
2. Saves a snapshot to `.cache/substack-feed.json`
3. At build time, the posts collection loader reads the snapshot directly — no local MDX files, no enrichment layer
4. GitHub Actions runs the refresh on a 4-hour schedule

Authors edit on Substack, not in the repo. The `source` and `externalUrl` fields are assigned from the pipeline, not manually.

**Experience** (`src/content/experience/*.mdx`)

```ts
schema: z.object({
  timespan: z.string(),
  title: z.string(),
  company: z.string(),
  description: z.string().optional(),
  logo: z.string().optional(),
  type: z.enum(["work", "education"]).default("work"),
  order: z.number().default(0),
})
```

**Impact** (`src/content/impact/*.mdx`)

```ts
schema: z.object({
  title: z.string(),
  icon: z.string(),                     // lucide icon name
  visible: z.boolean().default(true),
  order: z.number().default(0),
  items: z.array(z.object({
    text: z.string(),
    meta: z.string().optional(),
    link: z.string().url().optional(),
  })),
})
```

**About** (`src/content/other/about.mdx`) — single MDX file with bio text.

### Data files

**`src/data/config.ts`** — site config (URLs, social links, nav items, posts per section, project categories).

**`src/data/content.ts`** — helper functions for querying collections (getLiveProjects, getVisiblePosts, formatDate).

**`src/data/icons.ts`** — brand SVG icons keyed by social link key.

### Page routes

| Route | Source | What it renders |
|---|---|---|
| `/` | Projects + Posts + GitHub | Homepage: intro, top featured projects, latest writing, GitHub activity, subscribe |
| `/projects/` | Projects collection | All projects, organized by category (from config.ts) |
| `/writing/` | Posts collection | All posts (flat list, sourced from Substack) |
| `/about/` | About MDX + Impact + Experience | Bio, recognition, timeline, social links, interests |

No project detail pages. No analysis route (links to external sites).

### Component architecture

**Astro components** (static, zero JS):
- Page layouts and structure
- Nav and footer
- Content rendering (project cards, post items, etc.)

**React components via shadcn/ui** (interactive islands):
- `ModeToggle` — dark/light/system toggle
- Any future interactive component

### Video handling

Projects optionally have `videoWebm`, `videoMp4`, and `videoPoster` in their frontmatter. The project card renders them in a fallback chain:

1. **Video** — if `videoWebm` or `videoMp4` is set, render an autoplay muted looping `<video>` tag
2. **Poster** — if no video but `videoPoster` is set, render the poster image (same aspect ratio, same border/rounded treatment as video)
3. **Shimmer** — if neither, render an animated gradient placeholder with a play icon

Video compression recipe (1280px wide, no audio):
- WebM: VP9, CRF 35, two-pass
- MP4: H.264, CRF 28, slow preset, faststart
- Poster: first frame, quality 2

### Typography

**Lora** (display headings), **Inter** (body text), **JetBrains Mono** (labels, meta, badges).

All fonts are self-hosted from `public/fonts/` as woff2 files with `font-display: block` — no Google Fonts CDN, no FOUT/flicker.

Configured as custom font families in Tailwind's `@theme` block:
- `font-display` → Lora
- `font-sans` → Inter
- `font-mono` → JetBrains Mono

### Layout and spacing

- **Max width:** `max-w-4xl` (896px) on nav, main content, and footer
- **Sections:** `mb-20` on homepage, `mt-16` between about page sections
- **Font sizes:** section labels at `text-[0.8rem]`, meta text at `text-sm`, body at `text-lg`, post titles at `text-2xl`, project titles at `text-[1.7rem]`
- **No micro text:** nothing below `text-xs` (12px) anywhere on the site

### Responsive design

Single column on mobile (<640px), comfortable reading width on desktop (896px max content area). shadcn/ui components are responsive by default. Tailwind's `sm:`, `md:`, `lg:` breakpoints handle layout shifts.

### Deployment

- **Static output** (`output: 'static'`)
- **Fly.io** — reuse the existing `soma-portfolio` Fly app from datascienceapps. Same nginx-based Dockerfile pattern. Swap the repo pointer when ready for cutover.
- **GitHub Actions** — port the existing workflow from datascienceapps: push to `main` triggers build + deploy, scheduled Substack refresh every 4 hours, typecheck step, automatic commit of snapshot changes. Uses `GITHUB_TOKEN` secret for GitHub Activity at build time and `FLY_API_TOKEN` secret for deployment.
- **Substack refresh** on scheduled runs (4 hours), same pattern as datascienceapps. Uses a Substack API proxy at `substack.eeshans.com` to avoid CORS/rate-limit issues.
- **PostHog** for analytics — public key inlined at build time via `PUBLIC_POSTHOG_KEY` env var, proxy host at `api-v2.eeshans.com`. Snippet injected in `<head>` of the base layout.
- **GitHub Activity** — fetched at build time via GitHub GraphQL API using `GITHUB_TOKEN`. Contribution heatmap + recent activity (commits, repos, issues, PRs) displayed on homepage. Uses build-time caching (`.cache/github-data.json`) so the site remains fully static.
- **No Pagefind** for V1 — skipped

### What we're NOT using

- **No theme dependency** (no Spectre, no AstroPaper, no third-party theme). shadcn/ui gives us components, not a theme.
- **No Keystatic**. Content is managed through git and MDX files. Content Collections are built-in and type-safe.
- **No Brewfolio**. Not included in the projects list.
- **No analysis route**. Links to external sites (absim.eeshans.com/analysis/).
- **No Pagefind** for V1. Search skipped.
- **No project detail pages**. `/projects/` is the single project experience.
- **No post enrichment/series layer.** Posts are sourced directly from Substack. Series grouping, tags, and related-project cross-links were deprecated — the enrichment layer added complexity without proportionate value.
- **No Google Fonts CDN.** Fonts are self-hosted to avoid FOUT/flicker.

---

## 3. Tech Stack Summary

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro 6 | Static output, content collections, island architecture |
| UI Components | shadcn/ui (React) | Accessible, composable, dark mode, future-proof. Copy-paste source, not a dependency |
| Styling | Tailwind CSS v4 | Utility-first, dark mode, shadcn requirement, zero custom CSS |
| Content | Astro Content Collections + MDX | Built-in, type-safe, no external CMS |
| Fonts | Self-hosted woff2 (Lora, Inter, JetBrains Mono) | No CDN, no FOUT, privacy-friendly |
| Typography | @tailwindcss/typography | Prose styling for MDX content |
| Dark Mode | shadcn dark mode system | CSS variables + inline script + ModeToggle component |
| Analytics | PostHog (public key, build-time inlined) | Same as current site, with proxy host |
| GitHub Activity | GitHub GraphQL API (`GITHUB_TOKEN`) | Build-time fetch, cached in `.cache/` |
| Substack Proxy | `substack.eeshans.com` API | Same as datascienceapps, avoids CORS |
| Deploy | Fly.io (`soma-portfolio` app) + GitHub Actions | Reuse existing Fly app from datascienceapps |
| Package manager | pnpm | Same as es-portfolio |

### Key npm dependencies (17)

```
astro                    # Core framework
@astrojs/mdx             # MDX support for content
@astrojs/react           # React integration for shadcn islands
@astrojs/rss             # RSS feed generation
@astrojs/sitemap         # Sitemap generation
@tailwindcss/typography  # Prose styling for MDX content
@tailwindcss/vite        # Tailwind v4 Vite plugin
astro-expressive-code    # Code syntax highlighting
class-variance-authority # shadcn utility
clsx                     # shadcn utility
react / react-dom        # React for shadcn islands
sharp                    # Image optimization
tailwind-merge           # shadcn utility
tailwindcss              # Tailwind v4
```

---

## 4. Implementation Plan

### Phase 1 — Foundation & Scaffolding ✓

- [x] Initialize Astro 6 project in this repo with React + Tailwind + MDX integrations
- [x] Configure `components.json` for shadcn (path aliases, React, Tailwind v4)
- [x] Configure Tailwind v4 `@theme` tokens (colors, fonts, spacing matching mockups)
- [x] Set up `src/styles/globals.css` with shadcn theme variables + custom Tailwind `@theme` block + self-hosted @font-face declarations
- [x] Set up dark mode inline script in base layout
- [x] Define content collections in `src/content.config.ts` (projects, posts, experience, impact, about)
- [x] Create `src/data/config.ts` (site URL, title, social links, nav items, project categories)
- [x] Create project MDX files (Sidequests, How I Prompt, A/B Simulator, LLM Visual Bench)
- [x] Create experience collection entries (Starbucks, Overstock, Amazon, S&P, HCL, MBA, CS)
- [x] Create impact collection entries (5 Under 35, UCLA talk, podcasts, publications, open source)
- [x] Create about MDX with humanized copy from mockup
- [x] `astro build` succeeds, all collections validate

### Phase 2 — Visual Layer & Layout ✓

- [x] Create `src/layouts/Base.astro` — html head, font imports, Tailwind, dark mode script, nav, footer
- [x] Create components: ProjectCard, ProjectCardContent, PostItem, SectionTitle, SocialLinks, SubscribeBox, VideoShimmer, TimelineEntry, Icon, GitHubActivity
- [x] Self-hosted fonts in `public/fonts/` with @font-face declarations and `font-display: block`
- [x] Video shimmer placeholder (animated gradient)
- [x] Implement responsive layout (single column mobile, 896px max desktop)
- [x] Typography pass: bumped all micro text sizes, expanded spacing, Lora display font

### Phase 3 — Pages ✓

- [x] Create `src/pages/index.astro` — homepage: intro, featured projects, latest writing, GitHub activity, subscribe
- [x] Create `src/pages/projects.astro` — all projects by category (from config.ts)
- [x] Create `src/pages/writing.astro` — all posts (flat list from Substack)
- [x] Create `src/pages/about.astro` — full bio, recognition, timeline, social links, interests
- [x] Add "See all →" links on homepage sections
- [ ] Add navigation highlighting (active state per page)
- [ ] Add SEO meta tags and Open Graph images per page

### Phase 4 — Integration & Polish ✓

- [x] Port Substack refresh pipeline from datascienceapps (`scripts/refresh-substack.mjs`)
- [x] Posts sourced directly from Substack — no local MDX stubs, no enrichment layer
- [x] Port `src/lib/substack.ts`, `src/lib/github.ts`, `src/lib/build-cache.ts` from datascienceapps
- [x] Port PostHog analytics (public key via `PUBLIC_POSTHOG_KEY`, proxy host via `PUBLIC_POSTHOG_HOST`, inline snippet in base layout)
- [x] Port GitHub Activity system from datascienceapps
- [x] Add RSS feed (`/rss.xml`) from posts collection
- [x] Add `robots.txt` and sitemap
- [x] Add 404 page
- [x] Set up Fly.io deployment config
- [x] Port GitHub Actions workflow from datascienceapps
- [x] Config-driven socials, subscribe box, and project categories
- [x] Design pass: warm-tinted muted/border, Lora font, widened layout, expanded typography and spacing
- [x] About page: profile photo with text wrapping, recognition as stacked rows, social links after bio
- [x] Homepage: no h1, tagline intro, featured projects, flat post list, GitHub activity, subscribe

### Phase 5 — Demo Videos ✓

- [x] Sidequests demo — WebM + MP4 + poster JPG
- [x] How I Prompt demo — WebM + MP4 + poster JPG
- [x] A/B Simulator demo — WebM + MP4 + poster JPG
- [x] LLM Visual Bench demo — WebM + MP4 + poster JPG
- [x] Video fallback chain: video → poster image → shimmer placeholder
- [x] Video compression: 1280px, VP9 CRF 35 (webm) + H264 CRF 28 (mp4), audio stripped
- [x] Click-to-pause overlay with IntersectionObserver auto-pause

### Phase 6 — Deploy & Cutover

> **Nothing deploys until this phase.** All deployment is deferred until polish is complete.

- [ ] Set up Fly.io secrets: `GITHUB_TOKEN`, `FLY_API_TOKEN` (manual step)
- [ ] Test Substack refresh script end-to-end locally
- [ ] Test full build pipeline with `GITHUB_TOKEN` in `.env`
- [ ] Deploy to Fly.io staging and verify everything loads
- [ ] DNS cutover: point `eeshans.com` to the existing `soma-portfolio` Fly.io app (swap the repo)
- [ ] Verify all external links still resolve (Substack posts, project live URLs, GitHub repos)
- [ ] Verify PostHog events are firing
- [ ] Verify GitHub Activity renders correctly (requires `GITHUB_TOKEN` secret in GitHub Actions)
- [ ] Verify Substack scheduled refresh works on GitHub Actions
- [ ] Archive or redirect old routes if any URL structure changed
- [ ] Monitor for 48 hours, fix any issues
- [ ] Archive the `datascienceapps` repo (or redirect it)
- [ ] Update `es-portfolio` (old repo) README with new architecture docs

---

## 5. File Structure

```
eeshans-portfolio/
├── public/
│   ├── fonts/              # Self-hosted woff2 font files (Lora, Inter, JetBrains Mono)
│   ├── images/             # Profile photo
│   ├── logos/              # Company/education logos
│   ├── videos/             # Project demo videos (webm + mp4 + poster jpg)
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   │   └── button.tsx
│   │   ├── GitHubActivity.astro  # GitHub contribution heatmap + recent activity
│   │   ├── Icon.astro            # SVG icon helper
│   │   ├── ModeToggle.tsx        # React component for theme switching
│   │   ├── PostItem.astro        # Writing list item
│   │   ├── ProjectCard.astro     # Project card wrapper
│   │   ├── ProjectCardContent.astro  # Project card content (title, badge, hook, links, video)
│   │   ├── SectionTitle.astro    # Section header with optional "See all" link
│   │   ├── SocialLinks.astro     # Social links row (homepage + about)
│   │   ├── SubscribeBox.astro    # Substack CTA
│   │   ├── TimelineEntry.astro   # Experience/education timeline entry
│   │   └── VideoShimmer.astro    # Animated placeholder for missing demo videos
│   ├── content/
│   │   ├── projects/        # MDX files for each project
│   │   │   ├── sidequests.mdx
│   │   │   ├── how-i-prompt.mdx
│   │   │   ├── ab-simulator.mdx
│   │   │   └── local-llm-visual-bench.mdx
│   │   ├── experience/      # MDX files for timeline entries
│   │   ├── impact/          # MDX files for recognition entries
│   │   └── other/
│   │       └── about.mdx
│   ├── data/
│   │   ├── config.ts        # Site config (URLs, socials, nav, subscribe, project categories)
│   │   ├── content.ts       # Collection query helpers (getLiveProjects, getVisiblePosts)
│   │   └── icons.ts         # Brand SVG icons
│   ├── layouts/
│   │   └── Base.astro       # Main layout (head, fonts, dark mode script, PostHog, nav, footer)
│   ├── lib/
│   │   ├── utils.ts         # shadcn cn() utility
│   │   ├── github.ts        # GitHub GraphQL data fetcher (build-time)
│   │   ├── build-cache.ts   # Build-time cache for API responses
│   │   └── substack.ts      # Substack snapshot reader
│   ├── pages/
│   │   ├── index.astro      # Homepage
│   │   ├── projects.astro   # All projects
│   │   ├── writing.astro    # All writing
│   │   ├── about.astro      # About page
│   │   ├── 404.astro
│   │   ├── robots.txt.ts
│   │   └── rss.xml.ts
│   ├── styles/
│   │   └── globals.css     # @font-face declarations + Tailwind directives + shadcn theme variables
│   └── content.config.ts   # Zod schemas for all collections
├── scripts/
│   └── refresh-substack.mjs # Substack RSS snapshot script
├── CONTENT.md              ← Content editing guide (where to edit everything)
├── internal_docs/
│   ├── portfolio-architecture.md  ← This file
│   └── portfolio-rebuild-analysis.md  ← Brand/product analysis
├── astro.config.ts
├── components.json          # shadcn/ui config
├── tsconfig.json
├── package.json
├── .env.example             # Required env vars (GITHUB_TOKEN, PUBLIC_POSTHOG_KEY, etc.)
├── Dockerfile               # Fly.io deployment (nginx serving static build)
├── fly.toml                 # Fly.io config (app = soma-portfolio)
├── .cache/                  # Build-time cache (substack-feed.json, github-data.json)
└── .github/
    └── workflows/
        └── deploy.yml       # CI/CD
```

---

## 6. Decisions Log

| Decision | Rationale |
|---|---|
| Astro 6 + React islands | Astro for performance, React only for shadcn interactive components |
| Tailwind CSS v4 | Zero custom CSS, shadcn requirement, dark mode, utility-first |
| shadcn/ui | Accessible, composable, dark mode ready, extensible, copy-paste source |
| Dark mode (light + dark) | shadcn built-in system, CSS variables, inline script, ModeToggle |
| Content Collections (not Keystatic) | Built-in, type-safe, no external dependency, git-based workflow |
| Self-hosted fonts (no CDN) | Eliminates FOUT/flicker, no external dependency, privacy-friendly |
| Lora display font | Warmer and heavier than Instrument Serif, readable at all sizes |
| `max-w-4xl` layout width | Less cramped than `max-w-3xl`, better for video thumbnails |
| Minimum `text-xs` everywhere | Nothing below 12px — micro text is unreadable |
| GitHub Activity | Build-time fetch via GraphQL API, cached in `.cache/`. No client-side API calls |
| PostHog | Public key inlined at build time, proxy via `api-v2.eeshans.com`. No client-side secret |
| Substack proxy | Uses `substack.eeshans.com` API to avoid CORS/rate-limiting |
| No post enrichment layer | Deprecated — added complexity (series, tags, relatedProject) without proportionate value. Posts are sourced directly from Substack. |
| No series grouping | Series cards, `series.ts`, `post-enrichment.ts` all removed. Writing page shows a flat post list. |
| Project categories in config.ts | Single source of truth for category slugs, labels, and display order — not duplicated in page templates |
| `videoPoster` as fallback image | When no video exists, the poster image is shown instead of the shimmer. Same field, same files — no separate image pipeline. |
| No project detail pages | `/projects/` is the single project experience |
| No analysis route | Links to external sites (absim.eeshans.com/analysis/) |
| No Brewfolio | Not included in the project list |
| No Pagefind | Skipped for V1 |
| No Quizzard or LLM Bench | Removed from project list (Quizzard offline, LLM Bench deprecated) |
| Warm-tinted `--muted`/`--border` in both modes | Hue 30 (amber undertone) — prevents the neutral gray cards problem |
| Socials as array in config | `{key, label, href}` lets labels be configurable ("Asymptotic" not "Substack") — one change updates all pages |
| SubscribeBox driven by config.ts | Kicker/tagline/href configurable, Substack orange-tinted styling with icon |
| No AI-slop positioning | Tagline comes from the user's own voice, not generated marketing copy |
| Recognition as stacked rows, not card grid | Matches the vertical section pattern of Experience/Education on the about page |
| No h1 on homepage or about page | Name already appears in nav; the h1 just wasted space |
| Deployment deferred to Phase 6 | No deploy until polish is complete |

---

### Notes

- `.env` exists locally and is ignored; do not print or commit secrets. See `.env.example` for required vars.
- The `soma-portfolio` Fly.io app is already deployed and serving `eeshans.com`. Cutover means pointing this app to the new repo's build, not creating a new app.
- The GitHub Actions workflow from datascienceapps (build + deploy on push, Substack refresh every 4h) will be ported and adapted.
- User controls the dev server. Do not start one unless asked.
- Do not push commits without asking.
- Substack refresh: `pnpm refresh:substack` — updates `.cache/substack-feed.json`
- Posts are Substack-sourced: custom content collection loader reads cache, no local MDX stubs
- Content editing guide at `CONTENT.md`
- Demo video workflow: drop raw .mp4 in `public/videos/`, compress with ffmpeg (VP9 CRF 35 webm + H264 CRF 28 mp4 + poster jpg), update project MDX frontmatter