# Music-room reference teardown

Reference: https://telugu-mass.vercel.app/

Audit date: 20 August 2026

## Why the reference feels clean

The page has one visual system. A single cinematic stage contains the artwork, identity, playlist switcher, title, player, and song drawer. Nothing outside that stage competes with the music.

At a 1440 × 900 viewport:

- The page uses a near-black background and 52 px outer padding.
- The stage is 1336 × 738 px with a 20 px radius and a quiet one-pixel border.
- Artwork is a full-stage `background-image` with `cover`; playlist changes crossfade between complete scenes.
- The playlist switcher is a 315 × 42 px pill at the top right.
- The display title is centered and uses one culturally specific display face.
- The player is only 480 × 166 px, centered 39 px above the bottom edge.
- The song drawer reuses the player's exact 480 px width and opens above it instead of expanding the layout.
- The visible controls are limited to song title, Songs, shuffle, timeline, previous, play, and next.

## How playback works

The reference does not embed Spotify or YouTube. It uses an ordinary HTML `<audio>` element and assigns a direct MP3 URL when a track is selected. In the inspected Gym state, the player requested a public audio file from the site's Supabase storage.

This is why the player can be fully custom and still play complete tracks: the application controls the audio files directly. We should not scrape or copy those files. Our equivalent can use local audio files only when Dhruvith supplies files he is permitted to publish.

## What failed in our previous version

1. Spotify and YouTube Music became visible design elements instead of invisible content sources.
2. The 870 px split player introduced a second image and a second hierarchy inside the stage.
3. Platform labels, two external-playlist links, listener language, and embed chrome added words without adding meaning.
4. The Spotify embed changed the section from a designed experience into a third-party widget.
5. The giant title collided with the oversized player instead of floating in a large calm field.
6. One supplied playlist plus a Spotify tab made the switcher describe platforms, not musical moods.

## Rebuild contract

- One stage and one artwork per playlist.
- No Spotify, YouTube, or service names in the public interface.
- No third-party embeds.
- One compact 480 px custom player.
- Playlist tabs appear only when there is more than one real playlist.
- With no local audio source, Play opens the exact selected public track link in a new tab.
- With an approved local `audioSrc`, the same control plays the full track inline through HTML Audio.
- The song drawer opens over the stage and never changes the section's dimensions.
- Only verified playlist and track data appears; no fake listener counts or invented playlists.
- Desktop and mobile keep the same hierarchy rather than becoming different designs.
