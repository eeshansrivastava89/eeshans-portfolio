// Plain JS (not .ts) so scripts/refresh-wordpress.mjs can import it under
// plain Node: the refresh probes each media URL exactly as the render step
// will emit it, so both must select and repair the same way.

/** Hotlinked media in WordPress post bodies: images and self-hosted videos */
export const MEDIA_SELECTOR = "img[src], video[src]";

/** WordPress origin that root-relative media paths (e.g. /wp-content/...) belong to */
export const WORDPRESS_ORIGIN = "https://blog.eeshans.com";

/**
 * Repair a hotlinked media URL:
 * 1. root-relative → the WordPress origin (WP bodies sometimes hotlink
 *    /wp-content/... with no host, which would 404 against eeshans.com)
 * 2. http → https (mixed content on the https site)
 * 3. Wikimedia retired non-standard thumbnail sizes (e.g. 300px) —
 *    rewrite dead /thumb/H/H/F/N/<size>px-N URLs to the original H/H/F/N
 * @param {string} src
 * @param {string} [origin]
 * @returns {string}
 */
export function repairMediaUrl(src, origin = WORDPRESS_ORIGIN) {
	const absolute = src.startsWith("/") ? `${origin}${src}` : src;
	const https = absolute.replace(/^http:\/\//, "https://");
	const thumb = https.match(
		/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/([0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/\d+px-[^/]+$/,
	);
	return thumb ? `https://upload.wikimedia.org/wikipedia/commons/${thumb[1]}` : https;
}
