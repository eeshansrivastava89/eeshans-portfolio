/**
 * Generates src/styles/fonts.css and downloads woff2 files from public/fonts.
 * Reads config from src/data/fonts.ts.
 *
 * Usage: node scripts/generate-fonts.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

// ── Config (synced with src/data/fonts.ts) ──────────────────────────
const fonts = {
	display: {
		name: "Lora",
		fallback: "Georgia, serif",
		weights: [400, 700],
		styles: ["normal", "italic"],
	},
	sans: {
		name: "Geist",
		fallback: "system-ui, -apple-system, sans-serif",
		weights: [300, 400, 500, 600],
		styles: ["normal"],
	},
	mono: {
		name: "JetBrains Mono",
		fallback: '"Fira Code", monospace',
		weights: [400, 500],
		styles: ["normal"],
	},
};

// ── Unicode ranges ──────────────────────────────────────────────────
const subsets = {
	latin: "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
	latinExt: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
};

// ── FontSource CDN slugs ────────────────────────────────────────────
const fontSlugs = {
	"Lora": "lora",
	"Source Sans 3": "source-sans-3",
	"JetBrains Mono": "jetbrains-mono",
	"Inter": "inter",
	"Raleway": "raleway",
	"Geist": "geist",
	"Plus Jakarta Sans": "plus-jakarta-sans",
	"Outfit": "outfit",
};

// CDN uses hyphenated subset names in URLs
const cdnSubsetNames = { latin: "latin", latinExt: "latin-ext" };

// ── Helpers ──────────────────────────────────────────────────────────
function slug(name) {
	return fontSlugs[name] || name.toLowerCase().replace(/\s+/g, "-");
}

const FONT_DIR = "public/fonts";
const CSS_PATH = "src/styles/fonts.css";

async function downloadWoff2(fontName, weight, style, subset, fileName) {
	const s = slug(fontName);
	const cdnSubset = cdnSubsetNames[subset];
	const filePath = `${FONT_DIR}/${fileName}`;

	if (existsSync(filePath)) {
		console.log(`  ✓ ${fileName} (cached)`);
		return;
	}

	const url = `https://cdn.jsdelivr.net/fontsource/fonts/${s}@latest/${cdnSubset}-${weight}-${style}.woff2`;
	console.log(`  ↓ ${fileName}`);

	const res = await fetch(url);
	if (!res.ok) {
		console.error(`  ✗ ${res.status} from ${url}`);
		return;
	}
	const buf = Buffer.from(await res.arrayBuffer());
	writeFileSync(filePath, buf);
}

async function main() {
	if (!existsSync(FONT_DIR)) mkdirSync(FONT_DIR, { recursive: true });

	console.log("Generating fonts.css + downloading woff2 files...\n");

	const lines = [
		"/* Auto-generated from src/data/fonts.ts — do not edit directly */",
		"/* To change fonts: edit src/data/fonts.ts and run pnpm fonts:generate */",
		"",
	];

	for (const [role, font] of Object.entries(fonts)) {
		console.log(`${font.name} (${role}):`);
		for (const weight of font.weights) {
			for (const style of font.styles) {
				for (const [subsetName, range] of Object.entries(subsets)) {
					// File naming uses hyphenated subset (latin-ext), CSS var uses camelCase (latinExt)
					const fileName = `${slug(font.name)}-${subsetName.replace(/([a-z])(Ext)/, '$1-$2').toLowerCase()}-${weight}-${style}.woff2`;
					await downloadWoff2(font.name, weight, style, subsetName, fileName);

					lines.push("@font-face {");
					lines.push(`\tfont-family: "${font.name}";`);
					lines.push(`\tfont-style: ${style};`);
					lines.push(`\tfont-weight: ${weight};`);
					lines.push("\tfont-display: swap;");
					lines.push(`\tsrc: url("/fonts/${fileName}") format("woff2");`);
					lines.push(`\tunicode-range: ${range};`);
					lines.push("}");
					lines.push("");
				}
			}
		}
		console.log("");
	}

	writeFileSync(CSS_PATH, lines.join("\n"));
	console.log(`\n✓ ${CSS_PATH} generated`);

	console.log("\nTheme variables (paste into globals.css @theme):");
	for (const [role, font] of Object.entries(fonts)) {
		console.log(`\t--font-${role}: "${font.name}", ${font.fallback};`);
	}
}

main().catch(console.error);