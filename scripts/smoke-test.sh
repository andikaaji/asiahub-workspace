#!/bin/sh
set -eu
base="${1:-http://127.0.0.1:${WORKSPACE_PORT:-8877}}"
for path in / /assets/styles.css /assets/app.js /deckcraft/ /wordcraft/ /pdfcraft/; do
  printf 'checking %-20s ' "$path"
  curl --fail --silent --show-error --max-time 20 -o /dev/null "$base$path"
  echo OK
done
for path in deckcraft wordcraft pdfcraft; do
  curl --fail --silent --show-error --max-time 20 "$base/$path/" | grep -qi '<html' || {
    echo "FAILED: $path did not serve an editor HTML document" >&2; exit 1;
  }
done
printf 'checking redirect to /deckcraft/ '
status="$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 20 "$base/deckcraft")"
[ "$status" = '308' ] || { echo "FAILED: $status" >&2; exit 1; }
echo OK
echo 'Workspace smoke test PASSED'
