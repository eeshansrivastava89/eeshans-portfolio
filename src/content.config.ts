import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { getSubstackPosts } from "./lib/substack";

const projects = defineCollection({
	loader: glob({ base: "src/content/projects", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		hook: z.string(),
		description: z.string(),
		date: z.coerce.date(),
		status: z.enum(["live", "archived", "draft"]).default("live"),
		featured: z.boolean().default(false),
		category: z
			.enum(["featured", "local-ai", "experimentation", "events", "tool"])
			.default("experimentation"),
		liveUrl: z.string().url().optional(),
		repoUrl: z.string().url().optional(),
		analysisUrl: z.string().url().optional(),
		relatedWriting: z.array(z.string()).default([]),
		tech: z.array(z.string()).default([]),
		videoWebm: z.string().optional(),
		videoMp4: z.string().optional(),
		videoPoster: z.string().optional(),
		image: z.string().optional(),
		stats: z
			.array(
				z.object({
					value: z.string(),
					label: z.string().optional(),
				}),
			)
			.optional(),
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
		description: z.string(),
		coverImage: z.string().url().optional(),
		source: z.enum(["substack", "manual"]).default("substack"),
		externalUrl: z.string().url().optional(),
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
			}),
		),
	}),
});

const other = defineCollection({
	loader: glob({ base: "src/content/other", pattern: "**/*.{md,mdx}" }),
});

export const collections = { projects, posts, experience, impact, other };