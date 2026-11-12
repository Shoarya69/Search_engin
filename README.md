# Movie Search (React + Meilisearch / OpenSearch)

Movie search demo with **Vite**, **React**, **Tailwind**, and **either Meilisearch or OpenSearch** — chosen via `.env`. Same UI: IMDb-enriched data, smart queries (no LLM), filters, sort, pagination.

Legacy CDN demos: [`legacy/`](legacy/).

## Choose search engine

Set **both** (same value):

```env
VITE_SEARCH_ENGINE=meilisearch   # or opensearch
SEARCH_ENGINE=meilisearch        # used by npm run seed
```

| Engine | Frontend env | Seed env |
|--------|--------------|----------|
| **Meilisearch** | `VITE_MEILISEARCH_HOST`, `VITE_MEILISEARCH_SEARCH_API_KEY` | `MEILISEARCH_HOST`, `MEILISEARCH_MASTER_API_KEY` |
| **OpenSearch** | `VITE_OPENSEARCH_URL`, auth (`VITE_OPENSEARCH_USERNAME`/`PASSWORD` or `VITE_OPENSEARCH_API_KEY`) | `OPENSEARCH_URL`, `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD` |

Shared (optional): `VITE_SEARCH_INDEX_NAME` / `SEARCH_INDEX_NAME` (default `movies`).

Copy [`.env.example`](.env.example) to `.env`.

### OpenSearch dev proxy (CORS)

For local OpenSearch, use in `.env`:

```env
VITE_SEARCH_ENGINE=opensearch
VITE_OPENSEARCH_URL=/opensearch
OPENSEARCH_URL=http://localhost:9200
```

Vite proxies `/opensearch` → `OPENSEARCH_URL`. For self-signed TLS: `OPENSEARCH_INSECURE=true`.

## Setup

```bash
npm install
cp .env.example .env
# edit .env for your engine

npm run build:movies   # optional IMDb enrich → movies-enriched.json
npm run seed -- --force  # routes to Meilisearch or OpenSearch seed
npm run dev
```

## Scripts

### Index lifecycle (uses `SEARCH_ENGINE` from `.env`)

| Command | Description |
|---------|-------------|
| `npm run index:create` | Create / configure index (mappings or Meili settings) |
| `npm run index:create -- --recreate` | Drop index first, then create |
| `npm run index:status` | Ping cluster, doc count, schema summary |
| `npm run index:test` | 4 smoke tests: browse, search, top rated, filters |
| `npm run index:delete -- --force` | Delete index |
| `npm run index:reset` | delete → create → seed `--force` (full rebuild) |

Custom index name: set `SEARCH_INDEX_NAME=my_movies` in `.env` (same for seed + UI via `VITE_SEARCH_INDEX_NAME`).

### Data & app

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (+ OpenSearch proxy when configured) |
| `npm run build` | Production build |
| `npm run build:movies` | Merge IMDb TSV + TMDB JSON |
| `npm run seed` | Import documents into active engine |
| `npm run seed:meili` / `seed:opensearch` | Engine-specific seed |
| `npm run reindex` | `build:movies` + forced seed |

### Typical workflow

```bash
npm run index:status          # check connection
npm run index:create          # empty index + schema
npm run build:movies          # optional enrich
npm run seed -- --force       # load documents
npm run index:test            # verify search/sort/filter
npm run dev                   # open UI
```

## Smart search

Rule-based parsing in [`src/lib/parseNaturalQuery.ts`](src/lib/parseNaturalQuery.ts) — works with both engines via InstantSearch `facetFilters` + sort index names (`movies:vote_average:desc`).

## Architecture

- **Meilisearch:** `@meilisearch/instant-meilisearch`
- **OpenSearch:** custom InstantSearch client in [`src/lib/opensearch/instantSearchClient.ts`](src/lib/opensearch/instantSearchClient.ts) (Elasticsearch `_search` + aggregations)

## Security

- Never put Meilisearch **master** key in `VITE_*` variables.
- OpenSearch credentials in the browser are for demos only; use read-only users or a backend proxy in production.

## Data

- `movies.json` — base TMDB dataset
- `movies-enriched.json` — generated (ratings, regions, languages)
- IMDb `title.*.tsv` — local only, not committed
