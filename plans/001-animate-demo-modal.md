# 001 — Animate the demo modal enter/exit

- **Status**: DONE
- **Commit**: 72a5c80
- **Severity**: HIGH
- **Category**: Missed opportunity / preventing jarring change
- **Estimated scope**: 2 files, ~45 lines of CSS, 1 class-name edit

## Problem

The demo video modal — the largest interactive element on the site — opens and closes instantly. `dialog.showModal()` snaps the dialog into view and the `backdrop:bg-black/55` backdrop pops in with zero transition. Closing is equally abrupt. This is the site's one "occasional frequency" element (a demo watch), so it earns a standard, well-tuned animation.

Current code, `src/layouts/Base.astro:115-127`:

```astro
<dialog
	id="demo-modal"
	class="p-0 border-none rounded-xl w-[min(92vw,960px)] bg-neutral-950 text-neutral-100 overflow-hidden backdrop:bg-black/55"
>
	<div class="flex items-center justify-between px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs">
		<span class="modal-title"></span>
		<button type="button" class="modal-close cursor-pointer px-2 py-1 opacity-70 hover:opacity-100" aria-label="Close">✕</button>
	</div>
	<video controls playsinline preload="none" class="block w-full">
		<source type="video/webm" />
		<source type="video/mp4" />
	</video>
</dialog>
```

There is currently no dialog/modal CSS anywhere — `rg dialog src/styles/globals.css` returns nothing.

## Target

The dialog fades in and scales from `0.97` to `1` over **250ms**; it closes over **200ms** (exit faster than enter). The backdrop fades `black/0 → black/55` over the same durations. `transform-origin` stays **center** — this is a modal, not a popover; center origin is correct and must not change.

Easing: `cubic-bezier(0.23, 1, 0.32, 1)` (strong ease-out) for the dialog; plain `ease` for the backdrop color fade.

Exact CSS to add at the end of `src/styles/globals.css`:

```css
/* Demo modal enter/exit — native <dialog> animated via @starting-style + allow-discrete */
#demo-modal {
	opacity: 0;
	transform: scale(0.97);
	transition:
		opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
		transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
		overlay 200ms cubic-bezier(0.23, 1, 0.32, 1) allow-discrete,
		display 200ms cubic-bezier(0.23, 1, 0.32, 1) allow-discrete;
}
#demo-modal[open] {
	opacity: 1;
	transform: scale(1);
	transition-duration: 250ms;
}
@starting-style {
	#demo-modal[open] {
		opacity: 0;
		transform: scale(0.97);
	}
}
#demo-modal::backdrop {
	background-color: rgb(0 0 0 / 0);
	transition:
		background-color 200ms ease,
		overlay 200ms ease allow-discrete,
		display 200ms ease allow-discrete;
}
#demo-modal[open]::backdrop {
	background-color: rgb(0 0 0 / 0.55);
}
@starting-style {
	#demo-modal[open]::backdrop {
		background-color: rgb(0 0 0 / 0);
	}
}

/* Reduced motion: keep the opacity fade, drop the scale */
@media (prefers-reduced-motion: reduce) {
	#demo-modal {
		transform: none;
	}
	#demo-modal[open] {
		transform: none;
	}
	@starting-style {
		#demo-modal[open] {
			transform: none;
		}
	}
}
```

How it works (do not deviate): the base rule's 200ms transition is the **exit** timing (when `[open]` is removed, the base styles are the destination); the `[open]` rule's `transition-duration: 250ms` is the **enter** timing. `allow-discrete` on `display`/`overlay` lets the browser keep the dialog rendered for the exit transition instead of removing it instantly.

## Repo conventions to follow

- Global one-off CSS lives in `src/styles/globals.css` as plain CSS after the Tailwind layers — exemplar: the `@utility project-grid` block at the bottom of that file. This component has no motion tokens (there is no `--ease-*` anywhere); inline the cubic-bezier literally, do not invent a token system here.
- Tailwind classes stay on the `<dialog>` element for layout/color; only the backdrop color moves to CSS (it must be transitionable, which the `backdrop:bg-black/55` utility cannot do on its own).

## Steps

1. In `src/layouts/Base.astro`, edit the `<dialog>` class attribute: remove `backdrop:bg-black/55` so the class reads:
   ```
   class="p-0 border-none rounded-xl w-[min(92vw,960px)] bg-neutral-950 text-neutral-100 overflow-hidden"
   ```
2. In `src/styles/globals.css`, append the entire CSS block from **Target** above (modal + backdrop + `@starting-style` blocks + reduced-motion block) after the `@utility project-grid` block.
3. Do not touch the `<script is:inline>` modal logic. The existing `dialog.addEventListener("close", () => video.pause())` pauses the video the moment `close()` is called; the frozen last frame fading out over 200ms is the intended behavior.

## Boundaries

- Do NOT touch `src/components/ProjectCardContent.astro` or any trigger markup.
- Do NOT change the modal's `transform-origin` (default center is correct for modals).
- Do NOT add JS animation libraries, WAAPI calls, or dependencies.
- Do NOT add easing/duration tokens to `@theme` — that is a separate, unscheduled plan.
- If the `<dialog>` markup or class list has drifted from what is quoted above, STOP and report instead of improvising.

## Verification

- **Mechanical**: `pnpm build` succeeds with no CSS errors.
- **Feel check**: `pnpm dev`, open `/projects`, click any "Demo" link, and confirm:
  - The dialog fades in and scales `0.97 → 1` from the **center** of the viewport; the backdrop darkens over the same beat. It should feel like one cohesive entrance, not two separate events.
  - Press Escape / click outside / click ✕ — the exit is noticeably quicker than the entrance (200ms vs 250ms) and never snaps.
  - In DevTools → Animations panel, set playback to 10% and confirm opacity and scale move in sync and the backdrop fades alongside.
  - Toggle `prefers-reduced-motion` (Rendering panel) and confirm the fade remains but there is no scale.
- **Browser note**: `@starting-style` and `allow-discrete` need Chrome 117+, Safari 18.4+, Firefox 129+. Older browsers get the current instant open/close with no breakage — verify in Chrome only.
- **Done when**: open and close both animate, exit is faster than enter, backdrop fades in sync, reduced motion drops only the scale, and the build is green.
