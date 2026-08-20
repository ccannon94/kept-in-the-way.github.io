#!/usr/bin/env bash
#
# update-post-dates.sh
#
# For each newly added Eleventy post passed as an argument, stamp it with "now"
# in US Eastern time:
#
#   * If the basename starts with a YYYY-MM-DD- prefix, that prefix is replaced
#     with today's Eastern date and the file is renamed via `git mv` (the slug
#     after the date is preserved).
#   * The first front-matter `date:` line is replaced with an Eleventy-compatible
#     ISO 8601 timestamp with a DST-aware offset, for example
#     "date: 2026-05-27T14:32:10-04:00".
#
# The date/time are derived from the America/New_York timezone so the offset is
# always correct. Both values can be overridden for testing via the POST_DATE
# and POST_DATETIME environment variables.
#
# Usage: update-post-dates.sh <post-file> [<post-file> ...]

set -eo pipefail

EASTERN_TZ="America/New_York"

NEW_DATE="${POST_DATE:-$(TZ="$EASTERN_TZ" date +'%Y-%m-%d')}"
NEW_DATETIME="${POST_DATETIME:-$(TZ="$EASTERN_TZ" date +'%Y-%m-%dT%H:%M:%S%z')}"

# Normalize both legacy test overrides (with a space and -0400) and the output
# from BSD/GNU date to ISO 8601 (with T and -04:00).
NEW_DATETIME="$(printf '%s' "$NEW_DATETIME" | sed -E \
  -e 's/^([0-9]{4}-[0-9]{2}-[0-9]{2})[[:space:]]+/\1T/' \
  -e 's/[[:space:]]+([+-][0-9]{2}:?[0-9]{2})$/\1/' \
  -e 's/([+-][0-9]{2})([0-9]{2})$/\1:\2/')"

if [ "$#" -eq 0 ]; then
  echo "No new posts to process."
  exit 0
fi

for file in "$@"; do
  if [ ! -f "$file" ]; then
    echo "Skipping '$file': not found (deleted later in the same push?)."
    continue
  fi

  dir="$(dirname "$file")"
  base="$(basename "$file")"

  # 1. Rewrite the leading YYYY-MM-DD- filename prefix, if one is present.
  new_base="$(printf '%s' "$base" | sed -E "s/^[0-9]{4}-[0-9]{2}-[0-9]{2}-/${NEW_DATE}-/")"
  if [ "$new_base" != "$base" ]; then
    new_path="${dir}/${new_base}"
    echo "Renaming '$file' -> '$new_path'"
    git mv "$file" "$new_path"
    file="$new_path"
  else
    echo "Filename prefix already current (or no date prefix): '$base'"
  fi

  # 2. Replace the first front-matter `date:` line, if one exists. awk is used
  #    instead of in-place sed so the script behaves the same on macOS and Linux.
  if grep -qE '^date:' "$file"; then
    echo "Setting date in '$file' to '${NEW_DATETIME}'"
    awk -v repl="date: ${NEW_DATETIME}" '
      !done && /^date:/ { print repl; done = 1; next }
      { print }
    ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
  else
    echo "WARNING: no 'date:' line found in '$file'; leaving front matter unchanged."
  fi
done
