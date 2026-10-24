# Offline build (installable app for phones)

`imperial_sanctuary_mahjong.html` stays the file you edit. This folder turns it into an
offline-ready Progressive Web App in `../docs/`:

- Tailwind is compiled locally (no CDN), fonts are inlined, nothing loads from the internet
- `manifest.webmanifest` + icons make it installable to the home screen, fullscreen
- `sw.js` caches everything on first visit so it runs in airplane mode

## Build
    cd build
    npm install      # first time only
    npm run build    # rebuild after every change to the game file

Rebuilding changes the cache version, so installed phones pick up the update the next time they open the game with internet.

## Put it on a phone
Service workers need HTTPS. `docs/` is published by GitHub Pages
(repo Settings → Pages → Deploy from a branch → `main` / `/docs`), so after a rebuild just
commit and push `docs/`.

Open the link on the phone once while online, then:
- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** ⋮ → Install app / Add to Home Screen

From then on it launches from the home-screen icon and plays with no connection.
Saves live on the phone (localStorage). Installed home-screen apps on iOS are exempt
from Safari's 7-day storage cleanup.

`make_icons.py` regenerates `icons/` (needs Pillow).
