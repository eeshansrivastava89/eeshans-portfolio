# Content Editing Guide

Everything on this site is driven by content files. This guide tells you exactly where to edit every piece of content — no hunting through component code.

## Architecture Overview

```
Content (MDX/YAML)  ──→  Astro Pages  ──→  Built HTML
      ↓                        ↓
src/content/            src/pages/
src/data/               src/components/  (layout only, no hardcoded content)
```

**Rule of thumb:** If it's text, a link, a date, or a list of things — it's in a content file. Components only handle layout and styling.

---

## Where to Edit Everything

### Site-wide Settings

| What | File | Notes |
|------|------|-------|
| Site title, URL, description | `src/data/config.ts` | `title`, `description`, `url` |
| Social links | `src/components/SocialLinks.astro` + `src/data/config.ts` → `socials` | URLs in config.ts; icons/labels in SocialLinks.astro. Used on both homepage and about page |
| Nav bar links | `src/data/config.ts` | `nav` array |
| Homepage intro | `src/data/config.ts` | `intro.tagline` — a single line of text |

### About Page

| What | File | Notes |
|------|------|-------|
| Bio text (the paragraphs) | `src/content/other/about.mdx` | Standard MDX — bold, links, italics all work |
| Profile photo | `public/images/art-profile-eeshan.jpeg` | Replace the file, same name |
| Social links row | `src/components/SocialLinks.astro` + `src/data/config.ts` → `socials` | URLs in config; icons/labels in component |
| Recognition categories | `src/content/impact/*.mdx` | One file per category (awards, podcasts, talks, etc.) |
| Experience entries | `src/content/experience/*.mdx` | One file per role. Use `type: work` or `type: education` |
| Company/education logos | `public/logos/*.png` | Add new logos here, reference filename in `logo` frontmatter field |
| Substack subscribe box | `src/data/config.ts` → `subscribe` | `kicker`, `tagline`, `href` — all configurable |

### Homepage

| What | File | Notes |
|------|------|-------|
| Intro line | `src/data/config.ts` → `intro` | `intro.tagline` — a single line at the top |
| Social links under intro | `src/data/config.ts` → `socials` | URLs; icons are inline SVGs in `index.astro` |
| Which projects appear | `src/content/projects/*.mdx` → `featured: true` | Featured projects are prioritized; top 4 shown |
| How many projects shown | `src/data/config.ts` → `homepageProjectCount` | Defaults to 4 |
| Writing section | `src/content/posts/*.mdx` | Latest 3 standalone posts + Local AI series card |
| How many posts shown | `src/data/config.ts` → `homepagePostCount` | Defaults to 3 |
| GitHub Activity | Fetched at build time from GitHub API | See "GitHub Activity" below |

### Projects Page

| What | File | Notes |
|------|------|-------|
| All project data | `src/content/projects/*.mdx` | One file per project |
| Project categories | Frontmatter `category` field | `featured`, `local-ai`, `experimentation`, `tool` |
| Project badges | Frontmatter `featured`, `status` fields | `status: live|archived|draft` |
| Project tech tags | Frontmatter `tech` array | e.g. `["Python", "Astro", "React"]` |
| Project videos | Frontmatter `videoWebm`, `videoMp4`, `videoPoster` | Files go in `public/videos/` |

### Writing Page

| What | File | Notes |
|------|------|-------|
| Post data | `src/content/posts/*.mdx` | One file per post |
| Series grouping | Frontmatter `series` + `seriesOrder` fields | Posts with the same `series` slug are grouped |
| Series metadata (title, description) | `src/data/series.ts` | One entry per series slug |
| External links (Substack posts) | Frontmatter `externalUrl` + `source: "substack"` | Posts link out to Substack, not to internal pages |

### Recognition

| What | File | Notes |
|------|------|-------|
| Each category | `src/content/impact/*.mdx` | One file per category (awards, podcasts, talks, etc.) |
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
3. Optional: `featured`, `liveUrl`, `repoUrl`, `tech`, `stats`, `videoWebm`/`videoMp4`/`videoPoster`
4. Build to verify: `pnpm build`

### Add a new blog post

1. Create `src/content/posts/my-post.mdx`
2. Required frontmatter: `title`, `createdAt`, `description`
3. For Substack posts: add `source: "substack"` and `externalUrl`
4. For series: add `series: "local-ai"` and `seriesOrder`
5. Build to verify: `pnpm build`

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
2. If an icon exists for the `key`, add the SVG to `src/components/SocialLinks.astro` → `iconSvgs` map
3. Both homepage and about page use the same component — one change updates both
4. Build to verify: `pnpm build`

### Add a new series

1. Add an entry to `src/data/series.ts` with `slug`, `title`, `description`
2. Add `series: "your-slug"` and `seriesOrder` to each post's frontmatter
3. Build to verify: `pnpm build`

---

## Content That Comes From External Sources

### GitHub Activity (homepage)

Fetched at **build time** from the GitHub GraphQL API using `GITHUB_TOKEN`.
- Cache file: `.cache/github-data.json`
- Refresh: happens automatically during `pnpm build`, or by deleting the cache file
- Data source: `src/lib/github.ts`

### Substack Posts

Fetched by running `pnpm refresh:substack` (or automatically in CI on schedule).
- Cache file: `.cache/substack-feed.json`
- Refresh script: `scripts/refresh-substack.mjs`
- Data source: `src/lib/substack.ts`
- Currently, posts use local MDX files. The pipeline is ready for future integration.

---

## File Map

```
src/
├── content/
│   ├── projects/          ← Project data (MDX)
│   ├── posts/              ← Blog posts (MDX)
│   ├── experience/         ← Work & education timeline (MDX)
│   ├── impact/             ← Recognition categories (MDX)
│   └── other/
│       └── about.mdx       ← About page bio text
├── data/
│   ├── config.ts           ← Site-wide settings, socials, nav, homepage intro
│   └── series.ts            ← Series metadata (title, description per slug)
├── components/             ← Layout & styling only (no hardcoded content)
├── pages/                  ← Page templates (pull content from collections)
└── lib/                    ← GitHub Activity, Substack, build cache
```

```
public/
├── images/                  ← Profile photo
│   └── art-profile-eeshan.jpeg
├── logos/                   ← Company/education logos
└── videos/                  ← Project demo videos (Phase 5)
```