# Working Principles

## Work in chunks, pause after each one

Never sprint through multiple phases in one go. Work in discrete chunks — one logical unit of work at a time. After each chunk, pause and tell the user what was done, what's next, and whether anything needs a decision before continuing. The user decides when to proceed.

## Phase workflow (agreed with Eeshan, 2026-10-17)

The design/product audit runs phase by phase, tracked in `internal-docs/active/2026-10-17-design-product-audit.html`.

- Work through every task inside the **current phase**, chunk by chunk; never start the next phase on your own.
- Verify every visual change yourself: build, serve, then measure the DOM and take Playwright screenshots (390/640/960/1280/1920, light and dark). Never report a visual result you have not measured or seen.
- At the end of a phase run the full sweep (overflow, console errors, headings, type inventory, screenshots), update the tracker's checkboxes and done-notes, then **stop and wait for Eeshan's validation**.
- Only Eeshan's explicit approval starts the next phase.
- Keep `.pi/context.md` current at the end of each phase so a fresh session can resume.

## Maximize DRY, reusability, and composability

Every piece of logic should exist in exactly one place. If two components share behavior, extract it into a shared component, utility, or config. If a pattern appears more than once, generalize it. Reusable > repeated.

## Minimize code and custom implementations

Always reach for an existing library, framework, or tool before writing custom code. More dependencies is fine if they reduce the amount of code we own. The goal is to own as little custom logic as possible. Only write custom code when no off-the-shelf solution does what we need.

## Think in root causes, not patches

When something breaks or behaves unexpectedly, trace it to the root cause. Don't stack workarounds on top of symptoms. Fix the underlying issue — whether that's a schema mismatch, a config error, a wrong abstraction, or a structural problem. One correct fix is better than three compensating patches.

## Minimize conditionals

When fixing bugs or adding features, don't solve problems by adding `if/else` branches. Conditionals accumulate complexity. Instead, restructure so the correct path is the only path. A function that handles two cases cleanly is better than a function that handles five cases with nested guards.

## No hidden fallbacks. One way to do things. Fail loudly.

Every feature should have exactly one implementation path. No silent fallbacks, no "try X, then Y, then Z" chains that mask which path actually ran. If something fails, it should fail with a clear error — not fall through to a default that hides the problem. Implicit behavior is a bug waiting to happen. Make the happy path explicit and the error path visible.