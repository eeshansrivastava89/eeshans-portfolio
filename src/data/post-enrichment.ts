/**
 * Local enrichment data for Substack posts.
 *
 * Substack is the source of truth for titles, descriptions, dates, and URLs.
 * This file adds portfolio-specific metadata that only makes sense here:
 * related projects, series membership, and tags.
 *
 * To add a new field, update the PostMeta interface and the schema in
 * content.config.ts.
 */

export interface PostMeta {
	relatedProject?: string;
	series?: string;
	seriesOrder?: number;
	tags?: string[];
}

export const postEnrichment: Record<string, PostMeta> = {
	"how-i-de-vibed-a-vibe-coded-nlp-app": {
		relatedProject: "how-i-prompt",
	},
	"i-built-a-spotify-wrapped-for-my": {
		relatedProject: "how-i-prompt",
	},
	"building-an-ab-testing-memory-game": {
		relatedProject: "ab-simulator",
	},
	"agentic-coding-for-non-vibe-coders": {
		relatedProject: "sidequests",
		tags: ["ai"],
	},
	"its-time-for-the-regular-person-to": {
		series: "local-ai",
		seriesOrder: 1,
	},
	"local-ai-series-2-the-regular-persons": {
		series: "local-ai",
		seriesOrder: 2,
	},
	"local-ai-series-3-testing-local-ai": {
		series: "local-ai",
		seriesOrder: 3,
	},
	"the-dopamine-trap-of-ai-coding": {
		tags: ["ai"],
	},
	"why-local-ai-is-more-important-than": {
		relatedProject: "local-llm-bench",
	},
};