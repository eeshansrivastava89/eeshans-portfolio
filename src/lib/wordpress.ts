import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

export const WORDPRESS_SITE_URL = "https://eeshan89.wordpress.com";
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

export function renderWordPressHtml(html: string): string {
	// isDocument=false: keep fragment mode so $.html() returns the body fragment
	const $ = cheerio.load(html, null, false);

	$("script").remove();
	$("style").remove();

	// Repair hotlinked images:
	// 1. http → https (mixed content on the https site)
	// 2. Wikimedia retired non-standard thumbnail sizes (e.g. 300px) —
	//    rewrite dead /thumb/H/H/F/N/<size>px-N URLs to the original H/H/F/N
	$("img[src]").each((_, el) => {
		let src = $(el).attr("src")!;
		src = src.replace(/^http:\/\//, "https://");
		const thumb = src.match(
			/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/\d+px-[^/]+$/,
		);
		if (thumb) {
			src = `https://upload.wikimedia.org/wikipedia/commons/${thumb[1]}`;
		}
		$(el).attr("src", src);
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