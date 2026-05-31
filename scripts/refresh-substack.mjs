#!/usr/bin/env node
/* eslint-disable no-console */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PUBLICATION_URL = "https://theasymptotic.substack.com";
const POSTS_API_URL = "https://substack.eeshans.com/substack/posts";
const SNAPSHOT_PATH = path.join(process.cwd(), ".cache", "substack-feed.json");
const MAX_RESPONSE_BYTES = 20 * 1024 * 1024;

const REQUEST_HEADERS = {
  Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  Referer: `${PUBLICATION_URL}/`,
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
};

function requireString(value, label, postLabel) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Substack API post ${postLabel} missing ${label}`);
  }
  return value;
}

function normalizeDate(value, postLabel) {
  const date = new Date(requireString(value, "post_date", postLabel));
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `Substack API post ${postLabel} has invalid post_date: ${value}`
    );
  }
  return date.toISOString();
}

function normalizePost(post) {
  if (!post || typeof post !== "object") {
    throw new Error("Substack API returned a non-object post item");
  }

  const slug = requireString(post.slug, "slug", "unknown");
  const postLabel = slug || post.id || "unknown";
  const title = requireString(post.title, "title", postLabel);
  const content = requireString(post.body_html, "body_html", postLabel);
  const link =
    typeof post.canonical_url === "string" && post.canonical_url.length > 0
      ? post.canonical_url
      : `${PUBLICATION_URL}/p/${slug}`;
  const description =
    (typeof post.description === "string" && post.description.trim()) ||
    (typeof post.subtitle === "string" && post.subtitle.trim()) ||
    (typeof post.search_engine_description === "string" &&
      post.search_engine_description.trim()) ||
    (typeof post.truncated_body_text === "string" &&
      post.truncated_body_text.trim()) ||
    "";

  const tags = Array.isArray(post.postTags)
    ? post.postTags
        .filter((t) => t && !t.hidden)
        .map((t) => ({ name: t.name, slug: t.slug }))
    : [];

  return {
    title,
    link,
    slug,
    pubDate: normalizeDate(post.post_date, postLabel),
    description,
    content,
    tags,
    coverImage:
      typeof post.cover_image === "string" && post.cover_image.length > 0
        ? post.cover_image
        : undefined,
  };
}

function fetchWithCurl(apiUrl) {
  const headerArgs = Object.entries(REQUEST_HEADERS).flatMap(([key, value]) => [
    "--header",
    `${key}: ${value}`,
  ]);
  const body = execFileSync(
    "curl",
    [
      "--fail",
      "--silent",
      "--show-error",
      "--location",
      "--compressed",
      "--retry",
      "3",
      "--retry-all-errors",
      "--connect-timeout",
      "10",
      "--max-time",
      "30",
      ...headerArgs,
      apiUrl,
    ],
    { encoding: "utf-8", maxBuffer: MAX_RESPONSE_BYTES }
  );

  const posts = JSON.parse(body);
  if (!Array.isArray(posts)) {
    throw new Error(
      `Substack API did not return an array of posts from ${apiUrl}`
    );
  }
  return posts;
}

const posts = fetchWithCurl(POSTS_API_URL)
  .map(normalizePost)
  .sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

if (posts.length === 0) {
  throw new Error(`Substack API returned zero posts: ${POSTS_API_URL}`);
}

fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
fs.writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(posts, null, 2)}\n`);
console.log(
  `Refreshed ${SNAPSHOT_PATH} with ${posts.length} Substack posts from ${POSTS_API_URL}.`
);
