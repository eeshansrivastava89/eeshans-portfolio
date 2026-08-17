import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

export const SUBSTACK_PUBLICATION_URL =
	"https://theasymptotic.substack.com";
export const SUBSTACK_SUBSCRIBE_URL =
	"https://theasymptotic.substack.com/subscribe";
const SUBSTACK_SNAPSHOT_PATH = path.join(
	process.cwd(),
	".cache",
	"substack-feed.json",
);

export interface SubstackPost {
	title: string;
	link: string;
	slug: string;
	pubDate: Date;
	description: string;
	content: string;
	tags: { name: string; slug: string }[];
	coverImage?: string;
}

function readSubstackSnapshot(): SubstackPost[] {
	if (!fs.existsSync(SUBSTACK_SNAPSHOT_PATH)) {
		throw new Error(
			`${SUBSTACK_SNAPSHOT_PATH} does not exist. Run pnpm refresh:substack and commit the generated snapshot.`,
		);
	}

	return JSON.parse(
		fs.readFileSync(SUBSTACK_SNAPSHOT_PATH, "utf-8"),
	) as SubstackPost[];
}

export function renderPostHtml(html: string): string {
	// isDocument=false: keep fragment mode so $.html() returns the body fragment
	const $ = cheerio.load(html, null, false);

	// Subscribe CTAs — the post page renders its own SubscribeBox
	$(
		".subscription-widget-wrap, .subscription-widget-wrap-editor, p.button-wrapper",
	).remove();

	// Third-party embed scripts (e.g. Datawrapper auto-resize) — never run
	// inline scripts from feed HTML; the iframe keeps its fixed dimensions
	$("script").remove();

	// Unwrap Substack's image containers down to plain figure/img/figcaption,
	// keeping the full-res link around the image
	$(".captioned-image-container").each((_, el) => {
		$(el).replaceWith($(el).children("figure"));
	});
	$(".image2-inset").each((_, el) => {
		$(el).replaceWith($(el).contents());
	});
	$("img").attr("loading", "lazy").attr("decoding", "async");

	// Footnotes: anchor ids are preserved (same-page links keep working);
	// just visually separate the list from the body
	$(".footnote").first().before('<hr class="footnotes-divider" />');

	// Strip Substack bookkeeping attributes
	$("[data-attrs]").removeAttr("data-attrs");
	$("[data-component-name]").removeAttr("data-component-name");
	$("[contenteditable]").removeAttr("contenteditable");
	$("[tabindex]").removeAttr("tabindex");

	// New-tab links get rel; empty paragraphs go away
	$('a[target="_blank"]').attr("rel", "noopener noreferrer");
	$("p").each((_, el) => {
		const $el = $(el);
		if ($el.children().length === 0 && $el.text().trim() === "") {
			$el.remove();
		}
	});

	return $.html();
}

export async function getSubstackPosts(): Promise<SubstackPost[]> {
	const posts = readSubstackSnapshot();

	const hydrated = posts.map((post) => ({
		...post,
		pubDate: new Date(post.pubDate),
	}));

	if (hydrated.length === 0) {
		throw new Error("No Substack posts available");
	}

	for (const post of hydrated) {
		if (
			!post.title ||
			!post.link ||
			!post.slug ||
			!post.content ||
			Number.isNaN(post.pubDate.getTime())
		) {
			throw new Error(
				`Invalid Substack post data for snapshot item: ${post.slug || post.link || "unknown"}`,
			);
		}
	}

	return hydrated.sort(
		(a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
	);
}