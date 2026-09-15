import assert from "node:assert/strict";
import test from "node:test";
import Supercluster from "supercluster";
import { validPlaces, placeTitle, visitDate, searchPlaces, initialArea, samePosition, recordedPosition } from "../src/lib/travelPlaces.js";

const stops = [
  { id: "a", city: "Place 001", lat: 17.38, lng: 78.48, visitCount: 2, lastVisited: "2026-09-01" },
  { id: "b", city: "My saved cafe", lat: 17.39, lng: 78.49, visitCount: 1, lastVisited: "2025-10-04" },
  { id: "c", city: "Place 003", lat: 12.9, lng: 79.1 },
];

test("rejects missing, empty and out-of-range coordinates", () => {
  assert.equal(validPlaces([...stops, { lat: null, lng: 0 }, { lat: "", lng: 0 }, { lat: 100, lng: 2 }]).length, 3);
});
test("unnamed records do not pretend to be identified venues", () => {
  assert.equal(placeTitle(stops[0]), "Saved stop 001");
  assert.equal(placeTitle(stops[1]), "My saved cafe");
  assert.equal(visitDate("invalid"), "Not recorded");
});
test("search supports stop names, recorded dates and precise coordinates", () => {
  assert.equal(searchPlaces(stops, "cafe")[0].id, "b");
  assert.equal(searchPlaces(stops, "Sep 2026")[0].id, "a");
  assert.equal(searchPlaces(stops, "17.390000, 78.490000")[0].id, "b");
  assert.equal(searchPlaces(stops, "unknown").length, 0);
});
test("opening view is a dense area, not a single frequent address", () => {
  assert.equal(initialArea(stops).zoom, 11);
  assert.ok(initialArea(stops).center[0] > 17);
  assert.notDeepEqual(initialArea(stops).center, [stops[0].lat, stops[0].lng]);
});
test("street-level zoom dissolves clusters even for coincident positions", () => {
  const index = new Supercluster({ radius: 36, maxZoom: 16 }).load([0, 1].map((id) => ({ type: "Feature", geometry: { type: "Point", coordinates: [78.48, 17.38] }, properties: { id } })));
  assert.equal(index.getClusters([78, 17, 79, 18], 16).length, 1);
  assert.equal(index.getClusters([78, 17, 79, 18], 17).length, 2);
  assert.equal(index.getClusters([78, 17, 79, 18], 19).length, 2);
  assert.equal(samePosition(stops[0], { lat: 17.38, lng: 78.48 }), true);
});
test("import uses a real recorded candidate instead of synthesizing a midpoint", () => {
  const points = [{ lat: 17.3, lng: 78.4 }, { lat: 17.4, lng: 78.5 }, { lat: 17.3, lng: 78.4 }];
  assert.deepEqual(recordedPosition(points), points[0]);
  assert.equal(recordedPosition([]), null);
});
