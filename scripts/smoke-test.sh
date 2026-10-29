#!/bin/sh
set -eu
base="${1:-http://127.0.0.1:${WORKSPACE_PORT:-8877}}"
for path in / /assets/styles.css /assets/app.js /assets/editor.js /assets/editor.css /assets/workspace-mark.svg /deckcraft/ /wordcraft/ /pdfcraft/ /gridcraft/ /photocraft/ /filmcraft/ /vectorcraft/; do
  printf 'checking %-24s ' "$path"
  curl --fail --silent --show-error --max-time 45 -o /dev/null "$base$path"
  echo OK
done
for app in deckcraft wordcraft pdfcraft gridcraft photocraft filmcraft vectorcraft; do
  curl --fail --silent --show-error --max-time 30 "$base/$app/" | grep -q 'id="craft-frame"' || {
    echo "FAILED: $app did not return editor shell" >&2; exit 1;
  }
  curl --fail --silent --show-error --max-time 45 "$base/$app/editor/" | grep -Eqi '<html' || {
    echo "FAILED: $app upstream editor HTML did not load" >&2; exit 1;
  }
  status="$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$base/$app")"
  [ "$status" = 308 ] || { echo "FAILED: /$app redirect got $status" >&2; exit 1; }
done
# PhotoCraft requires split, pre-gzipped WASM assets.
curl --fail --silent --show-error --max-time 20 "$base/photocraft/editor/app/parts.txt" | grep -q 'photocraft-parts' || {
  echo 'FAILED: PhotoCraft parts manifest is missing' >&2; exit 1;
}
echo 'Workspace 7-app smoke test PASSED'
