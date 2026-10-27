# Momahjong

**Momahjong** (Jade Sanctuary Mahjong): a calm mahjong solitaire game for phones (iPhone & Android), made to be played with a finger or stylus. Part of [GameHub](https://standan3126.github.io/).

## Play
Open GameHub (`https://standan3126.github.io/`) on a phone, add it to the home screen, and tap Momahjong. It works offline after the first visit. Saves stay on the phone (3 save slots); Settings → *Move your progress* carries them to another phone.

## How it plays
- 10 short lessons, then endless levels that ramp up to a maximum difficulty (generated from the level number, so they're infinite without growing the game).
- Every level gives up to three stars (fewer power-ups, more stars) and some gold. Stars raise your Sanctuary Rank and open the boss level every 10th level.
- Power-ups (Undo, Hint, Shuffle, Dragon Torch, Eagle Eye) cost gold once your own run out.
- A treasure chest every 5th level, little games between levels (Memory Pairs, Odd Tile Out, Suit Sorting), and a map of the winding Bamboo Path where any won level can be replayed.

## Files
- `game/`: the game itself. `index.html`, `css/game.css`, and `js/`, one file per section, loaded in order and sharing one global scope.
- `build/`: turns `game/` into the published copy in `dist/` (`cd build && npm install && npm run build`). `node build/check-levels.mjs` checks that generated levels are solvable.
- Every push to `main` checks the levels, builds, and publishes through GitHub Actions.

For local testing, serve `game/` (`python3 -m http.server`); the GameHub-only extras (moving progress, the toolbox) need GameHub's `/shared/` folder next to it.
