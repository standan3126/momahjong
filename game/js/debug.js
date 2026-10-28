/* ============================================================================
   14. DEBUG: ?debug=1 verifies boards are solvable & deterministic
   ============================================================================ */
function verifyGenerated(gen) {
    if (!gen.order) return null;
    const tiles = gen.tiles.map(t => ({ ...t }));
    for (const [a, b] of gen.order) {
        const A = tiles[a], B = tiles[b];
        if (A.tileId !== B.tileId) return 'type mismatch';
        if (!isTileFree(A, tiles) || !isTileFree(B, tiles)) return 'pair not free';
        A.removed = B.removed = true;
    }
    return tiles.every(t => t.removed) ? null : 'tiles left over';
}

function verifyLevels(levels) {
    const failures = [];
    for (const level of levels) {
        const a = generateBoard(level);
        const err = verifyGenerated(a);
        if (err) failures.push({ level, err });
        const b = generateBoard(level);
        if (JSON.stringify(a.tiles) !== JSON.stringify(b.tiles)) failures.push({ level, err: 'not deterministic' });
    }
    return failures;
}
window.__verifyLevels = verifyLevels;
