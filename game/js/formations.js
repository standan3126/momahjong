/* ============================================================================
   4. FORMATIONS: CLASSIC LAYOUTS, NAMED SHAPES & PROCEDURAL STACKS
      Coordinates use (x, y, z) where 1 tile = 2 units wide and 2 units tall.
      Boards stay within ~7 tiles wide x 8 tall so tiles stay finger-sized.
   ============================================================================ */
const FORMATIONS = [
    {
        name: "Sacred Turtle",
        build() {
            const slots = [];
            for (let x = 2; x <= 12; x += 2) for (let y = 0; y <= 6; y += 2) slots.push({ x, y, z: 0 });
            slots.push({ x: 0, y: 3, z: 0 }, { x: 14, y: 3, z: 0 });
            for (let x = 4; x <= 10; x += 2) for (let y = 1; y <= 5; y += 2) slots.push({ x, y, z: 1 });
            for (let x = 5; x <= 9; x += 2) for (let y = 2; y <= 4; y += 2) slots.push({ x, y, z: 2 });
            slots.push({ x: 6, y: 3, z: 3 }, { x: 8, y: 3, z: 3 });
            return slots;
        }
    },
    {
        name: "Imperial Pagoda",
        build() {
            const slots = [];
            for (let x = 2; x <= 12; x += 2) for (let y = 0; y <= 8; y += 2) slots.push({ x, y, z: 0 });
            for (let x = 4; x <= 10; x += 2) for (let y = 2; y <= 6; y += 2) slots.push({ x, y, z: 1 });
            for (let x = 4; x <= 10; x += 2) slots.push({ x, y: 4, z: 2 });
            slots.push({ x: 6, y: 4, z: 3 }, { x: 8, y: 4, z: 3 });
            return slots;
        }
    },
    {
        name: "Twin Jade Bridges",
        build() {
            const slots = [];
            for (let x = 0; x <= 12; x += 2) {
                for (let y = 0; y <= 6; y += 2) {
                    if (x === 6 && (y === 2 || y === 4)) continue;
                    slots.push({ x, y, z: 0 });
                }
            }
            for (let x = 2; x <= 10; x += 2) slots.push({ x, y: 0, z: 1 }, { x, y: 6, z: 1 });
            for (let x = 4; x <= 8; x += 2) slots.push({ x, y: 0, z: 2 }, { x, y: 6, z: 2 });
            return slots;
        }
    },
    {
        name: "Lotus Sanctuary",
        build() {
            const slots = [];
            const ring0 = [
                [4,0],[6,0],[8,0],
                [2,2],[4,2],[6,2],[8,2],[10,2],
                [0,4],[2,4],[4,4],[6,4],[8,4],[10,4],[12,4],
                [2,6],[4,6],[6,6],[8,6],[10,6],
                [4,8],[6,8],[8,8]
            ];
            ring0.forEach(([x, y]) => slots.push({ x, y, z: 0 }));
            for (let x = 4; x <= 8; x += 2) for (let y = 2; y <= 6; y += 2) slots.push({ x, y, z: 1 });
            slots.push({ x: 5, y: 3, z: 2 }, { x: 7, y: 3, z: 2 }, { x: 5, y: 5, z: 2 }, { x: 7, y: 5, z: 2 });
            slots.push({ x: 6, y: 4, z: 3 });
            return slots;
        }
    },
    {
        name: "Dragon Fortress",
        build() {
            const slots = [];
            for (let x = 0; x <= 12; x += 2) for (let y = 0; y <= 6; y += 2) slots.push({ x, y, z: 0 });
            [[0,0],[12,0],[0,6],[12,6],[4,2],[8,2],[4,4],[8,4],[6,2],[6,4]].forEach(([x, y]) => slots.push({ x, y, z: 1 }));
            [[0,0],[12,0],[0,6],[12,6],[5,3],[7,3]].forEach(([x, y]) => slots.push({ x, y, z: 2 }));
            return slots;
        }
    }
];

// Named base shapes ('#' = tile). Upper storeys are stacked automatically.
const SHAPES = [
    { name: 'Misty Mountain', rows: ['..###..', '.#####.', '#######', '#######', '#######', '.#####.'] },
    { name: 'Sacred Crane',   rows: ['...#...', '..###..', '#.###.#', '#######', '.#####.', '..#.#..'] },
    { name: 'Silk Fan',       rows: ['.#####.', '#######', '#######', '.#####.', '..###..', '...#...'] },
    { name: 'Torii Gate',     rows: ['#######', '.#####.', '.##.##.', '.##.##.', '###.###', '###.###'] },
    { name: 'Festival Lantern', rows: ['..###..', '.#####.', '#######', '#######', '#######', '.#####.', '..###..'] },
    { name: 'Koi Pond',       rows: ['.##.##.', '#######', '#######', '.#####.', '#######', '.##.##.'] },
    { name: 'Moon Gate',      rows: ['.#####.', '##...##', '##...##', '##...##', '.#####.'] },
    { name: 'Great Wall',     rows: ['#.#.#.#', '#######', '#######', '#######'] },
    { name: 'Pagoda Spire',   rows: ['...#...', '.#####.', '..###..', '#######', '.#####.', '#######', '#######'] },
    { name: 'Jade Butterfly', rows: ['##...##', '###.###', '#######', '.#####.', '#######', '###.###', '##...##'] }
];

const NAME_ADJ = ['Misty', 'Golden', 'Moonlit', 'Hidden', 'Celestial', 'Silent', 'Crimson', 'Jade', 'Emerald', 'Thunder', 'Lotus', 'Cherry', 'Phoenix', 'Tiger', 'Dragon', 'Azure', 'Starlit', 'Ancient', 'Whispering', 'Eternal'];
const NAME_NOUN = ['Terrace', 'Peaks', 'Garden', 'Shrine', 'Steps', 'Gate', 'Courtyard', 'Falls', 'Citadel', 'Pavilion', 'Grove', 'Harbor', 'Bridge', 'Valley', 'Altar', 'Palace', 'Monastery', 'Lagoon'];

function maskToSlots(rows) {
    const slots = [];
    rows.forEach((row, j) => {
        for (let i = 0; i < row.length; i++) if (row[i] === '#') slots.push({ x: i * 2, y: j * 2, z: 0 });
    });
    return slots;
}

// Mirror-symmetric random base mask
function proceduralMask(rng, cols, rows, dense = false) {
    const type = rngPick(rng, dense ? ['rect', 'rounded', 'blob', 'arch'] : ['rect', 'diamond', 'rounded', 'hourglass', 'blob', 'cross', 'arch', 'ring']);
    const blob = Array.from({ length: rows }, () => Array.from({ length: Math.ceil(cols / 2) }, () => rng() < 0.78));
    const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
    const out = [];
    for (let j = 0; j < rows; j++) {
        let s = '';
        for (let i = 0; i < cols; i++) {
            const mi = Math.min(i, cols - 1 - i);
            const dx = Math.abs(i - cx) / (cx || 1);
            const dy = Math.abs(j - cy) / (cy || 1);
            let on = true;
            switch (type) {
                case 'diamond': on = dx + dy <= 1.25; break;
                case 'rounded': on = !(dx > 0.8 && dy > 0.75); break;
                case 'hourglass': on = dx <= 0.4 + dy * 0.75; break;
                case 'cross': on = dx <= 0.45 || dy <= 0.45; break;
                case 'arch': on = !(dx <= 0.35 && j >= rows - 2); break;
                case 'ring': on = !(dx < 0.4 && dy < 0.4); break;
                case 'blob': on = blob[j][mi] || mi === Math.floor(cx); break;
            }
            s += on ? '#' : '.';
        }
        out.push(s);
    }
    return out;
}

// Builds upper storeys: either aligned on top of interior tiles, or offset by half a tile (pyramid style)
function stackLayers(base, rng, maxLayers) {
    const all = base.map(s => ({ x: s.x, y: s.y, z: 0 }));
    let prev = all.slice();
    const offsetBias = rng();
    for (let z = 1; z < maxLayers; z++) {
        const has = new Set(prev.map(t => t.x + ',' + t.y));
        const H = (x, y) => has.has(x + ',' + y);
        const aligned = prev.filter(t => H(t.x - 2, t.y) && H(t.x + 2, t.y) && (H(t.x, t.y - 2) || H(t.x, t.y + 2))).map(t => ({ x: t.x, y: t.y, z }));
        const offset = prev.filter(t => H(t.x + 2, t.y) && H(t.x, t.y + 2) && H(t.x + 2, t.y + 2)).map(t => ({ x: t.x + 1, y: t.y + 1, z }));
        const layer = rng() < offsetBias ? (offset.length ? offset : aligned) : (aligned.length ? aligned : offset);
        if (!layer.length) break;
        all.push(...layer);
        prev = layer;
    }
    return all;
}

function isCovered(t, list) {
    for (const o of list) {
        if (o !== t && o.z > t.z && Math.abs(o.x - t.x) < 2 && Math.abs(o.y - t.y) < 2) return true;
    }
    return false;
}

// Removes uncovered tiles (outer edges first, in mirror pairs) until the board has `target` tiles
function trimSlots(slots, target, rng) {
    const arr = slots.map(s => ({ ...s }));
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    arr.forEach(t => { minX = Math.min(minX, t.x); maxX = Math.max(maxX, t.x); minY = Math.min(minY, t.y); maxY = Math.max(maxY, t.y); });
    const X = minX + maxX, Y = minY + maxY;
    const removeBest = () => {
        let best = null, bestScore = -Infinity;
        for (const t of arr) {
            if (isCovered(t, arr)) continue;
            const score = Math.abs(t.x * 2 - X) * 0.5 + Math.abs(t.y * 2 - Y) * 0.35 - t.z * 1.5 + rng() * 1.5;
            if (score > bestScore) { bestScore = score; best = t; }
        }
        if (!best) return null;
        arr.splice(arr.indexOf(best), 1);
        return best;
    };
    while (arr.length > target) {
        const t = removeBest();
        if (!t) break;
        if (arr.length > target) {
            const mirror = arr.find(o => o.z === t.z && o.y === t.y && o.x === X - t.x);
            if (mirror && !isCovered(mirror, arr)) arr.splice(arr.indexOf(mirror), 1);
        }
    }
    if (arr.length % 2) removeBest();
    return arr;
}

function generateFormation(rng, targetTiles, maxLayers) {
    const cands = [];
    const big = targetTiles > 70;
    for (let i = 0; i < (big ? 16 : 10); i++) {
        const roll = rng();
        let c;
        if (roll < (big ? 0.08 : 0.2)) {
            const f = rngPick(rng, FORMATIONS);
            c = { name: f.name, slots: f.build().filter(s => s.z < maxLayers) };
        } else if (roll < (big ? 0.25 : 0.55)) {
            const sh = rngPick(rng, SHAPES);
            c = { name: sh.name, slots: stackLayers(maskToSlots(sh.rows), rng, maxLayers) };
        } else {
            const cols = rngInt(rng, big ? 6 : 4, 7), rows = rngInt(rng, big ? 6 : 4, 8);
            let base = maskToSlots(proceduralMask(rng, cols, rows, big));
            // Turtle-style "ears" that block the middle rows from the side
            if (cols <= 5 && rows % 2 === 0 && rng() < 0.4) base = base.concat([{ x: -2, y: rows - 1, z: 0 }, { x: cols * 2, y: rows - 1, z: 0 }]);
            c = { name: `${rngPick(rng, NAME_ADJ)} ${rngPick(rng, NAME_NOUN)}`, slots: stackLayers(base, rng, maxLayers) };
        }
        if (c.slots.length >= 8) cands.push(c);
    }
    if (big && !cands.some(c => c.slots.length >= targetTiles)) {
        // Guaranteed dense fallback: a full half-offset pyramid
        const base = maskToSlots(Array.from({ length: 8 }, () => '#######'));
        cands.push({ name: 'Grand Imperial Pyramid', slots: stackLayers(base, (() => { let first = true; return () => (first ? (first = false, 0.99) : 0); })(), maxLayers) });
    }
    const enough = cands.filter(c => c.slots.length >= targetTiles).sort((a, b) => a.slots.length - b.slots.length);
    const pick = enough.length
        ? enough[Math.floor(rng() * Math.min(3, enough.length))]
        : cands.sort((a, b) => b.slots.length - a.slots.length)[0];
    return { name: pick.name, slots: trimSlots(pick.slots, targetTiles, rng) };
}
