# UI + seed scripts
FROM node:22-bookworm-slim AS web

WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
RUN VITE_SEARCH_ENGINE=meilisearch \
    VITE_MEILISEARCH_HOST=/meili \
    VITE_MEILISEARCH_SEARCH_API_KEY=runtime \
    VITE_SEARCH_INDEX_NAME=catalog \
    VITE_DATA_PROFILE=catalog \
    VITE_NLP_MODE=hybrid \
    VITE_NLP_API_URL=/nlp \
    npx vite build

# GLiNER weights (cached in the image, no download at runtime)
FROM python:3.12-slim-bookworm AS model
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /opt/nlp
COPY nlp_api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
  && pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
  && pip install --no-cache-dir -r requirements.txt
ENV HF_HOME=/opt/hf \
    HF_HUB_DISABLE_TELEMETRY=1 \
    GLINER_MODEL=gliner-community/gliner_small-v2.5
RUN python -c "from gliner import GLiNER; GLiNER.from_pretrained('gliner-community/gliner_small-v2.5')"

FROM python:3.12-slim-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends nginx curl ca-certificates libgomp1 patchelf \
  && rm -rf /var/lib/apt/lists/* \
  && rm -f /etc/nginx/sites-enabled/default

# Official image is musl; keep its loader and libgcc off the glibc paths.
COPY --from=getmeili/meilisearch:v1.15 /bin/meilisearch /usr/local/bin/meilisearch
COPY --from=getmeili/meilisearch:v1.15 /lib/ld-musl-x86_64.so.1 /lib/ld-musl-x86_64.so.1
COPY --from=getmeili/meilisearch:v1.15 /usr/lib/libgcc_s.so.1 /opt/meili-libs/libgcc_s.so.1
RUN patchelf --set-rpath /opt/meili-libs /usr/local/bin/meilisearch
COPY --from=web /usr/local/bin/node /usr/local/bin/node
COPY --from=web /src/node_modules /opt/app/node_modules
COPY --from=web /src/dist /usr/share/nginx/html
COPY scripts /opt/app/scripts
COPY package.json marwadihub-data.json movies.json /opt/app/
COPY nlp_api/server.py /opt/nlp/server.py
COPY --from=model /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=model /usr/local/bin/uvicorn /usr/local/bin/uvicorn
COPY --from=model /opt/hf /opt/hf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh /usr/local/bin/meilisearch \
  && mkdir -p /data/meili

ENV HF_HOME=/opt/hf \
    HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    GLINER_MODEL=gliner-community/gliner_small-v2.5 \
    DATA_PROFILE=catalog \
    SEARCH_INDEX_NAME=catalog \
    NLP_MODE=hybrid \
    MEILI_DB_PATH=/data/meili

EXPOSE 80
VOLUME ["/data"]
ENTRYPOINT ["/entrypoint.sh"]
