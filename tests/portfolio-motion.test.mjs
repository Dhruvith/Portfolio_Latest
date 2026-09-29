import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
const system = await readFile(new URL("../src/motionSystem.jsx", import.meta.url), "utf8");
const css = await readFile(new URL("../src/editorial.css", import.meta.url), "utf8");
const cord = await readFile(new URL("../src/PullCordSwitch.jsx", import.meta.url), "utf8");

test("motion has one shared timing system and one-time scroll reveals", () => {
  assert.match(system, /motionEase = \[0\.22, 1, 0\.36, 1\]/);
  assert.match(system, /viewport=\{\{ once: true/);
  assert.match(system, /initial=\{reduceMotion \? false/);
  assert.match(system, /reducedMotion="user"/);
});

test("navigation, hero and tools use compositor-friendly motion", () => {
  assert.match(app, /style=\{\{ scaleX: scrollYProgress \}\}/);
  assert.match(app, /className="hero-line" initial=/);
  assert.match(app, /whileHover=\{\{ y: -4/);
  assert.doesNotMatch(app, /ScrollTrigger|gsap\./);
});

test("small screens and accessibility preferences keep motion restrained", () => {
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /prefers-reduced-transparency: reduce/);
  assert.match(css, /max-width: 760px[\s\S]*?music-stage-art \{[^}]*transform: none !important/);
});

test("theme control needs a pull for pointer users and remains keyboard accessible", () => {
  assert.match(cord, /drag="y"/);
  assert.match(cord, /info\.offset\.y >= 33/);
  assert.match(cord, /event\.key !== "Enter" && event\.key !== " "/);
  assert.doesNotMatch(cord, /onClick=\{switchTheme\}/);
});
