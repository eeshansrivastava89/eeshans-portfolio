/**
 * Icon data sourced from icon libraries — no hand-maintained SVG paths.
 *
 * - Brand icons (fill-style): simple-icons package
 * - UI icons (stroke-style): lucide-static package
 * - LinkedIn: hard-coded path (removed from simple-icons for trademark)
 *
 * Consumers render <svg> elements and inject path data.
 */

import { siGithub, siSpotify, siYoutube, siX, siSubstack } from "simple-icons";
import lucideStatic from "lucide-static";

export interface IconData {
	path: string;
	viewBox?: string;
}

/** Extract inner SVG content (between <svg> tags) and viewBox from a full SVG string */
function parseSvg(svg: string): IconData {
	const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
	const inner = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1]?.trim() ?? "";
	return { path: inner, viewBox };
}

// --- Brand icons (fill-style, from simple-icons) ---

export const brandIcons: Record<string, IconData> = {
	github: { path: siGithub.path },
	linkedin: {
		// simple-icons removed LinkedIn for trademark — kept as hard-coded path
		path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
	},
	substack: { path: siSubstack.path },
	twitter: { path: siX.path },
	spotify: { path: siSpotify.path },
	youtube: { path: siYoutube.path },
};

// --- Lucide-style icons (stroke-style, from lucide-static) ---

export const lucideIcons: Record<string, IconData> = {
	award: parseSvg(lucideStatic.Award),
	trophy: parseSvg(lucideStatic.Trophy),
	radio: parseSvg(lucideStatic.Radio),
	mic: parseSvg(lucideStatic.Mic),
	newspaper: parseSvg(lucideStatic.Newspaper),
	externalLink: parseSvg(lucideStatic.ExternalLink),
	globe: parseSvg(lucideStatic.Globe),
};

/** Mapping from impact item linkType to the icon key */
export const linkTypeIcons: Record<string, string> = {
	web: "globe",
	spotify: "spotify",
	youtube: "youtube",
	linkedin: "linkedin",
	github: "github",
};

/** Brand icon keys that use fill-style rendering (simple-icons) */
export const fillIcons = new Set(Object.keys(brandIcons));