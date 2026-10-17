#!/usr/bin/env node
/* eslint-disable no-console */
import { execFile, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import * as cheerio from "cheerio";
import { MEDIA_SELECTOR, repairMediaUrl } from "../src/lib/hotlinked-media.mjs";

// Public WordPress.com REST API — no proxy needed (unlike Substack, this API
// is reachable from CI). The link field points at wpcomstaging.com, which is
// where eeshan89.wordpress.com 301-redirects; use it verbatim as canonical.
const POSTS_API_URL =
  "https://public-api.wordpress.com/wp/v2/sites/eeshan89.wordpress.com/posts";
const SNAPSHOT_PATH = path.join(process.cwd(), ".cache", "wordpress-posts.json");
const MAX_RESPONSE_BYTES = 50 * 1024 * 1024;
const PER_PAGE = 100;
const PROBE_CONCURRENCY = 12;

// Decode WP-encoded HTML entities to real characters (curly quotes,
// ellipses, dashes) for plain-text fields (title, excerpt)
function decodeEntities(text) {
  return text
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 10))
    )
    .replace(/&hellip;/g, "…")
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, (ent) =>
      ({
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&apos;": "'",
        "&nbsp;": " ",
      })[ent]
    );
}

function requireString(value, label, postLabel) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`WordPress API post ${postLabel} missing ${label}`);
  }
  return value;
}

// `date` is the site-local wall time WordPress displays, with no offset (the
// site's timezone changed over the years: IST, then Pacific). Store that wall
// time as UTC — never parse it in the machine's zone — so the snapshot is
// identical wherever the refresh runs, and formatDate (UTC) shows exactly the
// day WordPress shows. The instant may be off by hours; only the day is used.
function normalizeDate(value, postLabel) {
  const date = new Date(`${requireString(value, "date", postLabel)}Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `WordPress API post ${postLabel} has invalid date: ${value}`
    );
  }
  return date.toISOString();
}

function normalizePost(post) {
  if (!post || typeof post !== "object") {
    throw new Error("WordPress API returned a non-object post item");
  }

  // WP stores non-ASCII slugs percent-encoded (e.g. %e2%80%a6 = …) — decode
  // so entry ids are clean, URL-safe-in-Astro slugs
  const slug = decodeURIComponent(
    requireString(post.slug, "slug", "unknown")
  );
  const postLabel = slug || post.id || "unknown";
  const title = decodeEntities(
    requireString(post.title?.rendered, "title", postLabel)
  );
  const link = requireString(post.link, "link", postLabel);
  // "The Tiny Frogs" (id 1149) is a published poem whose body never made it
  // through the WP.com export — title-only on the live site too. Keep the
  // post (title + date render fine); don't fail the whole snapshot over it.
  const content = post.content?.rendered?.trim()
    ? requireString(post.content.rendered, "content.rendered", postLabel)
    : "";
  // Strip tags then decode entities — plain text for the list-page description
  const excerpt =
    (typeof post.excerpt?.rendered === "string" &&
      post.excerpt.rendered.trim()) ||
    "";
  const excerptText = excerpt
    ? decodeEntities(excerpt.replace(/<[^>]*>/g, "")).trim()
    : "";

  const date = normalizeDate(post.date, postLabel);
  const coverImage =
    typeof post.jetpack_featured_media_url === "string" &&
    post.jetpack_featured_media_url.length > 0
      ? post.jetpack_featured_media_url
      : undefined;

  // Resolve category ids to {name, slug} — fail loud on unknown ids
  const categories = (Array.isArray(post.categories) ? post.categories : []).map(
    (id) => {
      const category = categoriesById.get(id);
      if (!category) {
        throw new Error(`WordPress post ${postLabel} references unknown category id ${id}`);
      }
      return category;
    }
  );

  return {
    title,
    link,
    slug,
    date,
    excerpt: excerptText,
    content,
    coverImage,
    categories,
    deadMedia: [],
  };
}

// Old posts hotlink third-party media (IMDb, Goodreads, a lapsed personal
// domain) that has since disappeared. Probe each body image and video as the
// browser will request it — repaired URL, eeshans.com referer — and record
// the ones that are definitively gone, so the render step can drop them:
// - host no longer resolves (curl exit 6, after retries)
// - origin refuses it (4xx other than 408/429)
// - origin answers with a page, not media (parked domain, soft 404)
// Timeouts, 5xx and 429 count as live: a flaky host must not delete media.
const execFileAsync = promisify(execFile);
async function probeMedia(url) {
  const result = await execFileAsync(
    "curl",
    [
      "--silent",
      "--location",
      "--retry",
      "2",
      "--retry-all-errors",
      "--max-time",
      "30",
      // First bytes only — enough for status and type, not a whole video
      "--range",
      "0-1023",
      "--output",
      "/dev/null",
      "--write-out",
      "%{http_code} %{content_type}",
      "--user-agent",
      "Mozilla/5.0 (compatible; eeshans.com media check)",
      "--referer",
      "https://eeshans.com/",
      url,
    ],
    { encoding: "utf-8" }
  ).then(
    ({ stdout }) => ({ code: 0, stdout }),
    (error) => ({ code: error.code, stdout: error.stdout ?? "" })
  );
  const [status, type = ""] = result.stdout.split(" ");
  const httpStatus = Number(status);
  const dead =
    result.code === 6 ||
    (httpStatus >= 400 && httpStatus < 500 && httpStatus !== 408 && httpStatus !== 429) ||
    (httpStatus >= 200 && httpStatus < 300 && !/^(image|video)\//.test(type));
  if (dead) {
    console.log(`Dead media (${result.code === 6 ? "unresolvable host" : `${status} ${type}`}): ${url}`);
  } else if (httpStatus < 200 || httpStatus >= 300) {
    console.log(`Media probe inconclusive (curl ${result.code}, ${status}), keeping: ${url}`);
  }
  return !dead;
}

async function findDeadMedia(posts) {
  const mediaByPost = posts.map((post) => {
    const $ = cheerio.load(post.content, null, false);
    return [...new Set($(MEDIA_SELECTOR).toArray().map((el) => repairMediaUrl($(el).attr("src"))))];
  });
  const urls = [...new Set(mediaByPost.flat())];
  const live = new Map();
  for (let i = 0; i < urls.length; i += PROBE_CONCURRENCY) {
    const batch = urls.slice(i, i + PROBE_CONCURRENCY);
    const results = await Promise.all(batch.map(probeMedia));
    batch.forEach((url, j) => live.set(url, results[j]));
  }
  posts.forEach((post, i) => {
    post.deadMedia = mediaByPost[i].filter((url) => !live.get(url)).sort();
  });
  return { probed: urls.length, dead: [...live.values()].filter((ok) => !ok).length };
}

function fetchPage(page) {
  const apiUrl = `${POSTS_API_URL}?per_page=${PER_PAGE}&page=${page}&_fields=id,slug,link,date,title,content,excerpt,jetpack_featured_media_url,categories`;
  const body = execFileSync(
    "curl",
    [
      "--fail",
      "--silent",
      "--show-error",
      "--location",
      "--compressed",
      "--retry",
      "6",
      "--retry-all-errors",
      "--retry-delay",
      "15",
      "--retry-max-time",
      "180",
      "--connect-timeout",
      "10",
      "--max-time",
      "60",
      apiUrl,
    ],
    { encoding: "utf-8", maxBuffer: MAX_RESPONSE_BYTES }
  );

  const posts = JSON.parse(body);
  if (!Array.isArray(posts)) {
    throw new Error(`WordPress API did not return an array from ${apiUrl}`);
  }
  return posts;
}

function fetchCategories() {
  const apiUrl = `${POSTS_API_URL.replace(/\/posts$/, "")}/categories?per_page=100&_fields=id,name,slug`;
  const body = execFileSync(
    "curl",
    [
      "--fail",
      "--silent",
      "--show-error",
      "--location",
      "--compressed",
      "--retry",
      "6",
      "--retry-all-errors",
      "--retry-delay",
      "15",
      "--retry-max-time",
      "180",
      "--connect-timeout",
      "10",
      "--max-time",
      "60",
      apiUrl,
    ],
    { encoding: "utf-8", maxBuffer: MAX_RESPONSE_BYTES }
  );

  const categories = JSON.parse(body);
  if (!Array.isArray(categories)) {
    throw new Error(`WordPress API did not return an array of categories from ${apiUrl}`);
  }
  const map = new Map();
  for (const category of categories) {
    if (!category?.name || !category?.slug) {
      throw new Error(`WordPress category missing name or slug: ${JSON.stringify(category)}`);
    }
    map.set(category.id, { name: decodeEntities(category.name), slug: category.slug });
  }
  return map;
}

const categoriesById = fetchCategories();

// Empty-title posts have no headline to render — drop them loudly (log, not
// throw) so a single untitled draft doesn't kill the whole snapshot.
const seenSlugs = new Set();
const posts = [];
for (let page = 1; ; page++) {
  const raw = fetchPage(page);
  for (const post of raw) {
    if (post && typeof post === "object" && post.title?.rendered?.trim()) {
      posts.push(normalizePost(post));
    } else {
      console.log(
        `Skipping WordPress post with empty title: ${post?.slug || post?.id || "unknown"}`
      );
    }
  }
  if (raw.length < PER_PAGE) break;
}
for (const post of posts) {
  if (seenSlugs.has(post.slug)) {
    throw new Error(`Duplicate WordPress slug: ${post.slug}`);
  }
  seenSlugs.add(post.slug);
}

posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

if (posts.length === 0) {
  throw new Error(`WordPress API returned zero posts: ${POSTS_API_URL}`);
}

const { probed, dead } = await findDeadMedia(posts);
console.log(`Probed ${probed} media URLs: ${dead} dead.`);
// Most media dead at once means the network is broken, not the web
if (dead > probed / 2) {
  throw new Error(`${dead} of ${probed} media URLs probed dead — refusing to write a snapshot that strips them`);
}

fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(posts, null, 2)}\n`);
console.log(
  `Refreshed ${SNAPSHOT_PATH} with ${posts.length} WordPress posts from ${POSTS_API_URL}.`
);