# Satellite map setup

The existing Leaflet map supports MapTiler satellite imagery. All 386 saved stops stay on the same map when switching layers. No Firebase database or geocoding service is required.

1. Use your **personal** MapTiler account, never any CodeSync account. Check the current plan, satellite access, quota and billing before enabling it. No account or paid plan has been created by this implementation.
2. Create a browser map key. In **Allowed HTTP origins**, allow only your local development origin and the exact production hostname (`portfolio-latest-wheat-alpha.vercel.app`). Follow MapTiler's required origin format. Do not allow every domain or unknown origins (`?`).
3. Add `VITE_MAPTILER_KEY=your_browser_key` to the existing ignored `.env.local`. This is intentionally public client configuration, not a secret. Never use an admin token here.
4. Restart the local Vite server and select **Satellite** on the map. Confirm imagery loads, attribution is visible, pins remain in position, and Map restores streets. Test a blocked/invalid key to confirm fallback.
5. When ready to publish, add the same variable to this personal project's Vercel environment and redeploy. Vite reads it at build time; editing an environment variable does not update an existing deployment.

Satellite loads only after the visitor selects it. The browser requests provider metadata and tiles for the viewed area; the imagery provider can observe that area and ordinary request metadata. The raw Timeline, place IDs, visit dates, and coordinates are not submitted for reverse geocoding. Existing public pins remain public. Satellite images are not live, and detail/capture dates vary by area.

No key is currently configured. The UI honestly reports this and keeps streets working. A 12-second timeout or tile/API error restores streets. Attribution from the metadata is rendered as escaped text beside the MapTiler copyright link. No third-party HTML or arbitrary tile host is accepted.

Official references checked September 15, 2026:

- https://docs.maptiler.com/leaflet/
- https://docs.maptiler.com/cloud/api/tiles/
- https://www.maptiler.com/maps/satellite/
- https://docs.maptiler.com/guides/maps-apis/maps-platform/how-to-protect-your-map-key/
