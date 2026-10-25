# Content Editing Guide

Everything on this site is driven by content files. This guide tells you exactly where to edit every piece of content — no hunting through component code.

## Architecture Overview

```
Content (MDX/snapshots) ──→  Astro Pages  ──→  Built HTML
      ↓                          ↓
src/content/                src/pages/
src/data/                   src/components/  (layout only, no hardcoded content)
```

**Rule of thumb:** If it's text, a link, a date, or a list of things — it's in a content file or a config file. Components only handle layout and styling.

---

## Where to Edit Everything

### Site-wide Settings

| What | File | Notes |
|------|------|-------|
| Site title, URL, description | `src/data/config.ts` | `title`, `description`, `url` — the description also shows under the name in the header |
| Social links | `src/data/config.ts` → `socials` | URL, label, icon key per entry |
| Nav bar links | `src/data/config.ts` | `nav` array |
| Subscribe CTAs | `src/data/config.ts` → `subscribe` | Array with one entry per feed (`substack`, `wordpress`) — kicker, tagline, href |
| Homepage hero | `src/data/config.ts` → `hero` | `headline` (the homepage's H1) and the one `pitch` sentence |
| Homepage counts | `src/data/config.ts` → `homepage` | `feedItems`, `projectItems`, `github.weeks`, `github.repos`, `github.activity` — the only place these numbers live |
| Goodreads panel counts | `src/data/config.ts` → `goodreads` | `profileUrl`, `handle` and the three shelf sizes — shelves shown in the reading panel |

### About Page

| What | File | Notes |
|------|------|-------|
| Bio text (the paragraphs) | `src/content/other/about.mdx` | Standard MDX — bold, links, italics all work |
| Profile photo | `public/images/art-profile-eeshan.jpeg` | Replace the file, same name |
| Social links row | `src/data/config.ts` → `socials` | Icons keyed by `key` in `src/components/Icon.astro` |
| Recognition categories | `src/content/impact/*.mdx` | One file per category (awards, podcasts, talks, etc.) |
| Experience entries | `src/content/experience/*.mdx` | One file per role. Use `type: work` or `type: education` |
| Company/education logos | `public/logos/*.png` | Add new logos here, reference filename in `logo` frontmatter field |

### Homepage (dashboard layout)

| What | File | Notes |
|------|------|-------|
| Hero headline + pitch | `src/data/config.ts` → `hero` | The hero is the only H1 on the page |
| GitHub Activity panel | `src/components/GitHubActivity.astro` | Heatmap + breakdown; window and repo rows come from `siteConfig.homepage.github`; data from the GitHub API (see below) |
| Writing feed | Substack feed (via `pnpm refresh:substack`) | Latest `siteConfig.homepage.feedItems` posts (6) |
| Blog feed | WordPress feed (via `pnpm refresh:wordpress`) | Latest `siteConfig.homepage.feedItems` posts (6) |
| Which projects appear | `src/content/projects/*.mdx` → `date` | Newest `siteConfig.homepage.projectItems` shown as compact cards (6) |

### Projects Page

| What | File | Notes |
|------|------|-------|
| All project data | `src/content/projects/*.mdx` | One file per project |
| Featured flag | Frontmatter `featured` | Not used by the homepage (which shows newest 4) |
| Project videos | Frontmatter `videoWebm`, `videoMp4`, `videoPoster` | Files go in `public/videos/`; poster + Demo button open the shared modal |

The projects frontmatter schema (`src/content.config.ts`): `title`, `hook`, `description`, `date`, `featured` (optional bool), `liveUrl`/`repoUrl` (optional URLs), `videoWebm`/`videoMp4`/`videoPoster` (optional).

### Writing Page (Substack essays)

| What | File | Notes |
|------|------|-------|
| Post data | Substack feed (via `pnpm refresh:substack`) | Posts are sourced from Substack at build time — no local MDX |
| Post pages | `src/pages/writing/[slug].astro` | Full posts render on-site; feed HTML is cleaned at build time by `renderPostHtml()` in `src/lib/substack.ts` |
| External links | Set automatically from Substack | Post pages set `rel="canonical"` to the Substack URL |
| Tag grouping sidebar | Computed from post tags at build time | No config — tags come from Substack |

### Blog Page (WordPress posts)

| What | File | Notes |
|------|------|-------|
| Post data | WordPress feed (via `pnpm refresh:wordpress`) | Sourced from the public WordPress.com REST API at build time — no local MDX |
| Post pages | `src/pages/blog/[slug].astro` | Full posts render on-site; HTML is cleaned at build time by `renderWordPressHtml()` in `src/lib/wordpress.ts` |
| External links | Set automatically from WordPress | Post pages set `rel="canonical"` to the WordPress URL |
| Year pages | `src/pages/blog/[year].astro` | One prebuilt page per year (`/blog/2011/` etc.) — shareable year filters |

### Recognition

| What | File | Notes |
|------|------|-------|
| Each category | `src/content/impact/*.mdx` | One file per category |
| Category icon | Frontmatter `icon` field | Maps to a lucide icon name in `src/components/Icon.astro` |
| Show/hide a category | Frontmatter `visible` field | `true` or `false` |
| Sort order | Frontmatter `order` field | Lower numbers appear first |

### Experience & Education

| What | File | Notes |
|------|------|-------|
| Each role | `src/content/experience/*.mdx` | One file per role |
| Work vs education | Frontmatter `type` field | `"work"` or `"education"` |
| Sort order | Frontmatter `order` field | Lower numbers appear first (1 = most recent) |
| Company logo | Frontmatter `logo` field | Filename of image in `public/logos/` |

---

## Adding New Content

### Add a new project

1. Create `src/content/projects/my-project.mdx`
2. Required frontmatter: `title`, `hook`, `description`, `date`
3. Optional: `featured`, `liveUrl`, `repoUrl`, `videoWebm`/`videoMp4`/`videoPoster`
4. Build to verify: `pnpm build`

### Add a new essay (Substack)

1. Publish on Substack — the site picks it up on the next refresh
2. Refresh locally: `pnpm refresh:substack`, then `pnpm build`
3. CI refreshes the snapshot every 4 hours on schedule

### Add a new blog post (WordPress)

1. Publish on WordPress — the site picks it up on the next refresh
2. Refresh locally: `pnpm refresh:wordpress`, then `pnpm build`
3. CI refreshes the snapshot every 4 hours on schedule

### Add a new recognition category

1. Create `src/content/impact/my-category.mdx`
2. Frontmatter: `title`, `icon` (lucide icon name), `visible`, `order`, `items` array
3. If the icon name isn't in `src/components/Icon.astro`, add the SVG mapping there
4. Build to verify: `pnpm build`

### Add a new work/education entry

1. Create `src/content/experience/my-role.mdx`
2. Frontmatter: `timespan`, `title`, `company`, `type`, `order`
3. Optional: `description`, `logo` (filename in `public/logos/`)
4. Build to verify: `pnpm build`

### Add a social link

1. Add an entry to `src/data/config.ts` → `socials` array: `{ key: "myservice", label: "My Service", href: "https://..." }`
2. Add the SVG to `src/data/icons.ts` keyed by the same `key`
3. Build to verify: `pnpm build`

---

## Content That Comes From External Sources

### GitHub Activity (homepage sidebar)

Fetched at **build time** from the GitHub GraphQL API using `GITHUB_TOKEN`.
- Cache file: `.cache/github-data.json` (gitignored)
- Refresh: happens automatically during `pnpm build`, or by deleting the cache file
- Data source: `src/lib/github.ts`

### Substack Posts

Fetched by running `pnpm refresh:substack` (or automatically in CI on schedule).
- Cache file: `.cache/substack-feed.json` (committed)
- Refresh script: `scripts/refresh-substack.mjs` (via the substack-proxy Cloudflare Worker)
- Data source: `src/lib/substack.ts`
- Posts are sourced entirely from Substack — no local MDX files.

### WordPress Posts

Fetched by running `pnpm refresh:wordpress` (or automatically in CI on schedule).
- Content: `src/content/blog/<slug>.json` — one committed file per post; the file name **is** the entry id and therefore the URL
- Refresh script: `scripts/refresh-wordpress.mjs` (public WordPress.com REST API, no proxy) — rewrites every file and deletes files for posts that disappeared upstream, so a refresh is a per-post diff
- Schema and HTML rendering: `src/content.config.ts` + `src/lib/wordpress.ts`
- Posts are sourced entirely from WordPress — no local MDX files.

### Goodreads Shelf (homepage sidebar)

Fetched by running `pnpm refresh:goodreads`, in the same 4-hour CI run as the other snapshots.
- Cache file: `.cache/goodreads.json` (committed)
- Refresh script: `scripts/refresh-goodreads.mjs` — per-shelf RSS (`currently-reading`, `read`, `to-read`); the public API was retired in 2020, the RSS still works
- Data source: `src/lib/goodreads.ts`
- Shelf sizes and the profile link: `src/data/config.ts` → `goodreads`
- A missing or malformed snapshot stops the build — the panel never renders half-empty

---

## File Map

```
src/
├── content/
│   ├── blog/              ← WordPress posts, one JSON file per post (generated)
│   ├── projects/          ← Project data (MDX)
│   ├── experience/         ← Work & education timeline (MDX)
│   ├── impact/             ← Recognition categories (MDX)
│   └── other/
│       └── about.mdx       ← About page bio text
├── data/
│   └── config.ts           ← Site-wide settings, socials, nav, subscribe CTAs
├── components/             ← Layout & styling only (no hardcoded content)
├── pages/                  ← Page templates (pull content from collections)
└── lib/                    ← GitHub, Substack, WordPress, build cache
```

```
public/
├── images/                  ← Profile photo
│   └── art-profile-eeshan.jpeg
├── logos/                   ← Company/education logos
└── videos/                  ← Project demo videos
```