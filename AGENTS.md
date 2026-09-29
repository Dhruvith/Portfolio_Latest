# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Keep the portfolio local until the user explicitly asks to publish.

The visual direction is a light, functional Scandinavian system: warm white surfaces, direct typography, visible grids, strong Swedish blue actions, and sparing yellow highlights. Design should feel useful first and expressive through proportion, colour, and detail rather than decoration.

## Durable portfolio decisions

- Direction: semi-formal, clear, warm, functional, and technically credible. Take inspiration from Swedish reduced form and IKEA's balance of form, function, quality, accessibility, and durability without copying IKEA branding.
- No Three.js, WebGL, floating blobs, particle fields, terminal clichés, cyberpunk neon, gradient mesh, card walls, or decorative AI imagery. User-requested exceptions: the footer signature may use restrained CSS 3D depth, and the selected-project cards may use the Xevrion-inspired 3D carousel interaction. Keep both readable and reduced-motion safe; do not reintroduce unrelated 3D objects.
- Avoid glass-heavy surfaces. Use flat, high-contrast panels, visible construction, and restrained shadows.
- Motion must reveal hierarchy: masked text entrances, restrained image parallax, and project-row transitions. Avoid decorative bouncing or spinning.
- Lead the hero with Dhruvith's name, role, concrete work, and direct project/tool links. Preserve “Engineer, not developer” and “AI can code. I give it logic.” as supporting copy in the method section, not the primary introduction.
- Keep the story factual and concise: education → projects → production experience → method → tools → personal interests. Do not restore theatrical interludes, duplicate principles sections, or generic motivational copy. Keep reported performance percentages off the public page until the measurement context can accompany them.
- Use factual résumé content and label invented work as “Concept”. Do not imply ownership of entire employer platforms or expose employer IP.
- Use the exact official local SVG marks in `public/logos/` for the stack; never redraw or approximate them.
- Headline typography must remain fully visible from 320px through large desktop widths. Do not use optical `scale` transforms or clipped line wrappers on display text.
- GitHub remains a direct contact/source link. Do not add synthetic activity widgets, WakaTime, Strava, or Letterboxd. Never expose secret tokens in frontend code.
- Keep education separate from employment. Use the résumé as the source of truth for roles, dates, degree, coursework, projects, achievements, and certifications.
- Preserve the technical story order after the opening: education and foundation, selected projects and proof, production experience and stakes, engineering method, then usable tools. Personal music, travel, movies, and cricket follow only after the technical chapters.
- The visited-places map may contain many precise CMS-managed or Google Timeline-imported points. Cluster with a spatial index, render only the visible viewport, reveal details only on hover, tap, or keyboard focus, retain visible OpenStreetMap attribution, never persist raw Google place IDs, and never print a separate location list.
- Music has its own post-technical chapter. Keep the exact public Spotify playlist embed. Public YouTube Music playlist links may be rendered through YouTube's official privacy-enhanced playlist embed; never copy audio files, obscure YouTube attribution, force background playback, or place Google/Spotify secrets in frontend code.
- Avoid decorative chapter numbering. Use clear section names, narrative transitions, and meaningful counts only where the number carries data, such as map visits.
- Portfolio copy is sourced from `public/content/portfolio.json`. The authoring UI is a separate local origin at `admin.localhost:4180`; never embed edit controls or secrets in the public site.
- The CMS API must remain bound to loopback and protected by password hashing, HttpOnly sessions, SameSite cookies, exact-origin CORS, CSRF validation, rate limiting, content validation, and atomic backups. Do not expose port 8788 or deploy the local CMS unchanged.
- Use progressive enhancement and honor `prefers-reduced-motion`.
- Keep the animated footer signature, but never show a replay label or icon. Do not restore the removed Charminar photograph/card in the personal section.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites later. Before a Sites handoff, run `npm run build` and `npm run test:sites`.

## Component source rule — mandatory

- For future UI component work in this portfolio, use [Xevrion UI Lab](https://lab.xevrion.dev/) as the sole component reference/library whenever a reusable interaction or component is needed. Inspect the exact demo and source before adapting it to the portfolio; do not substitute a different component gallery or add a competing UI component library unless Dhruvith explicitly changes this rule.
- Adapt the interaction to the existing design, real content, and available project count rather than copying its demo presentation wholesale. Preserve keyboard access, visible focus, contrast, responsive behavior, and `prefers-reduced-motion`.
- This preference does not replace the project's existing React, Motion, icon, mapping, or backend dependencies where they are required for functionality; it governs new UI component choices.

## Personal-project isolation — mandatory

- This portfolio is Dhruvith's personal project. Never use the `Dhruvith-codesync` GitHub account, any CodeSync organization, repository, credential, SSH key, token, cloud project, Supabase project, Firebase project, storage bucket, domain, or billing account for it.
- Keep Git author identity and authentication repository-local. Use a dedicated personal SSH key through this repository's `core.sshCommand`; do not switch the globally active GitHub CLI account and do not push until Dhruvith explicitly authorizes it.
- Ask only for the personal GitHub username, commit email, and repository name. Never ask Dhruvith to paste a password, personal access token, private SSH key, Supabase service-role key, or other secret into chat.
- Any future backend must be created under a new personal account/project owned by Dhruvith. Store local secrets only in ignored `.env.local` files and expose only public/publishable client keys to the browser.
- Music files in `C:\Users\DELL\Desktop\Songs` are local-only source material. Do not upload, deploy, commit, or copy them into a distributable build unless Dhruvith confirms he has the necessary publishing rights and explicitly authorizes that action.
