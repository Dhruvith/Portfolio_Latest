export function validPlaces(places) {
  return (Array.isArray(places) ? places : []).filter((place) =>
    place && place.lat !== null && place.lng !== null && String(place.lat).trim() !== "" && String(place.lng).trim() !== "" &&
    Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng)) &&
    Math.abs(Number(place.lat)) <= 90 && Math.abs(Number(place.lng)) <= 180,
  );
}

export function placeTitle(place) {
  const title = String(place?.city || "").trim();
  return /^Place \d+$/i.test(title) ? title.replace(/^Place /i, "Saved stop ") : title || "Unnamed stop";
}

export function isUnnamed(place) {
  return !place?.city || /^(?:Place|Saved stop) \d+$/i.test(place.city);
}

export function coordinates(place) {
  return `${Number(place.lat).toFixed(6)}, ${Number(place.lng).toFixed(6)}`;
}

export function visitDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return "Not recorded";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.valueOf()) ? new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(date) : "Not recorded";
}

export function searchPlaces(places, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return places.filter((place) => {
    const text = [placeTitle(place), place.city, place.note, place.firstVisited, place.lastVisited,
      visitDate(place.firstVisited), visitDate(place.lastVisited), coordinates(place)].join(" ").toLowerCase();
    return terms.every((term) => text.includes(term));
  });
}

// Start in the densest area, not on a frequent private address or a country-wide view.
export function initialArea(places) {
  if (!places.length) return { center: [17.385, 78.4867], zoom: 10 };
  const cells = new Map();
  for (const place of places) {
    const key = `${Math.floor(Number(place.lat) * 5)},${Math.floor(Number(place.lng) * 5)}`;
    const group = cells.get(key) || [];
    group.push(place);
    cells.set(key, group);
  }
  const group = [...cells.values()].sort((a, b) => b.length - a.length)[0];
  const center = ["lat", "lng"].map((key) => group.reduce((sum, place) => sum + Number(place[key]), 0) / group.length);
  return { center, zoom: places.length === 1 ? 15 : 11 };
}

export function samePosition(a, b) {
  return Math.abs(Number(a.lat) - Number(b.lat)) < 0.000001 && Math.abs(Number(a.lng) - Number(b.lng)) < 0.000001;
}

// Choose an actual recorded coordinate, never an average that may fall between buildings.
export function recordedPosition(points) {
  const groups = new Map();
  for (const point of points) {
    const key = `${Number(point.lat).toFixed(6)},${Number(point.lng).toFixed(6)}`;
    const previous = groups.get(key);
    groups.set(key, { point, count: (previous?.count || 0) + 1 });
  }
  return [...groups.values()].sort((a, b) => b.count - a.count)[0]?.point || null;
}
