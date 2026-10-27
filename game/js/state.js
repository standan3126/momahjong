/* ============================================================================
   7. GAME STATE, SETTINGS & 3-SLOT SAVE SYSTEM
   ============================================================================ */
const RANKS = [
    { name: "🌱 Bamboo Novice", minCharms: 0, mult: 1.0, blessingChance: 0.00 },
    { name: "🥈 Silver Disciple", minCharms: 4, mult: 1.2, blessingChance: 0.05 },
    { name: "🟢 Jade Guardian", minCharms: 10, mult: 1.5, blessingChance: 0.09 },
    { name: "🟡 Golden Sage", minCharms: 18, mult: 1.8, blessingChance: 0.12 },
    { name: "👑 Imperial Master", minCharms: 30, mult: 2.2, blessingChance: 0.16 }
];

const settings = { sound: true, music: false, haptics: true, highlightFree: true, autoNext: false, volume: 0.8 };
const SLOT_KEY = n => `jadeSanctuary_slot${n}`;
const SETTINGS_KEY = 'jadeSanctuary_settings';
const LEGACY_KEY = 'jadeSanctuaryMahjong_v1';
const newInventory = () => ({ hint: 3, shuffle: 2, undo: 3, torch: 1, eagle: 1 });

let currentSlot = null;
let state = freshState();

function freshState() {
    return {
        level: 1,
        score: 0,
        charms: 0,
        inventory: newInventory(),
        tutorialDone: false,
        returnLevel: null,
        seen: { torch: false, eagle: false },
        streak: 0,
        bestStreak: 0,
        bestCombo: 0,
        levelsCleared: 0,
        // Active level runtime state
        tiles: [],
        order: null,
        selectedUid: null,
        hintedUids: null,
        undoStack: [],
        combo: 0,
        comboDeadline: 0,
        comboWindow: 5500,
        eagleEyeActive: false,
        chestSpinsEarned: 1,
        chestSpinsRemaining: 0,
        wheelRotation: 0,
        isSpinning: false,
        autoCompleting: false,
        levelDone: false,
        formationName: '',
        modifier: null,
        isBoss: false,
        levelStartTime: Date.now(),
        itemsUsed: 0,
        fit: null
    };
}

function storageGet(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}
function storageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('Storage save failed:', e);
    }
}
function storageDel(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
}

function loadSettings() {
    const saved = storageGet(SETTINGS_KEY);
    if (saved) Object.assign(settings, saved);
}
function saveSettings() {
    storageSet(SETTINGS_KEY, settings);
}

// The old single save (v1) moves into slot 1; its levels had no training, so they map to 20 + N
function migrateLegacy() {
    const old = storageGet(LEGACY_KEY);
    if (!old || storageGet(SLOT_KEY(1)) || storageGet('jadeSanctuary_migrated')) return;
    storageSet(SLOT_KEY(1), {
        v: 2,
        level: TRAINING_LEVELS + (old.level || 1),
        score: old.score || 0,
        charms: old.charms || 0,
        inventory: { ...newInventory(), ...(old.inventory || {}) },
        tutorialDone: true,
        seen: { torch: true, eagle: true },
        streak: 0, bestStreak: 0, bestCombo: 0,
        levelsCleared: Math.max(0, (old.level || 1) - 1),
        lastPlayed: Date.now(),
        board: null
    });
    if (old.settings) {
        if (typeof old.settings.sound === 'boolean') settings.sound = old.settings.sound;
        if (typeof old.settings.highlightFree === 'boolean') settings.highlightFree = old.settings.highlightFree;
        saveSettings();
    }
    storageSet('jadeSanctuary_migrated', true);
}

function nextLevelAfter(level) {
    return level === TRAINING_LEVELS && state.returnLevel ? state.returnLevel : level + 1;
}

function saveProgress() {
    if (!currentSlot) return;
    const data = {
        v: 2,
        level: state.levelDone ? nextLevelAfter(state.level) : state.level,
        score: state.score,
        charms: state.charms,
        inventory: state.inventory,
        tutorialDone: state.tutorialDone,
        returnLevel: state.returnLevel,
        seen: state.seen,
        streak: state.streak,
        bestStreak: state.bestStreak,
        bestCombo: state.bestCombo,
        levelsCleared: state.levelsCleared,
        lastPlayed: Date.now(),
        board: null
    };
    // Resume mid-level (scripted lessons simply restart instead)
    if (!state.levelDone && state.level > 12 && state.tiles.length) {
        data.board = {
            level: state.level,
            tiles: state.tiles.map(t => ({ uid: t.uid, x: t.x, y: t.y, z: t.z, tileId: t.tileId, removed: t.removed, isGolden: t.isGolden, isMystery: t.isMystery, mysteryRevealed: t.mysteryRevealed })),
            undoStack: state.undoStack,
            chestSpinsEarned: state.chestSpinsEarned,
            eagleEyeActive: state.eagleEyeActive,
            formationName: state.formationName,
            modifier: state.modifier,
            isBoss: state.isBoss,
            comboWindow: state.comboWindow,
            itemsUsed: state.itemsUsed,
            elapsed: (Date.now() - state.levelStartTime) / 1000
        };
    }
    storageSet(SLOT_KEY(currentSlot), data);
}

function getCurrentRank(charms = state.charms) {
    let current = RANKS[0];
    for (const r of RANKS) if (charms >= r.minCharms) current = r;
    return current;
}

function getNextRankProgress() {
    for (let i = 0; i < RANKS.length; i++) {
        if (state.charms < RANKS[i].minCharms) {
            const prev = RANKS[i - 1].minCharms;
            const span = RANKS[i].minCharms - prev;
            return Math.min(100, Math.round(((state.charms - prev) / span) * 100));
        }
    }
    return 100;
}
