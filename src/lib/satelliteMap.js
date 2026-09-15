export function satelliteMetadataUrl(key) {
  if (!key?.trim() || key === "replace_me") return null;
  return `https://api.maptiler.com/tiles/satellite-v4/tiles.json?key=${encodeURIComponent(key.trim())}`;
}

export function satelliteOptions(metadata) {
  const template = metadata?.tiles?.[0];
  if (typeof template !== "string") throw new Error("Missing satellite tiles");
  const url = new URL(template);
  if (url.origin !== "https://api.maptiler.com" || !url.pathname.startsWith("/tiles/") ||
      !["{z}", "{x}", "{y}"].every((part) => template.includes(part))) throw new Error("Unexpected tile source");
  // Preserve provider credits as text, without injecting provider-supplied HTML.
  const attribution = String(metadata.attribution || "").replace(/<[^>]*>/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const nativeZoom = Number(metadata.maxzoom);
  return {
    template,
    maxNativeZoom: Number.isFinite(nativeZoom) ? Math.max(0, Math.min(nativeZoom, 22)) : 18,
    attribution: `&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>${attribution ? ` · ${attribution}` : ""}`,
  };
}
