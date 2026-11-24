# Catalog Search

Business catalog search demo. The page lists **businesses**. A search for a product or a category returns the businesses that carry it. Opening a business shows the **product categories** inside it, not a separate product hit.

The UI is Vite, React, and Tailwind. Search is Meilisearch. Optional natural-language parsing is a small Python API (GLiNER) that runs only when you press Enter.

An older movie demo is still in the repo (`DATA_PROFILE=movies`). The default path below is the catalog.

## What a record is

| Thing | Where it lives | What it means |
|---|---|---|
| Business | `businesses.json`, and the smaller `catalog-data.json` used by seed | A shop or service. This is a search hit. |
| Product category | `category_labels` on a business | A label such as `Home Appliances` or `Laptops`. This is not a product. |
| Product | `products.json` | A sellable item. It points at a business with `business_id`. The current index does not store one document per product. |

`category_labels` examples: Electronics, Home Appliances, Laptops, Mobiles, Air Conditioners.

GLiNER often tags a category phrase as `product`. `nlp_api/server.py` rewrites a known category after inference. `home appliance` and `home appliances` become the label `product category` and the text `Home Appliances`. The same list is in `src/lib/nlp/catalogCategories.ts`. If you add a category to the data, add it in both files.

## How search behaves

- One or two words do not call Meilisearch. The previous results stay on screen.
- Three words, then a short pause, run Meilisearch only. NLP is not called.
- Enter runs NLP once, then refreshes the results with the parsed filters (city, state, category, business type).
- Click a business to see its categories.

Do not search on every keystroke. `src/components/SearchExperience.tsx` must create the Meilisearch client once with `useMemo`. A new client on every render makes InstantSearch search again, which calls `/parse` again.

## Run it on your machine

Needs Node 22, a Meilisearch server, and Python 3.12 if you want Enter to use GLiNER.

```bash
npm install
cp .env.example .env
```

Catalog values:

```env
VITE_SEARCH_ENGINE=meilisearch
SEARCH_ENGINE=meilisearch
VITE_DATA_PROFILE=catalog
DATA_PROFILE=catalog
VITE_SEARCH_INDEX_NAME=catalog
SEARCH_INDEX_NAME=catalog

VITE_MEILISEARCH_HOST=http://localhost:7700
VITE_MEILISEARCH_SEARCH_API_KEY=your_search_key
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_API_KEY=your_master_key

VITE_NLP_MODE=hybrid
VITE_NLP_API_URL=/nlp
NLP_API_URL=http://127.0.0.1:8765
```

`VITE_MEILISEARCH_SEARCH_API_KEY` is the search-only key. Do not put the master key in any `VITE_` variable. The browser can read those.

```bash
npm run seed -- --force
npm run nlp:serve
npm run dev
```

Vite proxies `/nlp` to `NLP_API_URL`. Open the URL Vite prints.

`POST /parse` on the NLP process accepts `{ "query": "..." }` and returns entities. `GET /` on that process is 404. Health is `GET /health`.

Seed reads `catalog-data.json` when `DATA_PROFILE=catalog`. `businesses.json` and `products.json` are the larger source files. They are not what `npm run seed` imports unless you point `CATALOG_JSON_PATH` at one of them. Pointing it at `products.json` would index products as if they were businesses. Do not do that without a new document shape.

## Run it as one image

`bash run.sh` builds `catalog-search:latest` and starts it. Inside the container, nginx serves the UI and proxies `/meili/` and `/nlp/`. Meilisearch and GLiNER listen on localhost inside the container. They are not published on the host.

The image name is local. Compose is set to `pull_policy: build` so it does not try to pull `catalog-search` from Docker Hub.

`run.sh` binds `127.0.0.1` and, if 8080 is taken, the next free port. Status text from the port picker goes to stderr. Only the port number may go to stdout. With `SEARCH_DOMAIN` set, host nginx for that name is updated to the chosen port. The site needs a public DNS A record before Certbot can issue a certificate. `NXDOMAIN` means the name is missing, not that the app failed.

The first container start seeds the catalog index. The Meilisearch database stays in the `meili_data` volume. Set `MEILI_MASTER_KEY` before that first start. Changing it later does not unlock the old volume.

UI and Python changes are baked into the image. On a server they show up after `git pull` and `bash run.sh`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | UI, with the `/nlp` proxy |
| `npm run nlp:serve` | GLiNER on `127.0.0.1:8765` |
| `npm run seed -- --force` | Load the active dataset into the active engine |
| `npm run index:status` | Check the engine and document count |
| `npm run index:create` | Create the index settings |
| `npm run index:delete -- --force` | Delete the index |
| `npm run index:reset` | Delete, create, and seed |
| `bash run.sh` | Build the image, start it, and attach host nginx |

`SEARCH_ENGINE=opensearch` is still wired through `scripts/seed.mjs` and `src/lib/opensearch/instantSearchClient.ts`. Local OpenSearch uses `VITE_OPENSEARCH_URL=/opensearch` so Vite can proxy it.

## Layout

- `src/components/SmartSearchBox.tsx` decides when Meilisearch and NLP run
- `src/lib/nlp/` turns a query into filters
- `nlp_api/server.py` is the GLiNER service
- `scripts/seed-meilisearch.mjs` writes the index
- `Dockerfile` and `docker/entrypoint.sh` build the single image
- `deploy/nginx/catalog-search.conf` is the host site template (`__SEARCH_DOMAIN__`, `__APP_PORT__`)
- `AGENT_HANDOFF.md` is the list of production failures and the rules that keep them fixed
