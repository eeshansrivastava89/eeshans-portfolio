import fs from "node:fs";
import path from "node:path";

const CACHE_PATH = path.join(process.cwd(), ".cache", "goodreads.json");

export type GoodreadsShelfKey = "currentlyReading" | "recentlyRead" | "toRead";

export interface GoodreadsBook {
	title: string;
	author: string;
	cover: string;
	url: string;
	bookId: string;
	/** The user's rating, 0 when unrated */
	rating: number;
	/** Goodreads average, 0 when unknown */
	averageRating: number;
}

export interface GoodreadsData {
	fetchedAt: string;
	profileUrl: string;
	shelves: Record<GoodreadsShelfKey, GoodreadsBook[]>;
}

const SHELVES: GoodreadsShelfKey[] = ["currentlyReading", "recentlyRead", "toRead"];

/** Every failure says the same thing, because the remedy is the same. */
const MAINTENANCE =
	".cache/goodreads.json is maintained by hand and committed — Goodreads retired the shelf RSS feed, so there is no script that can rebuild it";

/**
 * Reads the committed shelf snapshot. There is no network call at build time
 * and no fallback: a missing or malformed snapshot stops the build, because a
 * half-populated reading panel is worse than a loud failure.
 *
 * The panel renders `fetchedAt` as an "as of" date, so the snapshot is allowed
 * to age. It is not allowed to be undated or malformed — an unlabelled frozen
 * shelf would claim to be current forever.
 */
export function getGoodreadsData(): GoodreadsData {
	if (!fs.existsSync(CACHE_PATH)) {
		throw new Error(`Goodreads snapshot missing: ${MAINTENANCE}`);
	}

	const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) as Partial<GoodreadsData>;
	if (!data.shelves) {
		throw new Error(`Goodreads snapshot has no shelves: ${MAINTENANCE}`);
	}

	const fetchedAt = data.fetchedAt ? new Date(data.fetchedAt) : null;
	if (!fetchedAt || Number.isNaN(fetchedAt.getTime())) {
		throw new Error(`Goodreads snapshot has no valid fetchedAt date: ${MAINTENANCE}`);
	}

	for (const shelf of SHELVES) {
		const books = data.shelves[shelf];
		if (!Array.isArray(books) || books.length === 0) {
			throw new Error(`Goodreads snapshot is missing the "${shelf}" shelf: ${MAINTENANCE}`);
		}
		for (const book of books) {
			const missing = (["title", "author", "cover", "url"] as const).filter((field) => !book[field]);
			if (missing.length > 0) {
				throw new Error(
					`Goodreads snapshot item ${book.bookId || "?"} in "${shelf}" is missing ${missing.join(", ")}: ${MAINTENANCE}`,
				);
			}
		}
	}

	return data as GoodreadsData;
}
