#!/usr/bin/env bash
set -euo pipefail

AUDIT_DIR="${VISUAL_AUDIT_DIR:-/root/conteudo-mago-auditoria}"
REPO_DIR="${REPO_DIR:-/opt/gerador-carrossel}"
TARGET_DIR="$REPO_DIR/visual-audit-snapshots"

if [ ! -d "$AUDIT_DIR" ]; then
  echo "VISUAL_AUDIT_PUBLISH=BLOCKED"
  echo "REASON=audit_dir_missing:$AUDIT_DIR"
  exit 1
fi

cd "$REPO_DIR"
rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"

count=0
for n in $(seq -w 37 66); do
  project="CM-0${n}"
  src="$AUDIT_DIR/$project"
  [ -d "$src" ] || continue
  mkdir -p "$TARGET_DIR/$project"
  for img in "$src"/card-*.png; do
    [ -f "$img" ] || continue
    cp "$img" "$TARGET_DIR/$project/"
    count=$((count+1))
  done
done

if [ "$count" -eq 0 ]; then
  echo "VISUAL_AUDIT_PUBLISH=BLOCKED"
  echo "REASON=no_screenshots_found"
  exit 1
fi

git add visual-audit-snapshots
if git diff --cached --quiet; then
  echo "VISUAL_AUDIT_FILES=$count"
  echo "VISUAL_AUDIT_PUBLISH=ALREADY_CURRENT"
  exit 0
fi

git commit -m "Publish Conteudo Mago visual audit snapshots"
git push origin HEAD:main

echo "VISUAL_AUDIT_FILES=$count"
echo "VISUAL_AUDIT_PUBLISH=OK"
echo "VISUAL_AUDIT_COMMIT=$(git rev-parse HEAD)"
