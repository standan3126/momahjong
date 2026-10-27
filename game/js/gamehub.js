/* ============================================================================
   13d. LIVING IN GAMEHUB: EXIT, MOVING PROGRESS, GROWN-UP TOOLS, OFFLINE
        The shared toolbox is loaded from GameHub (/shared/v1/). Outside GameHub
        (testing at home) these extras say so instead of working.
   ============================================================================ */
const GAME_ID = 'momahjong';
const HUB_URL = '/';
const toolbox = file => import(`/shared/v1/${file}`);

function goHub() {
    saveProgress();
    location.href = HUB_URL;
}

// --- Moving progress: a transfer code or a backup file of the current save slot ------
function slotData() {
    saveProgress();
    const d = { ...storageGet(SLOT_KEY(currentSlot)) };
    delete d.board; // a half-played board doesn't travel; the level just starts fresh
    return d;
}

function restoreSlot(data) {
    if (!data || typeof data.level !== 'number') throw new Error("That isn't Momahjong progress.");
    storageSet(SLOT_KEY(currentSlot), { ...upgradeSave(data), board: null, lastPlayed: Date.now() });
    closeModal('settingsModal');
    slotContinue(currentSlot);
    spawnFloatingBanner(`✅ Progress restored: Level ${state.level}`, '#a7f3d0');
}

const moveNote = text => ($('moveNote').textContent = text);

async function makeMoveCode() {
    try {
        const { makeTransferCode } = await toolbox('save.js');
        const box = $('moveCode');
        box.classList.remove('hidden');
        $('useMoveCode').classList.add('hidden');
        box.value = makeTransferCode(GAME_ID, slotData());
        box.select();
        try {
            await navigator.clipboard.writeText(box.value);
            moveNote('Code copied. Paste it into Momahjong on the other phone or app.');
        } catch {
            moveNote('Copy this code, then paste it into Momahjong on the other phone or app.');
        }
    } catch {
        moveNote('Moving progress works inside GameHub.');
    }
}

function enterMoveCode() {
    const box = $('moveCode');
    box.classList.remove('hidden');
    box.value = '';
    $('useMoveCode').classList.remove('hidden');
    box.focus();
    moveNote(`Pasting a code replaces the progress in this save slot (Slot ${currentSlot}).`);
}

async function useMoveCode() {
    try {
        const { readTransferCode } = await toolbox('save.js');
        restoreSlot(readTransferCode($('moveCode').value, GAME_ID));
    } catch (e) {
        moveNote(e.message || 'Moving progress works inside GameHub.');
    }
}

async function saveMoveFile() {
    try {
        const { saveBackupFile } = await toolbox('save.js');
        await saveBackupFile(GAME_ID, slotData());
    } catch {
        moveNote('Moving progress works inside GameHub.');
    }
}

async function loadMoveFile() {
    try {
        const { openBackupFile } = await toolbox('save.js');
        restoreSlot(await openBackupFile(GAME_ID));
    } catch (e) {
        moveNote(e.message || 'Moving progress works inside GameHub.');
    }
}

// --- Grown-up tools: tap the Settings heading 5 times, then the family code ---------
let secretTaps = [];
function settingsHeadingTap() {
    const now = Date.now();
    secretTaps = [...secretTaps.filter(t => now - t < 2500), now];
    if (secretTaps.length < 5) return;
    secretTaps = [];
    $('secretCodeRow').classList.remove('hidden');
    $('secretCode').focus();
}

async function checkSecretCode() {
    const input = $('secretCode');
    let ok = false;
    try {
        ok = await (await toolbox('secret.js')).checkCode(input.value);
    } catch {
        input.placeholder = 'Only inside GameHub';
    }
    input.value = '';
    if (!ok) {
        if (input.placeholder !== 'Only inside GameHub') input.placeholder = 'Not quite. Try again';
        return;
    }
    $('secretCodeRow').classList.add('hidden');
    $('grownUpTools').classList.remove('hidden');
    $('setLevelInput').value = mainLevel();
    $('setGoldInput').value = state.gold;
}

// For when progress is lost: set the level and gold. Won levels without stars count as
// two stars, as for saves from before stars, so boss gates behave.
function setProgressByHand() {
    const level = Math.max(1, Math.floor(Number($('setLevelInput').value)) || 1);
    const gold = Math.max(0, Math.floor(Number($('setGoldInput').value)) || 0);
    state.replayFrom = null;
    state.gold = gold;
    for (let l = TRAINING_LEVELS + 1; l < level; l++) state.stars[l] ??= LEGACY_STARS;
    if (level > TRAINING_LEVELS && !state.tutorialDone) {
        giveStarterPack();
        state.tutorialDone = true;
        state.gold = gold;
    }
    $('grownUpNote').textContent = `Set to Level ${level} with ${gold} gold.`;
    closeModal('settingsModal');
    playLevel(level);
    updateAllHUD();
    saveProgress();
}

// --- Offline: once settled, ask GameHub to save every file of the game ---------------
window.addEventListener('load', () => {
    setTimeout(() => toolbox('kit.js').then(kit => kit.warmOffline('offline-files.json')).catch(() => {}), 4000);
});
