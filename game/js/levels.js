/* ============================================================================
   6. DIFFICULTY CURVE & GUARANTEED-SOLVABLE BOARD GENERATOR
   ============================================================================ */
// Every level is generated (the 10 hand-built lessons went on 2026-10-28, when everyone started
// over: a few skippable tips on the first board teach the game instead). A boss every 10th.
// A special level shows its badge under the level; tapping the badge explains it.
const MODIFIERS = [
    { id: 'golden', name: '🌟 Golden Rain', desc: 'This level has extra golden tiles. Match them for more coins: 3 with a regular tile, 7 when two golden tiles meet.' },
    { id: 'misty', name: '🌫️ Misty Peaks', desc: 'This level has extra mystery tiles. They show a "?" until they come free, then they turn face up. Tap a covered one to peek for a moment.' }
];
// The staircase (the user's design, 2026-10-28): each ten levels is one step harder. A boss
// (every 10th) plays one step ahead, and the two levels after it ease back a step:
//   1-9 = 1, 10 = 1.5, 11-12 = 1, 13-19 = 1.5, 20 = 2, 21-22 = 1.5, 23-29 = 2, 30 = 2.5 ...
// Steps climb to the hardest boards (STEP_TOP) by the level 140 boss; later levels stay there.
// The steps follow the same gentle-then-steeper-then-gentle curve as before, so the overall
// pace is unchanged; bosses also get a bigger board on top of their step (below).
const STEP_TOP = 8;
const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function difficultyStep(level) {
    const ten = Math.floor((level - 1) / 10);
    const place = level - ten * 10;               // 1..10 within its ten
    const k = place === 10 ? ten + 1 : place <= 2 ? Math.max(0, ten - 1) : ten;
    return 1 + 0.5 * k;
}

function getLevelConfig(level) {
    const e = easeInOut(Math.min(1, (difficultyStep(level) - 1) / (STEP_TOP - 1)));
    const cfg = {
        kind: 'endless',
        pairs: Math.round(26 + e * 32),
        layers: 3 + (e > 0.35 ? 1 : 0) + (e > 0.7 ? 1 : 0),
        variety: Math.round(12 + e * 24),
        mystery: Math.round(e * 8),
        golden: 1 + (e > 0.4 ? 1 : 0) + (e > 0.8 ? 1 : 0),
        d: e,
        modifier: null,
        isBoss: false
    };
    if (isBossLevel(level)) {
        cfg.isBoss = true;
        cfg.pairs = Math.min(64, cfg.pairs + 6);
        cfg.golden++;
        cfg.layers = Math.min(5, cfg.layers + 1);
    } else if (level >= 5) {
        const r = mulberry32(hashSeed(level, 4242))();
        if (r < 0.3) cfg.modifier = MODIFIERS[Math.floor(r / 0.15)];
    }
    if (cfg.modifier && cfg.modifier.id === 'golden') cfg.golden += 2;
    if (cfg.modifier && cfg.modifier.id === 'misty') cfg.mystery += 4;
    return cfg;
}

// A tile at (x, y, z) occupies [x, x+2] horizontally and [y, y+2] vertically.
function isTileFree(tile, activeTiles) {
    let blockedLeft = false;
    let blockedRight = false;
    for (const other of activeTiles) {
        if (other.uid === tile.uid || other.removed) continue;
        if (other.z > tile.z) {
            if (Math.abs(other.x - tile.x) < 2 && Math.abs(other.y - tile.y) < 2) return false;
        } else if (other.z === tile.z && Math.abs(other.y - tile.y) < 2) {
            if (other.x === tile.x - 2) blockedLeft = true;
            if (other.x === tile.x + 2) blockedRight = true;
        }
    }
    return !(blockedLeft && blockedRight);
}

function hasTileAbove(tile, activeTiles) {
    for (const other of activeTiles) {
        if (other.uid === tile.uid || other.removed) continue;
        if (other.z > tile.z && Math.abs(other.x - tile.x) < 2 && Math.abs(other.y - tile.y) < 2) return true;
    }
    return false;
}

// Reverse-peel: repeatedly remove two tiles that are free at the same time. Playing the
// pairs in that order is a guaranteed solution. Returns null if the peel gets stuck.
function peelPairs(slots, rng, d) {
    const v = slots.map((s, i) => ({ uid: i, x: s.x, y: s.y, z: s.z, removed: false }));
    const order = [];
    let remaining = v.length;
    while (remaining > 0) {
        const free = v.filter(t => !t.removed && isTileFree(t, v));
        if (free.length < 2) return null;
        free.sort((a, b) => (b.z - a.z) + (rng() - 0.5) * (1.2 + d * 2));
        const first = free[0];
        // Harder levels pair tiles that are far apart instead of neighbours on the same storey
        const second = rng() < 0.35 + d * 0.5 ? free[1 + Math.floor(rng() * (free.length - 1))] : free[1];
        first.removed = true;
        second.removed = true;
        remaining -= 2;
        order.push([first.uid, second.uid]);
    }
    return order;
}

function fallbackPairs(slots) {
    const v = slots.map((s, i) => ({ uid: i, x: s.x, y: s.y, z: s.z, removed: false }));
    const order = [];
    while (v.some(t => !t.removed)) {
        const free = v.filter(t => !t.removed && isTileFree(t, v));
        const pool = free.length >= 2 ? free : v.filter(t => !t.removed);
        pool[0].removed = true;
        pool[1].removed = true;
        order.push([pool[0].uid, pool[1].uid]);
    }
    return order;
}

// Which of a level's possible boards it plays: levels 1-150 use the board picked for them in
// js/level-seeds.js (build/tune-levels.mjs tries 24 per level and keeps the one whose
// difficulty fits the staircase); later levels use board 0.
const levelVariant = level => parseInt(LEVEL_SEEDS[level - 1] || '0', 36);
const SEED_STRIDE = 7919;

function generateBoard(level, variant = levelVariant(level)) {
    const cfg = getLevelConfig(level);
    const vs = variant * SEED_STRIDE;
    const f = generateFormation(mulberry32(hashSeed(level, 1 + vs)), cfg.pairs * 2, cfg.layers);
    const slots = f.slots;
    const name = f.name;

    let order = null;
    let rng = null;
    for (let attempt = 0; attempt < 40 && !order; attempt++) {
        rng = mulberry32(hashSeed(level, 1000 + attempt + vs));
        order = peelPairs(slots, rng, cfg.d || 0);
    }
    if (!order) order = fallbackPairs(slots);

    const tiles = slots.map((s, i) => ({
        uid: i, x: s.x, y: s.y, z: s.z,
        tileId: 'b1', removed: false, isGolden: false, isMystery: false, mysteryRevealed: false
    }));

    const pool = rngShuffle(TILE_CATALOG.map(c => c.id), rng).slice(0, Math.max(4, Math.min(TILE_CATALOG.length, cfg.variety)));
    const typeList = rngShuffle(order.map((_, i) => pool[i % pool.length]), rng);
    order.forEach(([a, b], i) => { tiles[a].tileId = typeList[i]; tiles[b].tileId = typeList[i]; });

    rngShuffle(order.map((_, i) => i), rng).slice(0, Math.min(cfg.golden, order.length))
        .forEach(i => order[i].forEach(u => { tiles[u].isGolden = true; }));
    const blocked = tiles.filter(t => !isTileFree(t, tiles));
    rngShuffle(blocked, rng).slice(0, cfg.mystery).forEach(t => { t.isMystery = true; });

    return { tiles, order, formationName: name, modifier: cfg.modifier || null, isBoss: !!cfg.isBoss, cfg };
}
