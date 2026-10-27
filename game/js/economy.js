/* ============================================================================
   7b. GOLD, STARS, RANKS & BOSS GATES
       Power-ups cost gold once your own run out. Each endless level pays gold
       and 1-3 stars; stars raise your rank and open the boss levels.
   ============================================================================ */
const PRICES = { undo: 10, hint: 15, shuffle: 25, torch: 40, eagle: 40 };
const TOOL_NAMES = { hint: 'Hint', shuffle: 'Shuffle', undo: 'Undo', torch: 'Dragon Torch', eagle: 'Eagle Eye' };

// What finishing training leaves you with. Skipping it gives exactly the same.
const STARTER_PACK = { gold: 100, inventory: { hint: 2, shuffle: 1, undo: 2, torch: 1, eagle: 1 } };

const GOLD_PER_LEVEL = 10;
const GOLD_PER_STAR = 5;
const GOLD_PER_GOLDEN_PAIR = 5;
const CHEST_EVERY = 5;

// Each boss needs this many of the 27 stars from the 9 levels before it: about two stars
// a level, so a round or two may need replaying, never more.
const BOSS_STARS_NEEDED = 16;
// Levels won before stars existed count as this many (replay them for more).
const LEGACY_STARS = 2;

const RANKS = [
    { name: '🌱 Bamboo Novice', minStars: 0, blessingChance: 0.00 },
    { name: '🥈 Silver Disciple', minStars: 25, blessingChance: 0.05 },
    { name: '🟢 Jade Guardian', minStars: 75, blessingChance: 0.09 },
    { name: '🟡 Golden Sage', minStars: 150, blessingChance: 0.12 },
    { name: '👑 Imperial Master', minStars: 300, blessingChance: 0.16 }
];

const isBossLevel = level => level > TRAINING_LEVELS && level % 10 === 0;
const isChestLevel = level => level > TRAINING_LEVELS && level % CHEST_EVERY === 0;
const isTrainingLevel = level => level <= TRAINING_LEVELS;

// ★ for finishing; ★★ with at most one hint or undo (no shuffle or relics); ★★★ with no
// power-ups at all. A free rescue shuffle (when no moves are left) never costs a star.
// Lessons always give three: they make you use the power-ups on purpose.
function starsFor(level, used) {
    if (isTrainingLevel(level)) return 3;
    const total = Object.values(used).reduce((a, b) => a + b, 0);
    if (total === 0) return 3;
    if (!used.shuffle && !used.torch && !used.eagle && used.hint + used.undo <= 1) return 2;
    return 1;
}

// Gold for finishing: lessons pay nothing (training pays the starter pack at the end),
// bosses pay double, and replaying a level you've already won pays half.
function goldFor(level, stars, replay) {
    if (isTrainingLevel(level)) return 0;
    let gold = GOLD_PER_LEVEL + stars * GOLD_PER_STAR;
    if (isBossLevel(level)) gold *= 2;
    if (replay) gold = Math.round(gold / 2);
    return gold;
}

const starsOf = level => state.stars[level] || 0;
const totalStars = () => Object.values(state.stars).reduce((a, b) => a + b, 0);

function getCurrentRank(stars = totalStars()) {
    let current = RANKS[0];
    for (const r of RANKS) if (stars >= r.minStars) current = r;
    return current;
}

function getNextRankProgress() {
    const stars = totalStars();
    for (let i = 1; i < RANKS.length; i++) {
        if (stars < RANKS[i].minStars) {
            const prev = RANKS[i - 1].minStars;
            return Math.min(100, Math.round(((stars - prev) / (RANKS[i].minStars - prev)) * 100));
        }
    }
    return 100;
}

// The stars a boss level asks for, from the 9 levels before it.
function bossGate(level) {
    let have = 0;
    for (let l = level - 9; l < level; l++) have += starsOf(l);
    return { need: BOSS_STARS_NEEDED, have, from: level - 9, to: level - 1, open: have >= BOSS_STARS_NEEDED };
}

// --- Using power-ups: your own first, then gold -------------------------------------
const canAfford = kind => state.inventory[kind] > 0 || state.gold >= PRICES[kind];

function spendTool(kind) {
    if (state.inventory[kind] > 0) state.inventory[kind]--;
    else {
        state.gold -= PRICES[kind];
        spawnFloatingBanner(`-${PRICES[kind]} 🪙 for a ${TOOL_NAMES[kind]}`, '#fde68a');
    }
    state.toolsUsed[kind]++;
    state.itemsUsed++;
}

function addGold(amount) {
    state.gold += amount;
    bumpEl($('goldBox'));
}

// --- The treasure chest: one spin, one of four prizes, amounts vary -----------------
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const CHEST_PRIZES = [
    { icon: '🪙', name: 'Gold Pouch', color: '#92400e', weight: 40, roll: () => ({ gold: randInt(20, 40) }) },
    { icon: '🧰', name: 'Helpers', color: '#065f46', weight: 35, roll: () => {
        const got = { hint: 0, undo: 0, shuffle: 0 };
        const n = randInt(2, 3);
        for (let i = 0; i < n; i++) got[['hint', 'undo', 'shuffle'][randInt(0, 2)]]++;
        return got;
    } },
    { icon: '💰', name: 'Gold Chest', color: '#a16207', weight: 15, roll: () => ({ gold: randInt(60, 100) }) },
    { icon: '🐉', name: 'Rare Relic', color: '#7c2d12', weight: 10, roll: () => (Math.random() < 0.5 ? { torch: 1 } : { eagle: 1 }) }
];

function pickChestPrize() {
    let r = Math.random() * CHEST_PRIZES.reduce((a, p) => a + p.weight, 0);
    for (let i = 0; i < CHEST_PRIZES.length; i++) {
        r -= CHEST_PRIZES[i].weight;
        if (r < 0) return i;
    }
    return 0;
}

// Words for a prize like { gold: 35 } or { hint: 2, undo: 1 }.
function describePrize(got) {
    const icons = { gold: '🪙', hint: '💡', shuffle: '🌪️', undo: '📜', torch: '🔥', eagle: '🦅' };
    const names = { gold: 'gold', ...TOOL_NAMES };
    return Object.entries(got).filter(([, n]) => n > 0).map(([k, n]) => `${icons[k]} ${n} ${names[k]}${n > 1 && k !== 'gold' ? 's' : ''}`).join(' · ');
}
