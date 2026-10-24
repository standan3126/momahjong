// Builds an offline-installable PWA from ../imperial_sanctuary_mahjong.html into ../docs/ (served by GitHub Pages).
// - Compiles only the Tailwind classes the game uses (replaces the Tailwind CDN script)
// - Inlines the Google Fonts as base64 woff2 (downloaded once, cached in fonts/)
// - Adds a web manifest, icons and a cache-first service worker
// Usage: cd build && npm install && npm run build
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const srcFile = path.join(root, 'imperial_sanctuary_mahjong.html');
const dist = path.join(root, 'docs');
const fontsDir = path.join(here, 'fonts');
const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// 1. Tailwind: compile just the classes the game uses
const tailwindCss = execFileSync(
  path.join(here, 'node_modules/.bin/tailwindcss'),
  ['-c', 'tailwind.config.cjs', '-i', 'tailwind.input.css', '--minify'],
  { cwd: here, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
);

// 2. Fonts: keep the latin subsets, inline them so nothing is fetched at runtime
async function buildFontCss() {
  fs.mkdirSync(fontsDir, { recursive: true });
  const cssCache = path.join(fontsDir, 'google.css');
  if (!fs.existsSync(cssCache)) {
    const res = await fetch(FONTS_URL, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`Font CSS download failed: ${res.status}`);
    fs.writeFileSync(cssCache, await res.text());
  }
  const css = fs.readFileSync(cssCache, 'utf8');
  const blocks = [...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*{[^}]*})/g)].map(m => m[1]);
  let out = '';
  for (const block of blocks) {
    const url = block.match(/url\((https:[^)]+)\)/)[1];
    const local = path.join(fontsDir, path.basename(new URL(url).pathname));
    if (!fs.existsSync(local)) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Font download failed: ${url}`);
      fs.writeFileSync(local, Buffer.from(await res.arrayBuffer()));
    }
    const b64 = fs.readFileSync(local).toString('base64');
    out += block.replace(url, `data:font/woff2;base64,${b64}`) + '\n';
  }
  return out;
}

const fontCss = await buildFontCss();

// 3. Rewrite the HTML head: drop CDN/remote fonts, inline CSS, add PWA tags
let html = fs.readFileSync(srcFile, 'utf8');
html = html
  .replace(/\s*<script src="https:\/\/cdn\.tailwindcss\.com[^"]*"><\/script>/, '')
  .replace(/\s*<link[^>]*fonts\.googleapis\.com[^>]*>/g, '')
  .replace(/\s*<link[^>]*fonts\.gstatic\.com[^>]*>/g, '');

const headExtras = `
    <link rel="manifest" href="manifest.webmanifest">
    <link rel="icon" type="image/png" href="icons/icon-192.png">
    <link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Jade Mahjong">
    <style>${fontCss}</style>
    <style>${tailwindCss}</style>`;
html = html.replace(/(<title>[^<]*<\/title>)/, `$1${headExtras}`);

const swRegister = `
    <script>
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW register failed:', e)));
    }
    </script>
</body>`;
html = html.replace(/<\/body>(?![\s\S]*<\/body>)/, swRegister);

// Guard: the built page must not load anything from the network
const remote = [...html.matchAll(/<(?:script|link|img)[^>]+(?:src|href)="(https?:[^"]+)"/g)].map(m => m[1]);
if (remote.length) throw new Error(`Remote resources left in build: ${remote.join(', ')}`);

// 4. Write docs/
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.writeFileSync(path.join(dist, '.nojekyll'), ''); // serve files as-is on GitHub Pages
for (const f of fs.readdirSync(path.join(here, 'icons'))) {
  fs.copyFileSync(path.join(here, 'icons', f), path.join(dist, 'icons', f));
}

fs.writeFileSync(path.join(dist, 'manifest.webmanifest'), JSON.stringify({
  name: 'Jade Sanctuary Mahjong',
  short_name: 'Jade Mahjong',
  start_url: './',
  scope: './',
  display: 'fullscreen',
  orientation: 'portrait',
  background_color: '#031710',
  theme_color: '#063426',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

// Cache name changes whenever the build output changes, so phones pick up updates
const assets = ['./', 'index.html', 'manifest.webmanifest', ...fs.readdirSync(path.join(dist, 'icons')).map(f => `icons/${f}`)];
const version = createHash('sha256').update(html).digest('hex').slice(0, 12);
fs.writeFileSync(path.join(dist, 'sw.js'), `// Generated by build/build.mjs — cache-first so the game runs with no connection.
const CACHE = 'jade-mahjong-${version}';
const ASSETS = ${JSON.stringify(assets)};

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys()
        .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
        .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).catch(() => caches.match('index.html'))));
});
`);

const kb = n => `${(n / 1024).toFixed(0)}KB`;
console.log(`Built docs/ (index.html ${kb(Buffer.byteLength(html))}, tailwind ${kb(tailwindCss.length)}, fonts ${kb(fontCss.length)}, cache ${version})`);
