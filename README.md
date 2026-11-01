# Movie Search (React + Meilisearch)

A modern movie search demo built with **Vite**, **React**, **Tailwind CSS**, and **Meilisearch Cloud**. Search ~32k TMDB movies with IMDb ratings/regions, **rule-based smart queries** (no LLM), genre/region filters, sorting, and pagination.

The original CDN HTML demos live in [`legacy/`](legacy/) for reference.

## Prerequisites

- Node.js 20+ (for `npm run seed` with `--env-file=.env`)
- A [Meilisearch Cloud](https://www.meilisearch.com/cloud) project (or any hosted Meilisearch instance)
- IMDb dataset TSV files in the project root (for enrichment):
  - `title.basics.tsv`
  - `title.ratings.tsv`
  - `title.akas.tsv`

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   | Variable | Purpose |
   |----------|---------|
   | `VITE_MEILISEARCH_HOST` | Instance URL (used by the React app) |
   | `VITE_MEILISEARCH_SEARCH_API_KEY` | **Search-only** key for the browser |
   | `VITE_MEILISEARCH_INDEX_NAME` | Index name (default: `movies`) |
   | `MEILISEARCH_HOST` | Same host as above (seed script) |
   | `MEILISEARCH_MASTER_API_KEY` | **Master** key — seed script only, never `VITE_` |

3. **Build enriched movies + reindex** (after updating IMDb TSV files)

   ```bash
   npm run reindex
   ```

   This runs `build:movies` (merges TMDB `movies.json` with IMDb TSV → `movies-enriched.json`) then seeds Meilisearch with `--force`.

   Steps separately:

   ```bash
   npm run build:movies   # ~5–15 min while streaming title.akas.tsv
   npm run seed -- --force
   ```

4. **Run the dev server**

   ```bash
   npm run dev
   ```

5. Open the URL shown in the terminal (usually `http://localhost:5173`).

## Smart search (basic NLP, no LLM)

The search bar parses keywords and applies filters/sort automatically:

| Example query | Effect |
|---------------|--------|
| `best indian action movie` | Genre Action, region India, sort by rating |
| `top rated comedy` | Comedy + highest `vote_average` |
| `latest horror` | Horror + newest release date |
| `star wars action` | Text search “star wars” + Action filter |

Logic lives in [`src/lib/parseNaturalQuery.ts`](src/lib/parseNaturalQuery.ts).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run build:movies` | Merge IMDb TSV + TMDB → `movies-enriched.json` |
| `npm run seed` | Apply index settings; import if index empty |
| `npm run reindex` | `build:movies` + forced seed |

## Security

- Never prefix `MEILISEARCH_MASTER_API_KEY` with `VITE_`. Vite exposes all `VITE_*` variables to the browser.
- Use a search-restricted API key in `VITE_MEILISEARCH_SEARCH_API_KEY`.
- Do not use the old `legacy/setup.html` pattern (master key in the browser).

## Index settings

The seed script configures:

- **Searchable:** `title`, `overview`, `genres`
- **Filterable:** `genres`, `origin_regions`, `languages`
- **Sortable:** `release_date`, `vote_average`, `num_votes`

## Data

- [`movies.json`](movies.json) — TMDB-style base dataset (~31,944 docs)
- `movies-enriched.json` — generated; adds IMDb match by title: ratings, regions, languages
- IMDb TSV files are large (~4 GB total); keep locally, not committed

Matching is by **normalized movie title** to IMDb `primaryTitle`; some TMDB titles may not match.

## Optional: local Meilisearch

```bash
docker run -d -p 7700:7700 -e MEILI_MASTER_KEY=masterKey getmeili/meilisearch:latest
```

Use `http://127.0.0.1:7700` in `.env`, then `npm run reindex`.
