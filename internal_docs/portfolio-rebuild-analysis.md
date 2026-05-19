# Portfolio Rebuild — Product Manager Analysis

> Saved 2026-05-18 · Based on audit of eeshans.com, GitHub (eeshansrivastava89), Substack (Asymptotic), LinkedIn, and /Users/eeshans/dev project directories.

---

## 1. Who You Are — Brand Audit

**Eeshan Srivastava** — Sr. Data Science Manager @ Starbucks, Seattle. 12+ years across engineering, data science, and technical leadership. CS undergrad, MBA. No FAANG/Ivy credential signal — self-built credibility through shipped work and published writing.

**Core brand pillars:**

- **Builder, not talker** — every project is live, interactive, and open-source
- **Skeptic of hype** — writing consistently stress-tests AI claims against real results
- **Local AI / privacy advocate** — this is your differentiated niche
- **Data science practitioner, not just manager** — A/B testing, causal inference, experimentation
- **Accessible educator** — Substack writing is practical, not academic

**Brand tension:** GitHub profile says "☕ Sr. Data Science Manager @ Starbucks" but projects and writing say "solo indie hacker who ships." The portfolio currently undersells both sides.

---

## 2. Asset Inventory

### Projects (6 active, all live)

| Project | What It Is | Unique Hook | Live URL | npm | Differentiator |
|---|---|---|---|---|---|
| **Sidequests** | Side-project health dashboard — npx, scans dev folder, surfaces next actions | Only tool that gives AI-powered summaries of your local repos | GitHub only | `@eeshans/sidequests` | Most polished, clearest "install and go" value prop |
| **How I Prompt** | Wrapped-style analytics for AI coding conversations | "Spotify Wrapped for Claude" angle | howiprompt.eeshans.com | `@eeshans/howiprompt` | Viral-shareable concept, strong visual |
| **A/B Simulator** | Live memory game running a real A/B test with published statistical analysis | Only A/B test you can actually play | absim.eeshans.com | — | Proves real experimentation chops, not just theory |
| **Local LLM Bench** | Benchmark local models on structured data extraction | F1 scoring, fuzzy matching, MLX + Ollama | GitHub Pages | — | Practical, quantitative benchmark |
| **Local LLM Visual Bench** | Visual benchmark — ask models to build things, compare output side-by-side | "Make a cherry blossom" > "score 0.73 on MMLU" | localai.eeshans.com | — | Best "show, don't tell" demo in local AI space |
| **Quizzard** | Real-time quiz app for live events (Kahoot alternative) | Free, self-hosted, Supabase Realtime, 180-player cap | quizzard.fly.dev | — | Practical utility, not just a portfolio piece |

### Additional project (older, still live)

| **Weather App** | Apple-inspired weather explorer for US ZIP codes | Historical + current + forecast with Chart.js | GitHub Pages | — | Clean design, good first project |

### Writing — Substack (Asymptotic, 9 posts)

| Post | Date | Series | Hook |
|---|---|---|---|
| Local AI Series #3: Testing local AI models by asking them to build Cherry Blossoms and Solar Systems | May 2026 | Local AI (3/3) | Visual prompts as the benchmark method |
| It's time for the regular person to start testing local AI models | Apr 2026 | Local AI (1/3) | Cost/quality/regression argument for local |
| The Regular Person's Guide to Running AI on Your Laptop | Apr 2026 | Local AI (2/3) | 15-minute setup guide |
| How I De-Vibed a Vibe-Coded NLP App | Apr 2026 | Standalone | Vibes → rigor, most shareable single post |
| The Dopamine Trap of AI Coding | Feb 2026 | Standalone | Opinion piece, hot-take potential |
| Why Local AI Is More Important Than Ever | Jan 2026 | Standalone | Privacy + cost framing |
| Building an A/B Testing Memory Game | Dec 2025 | Standalone | Ties to project, full lifecycle walkthrough |
| I Built a Spotify Wrapped for My Coding Habits | — | Standalone | How I Prompt origin story |

### External Publication

- **Towards Data Science:** "Causal Inference in the Wild"

### Credibility Signals

- 🏆 **5 Under 35 Award**, Weatherhead School of Management (2024) — [case.edu link](https://case.edu/news/meet-2024-alumni-award-winners)
- 🎤 **UCLA + Starbucks Industry Seminar** — AI Applications — [LinkedIn](https://www.linkedin.com/posts/activity-7424640753852760064-ZBs6)
- 🎙️ **What Really Matters Podcast** — Weatherhead School of Management (2022) — [Spotify](https://open.spotify.com/episode/0K3M2e38PPMO1HUdXpU0i9)
- 🎙️ **Unapologetic ME with Ekta Khurana** — "From software engineer to data science" — [YouTube](https://www.youtube.com/watch?v=tAvAJ2tS0uY)
- 📰 Published in **Towards Data Science**

### Infrastructure

- Custom domain: `eeshans.com`
- Subdomain apps: `absim.`, `howiprompt.`, `localai.`, `quizzard.`
- Fly.io + GitHub Actions for deploys
- PostHog analytics wired up
- API proxy: `api-v2.eeshans.com`
- Brewfolio: extracted portfolio system as npm package (`create-brewfolio`)

### Other Projects in /Users/eeshans/dev

| Directory | Status | Notes |
|---|---|---|
| `brewfolio` | Published npm monorepo | Portfolio template system |
| `datascienceapps` | Live (old eeshans.com) | Previous AstroPaper-based portfolio |
| `weather-app` | Live on GitHub Pages | Clean first project |
| `goalbot` | Exploring | — |
| `letter-scraper` | Exploring | — |
| `privacy-checker` | Exploring | — |
| `opt-outs` | Exploring | — |
| `notesv2` | Exploring | — |
| `family-medical-portal` | Exploring | — |
| `dddr` | Exploring | — |
| `archived_repos` | Archived | — |
| `aw-import-screentime` | Exploring | — |
| `screen-time-capture-example` | Exploring | — |
| `ucla_data_challenge` | One-off | — |
| `llama.cpp-mtp` | Fork | — |

---

## 3. Gap Analysis — What's Wrong Today

| Problem | Impact |
|---|---|
| **Projects are text cards** — no motion, no demo, no "wow" | Visitors bounce before understanding what you built. Every project is an interactive web app but the portfolio shows them as static text blocks |
| **Writing is a flat list** — no series branding, no hooks | "Local AI Series #3" doesn't land without knowing it's a series. Best posts have no visual hierarchy |
| **About page is a wall of text** — reads like a LinkedIn bio | Doesn't convey personality: kickboxing, painting, Ravenclaw, "regular person" philosophy |
| **Analysis page is buried** — real statistical work is a second-class citizen | Most differentiated skill (practitioner-level experimentation) gets a single link |
| **No video, no motion, no demo anywhere** | Every project is an interactive web app but you'd never know from the portfolio |
| **Social proof is weak** — awards/talks/publications exist but are hidden in `/about` sub-sections | 5 Under 35, UCLA talk, podcast appearances deserve visual treatment |
| **No single narrative thread** | Visitor can't construct "who is this person?" in 10 seconds |
| **Mobile is an afterthought** | All projects are desktop-first web apps; portfolio should set the tone |

---

## 4. Target Audiences & Jobs-to-be-Done

| Audience | Job-to-be-Done | What They Need to See in 10s |
|---|---|---|
| **Hiring managers / recruiters** | "Is this person real?" → credibility fast | Titles, awards, live demos, writing quality |
| **Fellow data scientists / engineers** | "Can I learn from this person?" → depth signals | Real analysis, open-source code, Substack series |
| **Potential collaborators / cofounders** | "What can they ship?" → breadth + quality | Live projects, deployment cadence, variety |
| **AI/ML community on social** | "Is this worth sharing?" → novelty | Hot takes, unique demos, "I built this" energy |
| **General tech-curious readers** | "Can I actually use this?" → accessibility | Clear CTAs, "play now" buttons, local AI guides |

---

## 5. Information Architecture

```
eeshans.com/
├── Hero (identity + headline + motion)
├── Projects (immersive, demo-first)
├── Writing (series-aware, hooks-first)
├── About (personality-driven, credibility-forward)
├── Analysis (practitioner showcase)
└── Connect (everywhere, not a separate page)
```

### Hero

A 5-second handshake that makes someone stop scrolling.

- Name + one-line positioning (not a job title — a *point of view*)
- A single looping 10s demo video that cycles through all 6 projects
- Clear CTAs: [See the projects] [Read the writing] [About me]
- See positioning options in §9

### Projects

Each project gets:

1. **Autoplay looping video thumbnail** (10–15s, no sound, 1080p WebM + H.264 fallback + poster JPG) — single highest-ROI change
2. **One-sentence hook** (not a description — a *why should I care?*)

   | Project | Hook |
   |---|---|
   | Sidequests | "Track every side project you've ever started." |
   | How I Prompt | "Your Spotify Wrapped for AI coding." |
   | A/B Simulator | "Play the game. It's a real experiment." |
   | LLM Visual Bench | "Ask local models to draw cherry blossoms. See who's actually good." |
   | LLM Bench | "Benchmark local models on what matters: structured data extraction." |
   | Quizzard | "A free, self-hosted Kahoot for live events." |

3. **Tech badges** (keep — useful for searchability)
4. **Three CTAs per card:** [Play live] · [Source code] · [Read the writeup] (if one exists)
5. **Click-to-expand** → drawer/sheet with higher-res video + full description + related writing

**Layout:** Not a uniform grid. Lead with Sidequests and How I Prompt as the two strongest projects, then A/B Simulator, then LLM Bench, then Quizzard. Give 2–3 "hero" projects larger cards, the rest standard.

**Video markup pattern:**

```html
<video autoplay muted loop playsinline preload="metadata" poster="…poster.jpg">
  <source src="…webm" type="video/webm" />
  <source src="…mp4"  type="video/mp4"  />
</video>
```

### Writing

- **Series are first-class citizens.** "Local AI Series" gets a branded card with a 3-part count, series artwork, and "Start from #1" CTA
- **Standalone bangers get featured treatment.** "How I De-Vibed a Vibe-Coded NLP App" and "The Dopamine Trap" deserve pull-quote cards
- **Topic tags** as visual chips (Local AI, Experimentation, Career, Opinion)
- **Bidirectional linking** — each post links to its related project and vice versa

### About

Split into scannable sections:

1. **One-liner + photo** (if comfortable)
2. **Role** — "Sr. Data Science Manager, Starbucks · 12 years in engineering & DS"
3. **Philosophy** — distinctive parts front and center: "I test new tech to see what remains after the hype cycle," "AI on your own machine," "non-commercial, open-source"
4. **Credibility signals** — rendered as a visual row/grid, not inline links:
   - 🏆 5 Under 35, Weatherhead 2024
   - 🎤 UCLA AI Applications talk
   - 🎙️ What Really Matters Podcast · Unapologetic ME podcast
   - 📰 Towards Data Science publication
5. **Personal** — kickboxing, painting, basketball, Ravenclaw — these make you memorable, not a footnote
6. **CTAs** — [GitHub] [LinkedIn] [Substack] [Twitter/X]

### Analysis

This is your *differentiator*. Most portfolio sites don't have real statistical analysis.

- Summary card with key finding: *"Variant B is 0.39σ harder — but completion rate dropped 20 percentage points. Don't ship it."*
- Link to live analysis page (already exists and is good)
- Signal that more analyses will be added over time

---

## 6. Design Principles

| Principle | Why |
|---|---|
| **Demo-first: never describe when you can show** | Every project is an interactive web app. A 10s video says more than 200 words of description |
| **One narrative, not five sections** | Connective thread: "I build things to test ideas" unifies Sidequests (testing project health), A/B Simulator (testing hypotheses), LLM Bench (testing model claims), How I Prompt (testing your own behavior), and your writing (testing AI hype). Make that thread obvious |
| **Motion is trust** | Video demos, interactive charts, hover states, transitions — they signal craft and care, and they match the polish of your actual projects |
| **Credibility needs visual weight** | Awards, talks, publications need card treatment. An inline link to "5 Under 35" is forgettable. A card with icon and year is memorable |
| **Writing is a product, not an archive** | Series branding, hooks, excerpts, and visual hierarchy. Substack is active and growing — treat it like a product line |
| **Mobile is table stakes** | Every project's live demo is desktop-first, but the portfolio itself must be perfect on mobile — that's where shares happen |

---

## 7. Tech Approach

Keep Astro. Already there, it works, Brewfolio proves you can extract the system.

Changes needed:

- Add `<video>` elements for project thumbnails (WebM + MP4 + poster)
- Add **Projects showcase section** on the homepage (not just `/projects` — hero or first scroll stop should tease the best 2–3)
- Add **series grouping** to writing collection (`series` frontmatter field with `order` and `seriesTitle`)
- Add **credibility cards** to About section (structured data for awards, talks, publications)
- Ensure every project card has `relatedWriting` link and every post links back to its project
- Add **drawer polish** (slide-in animation, scroll lock, focus management)

---

## 8. Prioritized Roadmap

### Phase 1 — Demo Videos + Project Cards (1 week, highest impact)

| Task | RICE Score | Effort |
|---|---|---|
| Record 45s demo videos for Sidequests, How I Prompt, A/B Simulator, LLM Bench, Quizzard | R:10, I:3, C:5, E:2 → **75** | 2 afternoons |
| Encode WebM + MP4 + poster for each | Part of above | Included |
| Update project cards with `<video>` autoplay thumbnails | R:10, I:3, C:5, E:1 → **150** | 2–3 hrs |
| Add "Play live" + "Source code" + "Read writeup" CTAs | R:8, I:2, C:5, E:1 → **80** | 1 hr |
| Drawer polish (slide-in, scroll lock, focus management) | R:5, I:2, C:4, E:1 → **40** | 2 hrs |

### Phase 2 — Writing + Narrative (3–4 days)

| Task | RICE Score | Effort |
|---|---|---|
| Series grouping for Local AI series (3 posts → branded card) | R:5, I:3, C:4, E:1 → **60** | 3–4 hrs |
| Pull-quote featured cards for standalone bangers | R:4, I:2, C:4, E:1 → **32** | 2 hrs |
| Bidirectional project↔writing links | R:6, I:2, C:4, E:1 → **48** | 2 hrs |
| Topic tag visual chips and filtering | R:4, I:2, C:3, E:1 → **24** | 2 hrs |

### Phase 3 — About + Credibility (2–3 days)

| Task | RICE Score | Effort |
|---|---|---|
| Restructure About into scannable sections (role / philosophy / personal) | R:5, I:3, C:4, E:1 → **60** | 3–4 hrs |
| Credibility signal cards (awards, talks, podcasts, publications) | R:5, I:3, C:4, E:2 → **30** | 2–3 hrs |
| Better hero with positioning line + loop video | R:10, I:3, C:3, E:2 → **45** | 3–4 hrs |
| Social connect links in footer + about (GitHub, LinkedIn, Substack, X) | R:8, I:1, C:5, E:0.5 → **80** | 30 min |

### Phase 4 — Analysis + Growth (2–3 days)

| Task | RICE Score | Effort |
|---|---|---|
| Analysis section with key finding cards | R:3, I:3, C:3, E:2 → **14** | 3–4 hrs |
| Homepage "featured project" carousel or spotlight | R:6, I:2, C:3, E:2 → **18** | 3–4 hrs |
| Newsletter signup CTA (Substack embed) | R:8, I:2, C:4, E:1 → **64** | 1 hr |
| SEO / Open Graph / social sharing cards | R:10, I:2, C:4, E:1 → **80** | 2–3 hrs |

---

## 9. Positioning Options

The portfolio needs a positioning line that makes someone stop. Current site says nothing in the hero — just your name.

| Option | Vibe |
|---|---|
| **"I build things to test ideas."** | Builder-first, intellectually curious |
| **"Testing AI claims so you don't have to."** | Provocative, differentiated, writer-adjacent |
| **"Data science manager. Local AI skeptic. Open-source builder."** | Factual, triple-signal |
| **Positioning line from your own voice** | Yours — whatever you'd actually say |

**Recommendation:** Use whatever line sounds like *you*, not marketing copy. The options above are starting points — pick one, combine, or write your own. If it reads like AI generated it, it's wrong.

---

## 10. Current vs. Target State Summary

| Dimension | Current State | Target State |
|---|---|---|
| **Projects** | 4 text cards, no demos | 6 video-thumbnail cards with live CTAs |
| **Writing** | Flat reverse-chron list | Series-branded + featured + linked to projects |
| **About** | LinkedIn-style paragraph | Scannable: role → philosophy → credibility → personal |
| **Analysis** | Buried single link | Visual finding cards, practitioner showcase |
| **Hero** | Just your name | Tagline + looping project demo reel |
| **Motion** | None | Video thumbnails, hover transitions, drawer animations |
| **Story** | Implicit | Explicit — in your own words |
| **Mobile** | Functional but not differentiated | Swipeable project demos, touch-friendly cards |
| **Social proof** | Inline links | Cards with icons, dates, descriptions |
| **Newsletter** | No CTA | Substack signup prominently placed |

---

## Appendix: Recording Tips (from earlier session)

- 1920×1200 viewport at 2x DPR; hide menu bar/dock; neutral wallpaper; mute notifications
- Pre-populate test data so empty state isn't the first frame
- No voiceover, no music — visual flow only
- Loop-friendly endings so autoplay-loop thumbnails feel seamless
- WebM/AV1 for thumbnails, MP4/H.264 for click-to-expand
- **Tool:** Screen Studio (Mac, $89 one-time or trial) — 90% of polished demo videos online are made with it
- Per-video workflow: 45s take, 2–3 attempts, pick best, 1080p MP4 + WebM fallback + poster JPG, ~10–20 min per app
- Whole gallery is 2 afternoons