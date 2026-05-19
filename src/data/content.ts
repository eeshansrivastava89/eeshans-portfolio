import { getCollection } from "astro:content";
import type { CollectionEntry } from "astro:content";

export type ProjectEntry = CollectionEntry<"projects">;
export type PostEntry = CollectionEntry<"posts">;

export async function getLiveProjects(): Promise<ProjectEntry[]> {
	const projects = await getCollection("projects");
	return projects
		.filter((p) => p.data.status === "live")
		.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getVisiblePosts(): Promise<PostEntry[]> {
	const posts = await getCollection("posts");
	return posts
		.filter((p) => !p.data.draft)
		.sort((a, b) => b.data.createdAt.getTime() - a.data.createdAt.getTime());
}

export function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateMonthYear(date: Date): string {
	return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}