import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowsOut, ArrowsIn, ArrowLeft, ArrowRight, Crosshair, MagnifyingGlass, MapPin, X } from "@phosphor-icons/react";
import pinUrl from "leaflet/dist/images/marker-icon.png";
import pinRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import pinShadowUrl from "leaflet/dist/images/marker-shadow.png";
import { coordinates, initialArea, isUnnamed, placeTitle, samePosition, searchPlaces, validPlaces, visitDate } from "./lib/travelPlaces.js";
import "./travel-map.css";
import { satelliteMetadataUrl, satelliteOptions } from "./lib/satelliteMap.js";

export function TravelMap({ places }) {
  const root = useRef(null);
  const mapNode = useRef(null);
  const runtime = useRef(null);
  const selectRef = useRef(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("loading");
  const [tileError, setTileError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [view, setView] = useState({ count: 0, zoom: 11 });
  const [retry, setRetry] = useState(0);
  const [basemap, setBasemap] = useState("streets");
  const [mapNotice, setMapNotice] = useState("");
  const [satelliteLoading, setSatelliteLoading] = useState(false);
  const all = useMemo(() => validPlaces(places), [places]);
  const filtered = useMemo(() => all.filter((place) => filter === "all" ||
    (filter === "once" ? Number(place.visitCount || 1) === 1 : Number(place.visitCount || 1) > 1)), [all, filter]);
  const results = useMemo(() => searchPlaces(filtered, query), [filtered, query]);
  const colocated = useMemo(() => selected ? filtered.filter((place) => samePosition(place, selected)) : [], [filtered, selected]);
  const motion = () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const selectPlace = (place, zoomIn = true) => {
    setSelected(place);
    setQuery("");
    const current = runtime.current;
    if (!current) return;
    current.selection.clearLayers();
    current.L.circleMarker([Number(place.lat), Number(place.lng)], {
      radius: 17, color: "#0058a3", weight: 3, fillColor: "#ffda1a", fillOpacity: .35, interactive: false,
    }).addTo(current.selection);
    if (zoomIn) current.map.flyTo([Number(place.lat), Number(place.lng)], Math.max(17, current.map.getZoom()), { animate: motion(), duration: .7 });
  };
  selectRef.current = selectPlace;

  const closeSelection = () => {
    setSelected(null);
    runtime.current?.selection.clearLayers();
  };
  const fitAll = () => {
    closeSelection();
    const current = runtime.current;
    if (current && filtered.length) current.map.fitBounds(current.L.latLngBounds(filtered.map((p) => [Number(p.lat), Number(p.lng)])), {
      padding: [45, 65], maxZoom: 15, animate: motion(), duration: .6,
    });
  };

  useEffect(() => {
    if (!mapNode.current || !all.length) return;
    let disposed = false;
    let resize;
    setStatus("loading");
    Promise.all([import("leaflet"), import("supercluster")]).then(([{ default: L }, { default: Supercluster }]) => {
      if (disposed) return;
      const map = L.map(mapNode.current, { zoomControl: false, scrollWheelZoom: false, minZoom: 3, maxZoom: 19, zoomAnimation: motion() });
      const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      tiles.on("tileerror", () => !disposed && setTileError(true));
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
      const pin = L.icon({ iconUrl: pinUrl, iconRetinaUrl: pinRetinaUrl, shadowUrl: pinShadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41], tooltipAnchor: [0, -35] });
      const layer = L.layerGroup().addTo(map);
      const selection = L.layerGroup().addTo(map);
      runtime.current = { L, Supercluster, map, streets: tiles, layer, selection, pin, index: null, places: [] };
      const area = initialArea(all);
      map.setView(area.center, area.zoom, { animate: false });
      resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
      resize.observe(mapNode.current);
      setStatus("ready");
    }).catch(() => !disposed && setStatus("error"));
    return () => {
      disposed = true;
      resize?.disconnect();
      runtime.current?.map.remove();
      runtime.current = null;
    };
  }, [all, retry]);

  useEffect(() => {
    const current = runtime.current;
    if (status !== "ready" || !current) return;
    const { L, map, streets } = current;
    setTileError(false);
    if (basemap === "streets") { streets.addTo(map); setSatelliteLoading(false); return; }
    const controller = new AbortController();
    let active = true;
    let satellite;
    setSatelliteLoading(true);
    const failed = () => {
      if (!active) return;
      if (satellite) map.removeLayer(satellite);
      streets.addTo(map);
      setBasemap("streets");
      setMapNotice("Satellite imagery is unavailable. Street view and your saved pins are still available.");
      setSatelliteLoading(false);
    };
    // Only tile metadata and the viewed map area reach the provider. No Timeline uploads or geocoding.
    const url = satelliteMetadataUrl(import.meta.env.VITE_MAPTILER_KEY);
    if (!url) { failed(); return () => { active = false; }; }
    const timeout = setTimeout(() => { controller.abort(); failed(); }, 12000);
    fetch(url, { signal: controller.signal, credentials: "omit", referrerPolicy: "strict-origin-when-cross-origin" })
      .then((response) => { if (!response.ok) throw new Error("Satellite unavailable"); return response.json(); })
      .then((metadata) => {
        if (!active) return;
        const { template, ...options } = satelliteOptions(metadata);
        satellite = L.tileLayer(template, { ...options, maxZoom: 19, opacity: 0 });
        satellite.once("load", () => {
          if (!active) return;
          clearTimeout(timeout);
          satellite.setOpacity(1);
          map.removeLayer(streets);
          setSatelliteLoading(false);
        });
        satellite.on("tileerror", failed);
        satellite.addTo(map);
      }).catch(failed);
    return () => { active = false; clearTimeout(timeout); controller.abort(); if (satellite) map.removeLayer(satellite); };
  }, [basemap, status, all]);

  useEffect(() => {
    const current = runtime.current;
    if (status !== "ready" || !current) return;
    const { L, Supercluster, map, layer, pin } = current;
    const index = new Supercluster({ radius: 36, maxZoom: 16 }).load(filtered.map((place) => ({
      type: "Feature", geometry: { type: "Point", coordinates: [Number(place.lng), Number(place.lat)] }, properties: { place },
    })));
    current.index = index;
    current.places = filtered;
    const render = () => {
      layer.clearLayers();
      const bounds = map.getBounds();
      const zoom = Math.floor(map.getZoom());
      setView({ zoom, count: filtered.filter((p) => bounds.contains([Number(p.lat), Number(p.lng)])).length });
      // Pass the real zoom: > maxZoom must return individual points, not permanent clusters.
      for (const feature of index.getClusters([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()], zoom)) {
        const [lng, lat] = feature.geometry.coordinates;
        if (feature.properties.cluster) {
          const count = Number(feature.properties.point_count);
          const marker = L.marker([lat, lng], {
            title: `${count} saved stops. Select to zoom in.`, keyboard: true,
            icon: L.divIcon({ className: "atlas-cluster", html: `<span>${count}</span>`, iconSize: [40, 40], iconAnchor: [20, 20] }),
          });
          marker.on("click", () => map.flyTo([lat, lng], Math.min(index.getClusterExpansionZoom(feature.properties.cluster_id), 19), { animate: motion(), duration: .65 }));
          layer.addLayer(marker);
        } else {
          const place = feature.properties.place;
          const tooltip = document.createElement("span");
          const title = document.createElement("strong");
          const detail = document.createElement("small");
          title.textContent = placeTitle(place);
          detail.textContent = `${place.visitCount || 1} recorded visits · ${visitDate(place.lastVisited)}`;
          tooltip.append(title, detail);
          const marker = L.marker([lat, lng], { icon: pin, keyboard: true, title: `${placeTitle(place)}. Select for visit details.`, alt: placeTitle(place) })
            .bindTooltip(tooltip, { direction: "top", opacity: 1 });
          marker.on("click", () => selectRef.current(place));
          layer.addLayer(marker);
        }
      }
    };
    map.on("moveend", render);
    render();
    return () => map.off("moveend", render);
  }, [filtered, status]);

  useEffect(() => {
    const update = () => setExpanded(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === root.current) await document.exitFullscreen();
      else await root.current.requestFullscreen();
    } catch { setExpanded(false); }
  };

  return (
    <div className={`travel-explorer${selected ? " has-selection" : ""}`} ref={root}>
      <div className="travel-toolbar">
        <div className="travel-search">
          <MagnifyingGlass size={20} aria-hidden="true" />
          <input aria-label="Search saved stops by name, date, or coordinates" placeholder="Search a stop, date, or coordinates" type="search" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => {
            if (e.key === "Escape") setQuery("");
            if (e.key === "Enter" && results.length) selectPlace(results[0]);
          }} />
          {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={18} /></button>}
          {query.trim() && <div className="travel-results">
            {results.length ? results.slice(0, 6).map((place) => <button type="button" key={place.id} onClick={() => selectPlace(place)}>
              <MapPin size={18} /><span><strong>{placeTitle(place)}</strong><small>{coordinates(place)} · {visitDate(place.lastVisited)}</small></span>
            </button>) : <p>No saved stops match. Try a recorded date or coordinates.</p>}
            {results.length > 6 && <p>{results.length} matches. Refine your search to narrow them down.</p>}
          </div>}
        </div>
        <label className="travel-filter"><span>Show</span><select value={filter} onChange={(e) => { closeSelection(); setQuery(""); setFilter(e.target.value); }}>
          <option value="all">All stops</option><option value="once">Single visits</option><option value="return">Return visits</option>
        </select></label>
        <button type="button" className="travel-all" onClick={fitAll} disabled={status !== "ready"}><Crosshair size={18} />All locations</button>
        <button type="button" className="travel-fullscreen" onClick={toggleFullscreen} aria-label={expanded ? "Exit full screen" : "Expand map to full screen"}>{expanded ? <ArrowsIn size={20} /> : <ArrowsOut size={20} />}</button>
      </div>
      <div className="travel-map-options">
        <div className="travel-basemap" role="group" aria-label="Map view">
          <button type="button" aria-pressed={basemap === "streets"} onClick={() => { setBasemap("streets"); setMapNotice(""); }}>Map</button>
          <button type="button" aria-pressed={basemap === "satellite"} onClick={() => {
            if (!satelliteMetadataUrl(import.meta.env.VITE_MAPTILER_KEY)) { setMapNotice("Satellite view is not configured yet. You can still explore every saved pin on the street map."); return; }
            setMapNotice(""); setBasemap("satellite");
          }}>Satellite</button>
        </div>
        <span>{satelliteLoading ? "Loading satellite imagery…" : basemap === "satellite" ? "Satellite imagery · capture dates and detail vary by area" : "Street map"}</span>
      </div>
      {mapNotice && <div className="travel-map-notice" role="status"><span>{mapNotice}</span><button type="button" aria-label="Dismiss map notice" onClick={() => setMapNotice("")}><X size={18} /></button></div>}
      <div className="travel-canvas" data-lenis-prevent>
        <div ref={mapNode} className="atlas-map" aria-label="Visited locations. Arrow keys pan; plus and minus keys zoom. Select a pin for recorded details." />
        {status !== "ready" && <div className="travel-status" role="status">
          {status === "error" ? <><strong>The map could not load.</strong><button type="button" onClick={() => setRetry((n) => n + 1)}>Try again</button></> : all.length ? "Loading your saved stops…" : "No saved stops are available yet."}
        </div>}
        {status === "ready" && <div className="travel-view-status" aria-live="polite"><strong>{view.count}</strong> of {filtered.length} stops in view <span>{view.zoom >= 16 ? "Street detail" : view.zoom >= 10 ? "Neighbourhoods" : "Overview"}</span></div>}
        {selected && <aside className="travel-detail" aria-label="Selected stop details" aria-live="polite">
          <header><span>RECORDED STOP</span><button type="button" onClick={closeSelection} aria-label="Close stop details"><X size={18} /></button></header>
          <h4>{placeTitle(selected)}</h4>
          {isUnnamed(selected) && <p className="travel-unnamed">This timeline entry has no place name. The pin shows its recorded location, not a verified venue.</p>}
          <dl>
            <div><dt>Recorded visits</dt><dd>{selected.visitCount || 1}</dd></div>
            <div><dt>First recorded</dt><dd>{visitDate(selected.firstVisited)}</dd></div>
            <div><dt>Last recorded</dt><dd>{visitDate(selected.lastVisited)}</dd></div>
            <div className="travel-coordinates"><dt>Coordinates</dt><dd>{coordinates(selected)}</dd></div>
          </dl>
          {colocated.length > 1 && <div className="travel-colocated">
            <span>{colocated.findIndex((p) => p.id === selected.id) + 1} of {colocated.length} stops at this position</span>
            <button type="button" aria-label="Previous stop at this position" onClick={() => selectPlace(colocated[(colocated.findIndex((p) => p.id === selected.id) - 1 + colocated.length) % colocated.length], false)}><ArrowLeft size={18} /></button>
            <button type="button" aria-label="Next stop at this position" onClick={() => selectPlace(colocated[(colocated.findIndex((p) => p.id === selected.id) + 1) % colocated.length], false)}><ArrowRight size={18} /></button>
          </div>}
          <button className="travel-street" type="button" onClick={() => runtime.current?.map.flyTo([Number(selected.lat), Number(selected.lng)], 19, { animate: motion(), duration: .6 })}>Zoom to this position <ArrowRight size={18} /></button>
        </aside>}
      </div>
      <footer className="travel-footer"><span>{tileError ? "Some map tiles could not load. Your saved pins are still available." : "Select a cluster to explore · Select a pin for details · Use + / − to zoom"}</span><small>Google Timeline records · {basemap === "satellite" ? "MapTiler imagery" : "OpenStreetMap basemap"}</small></footer>
    </div>
  );
}
