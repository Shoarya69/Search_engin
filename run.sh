#!/usr/bin/env bash
# Start the search container and the host nginx site for search.marwadihub.com.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

DOMAIN="search.marwadihub.com"
APP_PORT="${APP_PORT:-8080}"
SITE_SRC="$ROOT/deploy/nginx/${DOMAIN}.conf"
SITE_AVAIL="/etc/nginx/sites-available/${DOMAIN}"
SITE_EN="/etc/nginx/sites-enabled/${DOMAIN}"

echo "Starting Docker app on 127.0.0.1:${APP_PORT}"
APP_PORT="$APP_PORT" docker compose up -d

if ! sudo test -f "$SITE_AVAIL"; then
  echo "Installing nginx site ${DOMAIN}"
  sudo cp "$SITE_SRC" "$SITE_AVAIL"
  sudo ln -sfn "$SITE_AVAIL" "$SITE_EN"
else
  echo "Nginx site already installed (${SITE_AVAIL}); leaving it so Certbot SSL stays intact"
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
