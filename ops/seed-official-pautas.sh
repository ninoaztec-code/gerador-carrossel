#!/usr/bin/env bash
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi
headers=(-H 'Content-Type: application/json' -H 'Accept: application/json')
if [ -n "${HERMES_API_KEY:-}" ]; then headers+=(-H "Authorization: Bearer ${HERMES_API_KEY}"); fi
response="$(curl -fsS -X POST "${headers[@]}" http://127.0.0.1:3007/api/hermes/seed-official)"
printf '%s\n' "$response" | python3 -m json.tool
printf '%s' "$response" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d.get("ok") is True and d.get("completed")==30 and d.get("failed")==0, d; print("OFFICIAL_PAUTAS_STATUS=OK"); print("OFFICIAL_PAUTAS_COMPLETED=30"); print("IMAGE_POOL_COUNT="+str(d.get("image_pool_count",0)))'
