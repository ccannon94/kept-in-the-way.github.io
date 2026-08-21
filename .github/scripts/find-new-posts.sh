#!/usr/bin/env bash

# Print posts that are being introduced to the default branch for the first
# time. A path reported as "added" is ignored when the same date-independent
# post slug already appears anywhere in the branch's earlier history.

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: find-new-posts.sh <before-sha> <after-sha>" >&2
  exit 2
fi

before="$1"
after="$2"
has_history=true

if [ "$before" = "0000000000000000000000000000000000000000" ]; then
  before="$(git hash-object -t tree /dev/null)"
  has_history=false
elif [ "$(git cat-file -t "$before")" != "commit" ]; then
  has_history=false
fi

post_slug() {
  basename "$1" | sed -E \
    -e 's/^[0-9]{4}-[0-9]{2}-[0-9]{2}-//' \
    -e 's/\.(md|markdown)$//'
}

while IFS= read -r file; do
  slug="$(post_slug "$file")"
  seen_before=false

  if [ "$has_history" = true ]; then
    while IFS= read -r historical_file; do
      case "$historical_file" in
        posts/*.md|posts/*.markdown|_posts/*.md|_posts/*.markdown)
          if [ "$(post_slug "$historical_file")" = "$slug" ]; then
            seen_before=true
            break
          fi
          ;;
      esac
    done < <(git log --format= --name-only "$before" -- posts/ _posts/)
  fi

  if [ "$seen_before" = false ]; then
    printf '%s\n' "$file"
  else
    echo "Ignoring previously published post: $file" >&2
  fi
done < <(
  git diff --find-renames=20% --name-only --diff-filter=A \
    "$before" "$after" \
    | grep -E '^posts/.*\.(md|markdown)$' || true
)
