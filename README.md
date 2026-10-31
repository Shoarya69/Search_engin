# Movie Search (React + Meilisearch)

A modern movie search demo built with **Vite**, **React**, **Tailwind CSS**, and **Meilisearch Cloud**. Search ~32k movies with highlighting, genre filters, sorting, and pagination.

The original CDN HTML demos live in [`legacy/`](legacy/) for reference.

## Prerequisites

- Node.js 20+ (for `npm run seed` with `--env-file=.env`)
- A [Meilisearch Cloud](https://www.meilisearch.com/cloud) project (or any hosted Meilisearch instance)

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

3. **Seed the index** (first time, or after reset)

   ```bash
   npm run seed
   ```

   Re-import all documents even if the index is non-empty:

   ```bash
   node --env-file=.env scripts/seed-meilisearch.mjs --force
   ```

4. **Run the dev server**

   ```bash
   npm run dev
   ```

5. Open the URL shown in the terminal (usually `http://localhost:5173`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run seed` | Apply index settings and import `movies.json` |

## Security

- Never prefix `MEILISEARCH_MASTER_API_KEY` with `VITE_`. Vite exposes all `VITE_*` variables to the browser.
- Use a search-restricted API key in `VITE_MEILISEARCH_SEARCH_API_KEY`.
- Do not use the old `legacy/setup.html` pattern (master key in the browser).

## Index settings

The seed script configures:

- **Searchable:** `title`, `overview`, `genres`
- **Filterable:** `genres`
- **Sortable:** `release_date`

## Data

[`movies.json`](movies.json) is a TMDB-style dataset at the repo root (~31,944 documents).

Optional: set `MOVIES_JSON_PATH` in `.env` to point to another JSON file.

## Optional: local Meilisearch

For local development without Cloud:

```bash
docker run -d -p 7700:7700 -e MEILI_MASTER_KEY=masterKey getmeili/meilisearch:latest
```

Use `http://127.0.0.1:7700` as host and the same keys in `.env`, then run `npm run seed`.
