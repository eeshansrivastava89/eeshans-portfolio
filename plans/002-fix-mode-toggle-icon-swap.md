# 002 — Fix ModeToggle icon swap (scale-from-nothing, transition-all, no press feedback)

- **Status**: DONE
- **Commit**: 72a5c80
- **Severity**: MEDIUM
- **Category**: Physicality & origin / Performance
- **Estimated scope**: 2 files, 3 edited lines

## Problem

The dark/light toggle has three motion defects:

1. **Icons appear from nothing.** The moon icon enters from `scale-0` (and the sun exits to `scale-0`). Nothing in the real world appears from nothing — entrances must start from `scale(0.9–0.97)` combined with `opacity: 0`, never `scale(0)`.
2. **`transition-all`.** Both icons and the shared `Button` use `transition-all`, which animates unintended properties and can push work off the GPU. Transitions must name exact properties.
3. **No press feedback.** The button gives no confirmation it heard the press — pressable elements need `transform: scale(0.97)` on `:active`.
4. **No reduced-motion path.** The rotate/scale swap plays fully under `prefers-reduced-motion`.

Current code, `src/components/ModeToggle.tsx:60-63`:

```tsx
<SunIcon className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
<MoonIcon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
```

Current code, `src/components/ui/button.tsx:7` (the base class string inside `cva(...)`):

```
"inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
```

## Target

Icon swap: incoming icon starts at `scale(0.9)`, rotated, `opacity: 0` — it has a visible silhouette as it arrives instead of materializing from zero. Explicit properties only (`transform`, `opacity`), 200ms, strong ease-out. Under reduced motion only the opacity crossfade runs; the transform snaps.

Replace the two icon lines in `src/components/ModeToggle.tsx` with exactly:

```tsx
<SunIcon className="h-4 w-4 scale-100 rotate-0 opacity-100 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] dark:scale-90 dark:-rotate-90 dark:opacity-0 motion-reduce:transition-[opacity]" />
<MoonIcon className="absolute h-4 w-4 scale-90 rotate-90 opacity-0 transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] dark:scale-100 dark:rotate-0 dark:opacity-100 motion-reduce:transition-[opacity]" />
```

Button base: explicit transitioned properties + subtle press scale. In `src/components/ui/button.tsx`, replace the `transition-all` token inside the base class string with:

```
transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97]
```

so the string begins:

```
"inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] outline-none focus-visible:border-ring ..."
```

(Everything after `outline-none` stays byte-identical.)

## Repo conventions to follow

- Tailwind v4 arbitrary values are already used in this codebase — exemplar: `group-hover/poster:scale-[1.02]` in `src/components/ProjectCardContent.astro:34`. Use the same bracket syntax.
- `motion-reduce:` is a built-in Tailwind variant; no config needed. The codebase already hand-writes one `prefers-reduced-motion` block in `src/components/GitHubActivity.astro:270-276` — same intent, utility form here.
- `Button` is used by exactly one component (`ModeToggle.tsx`), confirmed by `rg -l "components/ui/button" src/` → single result. The `active:scale-[0.97]` addition is safe globally.

## Steps

1. `src/components/ui/button.tsx`: in the `cva` base string, replace `transition-all` with `transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97]`. One token swap, nothing else changes.
2. `src/components/ModeToggle.tsx`: replace the `SunIcon` and `MoonIcon` className lines with the target lines above.
3. Build and feel-check (below).

## Boundaries

- Do NOT touch the theme-toggle click handler, `localStorage` logic, or icon SVGs.
- Do NOT change the button variants/sizes maps.
- Do NOT add a page-wide color crossfade on theme change — that is a separate, unscheduled opportunity.
- Do NOT add dependencies.
- If the quoted lines have drifted, STOP and report.

## Verification

- **Mechanical**: `pnpm build` succeeds.
- **Feel check**: `pnpm dev`, toggle the theme repeatedly:
  - The incoming icon fades in while rotating and finishing its last 10% of scale — it never appears from a point.
  - `transition-all` is gone: inspect the button in DevTools → Computed → `transition-property` shows exactly `color, background-color, border-color, box-shadow, transform`.
  - Press and hold the toggle: it scales to 0.97 and springs back on release (150ms — snappy, not mushy).
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`: the icons crossfade with **no rotation or scale**.
  - DevTools → Animations at 10% speed: opacity and transform start and end together; no double-exposure where both icons are half-visible at full size.
- **Done when**: no `scale-0` or `transition-all` remains in either file, press feedback is visible, reduced motion keeps only the fade, build green.
