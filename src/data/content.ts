import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";
import * as cheerio from "cheerio";

export type ProjectEntry = CollectionEntry<"projects">;
export type PostEntry = CollectionEntry<"posts">;
export type BlogEntry = CollectionEntry<"blog">;

export async function getProjects(): Promise<ProjectEntry[]> {
	const projects = await getCollection("projects");
	return projects.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getVisiblePosts(): Promise<PostEntry[]> {
	const posts = await getCollection("posts");
	return posts
		.filter((p) => !p.data.draft)
		.sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());
}

export async function getBlogPosts(): Promise<BlogEntry[]> {
	const posts = await getCollection("blog");
	return posts
		.filter((p) => !p.data.draft)
		.sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());
}


export interface PostHeading {
	slug: string;
	text: string;
	depth: number;
}

/** Extract h2/h3 headings (with ids, set at ingest) from a rendered post body.
 *  Parsed, not regex-matched: .text() decodes entities (&nbsp;, &amp;) that
 *  would otherwise render literally in the TOC. */
export function getPostHeadings(body: string): PostHeading[] {
	const $ = cheerio.load(body, null, false);
	return $("h2[id], h3[id]")
		.toArray()
		.map((el) => ({
			depth: el.tagName === "h2" ? 2 : 3,
			slug: $(el).attr("id")!,
			text: $(el).text().replace(/\s+/g, " ").trim(),
		}));
}

// Post dates are read in UTC everywhere (formatDate, getUTCFullYear) so the
// day shown doesn't depend on the build machine's zone. WordPress dates are
// stored as their wall time in UTC (see scripts/refresh-wordpress.mjs).
export function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}