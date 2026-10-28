import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const html = read('public/index.html');
const proxy = read('nginx/workspace.conf');
const compose = read('docker-compose.yml');
const dockerfile = read('Dockerfile.craft');

test('three editor links lead to same-origin context paths', () => {
  for (const name of ['deckcraft','wordcraft','pdfcraft']) {
    assert.match(html, new RegExp(`href="/${name}/"`));
    assert.match(proxy, new RegExp(`location \\^~ /${name}/`));
    assert.match(proxy, new RegExp(`proxy_pass http://${name}-web:8080/;`));
    assert.match(compose, new RegExp(`  ${name}-web:`));
  }
});
test('proxy preserves same-origin and avoids external redirects', () => {
  assert.doesNotMatch(html, /href="https:\/\/[^\"]*(deckcraft|wordcraft|pdfcraft)/);
  assert.match(proxy, /return 308 \/wordcraft\//);
  assert.match(proxy, /return 308 \/deckcraft\//);
  assert.match(proxy, /return 308 \/pdfcraft\//);
});
test('the landing is a usable responsive standalone page', () => {
  assert.match(html, /<html lang="id">/);
  assert.match(html, /id="tool-search"/);
  assert.match(read('public/assets/styles.css'), /@media\(max-width:680px\)/);
  assert.equal((html.match(/class="tool-card /g)||[]).length,3);
});
test('editor images fetch checksum verified official releases', () => {
  assert.match(dockerfile, /SHA256SUMS.txt/);
  assert.match(dockerfile, /sha256sum -c -/);
  assert.match(dockerfile, /github.com\/storytold/);
  assert.match(compose, /external: true/);
});
