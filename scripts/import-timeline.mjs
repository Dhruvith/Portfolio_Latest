import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const inputPath = path.resolve(process.argv[2] || "");
const contentPath = path.join(root, "public", "content", "portfolio.json");

if (!process.argv[2]) throw new Error("Provide the local Google Timeline JSON path.");

function parseLatLng(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/^\s*(-?\d+(?:\.\d+)?)°?\s*,\s*(-?\d+(?:\.\d+)?)°?\s*$/u);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

const timeline = JSON.parse(await readFile(inputPath, "utf8"));
if (!timeline || !Array.isArray(timeline.semanticSegments)) {
  throw new Error("Timeline JSON does not contain a semanticSegments array.");
}

const grouped = new Map();
for (const segment of timeline.semanticSegments) {
  const candidate = segment?.visit?.topCandidate;
  const placeId = candidate?.placeId;
  const coordinates = parseLatLng(candidate?.placeLocation?.latLng);
  const start = safeDate(segment?.startTime);
  const end = safeDate(segment?.endTime);
  if (!placeId || !coordinates || !start || !end) continue;

  const record = grouped.get(placeId) || {
    key: placeId,
    coordinates: [],
    visits: 0,
    first: start,
    last: end,
  };
  record.coordinates.push(coordinates);
  record.visits += 1;
  if (start < record.first) record.first = start;
  if (end > record.last) record.last = end;
  grouped.set(placeId, record);
}

const imported = [...grouped.values()]
  .sort((left, right) => left.first - right.first || left.key.localeCompare(right.key))
  .map((record, index) => {
    const lat = record.coordinates.reduce((sum, point) => sum + point.lat, 0) / record.coordinates.length;
    const lng = record.coordinates.reduce((sum, point) => sum + point.lng, 0) / record.coordinates.length;
    const sequence = String(index + 1).padStart(3, "0");
    return {
      id: `timeline-${createHash("sha256").update(record.key).digest("hex").slice(0, 12)}`,
      city: `Place ${sequence}`,
      country: "Timeline",
      note: `${record.visits} visit${record.visits === 1 ? "" : "s"}`,
      lat: Number(lat.toFixed(7)),
      lng: Number(lng.toFixed(7)),
      visitCount: record.visits,
      firstVisited: dateOnly(record.first),
      lastVisited: dateOnly(record.last),
    };
  });

if (!imported.length) throw new Error("No valid visits were found in the Timeline JSON.");

const content = JSON.parse(await readFile(contentPath, "utf8"));
content.places = imported;
content.placesSection = {
  label: "PLACES I'VE VISITED",
  heading: "A map of where I've been.",
  copy: "Zoom, pan, and select a pin to see when it appeared in my timeline.",
  firstVisited: imported.reduce((value, place) => value < place.firstVisited ? value : place.firstVisited, imported[0].firstVisited),
  lastVisited: imported.reduce((value, place) => value > place.lastVisited ? value : place.lastVisited, imported[0].lastVisited),
};

await writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
console.log(`Imported ${imported.length} distinct places from ${timeline.semanticSegments.length} timeline segments.`);
