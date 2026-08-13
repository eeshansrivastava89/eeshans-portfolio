# Mockups — project card redesign

Static mockups for the proposed project-card redesign (Aug 2026). **Nothing here ships** — this folder is for looking and deciding only.

## What changed vs. the live site

- Project rows (full-width, autoplay muted looping videos) → **card grid**, 2 or 3 per row (toggle), stacking on mobile.
- Autoplay videos → **static poster images** + a `▶ Demo` link. Clicking the poster *or* the Demo link opens a **modal** that plays the real video with controls.
- Everything else (header, intro, Writing, GitHub Activity, Subscribe, footer) is unchanged — those sections are embedded as **real screenshots captured from the live site** so the mockup shows true content.

## View it

From the repo root (paths reference `../public/videos` and `../public/fonts`):

```bash
npx serve .        # or: python3 -m http.server
# open http://localhost:3000/mockups/
```

Opening `mockups/index.html` directly via double-click (file://) also works.

## The toggle

Bottom-right pill switches between the two card variants being considered:

- **Posters** — card shows the existing poster JPG (click → modal plays video)
- **Text-only** — no image; Demo is just a text link

A second control switches the grid between **2/row** and **3/row** (defaults to 3).

This toggle is mockup chrome, not part of the proposed design.

## Files

- `index.html` — home page mockup (3 project cards, as live today)
- `projects.html` — projects page mockup (all 4 projects, single unified grid — categories removed)
- `mockup.css` / `mockup.js` — shared styles + interactions (mirrors `src/styles/globals.css` tokens, light theme only)
- `assets/` — real captures of unchanged sections from the live site

## Not mocked

- Dark mode (light theme only)
- Writing/About pages
- Mobile captures of unchanged sections (embedded screenshots are fixed-width; the card grid itself *is* responsive — resize the browser to see)
