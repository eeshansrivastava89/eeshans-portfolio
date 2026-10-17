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

/**
 * Reads the committed shelf snapshot. There is no network call at build time
 * and no fallback: a missing or malformed snapshot stops the build, because a
 * half-populated reading panel is worse than a loud failure.
 */
export function getGoodreadsData(): GoodreadsData {
	if (!fs.existsSync(CACHE_PATH)) {
		throw new Error(
			"Goodreads snapshot missing at .cache/goodreads.json — run `pnpm refresh:goodreads`",
		);
	}

	const data = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")) as Partial<GoodreadsData>;
	if (!data.shelves) {
		throw new Error("Goodreads snapshot has no shelves — run `pnpm refresh:goodreads`");
	}

	for (const shelf of SHELVES) {
		const books = data.shelves[shelf];
		if (!Array.isArray(books) || books.length === 0) {
			throw new Error(
				`Goodreads snapshot is missing the "${shelf}" shelf — run \`pnpm refresh:goodreads\``,
			);
		}
		for (const book of books) {
			const missing = (["title", "author", "cover", "url"] as const).filter((field) => !book[field]);
			if (missing.length > 0) {
				throw new Error(
					`Goodreads snapshot item ${book.bookId || "?"} in "${shelf}" is missing ${missing.join(", ")}`,
				);
			}
		}
	}

	return data as GoodreadsData;
}
