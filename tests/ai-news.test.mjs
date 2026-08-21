import assert from "node:assert/strict";
import test from "node:test";
import { canonicalizeNewsUrl, mergeEdition, sourceTypeForUrl, validateEdition } from "../scripts/ai-news-core.mjs";

const now = new Date("2026-08-21T02:45:00.000Z");
const story = (sourceUrl, publishedAt = "2026-08-20T12:00:00.000Z") => ({
  title: "A material artificial intelligence engineering update",
  summary: "The source describes a concrete change to an AI product, research result, or developer workflow with enough context to evaluate it.",
  whyItMatters: "Engineers can judge whether the change belongs in a real system.",
  sourceUrl,
  publishedAt,
  topics: ["AI", "Engineering"],
});

const validStories = [
  story("https://x.com/openai/status/1958172638475612345?utm_source=test"),
  story("https://x.com/github/status/1958172638475612346"),
  story("https://www.reddit.com/r/MachineLearning/comments/abc123/research_update/"),
  story("https://reddit.com/r/LocalLLaMA/comments/def456/open_source_release/"),
  story("https://medium.com/@engineer/a-useful-ai-systems-note-123456789abc"),
];

test("canonicalizes and classifies allowed source URLs", () => {
  assert.equal(canonicalizeNewsUrl(validStories[0].sourceUrl), "https://x.com/openai/status/1958172638475612345");
  assert.equal(sourceTypeForUrl(validStories[2].sourceUrl), "reddit");
  assert.equal(canonicalizeNewsUrl("https://example.com/story"), "");
});

test("accepts exactly five items with the required source mix", () => {
  const edition = validateEdition(validStories, now);
  assert.equal(edition.length, 5);
  assert.deepEqual(edition.map((item) => item.sourceType), ["x", "x", "reddit", "reddit", "medium"]);
});

test("rejects duplicate, stale, and malformed editions", () => {
  assert.throws(() => validateEdition(validStories.slice(0, 4), now), /exactly 5/);
  assert.throws(() => validateEdition([...validStories.slice(0, 4), validStories[0]], now), /duplicate/);
  assert.throws(() => validateEdition([...validStories.slice(0, 4), story("https://medium.com/@engineer/old-story-123", "2026-01-01T00:00:00Z")], now), /stale/);
});

test("prepends the new edition and preserves the archive", () => {
  const feed = mergeEdition({ items: [{ ...validStories[0], id: "old", sourceUrl: "https://x.com/older/status/1958172638475612340" }], editions: [] }, validStories, { now });
  assert.equal(feed.status, "ready");
  assert.equal(feed.items.length, 6);
  assert.equal(feed.editions[0].itemIds.length, 5);
});
