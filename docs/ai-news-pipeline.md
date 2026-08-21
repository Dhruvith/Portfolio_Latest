# AI news pipeline

The portfolio publishes five source-linked AI, ML, and developer-technology items each day. OpenAI is the primary research provider. Groq runs only when the OpenAI result is missing, malformed, stale, duplicated, or has the wrong source mix.

## Local setup

1. Copy `.env.news.example` to `.env.news.local`.
2. Add `OPENAI_API_KEY` and `GROQ_API_KEY`. Keep the model defaults unless you intentionally want to change them.
3. Run `npm run news:refresh`.
4. Start the portfolio with `npm run dev` and open the AI Briefing tool.

The refresh script never sends keys to Vite or the browser. Do not use `VITE_OPENAI_API_KEY` or `VITE_GROQ_API_KEY`; variables with that prefix are bundled into client code.

## GitHub schedule

The workflow in `.github/workflows/refresh-ai-news.yml` runs every day at 08:15 in `Asia/Kolkata`. It can also be launched manually from **GitHub → Actions → Refresh AI news → Run workflow**.

Before the first run, add these repository secrets under **Settings → Secrets and variables → Actions**:

- `OPENAI_API_KEY`
- `GROQ_API_KEY`

Optional repository variables:

- `OPENAI_NEWS_MODEL` (default `gpt-5.4-mini`)
- `GROQ_NEWS_MODEL` (default `groq/compound`)

The job stages only `public/data/ai-news.json`. A successful commit triggers the existing Vercel deployment. Failed or incomplete editions exit without modifying the public feed.

## Security and editorial controls

- Secrets live only in the server-side process and GitHub encrypted secrets.
- Search is restricted to direct public URLs on X, Reddit, and Medium.
- Every published source URL must also appear in the provider's returned web-search evidence; model-only URLs are rejected.
- Source pages are treated as untrusted input; instructions inside them are ignored.
- Every edition must contain exactly five unique, recent items: two X posts, two Reddit posts, and one Medium article.
- URLs, timestamps, text lengths, topic counts, source mix, and duplicates are validated before the feed is written.
- React renders summaries as text, not injected HTML.
- The archive is append-only. Existing editions remain visible when a later refresh fails.

GitHub scheduled workflows run from the default branch. Public-repository schedules may be disabled after 60 days without repository activity, so use the manual workflow button if that happens.
