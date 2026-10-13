import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "@/data/config";

export async function GET() {
	const [posts, blogPosts] = await Promise.all([
		getCollection("posts"),
		getCollection("blog"),
	]);
	const newest = <T extends { data: { draft?: boolean; createdAt: Date } }>(c: T[]) =>
		c
			.filter((p) => !p.data.draft)
			.sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: siteConfig.url,
		items: [
			...newest(posts).map((post) => ({
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.createdAt,
				link: `/writing/${post.id}`,
			})),
			...newest(blogPosts).map((post) => ({
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.createdAt,
				link: `/blog/${post.id}`,
			})),
		],
	});
}