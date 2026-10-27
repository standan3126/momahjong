/* ============================================================================
   7. GAME STATE, SETTINGS & 3-SLOT SAVE SYSTEM
   ============================================================================ */
// breakEvery: a little game after every Nth level (0 = never); breakKinds: which ones play.
const settings = { sound: true, music: false, haptics: true, highlightFree: true, autoNext: false, volume: 0.8, breakEvery: 4, breakKinds: ['memory', 'odd', 'sort'] };
const SLOT_KEY = n => `jadeSanctuary_slot${n}`;
const SETTINGS_KEY = 'jadeSanctuary_settings';
const LEGACY_KEY = 'jadeSanctuaryMahjong_v1';
const SAVE_VERSION = 3;
const newInventory = () => ({ hint: 0, shuffle: 0, undo: 0, torch: 0, eagle: 0 });
const noToolsUsed = () => ({ hint: 0, shuffle: 0, undo: 0, torch: 0, eagle: 0 });

let currentSlot = null;
let state = freshState();

function freshState() {
    return {
        level: 1,
        score: 0,
        charms: 0,
        gold: 0,
        stars: {},              // level -> best stars won (1-3)
        replayFrom: null,       // while replaying an old level: the level to return to
        breakCount: 0,          // levels since the last little game
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
        chimeStep: 0,
        lastMatchAt: 0,
        eagleEyeActive: false,
        wheelRotation: 0,
        isSpinning: false,
        autoCompleting: false,
        levelDone: false,
        formationName: '',
        modifier: null,
        isBoss: false,
        levelStartTime: Date.now(),
        itemsUsed: 0,
        toolsUsed: noToolsUsed(),
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
        level: 20 + (old.level || 1), // the training was 20 levels long then
        score: old.score || 0,
        charms: old.charms || 0,
        inventory: { hint: 3, shuffle: 2, undo: 3, torch: 1, eagle: 1, ...(old.inventory || {}) },
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

// Saves from before gold and stars (v2) keep everything and gain: 100 gold to start
// with, and 2 stars for every level already won past the lessons.
function upgradeSave(d) {
    if ((d.v || 2) >= SAVE_VERSION) return d;
    const up = { ...d, v: SAVE_VERSION, gold: d.gold ?? STARTER_PACK.gold, stars: { ...(d.stars || {}) } };
    // Training used to be 20 levels; a player partway through the old trials who was
    // replaying training goes back to where they were.
    if (up.returnLevel && up.level > TRAINING_LEVELS) {
        up.level = up.returnLevel;
        up.returnLevel = null;
        up.board = null;
    }
    for (let l = TRAINING_LEVELS + 1; l < (up.level || 1); l++) up.stars[l] ??= LEGACY_STARS;
    return up;
}

function saveProgress() {
    if (!currentSlot) return;
    const data = {
        v: SAVE_VERSION,
        level: state.replayFrom ?? (state.levelDone ? nextLevelAfter(state.level) : state.level),
        score: state.score,
        charms: state.charms,
        gold: state.gold,
        stars: state.stars,
        breakCount: state.breakCount,
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
    // Resume mid-level (scripted lessons and replays simply restart instead)
    if (!state.levelDone && !state.replayFrom && state.level > TRAINING_LEVELS && state.tiles.length) {
        data.board = {
            level: state.level,
            tiles: state.tiles.map(t => ({ uid: t.uid, x: t.x, y: t.y, z: t.z, tileId: t.tileId, removed: t.removed, isGolden: t.isGolden, isMystery: t.isMystery, mysteryRevealed: t.mysteryRevealed })),
            undoStack: state.undoStack,
            eagleEyeActive: state.eagleEyeActive,
            formationName: state.formationName,
            modifier: state.modifier,
            isBoss: state.isBoss,
            itemsUsed: state.itemsUsed,
            toolsUsed: state.toolsUsed,
            elapsed: (Date.now() - state.levelStartTime) / 1000
        };
    }
    storageSet(SLOT_KEY(currentSlot), data);
}
