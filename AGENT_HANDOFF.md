# Agent handoff: do not repeat these failures

This file is the record of optimizations and production errors on the catalog search app, and the rules that keep them fixed. Read it before changing search, NLP, Docker, or nginx.

## What this app is

One Docker image, `catalog-search:latest`, runs three processes:

- nginx on port 80 serves the React UI and proxies `/meili/` to Meilisearch and `/nlp/` to GLiNER
- Meilisearch on `127.0.0.1:7700` (not published on the host)
- GLiNER (`gliner-community/gliner_small-v2.5`) via uvicorn on `127.0.0.1:8765`

When `SEARCH_DOMAIN` is set, host nginx for that name proxies to `127.0.0.1:$APP_PORT`. Start with `bash run.sh`, not a bare `docker compose up`, because 8080 may already be taken on the VPS.

Catalog data is `catalog-data.json`. Index name is `catalog`. `category_labels` are product categories, not products. There is no separate product SKU list.

## Rules that must stay true

1. Create the InstantSearch client once with `useMemo` in `src/components/SearchExperience.tsx`. Never call `createSearchClient()` in the render body. A new client on every render makes InstantSearch search again, which calls `/parse` again. That loop already happened in production: continuous `POST /multi-search` and `POST /parse`, all HTTP 200, so it looked healthy while it was stuck.
2. Mount city, state, category, and business-type filters once. Do not render a second copy inside `lg:hidden`. CSS `hidden` still mounts the widgets, and each widget adds queries.
3. Do not search Meilisearch on every keystroke. `src/components/SmartSearchBox.tsx` waits for 3 words (`MIN_WORDS`) and a 400ms pause, or Enter. Do not go back to InstantSearch `queryHook` that calls `search()` on each change. That hook updates the query by searching.
4. Call GLiNER `POST /parse` only when the user presses Enter. Typing must not hit `/nlp/parse`.
5. `category_labels` are product categories. UI copy must say "product categories", never "products".
6. If a span matches a known category, the label is `product category` and the text is the canonical catalog name. "home appliance" and "home appliances" become `Home Appliances`. Do this in both places:
   - `nlp_api/server.py` `correct_entity` so the raw `/parse` response is already correct
   - `src/lib/nlp/catalogCategories.ts` plus `mapGlinerEntities.ts` and `parseCatalogRules.ts` so the UI filter is `category_labels:Home Appliances`
   GLiNER itself often tags categories as `product`. Do not trust that label. Do not delete the correction because the model "should" know.
7. Keep the category lists in `nlp_api/server.py` and `src/lib/nlp/catalogCategories.ts` in sync with `category_labels` in the catalog file. A new category that is only added to one file will be mislabeled again.
8. `catalog-search:latest` is a local image name. `docker-compose.yml` must keep `pull_policy: build`. Without it, Compose tries Docker Hub, prints `pull access denied ... repository does not exist`, and looks like a login failure.
9. Do not `COPY` gitignored files in the Dockerfile. `movies-enriched.json` is in `.gitignore`. The server clone does not have it. Catalog seeding uses `catalog-data.json`. The Dockerfile copies `package.json`, `catalog-data.json`, and `movies.json` only.
10. The frontend inside the image is baked by `npx vite build`. Code changes are not live until `git pull` on the server and `bash run.sh`. Restarting only the Python process does not update the UI.
11. `nlp_api` uvicorn in local dev was started without `--reload`. Python edits do nothing until that process is restarted.
12. `run.sh` `pick_port` must print status with `>&2`. The port number is the only thing allowed on stdout, because it is captured with `APP_PORT="$(pick_port ...)"`. A status line on stdout becomes part of the address and Docker reports `invalid IP address: 127.0.0.1:127.0.0.1`.
13. Do not bind this app to `127.0.0.1:8080` if that port is taken. On this VPS `qr_bussiness-app-1` owns 8080. `run.sh` moves to the next free port and rewrites the host nginx `proxy_pass`. Do not stop other projects to free 8080.
14. Do not publish Meilisearch port 7700 on the public IP, and do not put the master key in the browser. The container writes a search-only key into `/usr/share/nginx/html/runtime-config.js` at start. The browser talks to same-origin `/meili` and `/nlp`.
15. Certbot for `SEARCH_DOMAIN` fails with NXDOMAIN until DNS has an A record for that hostname pointing at the VPS. First issuance should reach this host's nginx (DNS-only / grey cloud if you use Cloudflare). A stale certbot lock with no running process is removed with `sudo rm -f /var/lib/letsencrypt/.certbot.lock`.
16. The official `getmeili/meilisearch:v1.15` binary is musl (`ld-musl-x86_64.so.1`). It is copied into Debian and pointed at `/opt/meili-libs` with `patchelf --set-rpath`. Do not overwrite Debian `/usr/lib/libgcc_s.so.1` with the musl libgcc. That breaks nginx, Python, and node.
17. Docker frontend build must stay `npx vite build`, not `npm run build`. `npm run build` runs `tsc -b`, and a clean `npm ci` fails on `vite.config.ts` with `Cannot find name 'process'` because `@types/node` is not a dependency.
18. Torch in the image is the CPU wheel (`https://download.pytorch.org/whl/cpu`). Runtime sets `HF_HUB_OFFLINE=1` and `TRANSFORMERS_OFFLINE=1`. The model is downloaded at image build into `/opt/hf`. Do not turn offline mode off to "fix" a cold start, and do not drop the model stage. The image is about 3.3 GB because of torch. That size is expected.
19. `runtime-config.js` is how one image works on any host. `meiliHost` and `nlpApiUrl` are `window.location.origin + '/meili'` and `'/nlp'`. Do not bake `localhost:7700` into the production bundle. `src/config/env.ts` `publicUrl()` turns a leading `/` into an absolute same-origin URL.
20. Changing `MEILI_MASTER_KEY` after the volume `/data` has been initialized will not unlock the old database. Set the key before the first start, or use a new volume.

## Error log and the exact fix

### 1. Docker build failed on TypeScript

`npm run build` in the image failed:

`vite.config.ts: error TS2580: Cannot find name 'process'`

Cause: `tsc -b` typechecks `vite.config.ts`, and `@types/node` is not installed.

Fix: Dockerfile web stage runs `npx vite build` with the `VITE_*` variables inline. Do not switch it back to `npm run build` unless `@types/node` is added and the lockfile updated.

### 2. Compose "pull access denied" for catalog-search

`catalog-search:latest` was set as `image:` and also `build:`. Compose tried to pull that name from Docker Hub. The repository does not exist. The build then continued and was not a login problem.

Fix: `pull_policy: build` in `docker-compose.yml`.

### 3. Server build: `movies-enriched.json` not found

`COPY package.json catalog-data.json movies.json movies-enriched.json /opt/app/` failed on the VPS with `/movies-enriched.json: not found`.

Cause: `movies-enriched.json` is gitignored, so the clone does not have it. Docker `COPY` fails if any listed file is missing.

Fix: copy only files that are in git. Catalog seed reads `catalog-data.json` when `DATA_PROFILE=catalog`.

### 4. Port 8080 already allocated

`Bind for 127.0.0.1:8080 failed: port is already allocated`

Cause: `qr_bussiness-app-1` has used `127.0.0.1:8080` for weeks. Other stacks also use 3000, 8000, 8010, 8020, 3011-3013, and a separate `meilisearch` container publishes `0.0.0.0:7700`.

Fix: `run.sh` checks `ss` and binds the next free port, then `sed`s the host nginx `proxy_pass`. Do not kill `qr_bussiness-app-1`.

### 5. `invalid IP address: 127.0.0.1:127.0.0.1`

`run.sh` printed `127.0.0.1:8080 busy, next port` on stdout inside `pick_port`. Command substitution stored that sentence plus `8081` in `APP_PORT`. Compose then tried to publish `127.0.0.1:127.0.0.1:8080 busy...`.

Fix: status echoes go to stderr (`>&2`). Only `printf '%s\n' "$port"` goes to stdout.

### 6. Certbot

First failure: `Another instance of Certbot is already running` while `ps` showed no certbot process. Stale lock.

Second failure, after the lock was gone:

`DNS problem: NXDOMAIN looking up A for <SEARCH_DOMAIN>`

The name had no public DNS record. Nginx and the container were already fine. Certificate issuance is blocked on DNS, not on the app.

Fix: Cloudflare A record `search` to the VPS IP, grey cloud for the first `certbot --nginx` run, then the same certbot command. Do not debug the app when the error says NXDOMAIN.

### 7. Infinite search and NLP loop

Production logs showed many `POST /multi-search` and `POST /parse` per second, status 200, from a phone and a desktop through Cloudflare (`172.70.*`, `162.158.*`). It was not an attacker and not a Meilisearch bug.

Cause: `SearchExperience` called `createSearchClient(env)` on every render. Enter or NLP `setParsed` re-rendered the component, InstantSearch saw a new client and searched again, the search reset the NLP effect, and `/parse` fired again.

Fix: `useMemo(() => createSearchClient(env).searchClient, [env])`. Also stop mounting the filter sidebar twice.

How to confirm it is not back: after typing stops, `/multi-search` and `/parse` stop. One 3-word pause produces one Meilisearch request and zero `/parse`. Enter produces one `/parse` and then Meilisearch. A stream of 200s after the user has stopped is this bug again.

### 8. Search fired on every letter

InstantSearch's default box calls the search client on each keystroke, and the old NLP effect called `/parse` about 350ms after each change.

Fix: a controlled input in `SearchBox.tsx`. `useSearchBox().refine` runs only after 3 words plus 400ms, or on Enter. Enter is the only path that calls `resolveQuery` / `/parse`. Fewer than 3 words leaves the previous results in place and does not request.

### 9. "home appliance" labeled product

`POST /parse` on `home appliance wholesaler in jodhpur` returned:

- `home appliance` as `product` (score about 0.73)
- `wholesaler` as `business type` (correct)
- `jodhpur` as `city` (correct)

`Home Appliances` is a `category_labels` value on businesses such as Heena Electronics and Chandra Electronic Appliances. The UI chip then said product, and a category filter was not applied.

Fix: after `predict_entities`, `correct_entity` rewrites a matching span to text `Home Appliances` and label `product category`. The same map exists in the frontend so the facet is `category_labels:Home Appliances`. Plural and singular both match (`appliances` to `appliance` in the normalizer).

`GET /` and `GET /json/version` returning 404 on uvicorn is normal. The API is `POST /parse` and `GET /health`. Those 404s are not the bug. The torch.jit and `resume_download` warnings are library warnings, not failed requests.

### 10. UI showed categories as products

Business cards counted `category_labels` as "8 products" and the dialog heading said "Products".

Fix: the card and dialog say "categories" and "Product categories". Search still returns businesses. A click opens that business's category list. Do not index one hit per category.

## Deploy checklist

On the VPS, in the repo directory:

```bash
git pull
bash run.sh
```

`run.sh` rebuilds the local image, starts it on a free localhost port, and points host nginx at that port. If only `nlp_api/server.py` changed and the container is already up, the Python process inside the container still needs a new image or a container restart. Local uvicorn on the laptop is a different process from the container.

Do not `docker compose up` by hand on port 8080. Do not `docker pull catalog-search`.
