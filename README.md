# momajong

**Jade Sanctuary Mahjong**: a mahjong solitaire game for phones (iPhone & Android), made to be played with a finger or stylus.

## Play
Open the GitHub Pages link on the phone, then add it to the home screen:
- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** ⋮ → Install app

After the first visit it works offline. Saves stay on the phone (3 save slots).

## Features
- 20-level guided training, then endless levels that ramp up to a max difficulty (generated from the level number, so they're infinite without growing the file)
- 3D stacked tiles with colour-coded layers, combos, golden & mystery tiles, boss boards
- Imperial Chance Chest (up to 3 spins per level) with power-ups: Hint, Shuffle, Undo, Dragon Torch, Eagle Eye
- Synthesized sound effects and optional zen music; no downloads needed

## Files
- `imperial_sanctuary_mahjong.html`: the game source (edit this)
- `build/`: turns the source into the offline, installable app (`cd build && npm install && npm run build`)
- `docs/`: the built app, served by GitHub Pages

Add `?debug=1` to the URL to check 500 levels for solvability.
