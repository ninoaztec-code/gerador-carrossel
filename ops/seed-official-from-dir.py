#!/usr/bin/env python3
"""Seed CM-037..CM-066 using project-specific images from a VPS directory.

Expected layout:
  /root/hermes-workspace/conteudo-mago/producao-oficial/CM-037/01.jpg ... 05.jpg
  /root/hermes-workspace/conteudo-mago/producao-oficial/CM-038/01.jpg

Carousels require one image per card. Fixed posts require one image.
No image is ever borrowed from another project.
"""
import base64, json, mimetypes, os, sys, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(os.environ.get("OFFICIAL_IMAGES_DIR", "/root/hermes-workspace/conteudo-mago/producao-oficial"))
API = os.environ.get("CAROUSEL_PROJECTS_API", "http://127.0.0.1:3007/api/hermes/seed-official")
KEY = os.environ.get("HERMES_API_KEY", "")
IDS = [f"CM-{n:03d}" for n in range(37, 67)]
EXTS = (".jpg", ".jpeg", ".png", ".webp", ".avif")

def images_for(pid: str):
    folder = ROOT / pid
    if not folder.is_dir(): return []
    files = sorted(p for p in folder.iterdir() if p.suffix.lower() in EXTS)
    out=[]
    for p in files:
        mime = mimetypes.guess_type(p.name)[0] or "image/jpeg"
        out.append(f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode())
    return out

image_map={pid: images_for(pid) for pid in IDS}
missing=[pid for pid,v in image_map.items() if not v]
if missing:
    print("OFFICIAL_IMAGE_SEED=BLOCKED")
    print("MISSING_PROJECTS=" + ",".join(missing))
    print("ROOT=" + str(ROOT))
    sys.exit(2)

payload=json.dumps({"images_by_project":image_map},ensure_ascii=False).encode()
headers={"Content-Type":"application/json","Accept":"application/json"}
if KEY: headers["Authorization"]="Bearer "+KEY
req=urllib.request.Request(API,data=payload,headers=headers,method="POST")
try:
    with urllib.request.urlopen(req,timeout=900) as r:
        body=r.read().decode("utf-8","replace")
        data=json.loads(body)
        print(json.dumps(data,ensure_ascii=False,indent=2))
        assert data.get("ok") is True and data.get("completed")==30 and data.get("failed")==0, data
        print("OFFICIAL_IMAGE_SEED=OK")
        print("OFFICIAL_PROJECTS_COMPLETED=30")
except urllib.error.HTTPError as e:
    print("HTTP",e.code)
    print(e.read().decode("utf-8","replace"))
    sys.exit(1)
