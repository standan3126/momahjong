/* ============================================================================
   7. GAME STATE AND THE SAVE
      One save per phone (no slots: everyone has their own phone), stored under
      "momahjong:save" like every GameHub game's saves (contract rule 5). On 2026-10-28
      everyone started over at level 1 with 30 coins (the user's choice: "reset so it
      means something"); the old site's jadeSanctuary_* saves are left alone for it.
      Settings live in GameHub's shared panel (js/hub.js); `settings` is its object.
   ============================================================================ */
let settings = { highlightFree: true, autoNext: false, haptics: true, breakEvery: 4, breakKinds: ['memory', 'odd'] };
const SAVE_KEY = 'momahjong:save';
const SAVE_VERSION = 1;

let state = freshState();

function freshState() {
    return {
        level: 1,
        gold: START_COINS,
        stars: {},              // level -> true once finished (a star on the map, nothing more)
        replayFrom: null,       // while replaying an old level: the level to return to
        breakCount: 0,          // levels since the last little game
        levelsCleared: 0,
        tipsSeen: false,
        explained: {},          // golden / mystery: true once its explanation has been shown
        heldAt: 0,              // when a tile was last pressed and held (its tap is ignored)
        // Active level runtime state
        tiles: [],
        order: null,
        selectedUid: null,
        hintedUids: null,
        undoStack: [],
        paidGolden: [],         // golden tiles already paid for on this board
        paidLevel: null,        // the level paidGolden belongs to (kept on a restart)
        earned: 0,              // coins earned on this board, for the "complete" card
        chimeStep: 0,
        lastMatchAt: 0,
        autoCompleting: false,
        levelDone: false,
        formationName: '',
        modifier: null,
        isBoss: false,
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

// Reads the save into `state` (a fresh start if there is none). Returns the saved
// half-played board, if any.
function loadSave() {
    const d = storageGet(SAVE_KEY);
    state = freshState();
    if (!d) return null;
    state.level = Math.max(1, d.level || 1);
    state.gold = d.gold ?? START_COINS;
    state.stars = d.stars || {};
    state.breakCount = d.breakCount || 0;
    state.levelsCleared = d.levelsCleared || 0;
    state.tipsSeen = !!d.tipsSeen;
    state.explained = d.explained || {};
    return d.board || null;
}

function saveProgress() {
    const data = {
        v: SAVE_VERSION,
        level: mainLevel(),
        gold: state.gold,
        stars: state.stars,
        breakCount: state.breakCount,
        levelsCleared: state.levelsCleared,
        tipsSeen: state.tipsSeen,
        explained: state.explained,
        board: null
    };
    // Resume mid-level (replays simply restart instead)
    if (!state.levelDone && !state.replayFrom && state.tiles.length) {
        data.board = {
            level: state.level,
            tiles: state.tiles.map(t => ({ uid: t.uid, x: t.x, y: t.y, z: t.z, tileId: t.tileId, removed: t.removed, isGolden: t.isGolden, isMystery: t.isMystery, mysteryRevealed: t.mysteryRevealed })),
            undoStack: state.undoStack,
            paidGolden: state.paidGolden,
            earned: state.earned,
            formationName: state.formationName,
            modifier: state.modifier,
            isBoss: state.isBoss
        };
    }
    storageSet(SAVE_KEY, data);
}

// The level the player has reached (not one being replayed).
const mainLevel = () => state.replayFrom ?? (state.levelDone ? state.level + 1 : state.level);
