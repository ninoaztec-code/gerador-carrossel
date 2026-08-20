#!/usr/bin/env python3
"""Export visual screenshots for CM-037..CM-066 for offline review.

Captures each rendered card using a headless Chromium/Chrome installed on the VPS,
creates an HTML index and a .tar.gz package. Does not modify projects.

Output defaults to /root/conteudo-mago-auditoria.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request
from pathlib import Path

BASE = os.environ.get("CAROUSEL_PUBLIC_ORIGIN", "https://carrossel.magodastesouras.com.br").rstrip("/")
OUT = Path(os.environ.get("AUDIT_OUTPUT_DIR", "/root/conteudo-mago-auditoria"))
WIDTH = int(os.environ.get("AUDIT_WIDTH", "1080"))
HEIGHT = int(os.environ.get("AUDIT_HEIGHT", "1350"))
WAIT_MS = int(os.environ.get("AUDIT_WAIT_MS", "1800"))
IDS = [f"CM-{n:03d}" for n in range(37, 67)]

# Official plan: odd-positioned content in current plan is carousel, alternating with fixed posts.
# Rather than hardcoding 5/1, probe card URLs until 404/empty after card 1, max 10.

def find_browser() -> str | None:
    explicit = os.environ.get("AUDIT_BROWSER", "").strip()
    if explicit and Path(explicit).exists():
        return explicit
    for cmd in ("chromium", "chromium-browser", "google-chrome", "google-chrome-stable"):
        p = shutil.which(cmd)
        if p:
            return p
    return None


def http_ok(url: str) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "MagoVisualAudit/1.0"})
        with urllib.request.urlopen(req, timeout=45) as r:
            return r.status == 200
    except Exception:
        return False


def screenshot(browser: str, url: str, target: Path) -> tuple[bool, str]:
    target.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        browser,
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        f"--window-size={WIDTH},{HEIGHT}",
        f"--virtual-time-budget={WAIT_MS}",
        f"--screenshot={target}",
        url,
    ]
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=90)
    ok = p.returncode == 0 and target.exists() and target.stat().st_size > 10_000
    return ok, (p.stderr or p.stdout)[-1200:]


def expected_cards(pid: str) -> list[int]:
    cards=[]
    for card in range(1, 11):
        url=f"{BASE}/api/hermes/render-project?project_id={pid}&card={card}"
        if http_ok(url):
            cards.append(card)
            continue
        if card == 1:
            return []
        break
    return cards


def build_index(records: list[dict]) -> str:
    blocks=[]
    for rec in records:
        imgs="".join(
            f'<figure><img src="{rec["project_id"]}/{Path(x["file"]).name}" loading="lazy"><figcaption>Card {x["card"]}</figcaption></figure>'
            for x in rec["cards"] if x.get("ok")
        )
        blocks.append(f'''<section><h2>{rec["project_id"]}</h2><p><a href="{rec["studio_url"]}">Studio</a> · <a href="{rec["render_url"]}">Render</a></p><div class="grid">{imgs}</div></section>''')
    return f'''<!doctype html><html><head><meta charset="utf-8"><title>Auditoria Visual Conteúdo Mago</title><style>
body{{font-family:Arial,sans-serif;background:#111;color:#eee;margin:24px}}a{{color:#d8b86a}}section{{margin:0 0 48px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}}figure{{margin:0;background:#1c1c1c;padding:10px;border-radius:10px}}img{{width:100%;height:auto;display:block;border-radius:6px}}figcaption{{padding-top:8px;color:#bbb}}
</style></head><body><h1>Auditoria Visual — CM-037 a CM-066</h1>{''.join(blocks)}</body></html>'''


def main() -> int:
    browser=find_browser()
    if not browser:
        print("VISUAL_AUDIT=BLOCKED")
        print("REASON=headless_browser_missing")
        print("CHECK=which chromium || which chromium-browser || which google-chrome")
        return 2

    print(f"AUDIT_BROWSER={browser}")
    print(f"AUDIT_OUTPUT={OUT}")
    OUT.mkdir(parents=True, exist_ok=True)
    records=[]
    failures=[]
    total=0

    for pid in IDS:
        cards=expected_cards(pid)
        if not cards:
            failures.append({"project_id":pid,"error":"render_unavailable"})
            print(f"FAIL {pid} render unavailable")
            continue
        rec={
            "project_id":pid,
            "studio_url":f"{BASE}/studio?project={pid}",
            "render_url":f"{BASE}/api/hermes/render-project?project_id={pid}",
            "cards":[],
        }
        for card in cards:
            total += 1
            url=f"{BASE}/api/hermes/render-project?project_id={pid}&card={card}"
            target=OUT/pid/f"card-{card:02d}.png"
            ok,detail=screenshot(browser,url,target)
            item={"card":card,"url":url,"file":str(target),"ok":ok,"bytes":target.stat().st_size if target.exists() else 0}
            rec["cards"].append(item)
            if ok:
                print(f"OK {pid} card {card} -> {target}")
            else:
                failures.append({"project_id":pid,"card":card,"error":detail})
                print(f"FAIL {pid} card {card}")
        records.append(rec)

    manifest={"base":BASE,"projects":len(records),"screenshots":total,"failures":failures,"records":records}
    (OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    (OUT/"index.html").write_text(build_index(records),encoding="utf-8")

    archive=OUT.parent/"conteudo-mago-auditoria.tar.gz"
    with tarfile.open(archive,"w:gz") as tf:
        tf.add(OUT,arcname=OUT.name)

    print(f"AUDIT_PROJECTS={len(records)}")
    print(f"AUDIT_SCREENSHOTS={total}")
    print(f"AUDIT_FAILURES={len(failures)}")
    print(f"AUDIT_PACKAGE={archive}")
    if failures:
        print("VISUAL_AUDIT=INCOMPLETE")
        return 1
    print("VISUAL_AUDIT=READY")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
