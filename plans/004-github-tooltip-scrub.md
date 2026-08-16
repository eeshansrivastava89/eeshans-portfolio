# 004 — GitHub contribution tooltips: instant on subsequent hovers, scale from the day

- **Status**: DONE
- **Commit**: 72a5c80
- **Severity**: MEDIUM
- **Category**: Purpose & frequency / Physicality & origin
- **Estimated scope**: 1 file (`src/components/GitHubActivity.astro`), ~20 lines added, 1 line edited

## Problem

The contribution heatmap renders ~180 day cells, each with a CSS `::after` tooltip that animates in over 120ms on hover. Two issues:

1. **Every tooltip re-animates while scrubbing.** Moving the pointer across the grid fires a fresh 120ms fade+scale for every cell — dozens of animations in a single gesture. Tooltip animations exist to orient the user on the *first* hover; once one tooltip is open, adjacent ones should appear **instantly** (0ms). This makes the whole grid feel faster without defeating the first-tooltip delay.
2. **Wrong transform origin.** The tooltip scales from `center` (default) but it is anchored above the day cell — it should grow from `50% 100%` (bottom center, i.e. from the trigger).

Current code, `src/components/GitHubActivity.astro:229-249`:

```css
.gh-contrib-day::after {
	content: attr(data-tip);
	position: absolute;
	bottom: calc(100% + 8px);
	left: 50%;
	transform: translateX(-50%) scale(0.9);
	padding: 4px 8px;
	border-radius: 6px;
	font-size: 11px;
	font-family: var(--font-mono);
	white-space: nowrap;
	color: var(--color-background);
	background: var(--color-foreground);
	pointer-events: none;
	opacity: 0;
	transition: opacity 120ms ease, transform 120ms ease;
	z-index: 10;
}
```

The grid container markup is at `src/components/GitHubActivity.astro:89`:

```astro
<div class="gh-contrib-grid mb-4" style={`--weeks: ${weeks.length};`}>
```

The component currently has no `<script>` block — the tooltips are pure CSS.

## Target

First tooltip in a burst animates (120ms, existing values unchanged); any tooltip triggered within 800ms of the previous one is instant. Tooltip scales from bottom center. Exit of the previous tooltip during a scrub is also instant — one visible tooltip at a time, no overlapping fades.

**Edit 1** — add `transform-origin` to the `::after` rule (one new declaration after `transform: translateX(-50%) scale(0.9);`):

```css
	transform-origin: 50% 100%;
```

**Edit 2** — append to the component's `<style>` block (after the tooltip rules):

```css
/* While scrubbing the grid, subsequent tooltips appear instantly */
.gh-contrib-grid[data-scrubbing] .gh-contrib-day::after,
.gh-contrib-grid[data-scrubbing] .gh-contrib-day::before {
	transition-duration: 0ms;
}
```

**Edit 3** — add this `<script>` block to `src/components/GitHubActivity.astro`, immediately after the closing `</style>` tag:

```astro
<script>
	const grid = document.querySelector(".gh-contrib-grid");
	if (grid) {
		let lastShown = 0;
		grid.addEventListener("pointerover", (e) => {
			const day = (e.target as HTMLElement).closest(".gh-contrib-day");
			if (!day) return;
			const now = performance.now();
			if (now - lastShown < 800) {
				grid.setAttribute("data-scrubbing", "");
			} else {
				grid.removeAttribute("data-scrubbing");
			}
			lastShown = now;
		});
	}
</script>
```

Behavior this produces: hover a day → tooltip animates in. Move to a neighboring day within 800ms → `data-scrubbing` is set → that tooltip (and the previous one's exit) is 0ms. Stop for 800ms+ → the next hover animates again. `pointerover` on the grid fires once per cell entry, so this costs one timestamp comparison per hover.

## Repo conventions to follow

- Component-scoped styles live in the component's `<style>` block — this file already does that for `.gh-contrib-day`, `.gh-contrib-day::after`, etc.
- Astro component `<script>` blocks are processed as TypeScript modules and deferred by default; no `DOMContentLoaded` wrapper needed. There is no existing script exemplar in this file, but the pattern matches a standard Astro island-less enhancement. The `(e.target as HTMLElement)` cast is required — do not remove it.
- Do not change the tooltip's duration (120ms) or its `scale(0.9)` entry — both are already correct.

## Steps

1. Add `transform-origin: 50% 100%;` to `.gh-contrib-day::after`.
2. Add the `[data-scrubbing]` CSS rule to the `<style>` block.
3. Add the `<script>` block after `</style>`.
4. Build and feel-check (below).

## Boundaries

- Do NOT touch the day-cell hover lift (`translateY(-3px) scale(1.45)`) or its easing — that is already correct.
- Do NOT touch the `::before` arrow's positioning; it only gains the 0ms duration under scrubbing.
- Do NOT gate this behind media queries and do NOT modify the existing `prefers-reduced-motion` block.
- Do NOT convert the tooltips to a JS-rendered element or add a library.
- If the quoted CSS or markup has drifted, STOP and report.

## Verification

- **Mechanical**: `pnpm build` succeeds; the built page contains `data-scrubbing` logic (search the output HTML/JS for `gh-contrib-grid` if unsure).
- **Feel check**: `pnpm dev`, scroll to GitHub Activity:
  - Hover one day: tooltip fades/scales in over ~120ms, growing **upward from the day**, not from its own center.
  - Sweep the pointer horizontally across a week row: tooltips track the pointer **instantly** — no lag, no parade of fading boxes.
  - Stop on a day for a second, then hover a distant day: that tooltip animates again.
  - DevTools → Animations at 10%: on the first hover, the tooltip's scale pivot is its bottom edge.
- **Done when**: scrubbing is instant, first-hover animation intact, tooltip origin is bottom-center, build green.
