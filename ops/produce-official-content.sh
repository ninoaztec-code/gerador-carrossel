#!/usr/bin/env bash
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

python3 ops/generate-official-images-openai.py
python3 ops/seed-official-from-dir.py

python3 - <<'PY'
import urllib.request
ids=[f"CM-{n:03d}" for n in range(37,67)]
errors=[]
for pid in ids:
    for kind,url in [
        ("studio",f"https://carrossel.magodastesouras.com.br/studio?project={pid}"),
        ("render",f"https://carrossel.magodastesouras.com.br/api/hermes/render-project?project_id={pid}"),
    ]:
        try:
            req=urllib.request.Request(url,headers={"User-Agent":"MagoProductionValidator/1.0"})
            with urllib.request.urlopen(req,timeout=45) as r:
                if r.status != 200: errors.append((pid,kind,r.status))
        except Exception as e:
            errors.append((pid,kind,str(e)))
print("OFFICIAL_HTTP_CHECKS="+str(len(ids)*2))
print("OFFICIAL_HTTP_ERRORS="+str(len(errors)))
if errors:
    print(errors)
    raise SystemExit(1)
print("OFFICIAL_PRODUCTION_HTTP=OK")
PY

echo "OFFICIAL_PRODUCTION=READY_FOR_VISUAL_REVIEW"
