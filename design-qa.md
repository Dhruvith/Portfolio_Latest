# Design QA — cinematic portfolio story

## Evidence

- Source visual truth: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-3800a66d-ba36-4e56-95e5-c85ab863572b.png`.
- Full-view comparison: `qa-story-comparison-final.png` (1770 × 1140).
- Desktop implementation captures:
  - `qa-story-hero-1280x720.png`
  - `qa-story-education-final-1280x720.png`
  - `qa-story-projects-final-1280x720.png`
  - `qa-story-experience-1280x720.png`
- Focused responsive evidence:
  - `qa-story-mobile-nav-430x900.png`
  - `qa-story-mobile-education-430x900.png`
  - `qa-story-mobile-transition-final2-430x900.png`
- Desktop CSS viewport: 1280 × 720 at device scale factor 1.25.
- Mobile CSS viewport: 430 × 900 at device scale factor 1.
- State: light editorial theme; opening, education, projects, experience, narrative transition, mobile menu, and tool payoff tested.

## Findings

No actionable P0, P1, or P2 findings remain.

### Required fidelity surfaces

- Fonts and typography: passed. Dela Gothic One carries the Japanese display influence without replacing DM Sans for readable content. Desktop and mobile headings remain inside their frames without clipping or horizontal overflow.
- Spacing and layout rhythm: passed. The technical story now progresses through origin, proof, stakes, method, and payoff. Short transition scenes create changes in pace without adding decorative chapter numbers.
- Colors and visual tokens: passed. Warm white chapters carry the résumé content; Swedish blue signals action and production; yellow marks narrative turns; ink and red remain reserved for later contrast.
- Image quality and asset fidelity: passed. The Hyderabad opening image remains sharp, correctly cropped, and tied to the user's city. No filler stock or invented project imagery was introduced.
- Copy and content: passed. Education, projects, and experience are separated and ordered correctly. Transition copy is concise and functional. The tools chapter explicitly invites use rather than making another portfolio claim.
- Interaction and accessibility: passed. Navigation order matches DOM order, the mobile menu closes after selection, anchors expose headings below the fixed navigation, the project accordion works, and DFinance still calculates correctly.
- Responsiveness: passed. The 430-pixel viewport has no horizontal document overflow. All four transition statements remain within bounds.

## Information architecture verified

1. Cold open — technical identity and Hyderabad.
2. Education — origin and foundation.
3. Projects — proof through building.
4. Experience — production stakes and measurable work.
5. Engineering method — the pattern revealed by real systems.
6. Tools — direct, usable payoff.
7. Principles — constraints behind the work.
8. Music and more about me — personal dimension after technical credibility.
9. Contact — a clear next scene.

## Comparison history

### Pass A — narrative order

- P2: the earlier page presented method and experience before education, so it read like disconnected résumé categories rather than a chronological technical story.
- Fix: reordered the DOM, navigation, active-section model, and hero continuation to education → projects → experience → method → tools.
- Post-fix evidence: `qa-story-education-final-1280x720.png`, `qa-story-projects-final-1280x720.png`, and `qa-story-experience-1280x720.png`.

### Pass B — anchor framing

- P2: a 104-pixel section scroll margin left a cropped line from the previous transition visible around the fixed navigation.
- Fix: aligned desktop anchors to 18 pixels and mobile anchors to 10 pixels so the destination scene begins behind the navigation while its heading remains fully visible.
- Post-fix evidence: `qa-story-education-final-1280x720.png` and `qa-story-projects-final-1280x720.png`.

### Pass C — mobile transition typography

- P2: the first transition wrapped “it” onto an isolated line and placed punctuation too close to the viewport edge.
- Fix: reduced mobile transition type from 11vw to 9vw, tightened the maximum size, and retained balanced line height.
- Post-fix evidence: `qa-story-mobile-transition-final2-430x900.png`.

## Primary interactions tested

- Desktop navigation order and active states.
- Education, Projects, Experience, and Tools anchors.
- Project accordion state.
- DFinance launch and SIP result: ₹11,61,695 for ₹5,000 monthly, 12%, 10 years.
- Mobile menu order and close-on-selection behavior.
- Mobile narrative transitions and document bounds.
- Browser console errors: none.
- Production build and four Sites worker tests: passed.

## Pass D — copy, overlap, contrast, and scroll-film review (20 August 2026)

- P2: the hero ended the visible phrase “not developer” with a comma even though no clause followed it.
  - Fix: removed the dangling comma and kept the accessible label grammatically explicit as “Engineer, not developer.”
- P2: “Ai” used incorrect initialism casing and the sentence “but I can give logic” was unnatural.
  - Fix: changed the signature statement to “AI can code. I give it logic.”
- P2: the active timeline rule occupied the same horizontal space as the first text column.
  - Fix: added 28 pixels of desktop inset and 18 pixels of mobile inset. Measured final positions: row left 89.6 px; text left 117.6 px.
- P2: an older dark hover rule overrode the light principle cards, producing black text on a nearly black surface.
  - Fix: retained each light card surface on hover and moved the interaction cue to a blue top rule and blue heading.
- P3: the empty YouTube Music placeholder added implementation-status copy to the public story.
  - Fix: removed the empty card. New playlists can still be added through the local Content Studio.
- P3: personal, music, and map copy contained generic phrases and future-status language.
  - Fix: rewrote each sentence around concrete interests or actions.

### New evidence

- Full scroll recording: `portfolio-scroll-review.mp4` — 90 sequential browser frames from top to footer, 1266 × 712, 9 seconds.
- Scroll-film contact sheet: `qa-final/scroll-contact-sheet.png`.
- Desktop: `qa-final/hero-1280x720.png`, `qa-final/method-active-1280x720.png`, `qa-final/principles-hover-1280x720.png`.
- Mobile: `qa-final/mobile-hero-390x844.png`, `qa-final/mobile-method-390x844.png`, `qa-final/mobile-principles-390x844.png`, `qa-final/mobile-menu-390x844.png`.
- DOM checks: no broken images, no clipped text nodes, no horizontal document overflow, fonts loaded.
- Interaction checks: mobile navigation opens, preserves the intended chapter order, closes after selection, and reports Education as active.
- Build and worker tests: passed; 4 tests, 0 failures.

## Follow-up polish

- P3: add each future real tool to the CMS with a concise problem statement and access mode; do not fill the shelf with concepts or placeholders.
- P3: replace generic Timeline place labels only when verified human-readable place names are available.

## Pass E — cinematic playlist room (20 August 2026)

### Source truth and implementation

- Reference: `https://telugu-mass.vercel.app/`, captured at 1440 × 900 in `qa-music-reference/telugu-mass-desktop-1440x900.jpg` and 390 × 844 in `qa-music-reference/telugu-mass-mobile-390x844.jpg`.
- Final implementation: `qa-music-final/music-console-framed-final2-1440x900.jpg` and `qa-music-final/music-mobile-framed-final2-390x844.jpg`.
- Comparison: `qa-music-final/music-reference-vs-local.png`.
- Desktop console measurement: 1309.6 × 736.65 px at x 57.6; final framed y 72.14. Mobile console measurement: 331.2 × 930 px at x 22; no horizontal document overflow.

### Findings and fixes

- P2: the previous row of generic embeds had no focal image, playlist switching, or narrative hierarchy.
  - Fix: replaced it with one 16:9 cinematic console, a single visual focal point, a restrained two-tab switcher, large playlist title, and docked controls.
- P2: the YouTube Music playlist had no browsable queue.
  - Fix: added all 12 verified tracks, previous/next, shuffle, a numbered queue, current-track state, and direct selection.
- P2: the supplied YouTube Music tracks report `Video unavailable` when loaded in an embedded iframe.
  - Fix: removed the broken player state. The selected song now hands off through a normal HTTPS link to its exact YouTube Music watch URL, while Spotify retains full in-page playback.
- P2: the first desktop console was too narrow and tall compared with the source.
  - Fix: widened the section to 4vw page gutters and restored a 16:9 console ratio.
- P2: the long Spotify playlist name competed with the artwork and controls.
  - Fix: shortened the visible title to `My Spotify`; the exact playlist remains linked and embedded.
- P3: the music room needed a distinctive image without copying the source site's artwork.
  - Fix: generated an original golden-hour Telangana landscape and used it consistently as the banner and player fallback.

### Interaction and technical verification

- Playlist tabs switch between YouTube Music and the existing Spotify embed.
- The YouTube Music queue contains 12 songs; selecting item 03 updates the current track to `Those Eyes` and its exact watch URL.
- Previous, next, shuffle, queue open/close, Spotify iframe, and external full-playlist links were exercised.
- Exact Spotify iframe: `https://open.spotify.com/embed/playlist/2QbRkkKxVYTgFgfAlQFhQk`.
- Exact first-track handoff: `https://music.youtube.com/watch?v=90DKXLbzLto&list=PL3nhWsYPW4ySL0aVUhSlU_Qwx83VJkijk`.
- Desktop and mobile checks found no broken images, no horizontal overflow, and no browser console warnings or errors.
- Production build passed; Sites worker tests passed 4/4.

## Pass F — platform-neutral music room rebuild (20 August 2026)

### Comparison target

- Source visual truth: `qa-music-rebuild/02-reference-target.png`, supplied reference capture of `https://telugu-mass.vercel.app/`.
- Rendered implementation: `qa-music-rebuild/15-desktop-polished-1440x900.jpg`.
- Mobile implementation: `qa-music-rebuild/17-mobile-polished-390x844.jpg`.
- Full-view normalized comparison: `qa-music-rebuild/16-reference-vs-final.jpg`.
- Focused player evidence: `qa-music-rebuild/04-player-detail-pass-b.jpg`.
- Queue evidence: `qa-music-rebuild/08-queue-final-framed-1280x720.jpg` and `qa-music-rebuild/10-mobile-queue-390x844.jpg`.
- Desktop CSS viewport: 1440 × 900 at device scale factor 1. Source stage crop: 1791 × 753 source pixels, normalized to 1321 × 738. Implementation stage crop: 1321 × 738 pixels. Mobile CSS viewport: 390 × 844 at device scale factor 1.
- State: first playlist selected, player closed; queue-open state compared separately.

### Findings and comparison history

- P1: third-party platforms had become visible interface sections.
  - Evidence: `qa-music-rebuild/01-current-problem.png` showed a Spotify tab, a large Spotify embed, platform labels, and duplicate open-playlist actions.
  - Fix: replaced the rendered music experience with a platform-neutral custom player. The final stage contains zero iframes and no visible Spotify or YouTube text.
- P1: the earlier 870 px split player materially changed the reference hierarchy.
  - Fix: matched the reference's 480 × 166 px centered player and removed the duplicate image/video panel.
- P2: the title and player did not align with the reference at 1440 × 900.
  - Fix: matched the source measurements. Reference title top: approximately 317 px; implementation title top: 314.01 px. Reference player top: 614.8 px; implementation player top: 614.34 px.
- P2: the first rebuilt song drawer opened too high and could sit behind the fixed portfolio navigation.
  - Fix: anchored the drawer over the player with a bounded viewport height. The final desktop and mobile drawers remain inside the stage and expose a scrollable 12-song queue.
- P2: the red chapter background competed with the cinematic stage.
  - Fix: changed only the music chapter surround to the reference's near-black field while keeping the rest of the portfolio's light Scandinavian system intact.
- P2: the first rebuilt artwork pass was noticeably darker than the source.
  - Fix: reduced the stage shade and applied restrained brightness and saturation adjustment; the final image remains legible under white type.

### Required fidelity surfaces

- Fonts and typography: passed. The large display title uses the portfolio display face but now matches the reference's visual scale and placement. Small controls remain readable and are not clipped.
- Spacing and layout rhythm: passed. The stage, title, and player proportions match the source at 1440 × 900. The custom player is centered and the queue reuses its width.
- Colors and visual tokens: passed. The music chapter uses a near-black surround, warm artwork, white type, and one yellow current-track cue. No platform brand color enters the public interface.
- Image quality and asset fidelity: passed. The original Telangana banner is sharp, full-bleed, correctly cropped, and brighter without visible compression or stretching.
- Copy and content: passed. Visible copy is limited to `MUSIC I LOVE`, `Selected by Dhruvith`, one verified playlist title, its real track count/duration, song names, artists, and controls. No fake listener count or invented playlists appear.
- Interaction and accessibility: passed. The 12-song drawer, track selection, previous, next, shuffle, close, focus labels, and external full-track fallback work. The selected `Those Eyes` row resolves to its exact public watch URL.
- Responsiveness: passed. Desktop and 390 × 844 mobile have zero horizontal overflow, zero broken images, zero platform embeds, and no console warnings or errors.

### Playback contract verified

- Tracks with an approved `audioSrc` play inline through HTML Audio and use the custom timeline and transport controls.
- Tracks without `audioSrc` use the same clean play control as a normal HTTPS link to the selected public track.
- The Content Studio now exposes an `audioSrc` field for every existing track because the field is present in `public/content/portfolio.json`.
- Local audio instructions are saved in `public/audio/README.md`; no third-party audio was downloaded or copied.
- Production build passed. Sites worker tests passed 4/4.

### Remaining P3

- Playlist tabs intentionally remain hidden until a second real playlist is added. The component already renders the reference-style switcher when more than one verified playlist exists.

Pass F result: passed

## Pass G — in-page playback contract and motion polish (20 August 2026)

### Source and rendered evidence

- Source visual truth: `qa-motion-reference-footer-1440x900.png`, a fresh 1440 × 900 in-app-browser capture of the supplied `praneethreddy.work` closing scene.
- Rendered implementation: `qa-motion-final-footer-1440x900.png`, captured at the same 1440 × 900 CSS viewport and device scale factor 1.
- Full-view comparison evidence: `qa-motion-reference-vs-final.png` (source and implementation in one normalized image).
- Focused music evidence: `qa-motion-final-music-controls-1440x900.png` and `qa-motion-final-music-390x844.png`.
- Responsive closing evidence: `qa-motion-final-footer-390x844.png`.
- State: music stage with first playlist selected and queue closed; contact closing at page end.

### Findings, fixes, and post-fix evidence

- P1: tracks without a local audio source still opened an external music page.
  - Fix: removed the external-link fallback. The transport now remains a semantic button and is disabled until an approved `audioSrc` exists.
  - Evidence: browser inspection reports `playTag: BUTTON`, `playDisabled: true`, zero external links, and zero iframes inside the music chapter.
- P2: the portfolio had smooth scrolling, but all chapter reveals used the same undifferentiated movement.
  - Fix: refined Lenis timing, staggered the label/title/copy inside chapter headings, added restrained scroll-bound parallax to the music artwork, and kept the existing reduced-motion bypass.
- P2: the closing had correct metadata but no personal visual stop.
  - Fix: added an original typographic `Dhruvith.` signature, with a restrained entrance and a responsive one-column mobile arrangement.
  - Evidence: the normalized side-by-side comparison shows the reference's human closing principle adapted to the portfolio's yellow contact scene without copying its line, artwork, or signature asset.

### Required fidelity surfaces

- Fonts and typography: passed. Display and UI faces remain local, headline wrapping is unchanged, and the signature uses the existing italic Instrument Serif asset without clipped glyphs.
- Spacing and layout rhythm: passed. The desktop footer retains a wide closing pause; the mobile signature and metadata stack without overlap.
- Colors and visual tokens: passed. The contact scene remains within the established Swedish yellow/black system; the music chapter remains near-black and warm.
- Image quality and asset fidelity: passed. The existing music banner remains sharp and full bleed; the new parallax stays within its crop.
- Copy and content: passed. No new promotional filler was introduced. The only new visible copy is the owner's signature.
- Interaction and accessibility: passed. Music never opens a new tab, disabled playback has an accessible explanation, focus styling is preserved, reduced motion is honored, and desktop/mobile document overflow is zero.

### Verification

- Production build: passed.
- Sites worker tests: 4 passed, 0 failed.
- Admin production build: passed.
- Desktop music: zero iframes, zero external links, zero horizontal overflow.
- Mobile music and contact: zero horizontal overflow; no overlap in the player or signature metadata.

final result: passed
