import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { getSubstackPosts, renderPostHtml } from "./lib/substack";
import { renderWordPressHtml } from "./lib/wordpress";

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
	// One committed JSON file per post, written by scripts/refresh-wordpress.mjs.
	// The file name is the slug: it becomes the entry id, which is the URL. That
	// has to be verbatim — Astro's default id slugifies the file name, which
	// would rewrite `all-i-want-is-this…`.
	loader: glob({
		base: "src/content/blog",
		pattern: "**/*.json",
		generateId: ({ entry }) => entry.replace(/\.json$/, ""),
	}),
	schema: z
		.object({
			title: z.string(),
			link: z.string().url(),
			date: z.coerce.date(),
			excerpt: z.string().default(""),
			content: z.string().default(""),
			coverImage: z.string().url().optional(),
			categories: z.array(z.object({ name: z.string(), slug: z.string() })).default([]),
			likeCount: z.number().int().nonnegative().default(0),
			commentCount: z.number().int().nonnegative().default(0),
			deadMedia: z.array(z.string()).default([]),
			draft: z.boolean().default(false),
		})
		// The files hold WordPress' own facts. How the site *says* them —
		// canonical URL, sentence for cards, rendered HTML — is derived here, so
		// a content diff shows real changes and nothing else.
		.transform(({ link, date, excerpt, content, deadMedia, ...post }) => ({
			...post,
			createdAt: date,
			// Image-only posts (drawings) have no excerpt; share cards and
			// search snippets still need a sentence
			description:
				excerpt || `${post.title}, from Eeshan's Blog (${date.getUTCFullYear()}).`,
			externalUrl: link,
			source: "wordpress" as const,
			body: renderWordPressHtml(content, deadMedia),
		})),
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