#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <root_dir> <release_id>" >&2
  exit 1
fi

ROOT_DIR="$1"
RELEASE_ID="$2"
RELEASE_DIR="$ROOT_DIR/releases/$RELEASE_ID"
CURRENT_LINK="$ROOT_DIR/current"
LOG_FILE="$ROOT_DIR/shared/deploy.log"

[[ -d "$RELEASE_DIR" ]] || {
  echo "release dir missing: $RELEASE_DIR" >&2
  exit 1
}
[[ -f "$RELEASE_DIR/index.html" ]] || {
  echo "index.html missing: $RELEASE_DIR/index.html" >&2
  exit 1
}
[[ -d "$RELEASE_DIR/assets" ]] || {
  echo "assets missing: $RELEASE_DIR/assets" >&2
  exit 1
}
[[ -f "$RELEASE_DIR/sitemap.xml" ]] || {
  echo "sitemap.xml missing: $RELEASE_DIR/sitemap.xml" >&2
  exit 1
}

ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

mkdir -p "$(dirname "$LOG_FILE")"
echo "$(date -u +%FT%TZ) release=$RELEASE_ID status=promoted" >> "$LOG_FILE"
