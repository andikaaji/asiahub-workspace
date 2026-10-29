import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = read('public/index.html');
const proxy = read('nginx/workspace.conf');
const compose = read('docker-compose.yml');
const downloader = read('Dockerfile.craft');
const apps = ['deckcraft','wordcraft','pdfcraft','gridcraft','photocraft','filmcraft','vectorcraft'];

test('all seven editor links use same-origin context paths', () => {
  for (const app of apps) {
    assert.ok(html.includes(`href="/${app}/"`));
    assert.ok(proxy.includes(`location ^~ /${app}/`));
    assert.ok(proxy.includes(`proxy_pass http://${app}-web:8080/;`));
    assert.ok(proxy.includes(`location = /${app} { return 308 /${app}/;`));
    assert.ok(compose.includes(`  ${app}-web:`));
    assert.ok(downloader.includes(app));
  }
  assert.equal((html.match(/class="tool-card"/g) || []).length, 7);
});
test('no disabled, planned or coming-soon editor cards', () => {
  assert.doesNotMatch(html, /Segera hadir|Planned|Coming soon|disabled aria-label=/i);
  for (const name of ['DeckCraft','WordCraft','PdfCraft','GridCraft','PhotoCraft','FilmCraft','VectorCraft']) {
    assert.ok(html.includes(`data-tool-name="${name}"`));
  }
});
test('accessible, responsive portal includes custom workspace branding', () => {
  assert.match(html, /<html lang="id">/);
  assert.match(html, /id="tool-search"/);
  assert.match(html, /assets\/workspace-mark\.svg/);
  assert.match(read('public/assets/styles.css'), /@media\(max-width:600px\)/);
  assert.match(read('public/assets/workspace-mark.svg'), /<svg/);
  assert.match(read('public/assets/app.js'), /function filterTools/);
});
test('release integrity and AutoDev network settings', () => {
  assert.match(downloader, /SHA256SUMS.txt/);
  assert.match(downloader, /sha256sum -c -/);
  assert.match(downloader, /github.com\/storytold/);
  assert.match(compose, /external: true/);
  assert.match(compose, /name: autodev-net/);
  for (const app of apps) assert.match(compose, new RegExp(`${app.toUpperCase()}_VERSION`));
});
test('PhotoCraft split WASM parts are served without double gzip and stale caching', () => {
  const editor = read('nginx/editor.conf');
  assert.match(downloader, /app\/parts\.txt/);
  assert.match(editor, /location = \/app\/parts\.txt/);
  assert.match(editor, /location = \/app\/photocraft-web\.js/);
  assert.match(editor, /gzip off/);
});
