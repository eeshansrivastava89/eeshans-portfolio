import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "@/data/config";

export async function GET() {
	const posts = await getCollection("posts");
	const sortedPosts = posts
		.filter((p) => !p.data.draft)
		.sort(
			(a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime(),
		);

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: siteConfig.url,
		items: sortedPosts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.createdAt,
			link: post.data.externalUrl || `${siteConfig.url}/writing`,
		})),
	});
}