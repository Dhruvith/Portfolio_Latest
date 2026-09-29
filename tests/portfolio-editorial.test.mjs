import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const content = JSON.parse(await readFile(new URL("../public/content/portfolio.json", import.meta.url), "utf8"));
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const carousel = await readFile(new URL("../src/ProjectCarousel.jsx", import.meta.url), "utf8");

test("introduction leads with the person's name, with separate education and employment", () => {
  assert.equal(`${content.hero.lineOne} ${content.hero.lineTwo}`, content.identity.name);
  assert.match(content.education.institution, /Vellore Institute/);
  assert.equal(content.experience.length, 3);
  assert.ok(content.experience.every((role) => !/Vellore Institute/.test(role.company)));
  assert.ok(content.experience.some((role) => /chatbots and voice bots/.test(role.summary)));
});

test("technical chapters stay ordered and theatrical interludes are not rendered", () => {
  let previous = -1;
  for (const id of ["education", "work", "experience", "story", "tools", "music", "signals", "contact"]) {
    const position = app.indexOf(`id="${id}"`);
    assert.ok(position > previous, `${id} follows the preceding chapter`);
    previous = position;
  }
  assert.doesNotMatch(app, /<StoryBeat|className="principle-grid"/);
  assert.match(app, /href="#work"[^>]*>Explore my work/);
  assert.match(app, /href="#tools"[^>]*>Try my tools/);
});

test("project carousel keeps image cards, in-page details, and keyboard controls", () => {
  assert.match(carousel, /project-editorial-image/);
  assert.match(carousel, /project-editorial-detail/);
  assert.match(carousel, /useMotionValue\(1\)/);
  assert.match(carousel, /rotateY/);
  assert.match(carousel, /onPointerMove=/);
  assert.match(carousel, /prefers-reduced-motion|useReducedMotion/);
  assert.match(carousel, /event\.key !== "ArrowLeft" && event\.key !== "ArrowRight"/);
  assert.match(carousel, /aria-label="Next project"/);
  assert.match(app, /workbenchRef.current.focus/);
  assert.match(app, /toolTriggerRef.current\?\.focus/);
});

test("music, travel data, official logos and native tools are retained", async () => {
  assert.equal(content.musicPlaylists[0].tracks.length, 15);
  assert.equal(content.places.length, 386);
  assert.ok(content.tools.some((tool) => tool.id === "dfinance"));
  assert.ok(content.tools.some((tool) => tool.id === "ai-news"));
  for (const [, logo] of content.stack) {
    assert.match(logo, /^\/logos\/[^/]+\.svg$/);
    assert.ok((await readFile(new URL(`../public${logo}`, import.meta.url))).length > 0);
  }
});
