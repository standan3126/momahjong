/* ============================================================================
   6. DIFFICULTY CURVE & GUARANTEED-SOLVABLE BOARD GENERATOR
   ============================================================================ */
const MAX_SPINS = 3;
const TRAINING_LEVELS = 20;
const MODIFIERS = [
    { id: 'golden', name: '🌟 Golden Rain', desc: 'Extra Golden pairs this level!' },
    { id: 'misty', name: '🌫️ Misty Peaks', desc: 'Extra Mystery tiles hide in the mist!' },
    { id: 'speed', name: '⚡ Speed Blessing', desc: 'Combo window stretched to 8 seconds!' }
];
const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function getLevelConfig(level) {
    if (level <= 12) {
        return { kind: 'tutorial', tut: TUTORIAL[level], variety: 6, d: 0 };
    }
    if (level <= TRAINING_LEVELS) {
        const k = level - 12; // trial 1..8: 28 → 56 tiles
        return { kind: 'training', pairs: 12 + k * 2, layers: k <= 2 ? 2 : 3, variety: 7 + k, mystery: k >= 4 ? (k >= 7 ? 2 : 1) : 0, golden: 1, d: 0.1 + k * 0.03 };
    }
    // Endless: ramps for ~130 levels, then holds at max difficulty forever
    const e = easeInOut(Math.min(1, (level - 21) / 130));
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
    if (level >= 30 && level % 10 === 0) {
        cfg.isBoss = true;
        cfg.pairs = Math.min(64, cfg.pairs + 6);
        cfg.golden++;
        cfg.layers = Math.min(5, cfg.layers + 1);
    } else if (level >= 25) {
        const r = mulberry32(hashSeed(level, 4242))();
        if (r < 0.45) cfg.modifier = MODIFIERS[Math.floor(r / 0.15)];
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

function generateBoard(level) {
    const cfg = getLevelConfig(level);
    let slots, name;
    if (cfg.kind === 'tutorial') {
        slots = cfg.tut.slots.map(s => ({ ...s }));
        name = cfg.tut.title;
    } else {
        const f = generateFormation(mulberry32(hashSeed(level, 1)), cfg.pairs * 2, cfg.layers);
        slots = f.slots;
        name = f.name;
    }

    let order = null;
    let rng = null;
    for (let attempt = 0; attempt < 40 && !order; attempt++) {
        rng = mulberry32(hashSeed(level, 1000 + attempt));
        order = peelPairs(slots, rng, cfg.d || 0);
    }
    if (!order) order = fallbackPairs(slots);

    const tiles = slots.map((s, i) => ({
        uid: i, x: s.x, y: s.y, z: s.z,
        tileId: 'b1', removed: false, isGolden: false, isMystery: false, mysteryRevealed: false
    }));

    if (cfg.kind === 'tutorial' && cfg.tut.types) {
        cfg.tut.types.forEach((id, i) => { tiles[i].tileId = id; });
    } else {
        const pool = rngShuffle(TILE_CATALOG.map(c => c.id), rng).slice(0, Math.max(4, Math.min(TILE_CATALOG.length, cfg.variety)));
        const typeList = rngShuffle(order.map((_, i) => pool[i % pool.length]), rng);
        order.forEach(([a, b], i) => { tiles[a].tileId = typeList[i]; tiles[b].tileId = typeList[i]; });
    }

    if (cfg.kind === 'tutorial') {
        if (cfg.tut.golden != null) {
            const g = tiles[cfg.tut.golden];
            const pair = order.find(p => p.includes(g.uid));
            const partner = cfg.tut.types ? tiles.find(t => t.uid !== g.uid && t.tileId === g.tileId) : tiles[pair[0] === g.uid ? pair[1] : pair[0]];
            g.isGolden = true;
            if (partner) partner.isGolden = true;
        }
        (cfg.tut.mystery || []).forEach(u => { tiles[u].isMystery = true; });
    } else {
        rngShuffle(order.map((_, i) => i), rng).slice(0, Math.min(cfg.golden, order.length))
            .forEach(i => order[i].forEach(u => { tiles[u].isGolden = true; }));
        const blocked = tiles.filter(t => !isTileFree(t, tiles));
        rngShuffle(blocked, rng).slice(0, cfg.mystery).forEach(t => { t.isMystery = true; });
    }

    return { tiles, order, formationName: name, modifier: cfg.modifier || null, isBoss: !!cfg.isBoss, cfg };
}
