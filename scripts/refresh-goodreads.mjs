/**
 * Refresh the Goodreads shelf snapshot used by the homepage reading panel.
 *
 * Goodreads retired its public API in 2020; the per-shelf RSS feed still works
 * and returns up to 100 books per page. We snapshot what the panel needs and
 * fail loudly on anything malformed — a half-empty panel is worse than a crash.
 *
 * Run: pnpm refresh:goodreads   (CI does this in the same 4-hour refresh step)
 */

import * as cheerio from "cheerio";
import fs from "node:fs";
import path from "node:path";

const USER_ID = "7370124";
const RSS_BASE = "https://www.goodreads.com/review/list_rss";
const PER_PAGE = 100;
const CACHE_PATH = path.join(process.cwd(), ".cache", "goodreads.json");

/** Shelf order here is the order the panel renders. */
const SHELVES = [
	{ key: "currentlyReading", shelf: "currently-reading" },
	{ key: "recentlyRead", shelf: "read" },
	{ key: "toRead", shelf: "to-read" },
];

function text($, el, name) {
	return $(el).find(name).first().text().replace(/\s+/g, " ").trim();
}

function parseItems(xml, shelf) {
	const $ = cheerio.load(xml, { xmlMode: true });
	const items = $("item").toArray().map((el) => {
		const rating = Number(text($, el, "user_rating"));
		return {
			title: text($, el, "title"),
			author: text($, el, "author_name"),
			cover: text($, el, "book_image_url"),
			url: text($, el, "link"),
			bookId: text($, el, "book_id"),
			rating: Number.isFinite(rating) ? rating : 0,
			averageRating: Number(text($, el, "average_rating")) || 0,
		};
	});

	if (items.length === 0) {
		throw new Error(`Goodreads shelf "${shelf}" returned no books`);
	}
	for (const book of items) {
		const missing = ["title", "author", "cover", "url"].filter((field) => !book[field]);
		if (missing.length > 0) {
			throw new Error(
				`Goodreads shelf "${shelf}" item ${book.bookId || "?"} is missing ${missing.join(", ")}`,
			);
		}
	}
	return items;
}

async function fetchShelf(shelf) {
	const url = `${RSS_BASE}/${USER_ID}?shelf=${encodeURIComponent(shelf)}&per_page=${PER_PAGE}`;
	const response = await fetch(url, {
		headers: { "User-Agent": "eeshans.com build (shelf snapshot)" },
	});
	if (!response.ok) {
		throw new Error(`Goodreads RSS failed for "${shelf}": HTTP ${response.status}`);
	}
	const xml = await response.text();
	if (!xml.includes("<rss")) {
		throw new Error(`Goodreads RSS for "${shelf}" is not an RSS document`);
	}
	return parseItems(xml, shelf);
}

const shelves = {};
for (const { key, shelf } of SHELVES) {
	shelves[key] = await fetchShelf(shelf);
	console.log(`  ${shelf}: ${shelves[key].length} books`);
}

const snapshot = {
	fetchedAt: new Date().toISOString(),
	profileUrl: `https://www.goodreads.com/user/show/${USER_ID}`,
	shelves,
};

fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
fs.writeFileSync(CACHE_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), CACHE_PATH)}`);
