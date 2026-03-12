#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <root_dir> <target_release_id>" >&2
  exit 1
fi

ROOT_DIR="$1"
TARGET_RELEASE_ID="$2"
TARGET_RELEASE_DIR="$ROOT_DIR/releases/$TARGET_RELEASE_ID"
CURRENT_LINK="$ROOT_DIR/current"
LOG_FILE="$ROOT_DIR/shared/deploy.log"

[[ -d "$TARGET_RELEASE_DIR" ]] || {
  echo "target release dir missing: $TARGET_RELEASE_DIR" >&2
  exit 1
}
[[ -f "$TARGET_RELEASE_DIR/index.html" ]] || {
  echo "index.html missing: $TARGET_RELEASE_DIR/index.html" >&2
  exit 1
}
[[ -d "$TARGET_RELEASE_DIR/assets" ]] || {
  echo "assets missing: $TARGET_RELEASE_DIR/assets" >&2
  exit 1
}
[[ -f "$TARGET_RELEASE_DIR/sitemap.xml" ]] || {
  echo "sitemap.xml missing: $TARGET_RELEASE_DIR/sitemap.xml" >&2
  exit 1
}

ln -sfn "$TARGET_RELEASE_DIR" "$CURRENT_LINK"

mkdir -p "$(dirname "$LOG_FILE")"
echo "$(date -u +%FT%TZ) release=$TARGET_RELEASE_ID status=rolled_back" >> "$LOG_FILE"
