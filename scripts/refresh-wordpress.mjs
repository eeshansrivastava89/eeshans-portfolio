#!/usr/bin/env node
/* eslint-disable no-console */
import { execFile, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import * as cheerio from "cheerio";
import { MEDIA_SELECTOR, repairMediaUrl } from "../src/lib/hotlinked-media.mjs";

// Public WordPress.com REST API — no proxy needed (unlike Substack, this API
// is reachable from CI). The site's .wordpress.com slug is the stable API
// identifier even though the blog's public home is now blog.eeshans.com; the
// link field returns that public domain, which is what we use as canonical.
const POSTS_API_URL =
  "https://public-api.wordpress.com/wp/v2/sites/eeshan89.wordpress.com/posts";
// Likes and comment counts are not in the v2 payload; v1.1 exposes them.
// Joined by slug, so the snapshot carries no WordPress IDs.
const V1_POSTS_API_URL =
  "https://public-api.wordpress.com/rest/v1.1/sites/eeshan89.wordpress.com/posts";
// One committed JSON file per post. The `blog` collection globs this directory,
// so the file set *is* the post set, and the file name is the entry id — which
// is the URL segment.
const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");
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
    likeCount: 0,
    commentCount: 0,
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

// One curl invocation for every API read: retries are what keep the 4-hourly
// refresh from failing on a blip, so every call gets the same policy.
function curlArgs(apiUrl) {
  return [
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
  ];
}

function curlJson(apiUrl) {
  const body = execFileSync("curl", curlArgs(apiUrl), {
    encoding: "utf-8",
    maxBuffer: MAX_RESPONSE_BYTES,
  });
  return JSON.parse(body);
}

async function curlJsonAsync(apiUrl) {
  const { stdout } = await execFileAsync("curl", curlArgs(apiUrl), {
    encoding: "utf-8",
    maxBuffer: MAX_RESPONSE_BYTES,
  });
  return JSON.parse(stdout);
}

function fetchPage(page) {
  const apiUrl = `${POSTS_API_URL}?per_page=${PER_PAGE}&page=${page}&_fields=id,slug,link,date,title,content,excerpt,jetpack_featured_media_url,categories`;
  const posts = curlJson(apiUrl);
  if (!Array.isArray(posts)) {
    throw new Error(`WordPress API did not return an array from ${apiUrl}`);
  }
  return posts;
}

// v2 returns raw characters in slugs ("…"), v1.1 percent-encodes them
// ("%e2%80%a6"). Decode both sides so the join can't miss a post on encoding.
function slugKey(slug) {
	try {
		return decodeURIComponent(slug);
	} catch {
		return slug;
	}
}

// Comment counts come from the post payload; likes do not. `like_count` is a
// cached field that reset to 0 when the domain moved, while /likes computes the
// real number from the likes table — so likes cost one request per post.
async function fetchLikeCount(postId) {
  const { found } = await curlJsonAsync(
    `${V1_POSTS_API_URL}/${postId}/likes`
  );
  if (!Number.isFinite(found)) {
    throw new Error(`WordPress likes endpoint returned no count for post ${postId}`);
  }
  return found;
}

async function fetchEngagementBySlug() {
  const engagement = new Map();
  for (let page = 1; ; page++) {
    const apiUrl = `${V1_POSTS_API_URL}?number=${PER_PAGE}&page=${page}&fields=ID,slug,discussion`;
    const { posts = [] } = curlJson(apiUrl);
    for (const post of posts) {
      if (!post?.slug || !Number.isFinite(post.ID)) continue;
      engagement.set(slugKey(post.slug), {
        id: post.ID,
        likeCount: 0,
        commentCount: Number.isFinite(post.discussion?.comment_count)
          ? post.discussion.comment_count
          : 0,
      });
    }
    if (posts.length < PER_PAGE) break;
  }

  const entries = [...engagement.entries()];
  for (let i = 0; i < entries.length; i += PROBE_CONCURRENCY) {
    const batch = entries.slice(i, i + PROBE_CONCURRENCY);
    const counts = await Promise.all(
      batch.map(([, value]) => fetchLikeCount(value.id))
    );
    batch.forEach(([, value], index) => {
      value.likeCount = counts[index];
    });
  }

  return engagement;
}

function fetchCategories() {
  const apiUrl = `${POSTS_API_URL.replace(/\/posts$/, "")}/categories?per_page=100&_fields=id,name,slug`;
  const categories = curlJson(apiUrl);
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

// Every published post should have engagement counts. A missing slug means the
// v1.1 endpoint changed shape or the site moved — fail here rather than
// silently shipping zeroes onto every post.
const engagement = await fetchEngagementBySlug();
const missingEngagement = posts.filter((post) => !engagement.has(slugKey(post.slug)));
if (missingEngagement.length > 0) {
  throw new Error(
    `WordPress engagement counts missing for ${missingEngagement.length} post(s): ` +
      missingEngagement.map((post) => post.slug).join(", ")
  );
}
for (const post of posts) {
  const { likeCount, commentCount } = engagement.get(slugKey(post.slug));
  post.likeCount = likeCount;
  post.commentCount = commentCount;
}

if (posts.length === 0) {
  throw new Error(`WordPress API returned zero posts: ${POSTS_API_URL}`);
}

const { probed, dead } = await findDeadMedia(posts);
console.log(`Probed ${probed} media URLs: ${dead} dead.`);
// Most media dead at once means the network is broken, not the web
if (dead > probed / 2) {
  throw new Error(`${dead} of ${probed} media URLs probed dead — refusing to write a snapshot that strips them`);
}

// WordPress recomputes a tiled gallery's layout every time it serves a post: a
// post nobody touched comes back with different row heights, different item
// sizes and the photos in a different order (one gallery here has returned
// 156, 191 and 233px rows for the same photos). Reducing a gallery to the set
// of its photos, with captions, is how two versions of a post are recognised as
// the same; without it every refresh rewrites that file and the history fills
// with changes that never happened.
function withoutGalleryLayout(content) {
  const $ = cheerio.load(content, null, false);
  $(".tiled-gallery").each((_, gallery) => {
    const photos = $(gallery)
      .find(".tiled-gallery-item")
      .toArray()
      .map((item) => {
        const $item = $(item);
        const $photo = $item.find("img").first();
        const src = ($photo.attr("src") ?? "").replace(
          /[?&](?:w|h|fit|resize)=[^&"']*/g,
          ""
        );
        // Alt text and captions are content, so they take part in the comparison
        return [
          src,
          $photo.attr("alt") ?? "",
          $photo.attr("title") ?? "",
          $item.text().replace(/\s+/g, " ").trim(),
        ].join(" ");
      })
      .sort();
    $(gallery).replaceWith(
      `<div class="tiled-gallery" data-photos="${photos.join("|")}"></div>`
    );
  });
  return $.html();
}

function isSamePost(existing, next) {
  const comparable = (post) =>
    JSON.stringify({ ...post, content: withoutGalleryLayout(post.content) });
  return comparable(existing) === comparable(next);
}

// The slug is the file name, so it is dropped from the payload rather than
// duplicated inside the file.
function syncPostFiles(posts) {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  let kept = 0;
  for (const { slug, ...data } of posts) {
    const filePath = path.join(BLOG_DIR, `${slug}.json`);
    const existing = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, "utf-8"))
      : null;
    // Only the gallery's pixel geometry moved: keep the file we already have
    if (existing && isSamePost(existing, data)) {
      kept++;
      continue;
    }
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  }

  // A post deleted or unpublished upstream must stop rendering here, so remove
  // any file the refresh no longer produced.
  const expected = new Set(posts.map((post) => `${post.slug}.json`));
  const stale = fs
    .readdirSync(BLOG_DIR)
    .filter((name) => name.endsWith(".json") && !expected.has(name));
  for (const name of stale) fs.unlinkSync(path.join(BLOG_DIR, name));

  return { stale: stale.length, kept };
}

const { stale, kept } = syncPostFiles(posts);
console.log(
  `Wrote ${posts.length - kept} of ${posts.length} post files to ${BLOG_DIR} from ${POSTS_API_URL} ` +
    `(${kept} unchanged, ${stale} stale removed).`
);
