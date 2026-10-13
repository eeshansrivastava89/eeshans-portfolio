/**
 * Font configuration — single source of truth.
 *
 * To change a font:
 * 1. Update the config below (and the duplicated const in scripts/generate-fonts.mjs)
 * 2. Run: pnpm fonts:generate
 * 3. Update the --font-* vars in globals.css @theme
 * 4. Build — everything updates from here
 *
 * Components use var(--font-sans), var(--font-display), var(--font-mono)
 * so no template changes needed when swapping fonts.
 */

export const fonts = {
	display: {
		name: "Libre Franklin",
		fallback: "Georgia, serif",
		weights: [400, 500, 600, 700, 800],
		styles: ["normal", "italic"],
	},
	sans: {
		name: "Libre Franklin",
		fallback: "system-ui, -apple-system, sans-serif",
		weights: [400, 500, 600, 700, 800],
		styles: ["normal"],
	},
	mono: {
		name: "IBM Plex Mono",
		fallback: '"Fira Code", monospace',
		weights: [400, 500],
		styles: ["normal"],
	},
} as const;