#!/usr/bin/env python3
"""Generate the official CM-037..CM-066 image set with OpenAI Images API.

Requires OPENAI_API_KEY. Generates only missing files so it can be resumed safely.
The prompts come from /api/hermes/official-image-jobs, which is built from the
approved content plan. Output defaults to:
/root/hermes-workspace/conteudo-mago/producao-oficial/CM-XXX/NN.jpg

Optional controls for a safe test run:
  OFFICIAL_PROJECT_FILTER=CM-037
  OFFICIAL_IMAGE_MAX_JOBS=1
"""
import base64, json, os, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(os.environ.get("OFFICIAL_IMAGES_DIR", "/root/hermes-workspace/conteudo-mago/producao-oficial"))
JOBS_URL = os.environ.get("OFFICIAL_IMAGE_JOBS_URL", "http://127.0.0.1:3007/api/hermes/official-image-jobs")
OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "").strip()
HERMES_KEY = os.environ.get("HERMES_API_KEY", "").strip()
MODEL = os.environ.get("OPENAI_IMAGE_MODEL", "gpt-image-2")
QUALITY = os.environ.get("OPENAI_IMAGE_QUALITY", "medium")
SIZE = os.environ.get("OPENAI_IMAGE_SIZE", "1024x1536")
DELAY = float(os.environ.get("OPENAI_IMAGE_DELAY", "1.0"))
PROJECT_FILTER = os.environ.get("OFFICIAL_PROJECT_FILTER", "").strip().upper()
MAX_JOBS = int(os.environ.get("OFFICIAL_IMAGE_MAX_JOBS", "0") or 0)

if not OPENAI_KEY:
    print("OFFICIAL_IMAGE_GENERATION=BLOCKED")
    print("REASON=OPENAI_API_KEY_missing")
    sys.exit(2)

headers = {"Accept": "application/json"}
if HERMES_KEY:
    headers["Authorization"] = "Bearer " + HERMES_KEY
req = urllib.request.Request(JOBS_URL, headers=headers)
with urllib.request.urlopen(req, timeout=60) as r:
    jobs_doc = json.loads(r.read().decode())
assert jobs_doc.get("ok") is True, jobs_doc
jobs = jobs_doc["jobs"]
if PROJECT_FILTER:
    jobs = [job for job in jobs if str(job.get("project_id", "")).upper() == PROJECT_FILTER]
if MAX_JOBS > 0:
    jobs = jobs[:MAX_JOBS]
if not jobs:
    print("OFFICIAL_IMAGE_GENERATION=BLOCKED")
    print("REASON=no_jobs_after_filter")
    sys.exit(2)

print(f"OFFICIAL_IMAGE_JOBS={len(jobs)}")
print(f"MODEL={MODEL}")
print(f"QUALITY={QUALITY}")
print(f"SIZE={SIZE}")
if PROJECT_FILTER: print(f"PROJECT_FILTER={PROJECT_FILTER}")
if MAX_JOBS > 0: print(f"MAX_JOBS={MAX_JOBS}")

completed = 0
skipped = 0
failed = []
for idx, job in enumerate(jobs, 1):
    target = ROOT / job["filename"]
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size > 10_000:
        skipped += 1
        print(f"[{idx}/{len(jobs)}] SKIP {job['project_id']} card {job['card']} -> {target}")
        continue

    payload = json.dumps({
        "model": MODEL,
        "prompt": job["prompt"],
        "size": SIZE,
        "quality": QUALITY,
        "output_format": "jpeg",
    }, ensure_ascii=False).encode()
    image_req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=payload,
        headers={
            "Authorization": "Bearer " + OPENAI_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(image_req, timeout=300) as r:
            data = json.loads(r.read().decode())
        b64 = data.get("data", [{}])[0].get("b64_json")
        if not b64:
            raise RuntimeError("b64_json_missing")
        raw = base64.b64decode(b64)
        if len(raw) < 10_000:
            raise RuntimeError("image_too_small")
        tmp = target.with_suffix(target.suffix + ".tmp")
        tmp.write_bytes(raw)
        tmp.replace(target)
        completed += 1
        print(f"[{idx}/{len(jobs)}] OK {job['project_id']} card {job['card']} -> {target}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")
        failed.append({"project_id": job["project_id"], "card": job["card"], "http": e.code, "body": body[:1000]})
        print(f"[{idx}/{len(jobs)}] FAIL HTTP {e.code} {job['project_id']} card {job['card']}")
    except Exception as e:
        failed.append({"project_id": job["project_id"], "card": job["card"], "error": str(e)})
        print(f"[{idx}/{len(jobs)}] FAIL {job['project_id']} card {job['card']}: {e}")
    time.sleep(DELAY)

print("OFFICIAL_IMAGE_GENERATED=" + str(completed))
print("OFFICIAL_IMAGE_SKIPPED=" + str(skipped))
print("OFFICIAL_IMAGE_FAILED=" + str(len(failed)))
if failed:
    print(json.dumps(failed, ensure_ascii=False, indent=2))
    sys.exit(1)
print("OFFICIAL_IMAGE_GENERATION=OK")
