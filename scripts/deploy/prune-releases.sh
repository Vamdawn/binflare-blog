#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "usage: $0 <releases_dir> [keep_count]" >&2
  exit 1
fi

RELEASES_DIR="$1"
KEEP_COUNT="${2:-10}"

if [[ ! -d "$RELEASES_DIR" ]]; then
  echo "releases dir missing: $RELEASES_DIR" >&2
  exit 1
fi

if [[ ! "$KEEP_COUNT" =~ ^[0-9]+$ ]] || (( KEEP_COUNT <= 0 )); then
  echo "invalid keep_count: $KEEP_COUNT (must be a positive integer)" >&2
  exit 1
fi

shopt -s nullglob
RELEASE_DIRS=()
while IFS= read -r dir_name; do
  RELEASE_DIRS+=("$dir_name")
done < <(
  for entry in "$RELEASES_DIR"/*; do
    [[ -d "$entry" ]] || continue
    basename "$entry"
  done | sort
)

TOTAL="${#RELEASE_DIRS[@]}"
if (( TOTAL <= KEEP_COUNT )); then
  exit 0
fi

DELETE_COUNT=$((TOTAL - KEEP_COUNT))
for ((i = 0; i < DELETE_COUNT; i++)); do
  rm -rf "$RELEASES_DIR/${RELEASE_DIRS[$i]}"
done
