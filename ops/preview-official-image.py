#!/usr/bin/env python3
import base64, json, os, sys, urllib.request
from pathlib import Path

pid = (sys.argv[1] if len(sys.argv) > 1 else "CM-037").upper()
card = int(sys.argv[2] if len(sys.argv) > 2 else "2")
root = Path(os.environ.get("OFFICIAL_IMAGES_DIR", "/root/hermes-workspace/conteudo-mago/producao-oficial"))
img = root / pid / f"{card:02d}.jpg"
if not img.exists():
    raise SystemExit(f"IMAGE_NOT_FOUND={img}")

data = "data:image/jpeg;base64," + base64.b64encode(img.read_bytes()).decode()
preview_id = f"{pid}-PREVIEW-{card:02d}"
payload = {
    "project_id": preview_id,
    "template": "T01",
    "title": f"Preview {pid} imagem {card}",
    "cards": [{
        "card": 1,
        "headline": "Preview",
        "body": "Imagem de validação visual",
        "image_data_url": data,
    }],
}
headers = {"Content-Type":"application/json","Accept":"application/json"}
key = os.environ.get("HERMES_API_KEY", "").strip()
if key:
    headers["Authorization"] = "Bearer " + key
req = urllib.request.Request(
    "http://127.0.0.1:3007/api/hermes/projects",
    data=json.dumps(payload).encode(), headers=headers, method="POST"
)
with urllib.request.urlopen(req, timeout=120) as r:
    resp = json.loads(r.read().decode())
assert resp.get("ok") is True, resp
print("PREVIEW_PROJECT=" + preview_id)
print("PREVIEW_IMAGE_URL=https://carrossel.magodastesouras.com.br/api/hermes/project-image?project_id=" + preview_id + "&card=1")
print("PREVIEW_RENDER_URL=" + resp["render_cards"][0]["html_url"])
