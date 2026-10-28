# AsiaHub Workspace

Browser-first launchpad for three independent Craft editors, presented through **one domain and three same-origin context paths**.

| URL | Service | Upstream project | Web release |
|---|---|---|---|
| `https://workspace.asiahub.id/` | `workspace:8080` | This portal | local |
| `https://workspace.asiahub.id/deckcraft/` | `deckcraft-web:8080` | [DeckCraft](https://github.com/storytold/deckcraft) | `v0.11.1` |
| `https://workspace.asiahub.id/wordcraft/` | `wordcraft-web:8080` | [WordCraft](https://github.com/storytold/wordcraft) | `v0.11.0` |
| `https://workspace.asiahub.id/pdfcraft/` | `pdfcraft-web:8080` | [PdfCraft](https://github.com/storytold/pdfcraft) | `v0.14.0` |

## Architecture

```text
Android / desktop browser
  https://workspace.asiahub.id
     |
     v
Existing AutoDev HTTPS gateway (auth / TLS configured separately)
     |
     v
workspace (Nginx :8080) ── /          -> Portal HTML/CSS/JS
        |                ├─ /deckcraft/ -> deckcraft-web:8080/
        |                ├─ /wordcraft/ -> wordcraft-web:8080/
        |                └─ /pdfcraft/  -> pdfcraft-web:8080/
     autodev-net (existing external Docker network)
```

The editor applications are **prebuilt upstream WASM static sites**, not Node services and not headless desktop sessions. Their releases are downloaded and verified against upstream `SHA256SUMS.txt` during Docker build. The three browserside apps use relative asset URLs, and the proxy strips each context path before forwarding requests. No database, Redis or GPU server required for this phase.

## AutoDev import / VPS deployment

1. Import this GitHub branch/ZIP into AutoDev. Repository files, `Dockerfile`, `Dockerfile.craft`, `docker-compose.yml`, and `.env.example` must remain in the root.
2. Set the environment in **`.env.example` before importing** (AutoDev normally copies it to `.env`); defaults are shown below.
3. On the AutoDev VPS, confirm the external network exists (or create once):

   ```sh
   docker network inspect autodev-net >/dev/null 2>&1 || docker network create autodev-net
   ```

4. Launch from `/project/asiahub-workspace`:

   ```sh
   cp -n .env.example .env
   docker compose up -d --build
   docker compose ps
   sh scripts/smoke-test.sh
   ```

5. Configure the **existing AutoDev gateway** to proxy HTTPS host `workspace.asiahub.id` to service `workspace:8080` on `autodev-net` (or host `127.0.0.1:8877` if routing from the VPS host). Do **not** add three public domains. Only the portal is exposed on loopback; editor services have no published host ports.
6. Ensure DNS for `workspace.asiahub.id` targets the VPS, TLS certificate is valid, and gateway authentication/access policy is applied before exposing it to the Internet.

`.env.example`:

```dotenv
WORKSPACE_PORT=8877
DECKCRAFT_VERSION=0.11.1
WORDCRAFT_VERSION=0.11.0
PDFCRAFT_VERSION=0.14.0
```

If AutoDev changes build or Compose settings, preserve the context prefixes and external `autodev-net`. **Do not publish editor container ports** to the public internet.

## How local file editing works

1. Open `workspace.asiahub.id` from Android tablet, mobile or desktop.
2. Choose WordCraft, DeckCraft or PdfCraft.
3. Use the editor's built-in **File > Open** picker to select DOCX, PPTX or PDF from the device.
4. Save/export through the editor. Browser downloads (and platform-specific file save dialogs) send the updated file **to the device**, not the VPS.

There is **no server-side document storage, login, autosave or shared file browser** in this phase. The existing AutoDev gateway should restrict who can reach the editors. WordCraft and PdfCraft support their `?host=parent` bridge for a future same-origin portal / S3 storage integration, but this starter does not wire that bridge yet. DeckCraft may need its own API / bridge enhancements for future server persistence.

## Validation / troubleshooting

```sh
node --version
npm test                         # no dependency install needed
node --check public/assets/app.js
sh -n scripts/smoke-test.sh
docker compose config           # config only, no build
nginx -t                        # if running on a host with matching nginx configuration
sh scripts/smoke-test.sh       # requires running containers
```

If editors load blank: check browser developer console for WebGPU/WebGL2 availability and WASM MIME (`application/wasm`). Open `/deckcraft/?webgl` or `/wordcraft/?webgl` to force WebGL2 where supported. For large files, editing runs in browser memory and may use significant RAM on Android.

If Docker image fails downloading a release: confirm outbound HTTPS to GitHub, correct version in `.env.example`, exact `*-web-<version>.zip` and `SHA256SUMS.txt` assets in that upstream release. Do not skip checksum verification.

### Content ownership and security

The portal is a custom AsiaHub implementation. DeckCraft, WordCraft and PdfCraft are upstream open-source applications under their own license terms. ArtCraft names and logos are separately protected; do not imply endorsement or reuse the original ArtCraft trademarks in your fork's own brand. The portal uses an original AsiaHub-style geometric monogram placeholder rather than copying the official AsiaHub brand artwork; replace it once the licensed official logo asset is available.

Server-side security for Phase 2 must include auth, file limits, content-type checking, quotas, encryption, auditing, access control, and versioned backups. **Same-origin URLs alone do not provide authentication.**

## Adding a fourth editor later

Add the new card in `public/index.html`, its relevant CSS in `public/assets/styles.css`, a service in `docker-compose.yml`, and matching `location = /...` / `location ^~ /.../` blocks in `nginx/workspace.conf`. If upstream produces a WASM static release it can reuse `Dockerfile.craft` after its allowed app name is audited and added. Do not dynamically proxy arbitrary user-supplied hostnames.
