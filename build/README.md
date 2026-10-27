# Build

Turns `../game/` into `../dist/`, the copy GitHub Pages publishes:

- compiles only the Tailwind classes the game uses (the page loads Tailwind from a CDN while developing),
- downloads the two Google Fonts once (cached in `fonts/`) and includes them as `css/fonts.css`,
- writes `offline-files.json`, the list GameHub uses to save the whole game for offline play.

The game has no service worker or manifest of its own: GameHub's cover installing and offline.

```
npm install      # first time only
npm run build
node check-levels.mjs   # levels are solvable and repeatable
```

Class names must be written out in full in the HTML or JS (never built from pieces like `'bg-' + color`), or they won't exist in the compiled CSS.
