# AsiaHub Workspace — Seven Craft editors

Premium, responsive, browser-based workspace at **https://workspace.asiahub.id**. A separate static Nginx image serves each editor. The workspace Nginx routes all editors on the **same origin** with paths under `/` (same-origin iframe shell, with direct upstream editor routes). An existing AutoDev gateway must handle TLS and any access controls.

## Editor registry

| Path | Compose service | Upstream | Pinned web release |
|---|---|---|---|
| `/deckcraft/` | `deckcraft-web:8080` | https://github.com/storytold/deckcraft | `v0.11.1` |
| `/wordcraft/` | `wordcraft-web:8080` | https://github.com/storytold/wordcraft | `v0.11.0` |
| `/pdfcraft/` | `pdfcraft-web:8080` | https://github.com/storytold/pdfcraft | `v0.14.0` |
| `/gridcraft/` | `gridcraft-web:8080` | https://github.com/storytold/gridcraft | `v0.13.0` |
| `/photocraft/` | `photocraft-web:8080` | https://github.com/storytold/photocraft | `v0.17.0` |
| `/filmcraft/` | `filmcraft-web:8080` | https://github.com/storytold/filmcraft | `v0.14.0` |
| `/vectorcraft/` | `vectorcraft-web:8080` | https://github.com/storytold/vectorcraft | `v0.18.0` |

All upstream packages are loaded from GitHub Releases by `Dockerfile.craft`, checked against **SHA256SUMS.txt**, then served by Nginx. We don't compile Rust on the VPS or vendor upstream code. Avoid auto-updating untested upstream versions; bump a corresponding `*_VERSION` in `.env` deliberately and re-run smoke/UAT. Official static releases use relative URLs. The version in `.env.example` is the default for this snapshot.

## Architecture

```text
Android / laptop  https://workspace.asiahub.id
        |
        v
AutoDev HTTPS gateway (existing, configure outside this repository)
        |
        v
workspace:8080 (Nginx static premium landing + seven prefix routes)
   ├── /             => portal HTML/CSS/JS
   ├── /deckcraft/   => AsiaHub embedded shell, raw editor /deckcraft/editor/
   ├── /wordcraft/   => AsiaHub embedded shell, raw editor /wordcraft/editor/
   ├── /pdfcraft/    => pdfcraft-web:8080/
   ├── /gridcraft/   => gridcraft-web:8080/
   ├── /photocraft/  => photocraft-web:8080/
   ├── /filmcraft/   => filmcraft-web:8080/
   └── /vectorcraft/ => vectorcraft-web:8080/
```

## AutoDev setup and UAT

```sh
cp .env.example .env
# ensure external network autodev-net exists (normally created by AutoDev)
docker network inspect autodev-net >/dev/null 2>&1 || docker network create autodev-net
docker compose up -d --build
docker compose ps
sh scripts/smoke-test.sh
```

Gateway route: **`workspace.asiahub.id` → `workspace:8080`** on `autodev-net`, HTTPS enabled; or map to `127.0.0.1:8877` from a host-level reverse proxy. Do not create seven separate domain routes in the outer gateway: `workspace` handles the context paths. If using AutoDev's source importer, import this entire repo (PR branch for UAT), preserve `docker-compose.yml`, and point the gateway at the workspace service.

Sanity checks before deployment: `npm test`, `node --check public/assets/app.js`, `nginx -t` with the supplied configs in containers, then Docker build and real browser UAT. `scripts/smoke-test.sh` expects the complete stack running, verifies each context path and 308 redirect, and verifies PhotoCraft's `app/parts.txt`.

## Special handling

- **PhotoCraft** packages its web WASM as compressed `.part-*` assets. Serve these as exact bytes without `Content-Encoding` and without gzip recompression. Its unversioned `app/photocraft-web.js` and `app/parts.txt` must revalidate (no-cache). All are provided by `nginx/editor.conf`.
- **FilmCraft** can use WebCodecs, WebGPU, OPFS, and browser file handles; editing and exporting large media on Android may be constrained by RAM/codec support. UAT on real devices with short MP4 before trying large projects. Its browser recovery is stored locally in OPFS, not on the VPS.
- **VectorCraft** web release may include a `fonts/` folder. The static site is copied fully; do not omit it.
- WebGPU requires HTTPS or localhost. Most editors fall back to WebGL2; performance depends on the client device, not server GPU. Check each app on Android Chrome and desktop Chrome.
- This is a **portal**, not a centralized file manager or shared editing service. File Open/Save is handled by each editor/browser; no database/Redis/server file storage. Do not close tabs before saving and downloading. A browser may clear local storage/OPFS independently of server-side Docker volumes.
- Independent Craft repositories are MIT/Apache-2.0 licensed; their **ArtCraft brand assets have separate restrictions**. This landing uses an original AsiaHub Workspace SVG mark, and does not rebrand or imply official endorsement by upstream projects.

## Extending beyond seven

Add a new editor in `docker-compose.yml`, `Dockerfile.craft` allowlist, `nginx/workspace.conf` (`/{app}` redirect and `/{app}/` proxy), and one card in `public/index.html`; update the smoke and unit tests. Keep the upstream static web assets unchanged, with relative URLs and hash-sensitive caching.

## Files and licenses

This repository's original landing page and original workspace logo are AsiaHub implementation assets. Upstream editor images, when downloaded in the image build, retain their own license and notice files. The seven Craft projects remain independent upstream projects.

## Shared editor shell — Phase 1

All seven links open a minimal AsiaHub Workspace shell at `/<app>/`, with back navigation, a new-tab option, and fullscreen/focus mode. The actual official editor is proxied at `/<app>/editor/` on the **same origin**, so each editor's relative WASM/JS assets continue to work. Query parameters like `?blank` or PdfCraft's `?file=` are forwarded. The existing homepage and Docker Compose services remain unchanged.

No login, storage, sidebar, fake auto-save, or file manager is provided. All Craft editor file-open and save/download workflows remain intact; **download/export before leaving**. The host does not use `?host=parent` until an authenticated storage integration is built. Browser native fullscreen exits via Esc; if denied, the UI falls back to a viewport focus mode with a visible exit button.

### Phase 2 (architecture proposal, not implemented)

Add authentication at the AutoDev gateway, RBAC and audit in a same-origin file API, S3-compatible AsiaHub Storage for file bytes, a metadata/version table, and per-user scoped access. Where a Craft app provides a `host=parent` save/open bridge, adapt it only after implementing atomic saves, conflict handling, upload limits and save acknowledgements. Do not enable host mode without a persistence backend. Protect the raw editor paths as well as the shell.
