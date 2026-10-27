// Builds Momahjong for GameHub from ../game/ into ../dist/ (published by GitHub Actions).
// - Compiles only the Tailwind classes the game uses (replaces the Tailwind CDN script)
// - Inlines the Google Fonts as base64 woff2 (downloaded once, cached in fonts/)
// - Writes offline-files.json, so GameHub can save the whole game for offline play
// GameHub's own service worker and manifest cover installing and offline; the game has neither.
// Usage: cd build && npm install && npm run build
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const src = path.join(root, 'game');
const dist = path.join(root, 'dist');
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

// 3. Rewrite the page head: drop the CDN and remote fonts, link the compiled CSS
let html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
html = html
  .replace(/\s*<script src="https:\/\/cdn\.tailwindcss\.com[^"]*"><\/script>/, '')
  .replace(/\s*<link[^>]*fonts\.googleapis\.com[^>]*>/g, '')
  .replace(/\s*<link[^>]*fonts\.gstatic\.com[^>]*>/g, '')
  .replace('<link rel="stylesheet" href="css/game.css">',
    '<link rel="stylesheet" href="css/fonts.css">\n    <link rel="stylesheet" href="css/tailwind.css">\n    <link rel="stylesheet" href="css/game.css">');

// Guard: the built page must not load anything from the network
const remote = [...html.matchAll(/<(?:script|link|img)[^>]+(?:src|href)="(https?:[^"]+)"/g)].map(m => m[1]);
if (remote.length) throw new Error(`Remote resources left in build: ${remote.join(', ')}`);

// 4. Write dist/
fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(src, dist, { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), html);
fs.writeFileSync(path.join(dist, 'css', 'fonts.css'), fontCss);
fs.writeFileSync(path.join(dist, 'css', 'tailwind.css'), tailwindCss);
fs.writeFileSync(path.join(dist, '.nojekyll'), ''); // serve files as-is on GitHub Pages

// Every file, relative to the game's address, for GameHub's warmOffline()
const files = [];
const walk = dir => {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else files.push(path.relative(dist, p).split(path.sep).join('/'));
  }
};
walk(dist);
const list = files.filter(f => !f.startsWith('.')).map(f => (f === 'index.html' ? './' : f)).sort();
fs.writeFileSync(path.join(dist, 'offline-files.json'), JSON.stringify(list));

const kb = n => `${(n / 1024).toFixed(0)}KB`;
console.log(`Built dist/ (${list.length} files; tailwind ${kb(tailwindCss.length)}, fonts ${kb(fontCss.length)})`);
