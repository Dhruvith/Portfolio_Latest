import { createHash } from "node:crypto";

export const NEWS_PER_EDITION = 5;
export const SOURCE_DOMAINS = ["x.com", "reddit.com", "medium.com"];
export const SOURCE_MIX = Object.freeze({ x: 2, reddit: 2, medium: 1 });

const SOURCE_LABELS = Object.freeze({ x: "X", reddit: "Reddit", medium: "Medium" });

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sourceTypeForUrl(value) {
  try {
    const hostname = new URL(value).hostname.toLowerCase().replace(/^www\./, "");
    if (hostname === "x.com") return "x";
    if (hostname === "reddit.com" || hostname.endsWith(".reddit.com")) return "reddit";
    if (hostname === "medium.com" || hostname.endsWith(".medium.com")) return "medium";
  } catch {
    return "";
  }
  return "";
}

export function canonicalizeNewsUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:" || !sourceTypeForUrl(url.href)) return "";
    url.hash = "";
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "source",
      "share_id",
    ].forEach((parameter) => url.searchParams.delete(parameter));
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    url.pathname = url.pathname.replace(/\/$/, "") || "/";
    return url.href;
  } catch {
    return "";
  }
}

function isSpecificSourceUrl(url, sourceType) {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const parts = parsed.pathname.split("/").filter(Boolean);
  if (sourceType === "x") return parts.length >= 3 && parts[1] === "status" && /^\d+$/.test(parts[2]);
  if (sourceType === "reddit") return parts.includes("comments") && parts.length >= 4;
  if (sourceType === "medium") {
    if (["tag", "search", "topics", "me"].includes(parts[0])) return false;
    return hostname === "medium.com" ? parts.length >= 2 : parts.length >= 1;
  }
  return false;
}

export function validateStory(candidate, now = new Date()) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new Error("A news item must be an object.");
  }

  const sourceUrl = canonicalizeNewsUrl(candidate.sourceUrl);
  const sourceType = sourceTypeForUrl(sourceUrl);
  if (!sourceUrl || !sourceType || !isSpecificSourceUrl(sourceUrl, sourceType)) {
    throw new Error("A news item contains an invalid or non-specific source URL.");
  }

  const title = cleanText(candidate.title, 110);
  const summary = cleanText(candidate.summary, 280);
  const whyItMatters = cleanText(candidate.whyItMatters, 190);
  if (title.length < 12 || summary.length < 50 || whyItMatters.length < 30) {
    throw new Error("A news item is missing meaningful editorial copy.");
  }

  const publishedAt = new Date(candidate.publishedAt);
  const oldestAllowed = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  const newestAllowed = now.getTime() + 15 * 60 * 1000;
  if (!Number.isFinite(publishedAt.getTime()) || publishedAt.getTime() < oldestAllowed || publishedAt.getTime() > newestAllowed) {
    throw new Error("A news item has an invalid or stale publication timestamp.");
  }

  const topics = Array.isArray(candidate.topics)
    ? [...new Set(candidate.topics.map((topic) => cleanText(topic, 28)).filter(Boolean))].slice(0, 3)
    : [];
  if (!topics.length) throw new Error("A news item needs at least one topic.");

  return {
    id: createHash("sha256").update(sourceUrl).digest("hex").slice(0, 16),
    title,
    summary,
    whyItMatters,
    sourceName: SOURCE_LABELS[sourceType],
    sourceType,
    sourceUrl,
    publishedAt: publishedAt.toISOString(),
    topics,
  };
}

export function validateEdition(candidates, now = new Date()) {
  if (!Array.isArray(candidates) || candidates.length !== NEWS_PER_EDITION) {
    throw new Error(`An edition must contain exactly ${NEWS_PER_EDITION} items.`);
  }

  const stories = candidates.map((candidate) => validateStory(candidate, now));
  if (new Set(stories.map((story) => story.sourceUrl)).size !== NEWS_PER_EDITION) {
    throw new Error("An edition contains duplicate source URLs.");
  }

  for (const [sourceType, expected] of Object.entries(SOURCE_MIX)) {
    const actual = stories.filter((story) => story.sourceType === sourceType).length;
    if (actual !== expected) throw new Error(`An edition needs ${expected} ${sourceType} source item(s); received ${actual}.`);
  }

  return stories;
}

export function mergeEdition(feed, candidates, metadata = {}) {
  const now = metadata.now instanceof Date ? metadata.now : new Date();
  const stories = validateEdition(candidates, now);
  const editionDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const existingItems = Array.isArray(feed?.items) ? feed.items : [];
  const incomingUrls = new Set(stories.map((story) => story.sourceUrl));
  const items = [...stories, ...existingItems.filter((story) => !incomingUrls.has(canonicalizeNewsUrl(story.sourceUrl)))];
  const previousEditions = Array.isArray(feed?.editions) ? feed.editions : [];
  const edition = {
    id: editionDate,
    generatedAt: now.toISOString(),
    itemIds: stories.map((story) => story.id),
  };

  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    status: "ready",
    schedule: { time: "08:15", timezone: "Asia/Kolkata" },
    editions: [edition, ...previousEditions.filter((entry) => entry?.id !== editionDate)],
    items,
  };
}
