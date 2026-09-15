import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { satelliteMetadataUrl, satelliteOptions } from "../src/lib/satelliteMap.js";

test("satellite requires an explicit key and safely encodes it", () => {
  assert.equal(satelliteMetadataUrl(undefined), null);
  assert.equal(satelliteMetadataUrl("  "), null);
  assert.equal(satelliteMetadataUrl("replace_me"), null);
  assert.equal(satelliteMetadataUrl("a&b"), "https://api.maptiler.com/tiles/satellite-v4/tiles.json?key=a%26b");
});

test("satellite only accepts the documented provider, preserves attribution without HTML", () => {
  const template = "https://api.maptiler.com/tiles/satellite-v4/{z}/{x}/{y}.jpg?key=test";
  const options = satelliteOptions({ tiles: [template], maxzoom: 20, attribution: '<a href="javascript:bad()">Imagery credit</a><img src=x onerror=bad()>' });
  assert.equal(options.template, template);
  assert.equal(options.maxNativeZoom, 20);
  assert.match(options.attribution, /Imagery credit/);
  assert.doesNotMatch(options.attribution, /javascript:|<img|onerror/);
  for (const bad of ["http://api.maptiler.com/tiles/{z}/{x}/{y}.jpg", "https://other.test/tiles/{z}/{x}/{y}.jpg", "https://api.maptiler.com/tiles/no-coordinates.jpg"]) {
    assert.throws(() => satelliteOptions({ tiles: [bad] }));
  }
});

test("signature has manual replay, intersection replay, keyboard button and motion cleanup", async () => {
  const source = await readFile(new URL("../src/Signature.jsx", import.meta.url), "utf8");
  assert.match(source, /type="button"/);
  assert.match(source, /onClick=\{replay\}/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /observer.disconnect\(\)/);
  assert.match(source, /animation.cancel\(\)/);
  assert.doesNotMatch(source, /setInterval|requestAnimationFrame|three/);
});

test("satellite keeps a recoverable street layer and never imports geocoding", async () => {
  const source = await readFile(new URL("../src/TravelMap.jsx", import.meta.url), "utf8");
  assert.match(source, /streets.addTo\(map\)/);
  assert.match(source, /credentials: "omit"/);
  assert.match(source, /controller.abort\(\)/);
  assert.match(source, /Satellite view is not configured yet/);
  assert.doesNotMatch(source, /nominatim|geocoding\/|googleapis/);
});

test("removed photo and visible replay label stay out of the UI", async () => {
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  const signature = await readFile(new URL("../src/Signature.jsx", import.meta.url), "utf8");
  assert.doesNotMatch(app, /hometown-photo|charminar-hyderabad|personal-introduction/);
  assert.doesNotMatch(signature, /signature-replay|ArrowCounterClockwise|> Replay signature/);
  assert.match(app, /<Signature \/>/);
  assert.match(signature, /aria-label="Replay Dhruvith’s signature"/);
});
