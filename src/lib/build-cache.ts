import fs from "node:fs";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), ".cache");

/**
 * Fetches data from a URL with write-through caching.
 *
 * Always fetches fresh data. If the fetch succeeds and the serialized
 * result differs from the cached file, writes the new data to cache.
 * If the fetch fails, throws — no silent fallback to stale cache.
 */
export async function fetchWithCache<T>(
	url: string,
	cacheKey: string,
	fetcher: () => Promise<T>,
): Promise<T> {
	const cachePath = path.join(CACHE_DIR, `${cacheKey}.json`);

	const data = await fetcher();
	if (!fs.existsSync(CACHE_DIR)) {
		fs.mkdirSync(CACHE_DIR, { recursive: true });
	}
	const serialized = JSON.stringify(data, null, 2);
	const existing = fs.existsSync(cachePath)
		? fs.readFileSync(cachePath, "utf-8")
		: null;
	if (existing !== serialized) {
		fs.writeFileSync(cachePath, serialized);
	}
	return data;
}