/* ============================================================================
   3. SEEDED RANDOMNESS — level N always builds the same board, so levels are
      infinite without storing anything (level 10 or 10,000,000 costs 0 bytes)
   ============================================================================ */
function mulberry32(a) {
    return function () {
        a |= 0;
        a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function hashSeed(n, salt = 0) {
    let h = (2166136261 ^ salt) >>> 0;
    const s = String(n);
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
    return h >>> 0;
}
function rngShuffle(arr, rng) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
const rngInt = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const rngPick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
