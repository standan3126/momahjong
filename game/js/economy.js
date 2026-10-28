/* ============================================================================
   7b. COINS AND BOSS LEVELS
       One currency, coins (GameHub's shared coin look; Momahjong's own wallet).
       The user's numbers, 2026-10-28: a level pays 5 (a boss pays double), a golden
       tile matched with a regular tile pays 3, two golden tiles together pay 7, each
       golden tile only once per board. Hint 10, Undo 15, Shuffle 30. Everyone starts
       with 30. No stars to earn (the map marks finished levels), ranks, chests or relics.
   ============================================================================ */
const PRICES = { hint: 10, undo: 15, shuffle: 30 };
const TOOL_NAMES = { hint: 'Hint', undo: 'Undo', shuffle: 'Shuffle' };

const START_COINS = 30;
const COINS_PER_LEVEL = 5;
const COINS_GOLDEN_WITH_REGULAR = 3;
const COINS_GOLDEN_PAIR = 7;

// Little games (minigames.js) pay by how well you do; a perfect game earns the prize.
// Memory Pairs: full prize within 12 turns, one coin less per extra turn, never below 5.
// Odd Tile Out: a fifth of the prize for each of its 5 rounds found on the first tap.
const LITTLE_GAME_PRIZE = 20;
const MEMORY_TURNS = 12;
const MEMORY_FLOOR = 5;
const memoryCoins = turns => Math.max(MEMORY_FLOOR, LITTLE_GAME_PRIZE - Math.max(0, turns - MEMORY_TURNS));
const oddCoins = firstTries => Math.round(LITTLE_GAME_PRIZE * firstTries / 5);

const isBossLevel = level => level % 10 === 0;

// Coins for finishing a level (replays pay the same).
const coinsFor = level => (isBossLevel(level) ? 2 : 1) * COINS_PER_LEVEL;

// Coins for a match: golden tiles pay once each per board (state.paidGolden), so undoing or
// restarting can't earn them twice.
function goldenCoins(a, b) {
    const fresh = [a, b].filter(t => t.isGolden && !state.paidGolden.includes(t.uid));
    fresh.forEach(t => state.paidGolden.push(t.uid));
    if (fresh.length === 2) return COINS_GOLDEN_PAIR;
    if (fresh.length === 1) return COINS_GOLDEN_WITH_REGULAR;
    return 0;
}

const canAfford = kind => state.gold >= PRICES[kind];

function spendTool(kind) {
    state.gold -= PRICES[kind];
    spawnFloatingBanner(`-${PRICES[kind]} ${COIN} for a ${TOOL_NAMES[kind]}`, '#fde68a');
}

function addGold(amount) {
    state.gold += amount;
    bumpEl($('coinsBox'));
}
