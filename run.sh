#!/usr/bin/env bash
# Start the search container and optional host nginx (set SEARCH_DOMAIN).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

DOMAIN="${SEARCH_DOMAIN:-}"
REQUESTED_PORT="${APP_PORT:-8080}"
SITE_SRC="$ROOT/deploy/nginx/catalog-search.conf"
SITE_AVAIL="/etc/nginx/sites-available/${DOMAIN:-catalog-search}"
SITE_EN="/etc/nginx/sites-enabled/${DOMAIN:-catalog-search}"

pick_port() {
  local port="$1"
  local end=$((port + 50))
  while [ "$port" -le "$end" ]; do
    if ! ss -ltnH "sport = :${port}" 2>/dev/null | grep -q .; then
      printf '%s\n' "$port"
      return 0
    fi
    echo "127.0.0.1:${port} busy, next port" >&2
    port=$((port + 1))
  done
  echo "No free port between ${1} and ${end}" >&2
  return 1
}

current="$(docker compose port app 80 2>/dev/null | sed -n 's/.*://p' || true)"
if [ -n "$current" ]; then
  APP_PORT="$current"
  echo "Container already on 127.0.0.1:${APP_PORT}"
else
  APP_PORT="$(pick_port "$REQUESTED_PORT")"
fi

echo "Starting Docker app on 127.0.0.1:${APP_PORT}"
APP_PORT="$APP_PORT" docker compose up -d

if [ -z "$DOMAIN" ]; then
  echo "App: http://127.0.0.1:${APP_PORT}"
  echo "Set SEARCH_DOMAIN to configure host nginx and TLS (e.g. SEARCH_DOMAIN=search.example.com bash run.sh)"
  exit 0
fi

SITE_AVAIL="/etc/nginx/sites-available/${DOMAIN}"
SITE_EN="/etc/nginx/sites-enabled/${DOMAIN}"

if ! sudo test -f "$SITE_AVAIL"; then
  echo "Installing nginx site ${DOMAIN}"
  sed -e "s/__APP_PORT__/${APP_PORT}/g" -e "s/__SEARCH_DOMAIN__/${DOMAIN}/g" "$SITE_SRC" | sudo tee "$SITE_AVAIL" >/dev/null
  sudo ln -sfn "$SITE_AVAIL" "$SITE_EN"
else
  echo "Pointing nginx at 127.0.0.1:${APP_PORT} (SSL config left as-is)"
  sudo sed -i -E "s#proxy_pass http://127.0.0.1:[0-9]+;#proxy_pass http://127.0.0.1:${APP_PORT};#" "$SITE_AVAIL"
  sudo ln -sfn "$SITE_AVAIL" "$SITE_EN"
fi

sudo nginx -t
sudo systemctl enable nginx
if sudo systemctl is-active --quiet nginx; then
  sudo systemctl reload nginx
else
  sudo systemctl start nginx
fi

if ! sudo test -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"; then
  if ! command -v certbot >/dev/null 2>&1; then
    echo "Installing certbot"
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
  fi
  echo "Requesting Let's Encrypt certificate for ${DOMAIN}"
  sudo certbot --nginx \
    -d "$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --register-unsafely-without-email \
    --redirect
fi

echo "App:  http://127.0.0.1:${APP_PORT}"
echo "Site: https://${DOMAIN}"