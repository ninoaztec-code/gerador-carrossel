#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/ninoaztec-code/gerador-carrossel.git"
DEFAULT_DIR="/root/hermes-workspace/gerador-carrossel-repo"
APP_DIR="${APP_DIR:-$DEFAULT_DIR}"

if [ ! -d "$APP_DIR/.git" ] && [ -d "/root/hermes-workspace/gerador-carrossel/.git" ]; then
  APP_DIR="/root/hermes-workspace/gerador-carrossel"
fi

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout main
  git pull --ff-only origin main
else
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch main "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${CAROUSEL_API_KEY:-}" ]; then
  echo "ERRO: defina CAROUSEL_API_KEY no ambiente ou em $APP_DIR/.env"
  exit 2
fi

docker compose -f compose.vps.yml up -d --build

docker compose -f compose.vps.yml ps

node -e "fetch('http://127.0.0.1:3007/api/hermes/projects').then(async r=>{console.log('HEALTH_HTTP='+r.status); if(!r.ok) process.exit(1); console.log(await r.text())}).catch(e=>{console.error(e);process.exit(1)})"

echo "GERADOR_CARROSSEL_LOCAL=http://127.0.0.1:3007"
echo "HERMES_PROJECTS=http://127.0.0.1:3007/api/hermes/projects"
echo "STATUS=OK"
