/* ============================================================================
   13c. LITTLE GAMES BETWEEN LEVELS: MEMORY PAIRS, ODD TILE OUT
        Short and calm, no timers; each can be skipped. They pay by how well you do
        (the user's rules, 2026-10-28): a perfect game earns LITTLE_GAME_PRIZE (20).
        Each explains itself the first time it shows up. How often they come (and which
        ones) is in Settings.
        (Suit Sorting is pulled for now, 2026-10-28: some tiles were in the wrong
        group, e.g. a tree among the animals. Its code stays for when it's fixed.)
        (A sound-based "Wind Chimes" game is noted for later: not everyone can
        play with sound on.)
   ============================================================================ */
const BREAKS = {
    memory: {
        name: 'Memory Pairs',
        icon: '🀄',
        help: 'Find all 8 pairs. Full prize within 12 turns.',
        rules: `Sixteen tiles lie face down: eight pairs. Tap two to turn them over. A pair stays face up; two different tiles turn back, so remember where they were. Find every pair within 12 turns for the full ${LITTLE_GAME_PRIZE} coins. Each extra turn takes one coin off, but you always get at least ${MEMORY_FLOOR}.`,
        run: runMemoryPairs
    },
    odd: {
        name: 'Odd Tile Out',
        icon: '🔍',
        help: 'Tap the one tile that’s different. 5 rounds.',
        rules: `Every tile matches except one: tap the odd one out. There are 5 rounds, each a little harder (more tiles, then tiles of the same kind). Each round you get right on the first tap earns ${LITTLE_GAME_PRIZE / 5} coins, ${LITTLE_GAME_PRIZE} for all five. Take your time: there's no timer.`,
        run: runOddTileOut
    }
};
const SUITS = {
    bamboo: { name: 'Bamboo', icon: '🎋' },
    wildlife: { name: 'Animals', icon: '🐼' },
    arch: { name: 'Buildings', icon: '🏯' },
    treasure: { name: 'Treasures', icon: '💰' }
};

const shuffled = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};
const tilesOfSuit = suit => TILE_CATALOG.filter(t => t.suit === suit);

// Counts levels; true when it's time for a little game after this one.
function breakIsDue(level) {
    if (!settings.breakEvery || !settings.breakKinds.some(k => BREAKS[k])) return false;
    state.breakCount++;
    if (state.breakCount < settings.breakEvery) return false;
    state.breakCount = 0;
    return true;
}

let breakDone = null;

function playBreak(then) {
    const kinds = settings.breakKinds.filter(k => BREAKS[k]);
    const kind = kinds[state.levelsCleared % kinds.length];
    const game = BREAKS[kind];
    breakDone = then;
    $('breakTitle').textContent = `${game.icon} ${game.name}`;
    $('breakStatus').textContent = '';
    $('breakFinish').classList.add('hidden');
    $('breakSkip').classList.remove('hidden');
    openModal('breakModal');
    const start = () => {
        $('breakHelp').textContent = game.help;
        game.run($('breakArea'), ({ coins, note }) => {
            addGold(coins);
            updateAllHUD();
            saveProgress();
            SoundFX.fanfare();
            if (coins === LITTLE_GAME_PRIZE) FX.confetti(120);
            $('breakStatus').innerHTML = `${note} +${coins} ${COIN}`;
            $('breakSkip').classList.add('hidden');
            $('breakFinish').classList.remove('hidden');
        });
    };
    // The first time each one shows up, its rules come first.
    const seen = `break-${kind}`;
    if (state.explained[seen]) return start();
    $('breakHelp').textContent = 'How it works';
    $('breakArea').innerHTML = `<p class="text-sm text-emerald-100 leading-relaxed text-left">${game.rules}</p>
        <button id="breakStart" class="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 font-extrabold text-sm shadow-lg active:scale-95 transition">Start</button>`;
    $('breakStart').onclick = () => {
        state.explained[seen] = true;
        saveProgress();
        SoundFX.ui();
        start();
    };
}

function endBreak() {
    closeModal('breakModal');
    $('breakArea').innerHTML = '';
    const then = breakDone;
    breakDone = null;
    saveProgress();
    if (then) then();
}

// Home during a little game: it's left unplayed (Play goes on to the next level).
function leaveBreak() {
    if (!breakDone) return;
    breakDone = null;
    closeModal('breakModal');
    $('breakArea').innerHTML = '';
}

// A small ivory tile showing one tile face.
function miniTile(id, extra = '') {
    return `<div class="mini-tile ${extra}"><div class="mini-face">${getTileSVG(id)}</div></div>`;
}

function wiggle(el) {
    el.classList.remove('mini-wiggle');
    void el.offsetWidth;
    el.classList.add('mini-wiggle');
    SoundFX.error();
}

// --- Memory Pairs: turn over two tiles; matching ones stay face up ----------------------
// Pays the full prize within MEMORY_TURNS turns, one coin less for each turn after that,
// never below MEMORY_FLOOR (economy.js).
function runMemoryPairs(area, onWin) {
    const PAIRS = 8;
    const ids = shuffled(TILE_CATALOG).slice(0, PAIRS).map(t => t.id);
    const deck = shuffled([...ids, ...ids]);
    area.innerHTML = `<div class="grid grid-cols-4 gap-2 mx-auto" style="max-width:280px">${deck.map((id, i) => `
        <button class="memory-card" data-i="${i}" aria-label="Hidden tile">
            <div class="memory-back">🀄</div>${miniTile(id, 'memory-front')}
        </button>`).join('')}</div>`;
    let open = [];
    let found = 0;
    let turns = 0;
    let busy = false;
    const status = () => ($('breakStatus').textContent = `Pairs: ${found} of ${PAIRS} · Turns: ${turns}`);
    status();
    area.querySelectorAll('.memory-card').forEach(card => card.addEventListener('click', () => {
        if (busy || card.classList.contains('up')) return;
        card.classList.add('up');
        card.setAttribute('aria-label', CATALOG_BY_ID[deck[card.dataset.i]].name);
        SoundFX.ui();
        open.push(card);
        if (open.length < 2) return;
        const [a, b] = open;
        open = [];
        turns++;
        if (deck[a.dataset.i] === deck[b.dataset.i]) {
            found++;
            SoundFX.match(found);
            a.classList.add('matched');
            b.classList.add('matched');
            status();
            if (found === PAIRS) {
                const coins = memoryCoins(turns);
                onWin({ coins, note: coins === LITTLE_GAME_PRIZE ? `All pairs in ${turns} turns!` : `All pairs in ${turns} turns.` });
            }
        } else {
            status();
            busy = true;
            setTimeout(() => {
                a.classList.remove('up');
                b.classList.remove('up');
                a.setAttribute('aria-label', 'Hidden tile');
                b.setAttribute('aria-label', 'Hidden tile');
                busy = false;
            }, 900);
        }
    }));
}

// --- Odd Tile Out: every tile is the same but one; tap it (5 rounds, getting harder) -----
// Each round found on the first tap pays a fifth of the prize.
const ODD_ROUNDS = [
    { cols: 3, sameSuit: false },
    { cols: 4, sameSuit: false },
    { cols: 4, sameSuit: true },
    { cols: 5, sameSuit: true },
    { cols: 5, sameSuit: true }
];

function runOddTileOut(area, onWin) {
    let round = 0;
    let firstTry = 0;
    const play = () => {
        const { cols, sameSuit } = ODD_ROUNDS[round];
        const main = TILE_CATALOG[Math.floor(Math.random() * TILE_CATALOG.length)];
        const pool = TILE_CATALOG.filter(t => t.id !== main.id && (sameSuit ? t.suit === main.suit : t.suit !== main.suit));
        const odd = pool[Math.floor(Math.random() * pool.length)];
        const n = cols * cols;
        const at = Math.floor(Math.random() * n);
        let missed = false;
        $('breakStatus').textContent = `Round ${round + 1} of ${ODD_ROUNDS.length} · First tries: ${firstTry}`;
        area.innerHTML = `<div class="grid gap-2 mx-auto" style="grid-template-columns:repeat(${cols},1fr);max-width:${cols * 64}px">${
            Array.from({ length: n }, (_, i) => `<button class="odd-cell" data-odd="${i === at}" aria-label="${i === at ? odd.name : main.name}">${miniTile(i === at ? odd.id : main.id)}</button>`).join('')
        }</div>`;
        area.querySelectorAll('.odd-cell').forEach(cell => cell.addEventListener('click', () => {
            if (cell.classList.contains('found')) return;
            if (cell.dataset.odd !== 'true') {
                missed = true;
                return wiggle(cell);
            }
            cell.classList.add('found');
            SoundFX.star(round);
            if (!missed) firstTry++;
            round++;
            setTimeout(() => {
                if (round < ODD_ROUNDS.length) return play();
                $('breakStatus').textContent = '';
                onWin({ coins: oddCoins(firstTry), note: `${firstTry} of ${ODD_ROUNDS.length} on the first tap.` });
            }, 650);
        }));
    };
    play();
}

// --- Suit Sorting: tap a tile, then the bowl for its suit --------------------------------
function runSuitSorting(area, onWin) {
    const suits = shuffled(Object.keys(SUITS)).slice(0, 3);
    const tiles = shuffled(suits.flatMap(s => shuffled(tilesOfSuit(s)).slice(0, 3)));
    let picked = null;
    let sorted = 0;
    $('breakHelp').textContent = 'Tap a tile, then tap the bowl it belongs in.';
    area.innerHTML = `
        <div class="grid grid-cols-3 gap-2 mx-auto mb-3" style="max-width:250px" id="sortTray">${tiles.map((t, i) => `
            <button class="sort-tile" data-suit="${t.suit}" data-i="${i}" aria-label="${t.name}">${miniTile(t.id)}</button>`).join('')}
        </div>
        <div class="grid grid-cols-3 gap-2 mx-auto" style="max-width:320px">${suits.map(s => `
            <button class="sort-bowl" data-suit="${s}" aria-label="${SUITS[s].name} bowl">
                <div class="text-2xl leading-none">${SUITS[s].icon}</div>
                <div class="text-[11px] font-extrabold text-amber-200 mt-1">${SUITS[s].name}</div>
                <div class="sort-count text-[10px] text-emerald-200">0 / 3</div>
            </button>`).join('')}
        </div>`;
    const counts = Object.fromEntries(suits.map(s => [s, 0]));
    $('breakStatus').textContent = 'Sorted: 0 of 9';
    area.querySelectorAll('.sort-tile').forEach(tile => tile.addEventListener('click', () => {
        if (tile.classList.contains('done')) return;
        area.querySelectorAll('.sort-tile').forEach(t => t.classList.remove('picked'));
        picked = tile;
        tile.classList.add('picked');
        SoundFX.ui();
    }));
    area.querySelectorAll('.sort-bowl').forEach(bowl => bowl.addEventListener('click', () => {
        if (!picked) {
            $('breakStatus').textContent = 'Tap a tile first, then its bowl.';
            return;
        }
        if (picked.dataset.suit !== bowl.dataset.suit) return wiggle(bowl);
        picked.classList.remove('picked');
        picked.classList.add('done');
        picked = null;
        sorted++;
        counts[bowl.dataset.suit]++;
        bowl.querySelector('.sort-count').textContent = `${counts[bowl.dataset.suit]} / 3`;
        SoundFX.match(sorted);
        $('breakStatus').textContent = `Sorted: ${sorted} of 9`;
        if (sorted === 9) onWin();
    }));
}
