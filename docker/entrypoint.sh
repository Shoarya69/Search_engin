#!/bin/sh
set -eu

export MEILI_MASTER_KEY="${MEILI_MASTER_KEY:-meili-demo-master-key}"
export MEILI_ENV="${MEILI_ENV:-production}"
export MEILI_HTTP_ADDR="${MEILI_HTTP_ADDR:-127.0.0.1:7700}"
export MEILI_DB_PATH="${MEILI_DB_PATH:-/data/meili}"
export MEILI_NO_ANALYTICS="${MEILI_NO_ANALYTICS:-true}"
export DATA_PROFILE="${DATA_PROFILE:-catalog}"
export SEARCH_INDEX_NAME="${SEARCH_INDEX_NAME:-catalog}"
export SEARCH_ENGINE=meilisearch
export NLP_MODE="${NLP_MODE:-hybrid}"
export HF_HOME="${HF_HOME:-/opt/hf}"
export HF_HUB_OFFLINE=1
export TRANSFORMERS_OFFLINE=1
export GLINER_MODEL="${GLINER_MODEL:-gliner-community/gliner_small-v2.5}"

mkdir -p "$MEILI_DB_PATH" /var/log/nginx /usr/share/nginx/html

echo "Starting Meilisearch on ${MEILI_HTTP_ADDR}"
meilisearch &

echo "Starting GLiNER API"
cd /opt/nlp
uvicorn server:app --host 127.0.0.1 --port 8765 &

i=0
until curl -sf "http://127.0.0.1:7700/health" >/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "Meilisearch did not become healthy" >&2
    exit 1
  fi
  sleep 1
done

python3 << 'PY'
import json, os, urllib.request

master = os.environ["MEILI_MASTER_KEY"]
req = urllib.request.Request(
    "http://127.0.0.1:7700/keys",
    headers={"Authorization": f"Bearer {master}"},
)
with urllib.request.urlopen(req, timeout=30) as resp:
    payload = json.load(resp)

search_key = None
for item in payload.get("results", []):
    name = (item.get("name") or "").lower()
    actions = item.get("actions") or []
    if "search" in name or actions == ["search"]:
        search_key = item.get("key")
        break
if not search_key:
    raise SystemExit("Could not find Meilisearch search API key")

config = {
    "searchEngine": "meilisearch",
    "indexName": os.environ.get("SEARCH_INDEX_NAME", "catalog"),
    "meiliSearchKey": search_key,
    "nlpMode": os.environ.get("NLP_MODE", "hybrid"),
    "dataProfile": os.environ.get("DATA_PROFILE", "catalog"),
}
blob = json.dumps(config)
js = (
    "window.__RUNTIME_CONFIG__ = Object.assign("
    + blob
    + ", { meiliHost: window.location.origin + '/meili', nlpApiUrl: window.location.origin + '/nlp' });\n"
)
path = "/usr/share/nginx/html/runtime-config.js"
with open(path, "w", encoding="utf-8") as fh:
    fh.write(js)
print("Wrote runtime config (search key only, master key stays on the server)")
PY

export MEILISEARCH_HOST="http://127.0.0.1:7700"
export MEILISEARCH_MASTER_API_KEY="$MEILI_MASTER_KEY"
cd /opt/app
echo "Seeding index ${SEARCH_INDEX_NAME} (${DATA_PROFILE})"
node scripts/seed-meilisearch.mjs

echo "Warming GLiNER model"
(
  i=0
  until curl -sf "http://127.0.0.1:8765/health" >/dev/null; do
    i=$((i + 1))
    if [ "$i" -gt 90 ]; then
      echo "NLP API did not become healthy" >&2
      exit 0
    fi
    sleep 1
  done
  curl -sf -X POST "http://127.0.0.1:8765/parse" \
    -H "Content-Type: application/json" \
    -d '{"query":"cafe in mumbai"}' >/dev/null \
    && echo "GLiNER ready" \
    || echo "GLiNER warmup failed; first search will load the model"
) &

echo "Listening on :80"
exec nginx -c /etc/nginx/nginx.conf -g "daemon off;"
