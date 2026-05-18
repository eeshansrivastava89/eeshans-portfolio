# Portfolio Rebuild — Architecture & Implementation Plan

> Updated 2026-05-18

---

## 1. Product Vision

### Why this exists

The current portfolio (eeshans.com) undersells what I've built. Projects are text cards with no demos, writing is a flat list with no series branding, and about is a wall of text. Meanwhile, every project is a live interactive web app, the writing forms coherent series, and there are real credibility signals (5 Under 35, UCLA talk, podcasts, publications) buried in sub-sections.

The rebuild makes the portfolio actually represent the work.

### Core goals

1. **Demo-first, never describe when you can show.** Every project is a live web app. A 10-second autoplay video thumbnail says more than 200 words of description. Record demo videos with Screen Studio and embed them directly.

2. **Professional, not junior.** This is a portfolio for a senior data science leader. It should feel like a personal site from someone who's been doing this for 12 years — clean, restrained, editorial. Not a dashboard, not a card grid, not a startup landing page.

3. **Content-driven, not hard-coded.** Adding a new project or publishing a new post should mean creating an MDX file, not editing a component. The entire portfolio should be renderable from content collections and data files.

4. **Writing is a product, not an archive.** The Local AI Series is a franchise, not three random posts. Standalone essays deserve visual treatment that reflects their weight. Posts should link to related projects and vice versa.

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
- **Composable.** Card, Badge, Separator, Button, Sheet (drawer), DropdownMenu, etc. All composable for project cards, recognition rows, series cards, etc.
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
  liveUrl: z.url().optional(),
  repoUrl: z.url().optional(),
  analysisUrl: z.url().optional(),
  relatedWriting: z.array(z.string()).default([]),  // post slugs
  tech: z.array(z.string()).default([]),
  videoWebm: z.string().optional(),     // path in public/videos/
  videoMp4: z.string().optional(),
  videoPoster: z.string().optional(),
  image: z.string().optional(),        // fallback when no video
  stats: z.array(z.object({
    value: z.string(),
    label: z.string().optional(),
  })).optional(),
})
```

The MDX body is the project's expanded content.

**Posts** (`src/content/posts/*.mdx`)

```ts
schema: z.object({
  title: z.string(),
  createdAt: z.coerce.date(),
  description: z.string(),
  source: z.enum(["substack", "manual"]).default("substack"),
  externalUrl: z.url().optional(),      // required when source is "substack"
  series: z.string().optional(),          // slug grouping posts into a series
  seriesOrder: z.number().optional(),    // order within the series
  seriesTitle: z.string().optional(),    // display title (only on first post)
  seriesDescription: z.string().optional(),
  tags: z.array(z.string()).default([]),
  relatedProject: z.string().optional(), // project slug
  draft: z.boolean().default(false),
})
```

Substack posts are **not** hardcoded local MDX files. They come from the Substack refresh pipeline:

1. **`scripts/refresh-substack.mjs`** fetches all posts from the Substack API
2. Saves a snapshot to `.cache/substack-feed.json`
3. At build time, the posts collection loader reads the snapshot and merges it with local MDX files
4. GitHub Actions runs the refresh on a 4-hour schedule

Authors edit on Substack, not in the repo. The `source: "substack"` frontmatter field and `externalUrl` are assigned from the pipeline, not manually. Local MDX files are only for **manual posts** (posts not on Substack) with `source: "manual"`.

**Current state:** Phase 1 uses placeholder MDX files with Substack post metadata. These will be replaced by the pipeline in Phase 4.

**Series** — not a separate collection. Inferred from the `series` field on posts. Templates group posts by series slug and display them together. This avoids duplication and keeps series metadata close to the posts.

**Experience** (`src/content/experience/*.mdx`)

```ts
schema: z.object({
  timespan: z.string(),
  title: z.string(),
  company: z.string(),
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
    link: z.url().optional(),
  })),
})
```

**About** (`src/content/other/about.mdx`) — single MDX file with bio text.

### Data files

**`src/data/config.ts`** — site config (URLs, social links, nav items, posts per section).

**`src/data/series.ts`** — series metadata (slug, display title, description). Lets series have a description without putting it on every post.

### Page routes

| Route | Source | What it renders |
|---|---|---|
| `/` | Projects + Posts + Impact + About + GitHub | Homepage: top 4 featured projects, latest writing, recognition, about teaser, GitHub activity |
| `/projects/` | Projects collection | All projects, organized by category |
| `/writing/` | Posts collection | Local AI series card + all essays + publication |
| `/about/` | About MDX + Impact + Experience | Bio, recognition, timeline, social links, interests |

No project detail pages. No analysis route (links to external sites).

### Component architecture

**Astro components** (static, zero JS):
- Page layouts and structure
- Nav and footer
- Content rendering (project cards, post items, etc.)

**React components via shadcn/ui** (interactive islands):
- `ModeToggle` — dark/light/system toggle
- `Sheet` — if we add project expand/drawer later
- Any future interactive component

**shadcn/ui components we'll use:**

| Component | Where | Why |
|---|---|---|
| `Button` | Subscribe CTA, nav links | Consistent styling, hover states, variants |
| `Card`, `CardHeader`, `CardContent` | Project cards, series cards, recognition items | Standard layout, composable |
| `Badge` | Project status (Live, Featured), series labels | Consistent small labels |
| `Separator` | Section dividers | Replaces custom `<hr>` |
| `Sheet` | Future project expansion/drawer | Accessible slide-in panel, ready when we need it |
| `DropdownMenu` | Mode toggle | Accessible theme switcher |
| `Typography` | Headings, prose | Consistent text styles |
| `Tooltip` | Stat labels, meta info | Progressive disclosure |

### Video handling

Projects optionally have `videoWebm`, `videoMp4`, and `videoPoster` in their frontmatter. When present, the project card renders an autoplay muted looping `<video>` tag. When absent, it renders a shimmer placeholder with a play icon.

Recording workflow (deferred to Phase 5):
1. Record with Screen Studio, ~45s per app
2. Encode: WebM (AV1) for thumbnails, MP4 (H.264) for fallback, poster JPG
3. Drop files into `public/videos/` and update frontmatter
4. No build step for videos — static files served directly

### Typography

**Instrument Serif** (display headings), **Inter** (body text), **JetBrains Mono** (labels, meta, badges).

Loaded via Google Fonts CDN for simplicity. Self-hosting with `@fontsource` packages is an option if performance or privacy becomes a concern.

Configured as custom font families in Tailwind's `@theme` block:
- `font-display` → Instrument Serif
- `font-sans` → Inter
- `font-mono` → JetBrains Mono

### Responsive design

Single column on mobile (<640px), comfortable reading width on desktop (780px max content area). shadcn/ui components are responsive by default. Tailwind's `sm:`, `md:`, `lg:` breakpoints handle layout shifts.

### Deployment

- **Static output** (`output: 'static'`)
- **Fly.io** hosting with nginx, matching current production setup
- **GitHub Actions** for CI/CD: push to `main` triggers build + deploy
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

---

## 3. Tech Stack Summary

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro 6 | Static output, content collections, island architecture |
| UI Components | shadcn/ui (React) | Accessible, composable, dark mode, future-proof. Copy-paste source, not a dependency |
| Styling | Tailwind CSS v4 | Utility-first, dark mode, shadcn requirement, zero custom CSS |
| Content | Astro Content Collections + MDX | Built-in, type-safe, no external CMS |
| Icons | lucide-react | shadcn/ui default, comprehensive, tree-shakable |
| Fonts | Google Fonts CDN (Instrument Serif, Inter, JetBrains Mono) | Matches mockup design |
| Typography | @tailwindcss/typography | Prose styling for MDX content |
| Dark Mode | shadcn dark mode system | CSS variables + inline script + ModeToggle component |
| Analytics | PostHog (public key, build-time inlined) | Same as current site, with proxy host |
| GitHub Activity | GitHub GraphQL API (`GITHUB_TOKEN`) | Build-time fetch, cached in `.cache/` |
| Substack Proxy | `substack.eeshans.com` API | Same as datascienceapps, avoids CORS |
| Deploy | Fly.io + GitHub Actions | Same as current site |
| Package manager | pnpm | Same as es-portfolio |

### Key npm dependencies

```
astro                    # Core framework
@astrojs/react           # React integration for shadcn islands
@astrojs/mdx             # MDX support for content
@astrojs/sitemap         # Sitemap generation
@tailwindcss/vite        # Tailwind v4 Vite plugin
tailwindcss              # Tailwind v4
react / react-dom        # React for shadcn islands
lucide-react             # Icons
class-variance-authority # shadcn utility (comes with shadcn init)
clsx                     # shadcn utility
tailwind-merge           # shadcn utility
sharp                    # Image optimization
astro-expressive-code    # Code syntax highlighting
```

---

## 4. Implementation Plan

### Phase 1 — Foundation & Scaffolding ✓

- [x] Initialize Astro 6 project in this repo with React + Tailwind + MDX integrations
- [ ] Run `npx shadcn@latest init` to set up shadcn/ui with custom theme (warm paper palette for light, dark with amber accents)
- [x] Configure `components.json``components.json` for shadcn (path aliases, React, Tailwind v4)
- [x] Configure `components.json`Tailwind v4 `@theme` tokens (colors, fonts, spacing matching mockups)
- [x] Set up `src/styles/globals.css``src/styles/globals.css` with shadcn theme variables + custom Tailwind `@theme` block
- [x] Set up `src/styles/globals.css`dark mode inline script in base layout
- [x] Define content collections in `src/content.config.ts` (projects, posts, experience, impact, about)
- [x] Create `src/data/config.ts``src/data/config.ts` (site URL, title, social links, nav items)
- [x] Create `src/data/config.ts``src/data/series.ts` (Local AI series metadata)
- [x] Create `src/data/config.ts`all project MDX files from mockup content (Sidequests, How I Prompt, A/B Simulator, LLM Visual Bench, LLM Bench, Quizzard — no Brewfolio)
- [x] Create `src/data/config.ts`all post MDX files (9 Substack posts + series grouping)
- [x] Create `src/data/config.ts`experience collection entries (Starbucks, Overstock, Amazon, S&P, HCL, MBA, CS)
- [x] Create `src/data/config.ts`impact collection entries (5 Under 35, UCLA talk, podcasts, publications, open source)
- [x] Create `src/data/config.ts`about MDX with humanized copy from mockup
- [ ] Verify: `astro build` succeeds, all collections validate

### Phase 2 — Visual Layer & Layout

- [x] Create `src/data/config.ts``src/layouts/Base.astro` — html head, font imports, Tailwind, dark mode script, nav, footer
- [x] Create `src/data/config.ts``src/components/Nav.astro` — name, section links, ModeToggle React island
- [x] Create `src/data/config.ts``src/components/Footer.astro` — copyright, social links
- [ ] Add shadcn components: `Button`, `Card`, `Badge`, `Separator`
- [x] Create `src/data/config.ts``src/components/ProjectCard.astro` — project listing (title, badge, hook, meta, links, video/shimmer)
- [x] Create `src/data/config.ts``src/components/SeriesCard.astro` — grouped series with badge, title, numbered posts
- [x] Create `src/data/config.ts``src/components/PostItem.astro` — writing list item (title, excerpt, date, project cross-link)
- [x] Create `src/data/config.ts``src/components/RecogItem.astro` — recognition entry (icon, title, meta, link, year)
- [x] Create `src/data/config.ts``src/components/TimelineItem.astro` — experience timeline dot + entry
- [x] Create `src/data/config.ts``src/components/SubscribeBox.astro` — Substack CTA
- [x] Create `src/data/config.ts`video shimmer placeholder CSS (animated gradient, Tailwind `@keyframes`)
- [ ] Implement responsive layout (single column mobile, 780px max desktop)
- [ ] Verify: components render correctly with test data, light and dark themes work

### Phase 3 — Pages

- [x] Create `src/data/config.ts``src/pages/index.astro` — homepage: intro, top 4 projects, latest writing, recognition, about teaser, subscribe
- [x] Create `src/data/config.ts``src/pages/projects.astro` — all projects by category (Featured, Local AI, Also)
- [x] Create `src/data/config.ts``src/pages/writing.astro` — Local AI series card + all essays + publication
- [x] Create `src/data/config.ts``src/pages/about.astro` — full bio, recognition, timeline, social links, interests
- [ ] Add "See all →" links on homepage sections
- [ ] Add navigation highlighting (active state per page)
- [ ] Add SEO meta tags and Open Graph images per page
- [ ] Verify: all pages render, all links work, all external URLs resolve, dark mode toggle works

### Phase 4 — Integration & Polish

- [ ] Port Substack refresh pipeline from datascienceapps (adapt for new content schema — this replaces the placeholder post MDX files with live Substack data)
- [ ] Copy `.cache/substack-feed.json` snapshot from datascienceapps
- [ ] Port PostHog analytics (public key via `PUBLIC_POSTHOG_KEY`, proxy host via `PUBLIC_POSTHOG_HOST`, inline snippet in base layout)
- [ ] Port GitHub Activity system from datascienceapps (`src/lib/github.ts` + build-cache + `GitHubCard.astro`), adapt for Tailwind + shadcn styling
- [ ] Set up `GITHUB_TOKEN` for build-time GitHub data fetch
- [ ] Copy `.cache/github-data.json` snapshot from datascienceapps
- [ ] Add RSS feed (`/rss.xml`) from posts collection
- [ ] Add `robots.txt` and sitemap
- [ ] Add 404 page
- [ ] Set up Fly.io deployment config (Dockerfile, fly.toml)
- [ ] Set up GitHub Actions workflow for build + deploy + scheduled Substack refresh
- [ ] Test Substack refresh script end-to-end
- [ ] Test full build pipeline: `pnpm build` succeeds
- [ ] Deploy to Fly.io staging and verify everything loads

### Phase 5 — Demo Videos

- [ ] Record Sidequests demo (~45s) with Screen Studio
- [ ] Record How I Prompt demo (~45s)
- [ ] Record A/B Simulator demo (~45s)
- [ ] Record Local LLM Visual Bench demo (~30s)
- [ ] Encode each: WebM (AV1) + MP4 (H.264) + poster JPG
- [ ] Add `videoWebm`, `videoMp4`, `videoPoster` to project frontmatter
- [ ] Verify: video thumbnails autoplay correctly on homepage and projects page
- [ ] Add videos to LLM Bench, Quizzard when ready

### Phase 6 — Cutover

- [ ] DNS cutover: point `eeshans.com` to new Fly.io app
- [ ] Verify all external links still resolve (Substack posts, project live URLs, GitHub repos)
- [ ] Verify PostHog events are firing
- [ ] Verify Substack scheduled refresh works on GitHub Actions
- [ ] Archive or redirect old routes if URL structure changed
- [ ] Monitor for 48 hours, fix any issues
- [ ] Archive the `datascienceapps` repo (or redirect it)
- [ ] Update repo README with new architecture docs

---

## 5. File Structure (Target)

```
eeshans-portfolio/
├── public/
│   ├── videos/              # Demo videos (added in Phase 5)
│   ├── images/              # Project screenshots, OG images
│   ├── fonts/               # (Optional) Self-hosted fonts
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── sheet.tsx
│   │   ├── ModeToggle.tsx   # React component for theme switching
│   │   ├── GitHubActivity.astro # GitHub contribution heatmap + recent activity
│   │   ├── Nav.astro
│   │   ├── Footer.astro
│   │   ├── ProjectCard.astro
│   │   ├── SeriesCard.astro
│   │   ├── PostItem.astro
│   │   ├── RecogItem.astro
│   │   ├── TimelineItem.astro
│   │   ├── SubscribeBox.astro
│   │   └── VideoShimmer.astro
│   ├── content/
│   │   ├── projects/        # MDX files for each project
│   │   │   ├── sidequests.mdx
│   │   │   ├── how-i-prompt.mdx
│   │   │   ├── ab-simulator.mdx
│   │   │   ├── local-llm-visual-bench.mdx
│   │   │   ├── local-llm-bench.mdx
│   │   │   └── quizzard.mdx
│   │   ├── posts/           # Substack posts (sourced from pipeline, see Phase 4)
│   │   │   ├── its-time-for-the-regular-person-to.md
│   │   │   ├── local-ai-series-2-the-regular-persons.md
│   │   │   ├── local-ai-series-3-testing-local-ai.md
│   │   │   ├── agentic-coding-for-non-vibe-coders.md
│   │   │   ├── how-i-de-vibed-a-vibe-coded-nlp-app.md
│   │   │   ├── dopamine-trap-of-ai-coding.md
│   │   │   ├── why-local-ai-is-more-important-than.md
│   │   │   ├── building-an-ab-testing-memory-game.md
│   │   │   └── i-built-a-spotify-wrapped-for-my.md
│   │   ├── experience/      # MDX files for timeline entries
│   │   ├── impact/          # MDX files for recognition entries
│   │   └── other/
│   │       └── about.mdx
│   ├── data/
│   │   ├── config.ts        # Site config (URLs, social links, nav)
│   │   └── series.ts        # Series metadata
│   ├── layouts/
│   │   └── Base.astro       # Main layout (head, fonts, dark mode script, PostHog)
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
│   │   └── 404.astro
│   ├── styles/
│   │   └── globals.css      # Tailwind directives + shadcn theme variables
│   ├── scripts/
│   │   └── refresh-substack.mjs  # Substack RSS snapshot script
│   └── content.config.ts    # Zod schemas for all collections
├── astro.config.ts
├── components.json           # shadcn/ui config
├── tsconfig.json
├── package.json
├── .env.example              # Required env vars (GITHUB_TOKEN, PUBLIC_POSTHOG_KEY, etc.)
├── Dockerfile               # Fly.io deployment
├── fly.toml                 # Fly.io config
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
| lucide-react icons | shadcn default, comprehensive, tree-shakable |
| Google Fonts CDN | Simplicity, matches mockup. Can self-host later if needed |
| GitHub Activity | Build-time fetch via GraphQL API, cached in `.cache/`. No client-side API calls |
| PostHog | Public key inlined at build time, proxy via `api-v2.eeshans.com`. No client-side secret |
| Substack proxy | Uses `substack.eeshans.com` API to avoid CORS/rate-limiting. Same pattern as datascienceapps |
| No project detail pages | `/projects/` is the single project experience |
| No analysis route | Links to external sites (absim.eeshans.com/analysis/) |
| No Brewfolio | Removed from project list |
| No Pagefind | Skipped for V1 |
| Video infra first, videos later | Build shimmer placeholders now, record with Screen Studio in Phase 5 |
| No Tailwind CSS config file | Tailwind v4 uses CSS-based config via `@theme` in globals.css |