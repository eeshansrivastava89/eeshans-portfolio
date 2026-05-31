import fs from "node:fs";
import path from "node:path";

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