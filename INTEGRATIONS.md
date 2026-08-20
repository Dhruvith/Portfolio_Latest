# Local portfolio integrations

The public portfolio reads editable content from `public/content/portfolio.json`. The separate local Content Studio manages that file; no account token or integration secret belongs in public content.

The Content Studio runs at `http://admin.localhost:4180` (or `http://localhost:4180`) and talks only to the loopback CMS API at `http://127.0.0.1:8788`. Run `npm run cms:setup` once to create the local password hash, then `npm run cms` to start both processes. The API restricts origins and hosts, requires a CSRF token for writes, uses an HTTP-only same-site session cookie, rate-limits login attempts, validates JSON depth and size, writes atomically, and keeps local backups.

## Music playback

The public music chapter is platform-neutral. It renders no Spotify or YouTube iframe, exposes no provider token, and never opens a song in another tab. Playlist metadata remains editable through `musicPlaylists` in the Content Studio.

### Current local library

The development server mounts `C:\Users\DELL\Desktop\Songs` at `/audio/library/` using a loopback-only Vite middleware with byte-range support. The MP3 files remain outside the repository and production build. The project contains only metadata and local paths; `.gitignore` also excludes the local library mount.

### Personal production backend

The production backend is the personal Firebase project `personalportfolio-e5033`. Firestore stores one public portfolio document at `portfolio/public`; the public page may read it, while writes require a verified Firebase Authentication session for `dhruvith2004@gmail.com`. All other Firestore paths are denied. The Firebase web configuration lives in ignored `.env.local`; it identifies the project but grants no administrative authority. Security is enforced by `firestore.rules`, not by hiding the browser configuration.

The cloud Content Studio uses Google sign-in and writes the same Firestore document. The existing loopback CMS remains available for offline/local authoring. Never deploy the loopback API as a public server.

Do not enable Firebase Storage for the current music library. Cloud Storage for Firebase now requires the Blaze billing plan, and the local tracks are not cleared for public redistribution. If publishable original/licensed audio is added later, use a dedicated Firebase Storage path, owner-only upload rules, explicit MIME and size limits, and budget alerts. Keep service-account files and refresh tokens out of the browser, CMS content, Git, and chat.

Full-track playback uses the native HTML Audio element. Each track accepts an `audioSrc` value such as `/audio/track-name.mp3`. When an approved source exists, the custom play, pause, seek, previous, next, shuffle, and queue controls work entirely inside the portfolio. When it is empty, the play control stays disabled.

The Telugu Mass reference uses the same underlying delivery model: a custom player loading directly hosted audio files. Only add audio that you own or have permission to publish. YouTube Music Premium offline downloads are licensed for playback inside YouTube Music and are not publishable web audio files. Do not extract, copy, or re-host tracks from YouTube Music or Spotify.

YouTube's official iframe API can play only videos that permit embedding and requires a visible embedded player. Spotify's Web Playback SDK requires Spotify Premium, OAuth, and each listener's authentication. Neither approach satisfies the current platform-neutral interface, so neither is loaded by the public page.

Local file placement and Content Studio values are documented in `public/audio/README.md`.

## Embedded tools

`DFinance Manager` is the first item in the Tool Shelf. The portfolio contains a native, dependency-free version of the existing SIP, SWP, loan EMI, and fixed-deposit calculations, so visitors can use it without relying on cross-origin framing. Its résumé-linked Netlify URL remains available through **Open full screen** as the original live project.

## Visited-places map

The map reads the `places` collection from the Content Studio. Each place supports:

- `id`: a short unique identifier;
- `city`: the hover title;
- `country` and `note`: the hover detail;
- `lat` and `lng`: precise decimal coordinates.

Google Timeline exports can be imported locally with:

```powershell
npm run import:timeline -- "C:\path\to\Timeline.json"
```

The importer reads only `semanticSegments[].visit`, groups repeated visits by Google place ID, averages repeated coordinates for the same place, and records visit count plus first/latest visit dates. Raw Google place IDs are never written into the public portfolio content; only a one-way hashed local identifier is stored. Timeline exports do not include readable venue names in this format, so imported points use stable numbered labels instead of invented names.

The page intentionally does not print a written location list. Details appear only when a visitor hovers, taps, or focuses a map point. A spatial index clusters nearby coordinates and renders only the points needed for the visible map area, keeping large collections responsive. Search, smooth pan/zoom, fit-all, clustered pins, and selected-place details stay entirely in the browser.

Leaflet renders the map with OpenStreetMap tiles. Visible attribution must remain on the map. Do not add prefetching or offline tile downloads. If the site later receives material traffic, select a hosted tile provider instead of depending on OpenStreetMap's community tile servers.

Precise coordinates are public data once this portfolio is deployed, even if they are revealed only on hover. Do not add a home address, routine workplace entrance, or another sensitive private location.

WakaTime, Strava, and Letterboxd are not used by this portfolio.
