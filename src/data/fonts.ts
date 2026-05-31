/**
 * Font configuration — single source of truth.
 *
 * To change a font:
 * 1. Update the config below
 * 2. Run: pnpm fonts:generate
 * 3. Build — everything updates from here
 *
 * Components use var(--font-sans), var(--font-display), var(--font-mono)
 * so no template changes needed when swapping fonts.
 */

export const fonts = {
	display: {
		name: "Lora",
		fallback: "Georgia, serif",
		weights: [400, 700],
		styles: ["normal", "italic"],
	},
	sans: {
		name: "Source Sans 3",
		fallback: "system-ui, -apple-system, sans-serif",
		weights: [300, 400, 600],
		styles: ["normal"],
	},
	mono: {
		name: "JetBrains Mono",
		fallback: '"Fira Code", monospace',
		weights: [400, 500],
		styles: ["normal"],
	},
} as const;