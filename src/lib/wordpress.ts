import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { MEDIA_SELECTOR, repairMediaUrl, WORDPRESS_ORIGIN } from "./hotlinked-media.mjs";

export const WORDPRESS_SITE_URL = WORDPRESS_ORIGIN;
// WordPress.com personal sites have no public /follow page — following is a
// WordPress Reader action taken on the site itself, so CTAs point at the root
export const WORDPRESS_FOLLOW_URL = WORDPRESS_SITE_URL;
const WORDPRESS_SNAPSHOT_PATH = path.join(
	process.cwd(),
	".cache",
	"wordpress-posts.json",
);

export interface WordPressPost {
	title: string;
	link: string;
	slug: string;
	date: Date;
	excerpt: string;
	content: string;
	categories: { name: string; slug: string }[];
	coverImage?: string;
	/** WordPress.com likes on the original post */
	likeCount: number;
	/** Approved comments on the original post */
	commentCount: number;
	/** Media URLs (after repairMediaUrl) that returned 4xx at the last refresh */
	deadMedia: string[];
}

function readWordPressSnapshot(): WordPressPost[] {
	if (!fs.existsSync(WORDPRESS_SNAPSHOT_PATH)) {
		throw new Error(
			`${WORDPRESS_SNAPSHOT_PATH} does not exist. Run pnpm refresh:wordpress and commit the generated snapshot.`,
		);
	}

	return JSON.parse(
		fs.readFileSync(WORDPRESS_SNAPSHOT_PATH, "utf-8"),
	) as WordPressPost[];
}

export function renderWordPressHtml(html: string, deadMedia: string[]): string {
	// isDocument=false: keep fragment mode so $.html() returns the body fragment
	const $ = cheerio.load(html, null, false);

	$("script").remove();
	$("style").remove();

	// Root-relative hrefs (e.g. WP.com's retired /2011/annual-report/ service
	// pages) would otherwise resolve against this site and 404 here. Point
	// them at the WordPress origin they came from.
	$('a[href^="/"]').each((_, el) => {
		$(el).attr("href", `${WORDPRESS_ORIGIN}${$(el).attr("href")}`);
	});
	// Inline background images carry the same root-relative paths
	// (e.g. the 2011 annual-report teaser) and 404 for the same reason.
	$("[style]").each((_, el) => {
		const style = $(el).attr("style");
		if (style && /url\(\s*(['"]?)\//.test(style)) {
			$(el).attr("style", style.replace(/url\((['"]?)\/(?!\/)/g, `url($1${WORDPRESS_ORIGIN}/`));
		}
	});

	// The post page owns the only h1 — shift body headings so the top level
	// is h2, preserving their relative hierarchy (some posts use h1 for list
	// items, one mixes h1/h2). Runs before id injection so shifted headings
	// reach the TOC.
	const levels = $("h1, h2, h3, h4, h5, h6")
		.toArray()
		.map((el) => Number(el.tagName.slice(1)));
	const shift = Math.max(0, 2 - Math.min(...levels));
	$("h1, h2, h3, h4, h5, h6").each((_, el) => {
		el.tagName = `h${Math.min(6, Number(el.tagName.slice(1)) + shift)}`;
	});

	// Heading ids for the floating TOC (stable slugs, no position suffixes —
	// import runs are idempotent so the same post always gets the same ids)
	$("h2, h3, h4").each((i, el) => {
		const slug = $(el)
			.text()
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, "")
			.trim()
			.replace(/\s+/g, "-");
		if (slug) $(el).attr("id", slug || `section-${i}`);
	});

	// Dead media (gone at the origin, found by the refresh probe) would
	// render as blank boxes at their declared size. Remove each with its
	// figure (the caption describes the missing media), then any wrapper
	// (link, paragraph, gallery, column) left with no text or media.
	const dead = new Set(deadMedia);
	$(MEDIA_SELECTOR).each((_, el) => {
		const src = repairMediaUrl($(el).attr("src")!);
		if (!dead.has(src)) {
			$(el).attr("src", src);
			return;
		}
		const target = $(el).closest("figure").length ? $(el).closest("figure") : $(el);
		let parent = target.parent();
		target.remove();
		while (parent[0]?.type === "tag" && parent.text().trim() === "" && parent.find("img, iframe, video, audio, svg").length === 0) {
			const next = parent.parent();
			parent.remove();
			parent = next;
		}
	});
	$("img").attr("loading", "lazy").attr("decoding", "async");

	// Strip WordPress block-editor bookkeeping classes (wp-block-*,
	// wp-element-*, wp-caption*) — keep any custom classes
	$("[class]").each((_, el) => {
		const kept = ($(el).attr("class") ?? "")
			.split(/\s+/)
			.filter((cls) => cls && !cls.startsWith("wp-"));
		if (kept.length === 0) {
			$(el).removeAttr("class");
		} else {
			$(el).attr("class", kept.join(" "));
		}
	});

	$('a[target="_blank"]').attr("rel", "noopener noreferrer");
	$("p").each((_, el) => {
		if ($(el).text().trim() === "" && $(el).children("img, figure, iframe, video, audio, svg").length === 0) {
			$(el).remove();
		}
	});

	return $.html();
}

export async function getWordPressPosts(): Promise<WordPressPost[]> {
	return readWordPressSnapshot();
}