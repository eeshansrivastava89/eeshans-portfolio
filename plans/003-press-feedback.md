# 003 — Add `:active` press feedback to the poster button, modal close, and subscribe button

- **Status**: DONE
- **Commit**: 72a5c80
- **Severity**: MEDIUM
- **Category**: Physicality & origin (feedback)
- **Estimated scope**: 3 files, 3 small edits

## Problem

Buttons must feel responsive: pressing one should give instant visual confirmation via `transform: scale(0.97)` (subtle, 0.95–0.98 range) with a 100–160ms ease-out transition. Three pressable elements on the site have none — the interface never acknowledges the press. (The theme toggle's press feedback is handled separately in plan 002.)

**a) Project poster button** — `src/components/ProjectCardContent.astro:19-29`. Current:

```astro
<button
	type="button"
	class="group/poster relative block w-full aspect-video rounded-lg border border-border overflow-hidden cursor-pointer bg-muted mb-3.5 p-0"
	data-demo
	...
>
```

**b) Modal ✕ close button** — `src/layouts/Base.astro:122`. Current:

```astro
<button type="button" class="modal-close cursor-pointer px-2 py-1 opacity-70 hover:opacity-100" aria-label="Close">✕</button>
```

**c) Subscribe button** — `src/components/SubscribeBox.astro:52-68`. Current (note: it has **no transition at all**, so even the hover background snaps):

```css
.sub-button {
	display: inline-flex;
	align-items: center;
	gap: 7px;
	flex-shrink: 0;
	padding: 8px 13px;
	border-radius: 999px;
	background: var(--color-substack, #ff6719);
	color: #fff;
	font-size: 0.85rem;
	font-weight: 800;
	text-decoration: none;
}
```

## Target

**a) Poster button** — scale the whole poster (children scale with it, which is the desired effect). Large surface → subtler 0.98. Append to the class list:

```
transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]
```

Full resulting class attribute:

```
class="group/poster relative block w-full aspect-video rounded-lg border border-border overflow-hidden cursor-pointer bg-muted mb-3.5 p-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]"
```

Note: the `<img>` inside has its own `group-hover/poster:scale-[1.02]` hover zoom. Nested transforms compose multiplicatively — on press the whole card (zoomed image included) compresses to 0.98. That is intended; do not "fix" it.

**b) Modal ✕** — small icon button → 0.95. Its existing hover is opacity-based; consolidate onto one explicit transition. Replace the class attribute with:

```
class="modal-close cursor-pointer px-2 py-1 opacity-70 hover:opacity-100 transition-[opacity,transform] duration-150 ease-out active:scale-[0.95]"
```

**c) Subscribe button** — add a real transition (fixes the snapping hover too; color changes use `ease`) plus the press scale. In the `.sub-button` rule, add one line:

```css
.sub-button {
	/* ...existing declarations unchanged... */
	transition: background-color 150ms ease, transform 160ms cubic-bezier(0.23, 1, 0.32, 1);
}
.sub-button:active {
	transform: scale(0.97);
}
```

Press feedback needs no `prefers-reduced-motion` carve-out: it is a direct response to the user's own physical input, not gratuitous motion. Do not gate it. Do not gate `:active` behind `hover: hover` either — tap press feedback is wanted on touch.

## Repo conventions to follow

- Tailwind arbitrary values — exemplar `group-hover/poster:scale-[1.02]` in `src/components/ProjectCardContent.astro:34`.
- Hand-written component CSS lives in a scoped `<style>` block in the component file — exemplar: `.substack-pill` in `src/components/PostItem.astro:63-80`, which already uses `transition: background 150ms ease` for a color hover.
- Explicit transition properties only — no `transition-all` anywhere in this change.

## Steps

1. `src/components/ProjectCardContent.astro`: append the four classes to the poster `<button>` class attribute (exact result above).
2. `src/layouts/Base.astro`: replace the `.modal-close` button's class attribute (exact result above).
3. `src/components/SubscribeBox.astro`: add the `transition` declaration to `.sub-button` and add the `.sub-button:active` rule directly beneath the `.sub-button:hover` rule.
4. Build and feel-check (below).

## Boundaries

- Do NOT touch `src/components/ui/button.tsx` or `src/components/ModeToggle.tsx` — plan 002 owns those.
- Do NOT add hover animations to these elements beyond what exists — this plan is press feedback only.
- Do NOT restructure markup or add wrapper elements.
- If any quoted class list or CSS rule has drifted, STOP and report.

## Verification

- **Mechanical**: `pnpm build` succeeds.
- **Feel check**: `pnpm dev`:
  - `/projects` or home: press and hold a project poster — the whole poster compresses slightly (0.98) and springs back on release. On touch (DevTools device emulation), tap shows the same press.
  - Open the demo modal; press and hold ✕ — it dims *and* compresses (0.95).
  - Footer subscribe box: press and hold the orange button — compresses to 0.97; the hover background now fades instead of snapping.
  - DevTools → Animations at 10% speed: press transitions run 150–160ms with a fast start (ease-out), no sluggish ramp.
- **Done when**: all three elements visibly respond to press, no `transition-all` introduced, build green.
