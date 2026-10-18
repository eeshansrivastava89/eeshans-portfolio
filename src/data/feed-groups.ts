/**
 * One year grouping for both feeds.
 *
 * /blog and /writing render the same archive shape: an index listing every
 * post under year headings, with year/category/tag pages as filters. These
 * helpers exist so the six pages that show a feed cannot drift apart.
 */

export interface FeedRow {
	slug: string;
	date: Date;
	title: string;
	href: string;
}

export interface FeedGroup {
	year: string;
	posts: FeedRow[];
}

export interface GroupLink {
	label: string;
	href: string;
	count: number;
	active: boolean;
}

/** Anything with a date and a title — both content collections qualify. */
interface DatedPost {
	id: string;
	data: { createdAt: Date; title: string };
}

export interface LabelledGroup {
	slug: string;
	name: string;
}

function yearOf(post: DatedPost): string {
	return String(post.data.createdAt.getUTCFullYear());
}

function yearCounts<T extends DatedPost>(posts: T[]): [string, number][] {
	const counts = new Map<string, number>();
	for (const post of posts) {
		const year = yearOf(post);
		counts.set(year, (counts.get(year) ?? 0) + 1);
	}
	return [...counts.entries()].sort(([a], [b]) => Number(b) - Number(a));
}

/** All posts bucketed by year, newest year first and newest post first. */
export function groupByYear<T extends DatedPost>(
	posts: T[],
	hrefFor: (post: T) => string,
): FeedGroup[] {
	const buckets = new Map<string, T[]>();
	for (const post of posts) {
		const year = yearOf(post);
		const bucket = buckets.get(year);
		if (bucket) bucket.push(post);
		else buckets.set(year, [post]);
	}

	return [...buckets.entries()]
		.sort(([a], [b]) => Number(b) - Number(a))
		.map(([year, bucket]) => ({
			year,
			posts: [...bucket]
				.sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime())
				.map((post) => ({
					slug: post.id,
					date: post.data.createdAt,
					title: post.data.title,
					href: hrefFor(post),
				})),
		}));
}

/** Year filter links, e.g. /blog/2011 — `base` is the section root. */
export function yearLinks<T extends DatedPost>(
	posts: T[],
	base: string,
	activeYear?: string,
): GroupLink[] {
	return yearCounts(posts).map(([year, count]) => ({
		label: year,
		href: `${base}/${year}`,
		count,
		active: year === activeYear,
	}));
}

/** Tag or category links, most-used first. */
export function groupLinks<T extends DatedPost>(
	posts: T[],
	groupsFor: (post: T) => readonly LabelledGroup[],
	base: string,
	activeSlug?: string,
): GroupLink[] {
	const counts = new Map<string, { name: string; count: number }>();
	for (const post of posts) {
		for (const group of groupsFor(post)) {
			const entry = counts.get(group.slug) ?? { name: group.name, count: 0 };
			entry.count += 1;
			counts.set(group.slug, entry);
		}
	}

	return [...counts.entries()]
		.sort((a, b) => b[1].count - a[1].count)
		.map(([slug, { name, count }]) => ({
			label: name,
			href: `${base}/${slug}`,
			count,
			active: slug === activeSlug,
		}));
}
