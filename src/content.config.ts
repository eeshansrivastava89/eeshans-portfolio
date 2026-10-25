import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { getSubstackPosts, renderPostHtml } from "./lib/substack";
import { getWordPressPosts, renderWordPressHtml } from "./lib/wordpress";

const projects = defineCollection({
	loader: glob({ base: "src/content/projects", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		hook: z.string(),
		description: z.string(),
		date: z.coerce.date(),
		featured: z.boolean().default(false),
		liveUrl: z.string().url().optional(),
		repoUrl: z.string().url().optional(),
		videoWebm: z.string().optional(),
		videoMp4: z.string().optional(),
		videoPoster: z.string().optional(),
	}),
});

const posts = defineCollection({
	loader: async () => {
		const substackPosts = await getSubstackPosts();

		return Object.fromEntries(
			substackPosts.map((post) => [
				post.slug,
				{
					title: post.title,
					createdAt: post.pubDate,
					description: post.description,
					coverImage: post.coverImage,
					tags: post.tags,
					body: renderPostHtml(post.content),
					source: "substack" as const,
					externalUrl: post.link,
					draft: false,
				},
			]),
		);
	},
	schema: z.object({
		title: z.string(),
		createdAt: z.coerce.date(),
		description: z.string().min(1),
		coverImage: z.string().url().optional(),
		source: z.enum(["substack", "manual"]).default("substack"),
			externalUrl: z.string().url().optional(),
		tags: z.array(z.object({ name: z.string(), slug: z.string() })).default([]),
		body: z.string().default(""),
		draft: z.boolean().default(false),
	}),
});

const blog = defineCollection({
	loader: async () => {
		const wordPressPosts = await getWordPressPosts();

		return Object.fromEntries(
			wordPressPosts.map((post) => [
				post.slug,
				{
					title: post.title,
					createdAt: post.date,
					// Image-only posts (drawings) have no excerpt; share cards and
					// search snippets still need a sentence
					description:
						post.excerpt ||
						`${post.title}, from Eeshan's Blog (${new Date(post.date).getUTCFullYear()}).`,
					coverImage: post.coverImage,
					categories: post.categories,
					body: renderWordPressHtml(post.content, post.deadMedia),
					source: "wordpress" as const,
					externalUrl: post.link,
					likeCount: post.likeCount,
					commentCount: post.commentCount,
					draft: false,
				},
			]),
		);
	},
	schema: z.object({
		title: z.string(),
		createdAt: z.coerce.date(),
		description: z.string().min(1),
		coverImage: z.string().url().optional(),
		categories: z.array(z.object({ name: z.string(), slug: z.string() })).default([]),
		source: z.enum(["wordpress", "manual"]).default("wordpress"),
		externalUrl: z.string().url(),
		likeCount: z.number().int().nonnegative().default(0),
		commentCount: z.number().int().nonnegative().default(0),
		body: z.string().default(""),
		draft: z.boolean().default(false),
	}),
});

const experience = defineCollection({
	loader: glob({ base: "src/content/experience", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		timespan: z.string(),
		title: z.string(),
		company: z.string(),
		description: z.string().optional(),
		logo: z.string().optional(),
		type: z.enum(["work", "education"]).default("work"),
		order: z.number().default(0),
	}),
});

const impact = defineCollection({
	loader: glob({ base: "src/content/impact", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		icon: z.string(),
		visible: z.boolean().default(true),
		order: z.number().default(0),
		items: z.array(
			z.object({
				text: z.string(),
				meta: z.string().optional(),
				link: z.string().url().optional(),
				linkType: z.enum(["web", "spotify", "youtube", "linkedin", "github"]).optional(),
			}),
		),
	}),
});

const other = defineCollection({
	loader: glob({ base: "src/content/other", pattern: "**/*.{md,mdx}" }),
});

export const collections = { projects, posts, blog, experience, impact, other };