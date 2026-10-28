# Momahjong

**Momahjong** (Jade Sanctuary Mahjong): a calm mahjong solitaire game for phones (iPhone & Android), made to be played with a finger or stylus. Part of [GameHub](https://standan3126.github.io/).

## Play
Open GameHub (`https://standan3126.github.io/`) on a phone, add it to the home screen, and tap Momahjong. It works offline after the first visit. Progress stays on the phone; the gear → *Move your progress* carries it to another phone.

## How it plays
- Endless levels generated from the level number, ramping up to a maximum difficulty; a boss board every 10th level pays double.
- Match two free tiles to clear them. Coins: 5 for a level, golden tiles 3 (with a regular tile) or 7 (two golden tiles together). Hint 10, Undo 15, Shuffle 30. No matches left? Shuffle, or start the board again.
- Levels (a map of the winding Bamboo Path) shows a star on every finished level; any of them can be played again for coins.
- Little games between levels (Memory Pairs, Odd Tile Out).
- It sits in GameHub's frame (Hub or Home top left, the Settings gear top right) and uses GameHub's shared Settings, sounds and music (see the hub's `shared/CONTRACT.md`).

## Files
- `game/`: the game itself. `index.html`, `css/game.css`, and `js/`, one file per section, loaded in order and sharing one global scope.
- `build/`: turns `game/` into the published copy in `dist/` (`cd build && npm install && npm run build`). `node build/check-levels.mjs` checks that generated levels are solvable.
- `game/js/hub.js`: where it plugs into GameHub (the toolbox's Sound, Settings panel and frame).
- `tests/`: browser tests. `npm install`, then `npm test` checks the levels, builds, and plays the built game in phone-sized browsers, with GameHub's toolbox served from the `hub` folder next to this one (`node tests/serve.mjs` to look at it: http://localhost:4210/momahjong/).
- Every push to `main` checks the levels, builds, and publishes through GitHub Actions.
