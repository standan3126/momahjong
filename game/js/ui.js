/* ============================================================================
   13. HUD, MODALS, SETTINGS & TITLE / SAVE-SLOT SCREEN
   ============================================================================ */
let prevInventory = {};
const DOCK = { hint: ['badgeHint', 'btnHint'], shuffle: ['badgeShuffle', 'btnShuffle'], undo: ['badgeUndo', 'btnUndo'], torch: ['badgeTorch', 'btnTorch'], eagle: ['badgeEagle', 'btnEagle'] };

function bumpEl(el) {
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
}

function updateAllHUD() {
    $('starTotal').textContent = `⭐ ${totalStars()}`;
    $('rankTitle').textContent = getCurrentRank().name;
    $('rankProgressBar').style.width = `${getNextRankProgress()}%`;
    $('goldCount').textContent = state.gold.toLocaleString();
    for (const [key, [badgeId, btnId]] of Object.entries(DOCK)) {
        const n = state.inventory[key];
        // When you have none, the badge shows the price: tapping buys one with gold.
        $(badgeId).innerHTML = n > 0 ? n : `${COIN}${PRICES[key]}`;
        $(badgeId).classList.toggle('price', n <= 0);
        $(btnId).classList.toggle('opacity-60', !canAfford(key));
        if (prevInventory[key] != null && n > prevInventory[key]) bumpEl($(btnId));
        prevInventory[key] = n;
    }
    $('newTorch').classList.toggle('hidden', state.seen.torch || state.level <= TRAINING_LEVELS || state.inventory.torch <= 0);
    $('newEagle').classList.toggle('hidden', state.seen.eagle || state.level <= TRAINING_LEVELS || state.inventory.eagle <= 0);
}

function syncSettingsUI() {
    $('toggleSound').checked = settings.sound;
    $('toggleMusic').checked = settings.music;
    $('toggleHaptics').checked = settings.haptics;
    $('toggleHighlightFree').checked = settings.highlightFree;
    $('toggleAutoNext').checked = settings.autoNext;
    $('volumeSlider').value = Math.round(settings.volume * 100);
    $('volumeLabel').textContent = `${Math.round(settings.volume * 100)}%`;
    $('breakEvery').value = String(settings.breakEvery);
    $('breakMemory').checked = settings.breakKinds.includes('memory');
    $('breakOdd').checked = settings.breakKinds.includes('odd');
    $('breakSort').checked = settings.breakKinds.includes('sort');
    const inTraining = state.level <= TRAINING_LEVELS && (!state.tutorialDone || state.returnLevel);
    $('skipTrainingBtn').classList.toggle('hidden', !inTraining);
}

function updateSettings() {
    settings.sound = $('toggleSound').checked;
    settings.music = $('toggleMusic').checked;
    settings.haptics = $('toggleHaptics').checked;
    settings.highlightFree = $('toggleHighlightFree').checked;
    settings.autoNext = $('toggleAutoNext').checked;
    settings.volume = Number($('volumeSlider').value) / 100;
    settings.breakEvery = Number($('breakEvery').value);
    settings.breakKinds = [['memory', 'breakMemory'], ['odd', 'breakOdd'], ['sort', 'breakSort']].filter(([, id]) => $(id).checked).map(([k]) => k);
    $('volumeLabel').textContent = `${Math.round(settings.volume * 100)}%`;
    SoundFX.init();
    SoundFX.applyVolumes();
    if (settings.music) SoundFX.startMusic();
    else SoundFX.stopMusic();
    refreshBoardInteractivity();
    saveSettings();
}

function openModal(id) {
    if ((id === 'guideModal' || id === 'settingsModal') && Tutorial.blocking()) {
        Tutorial.nudge();
        return;
    }
    if (id === 'settingsModal') syncSettingsUI();
    const el = $(id);
    if (el) el.classList.remove('hidden');
    SoundFX.ui();
}

function closeModal(id) {
    const el = $(id);
    if (el) el.classList.add('hidden');
}

function restartLevel() {
    ['noMovesModal', 'settingsModal'].forEach(closeModal);
    startLevel(state.level, { restart: true });
}

const MSG_BUTTON_STYLES = {
    primary: 'w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 font-extrabold text-sm shadow-lg active:scale-95 transition',
    secondary: 'w-full py-3 rounded-2xl bg-emerald-800 border border-amber-400/40 text-amber-200 font-extrabold text-sm active:scale-95 transition',
    danger: 'w-full py-3 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-extrabold text-sm active:scale-95 transition',
    ghost: 'w-full py-2 rounded-2xl text-emerald-300 font-bold text-xs'
};

function showMessage({ icon = '', title = '', text = '', buttons = [] }) {
    $('msgIcon').textContent = icon;
    $('msgTitle').textContent = title;
    $('msgText').textContent = text;
    const wrap = $('msgButtons');
    wrap.innerHTML = '';
    buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.className = MSG_BUTTON_STYLES[b.style || 'secondary'];
        btn.textContent = b.label;
        btn.onclick = () => {
            closeModal('msgModal');
            SoundFX.ui();
            if (b.onClick) b.onClick();
        };
        wrap.appendChild(btn);
    });
    $('msgModal').classList.remove('hidden');
}

function timeAgo(ts) {
    const s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    return `${Math.floor(s / 86400)} days ago`;
}

const slotStars = d => Object.values(upgradeSave(d).stars).reduce((a, b) => a + b, 0);

function renderSlots() {
    const list = $('slotList');
    let html = '';
    for (let n = 1; n <= 3; n++) {
        const d = storageGet(SLOT_KEY(n));
        if (d) {
            const training = d.level <= TRAINING_LEVELS && (!d.tutorialDone || d.returnLevel);
            html += `
            <div class="pop-in bg-emerald-950/90 border-2 border-amber-400/60 rounded-3xl p-3 shadow-xl flex items-center gap-3">
                <button onclick="slotContinue(${n})" class="flex-1 min-w-0 text-left active:scale-95 transition">
                    <div class="text-[10px] font-extrabold tracking-widest text-emerald-300/80 uppercase">Slot ${n} · ${timeAgo(d.lastPlayed || 0)}</div>
                    <div class="font-serif-asian font-extrabold text-amber-300 text-lg leading-tight truncate">Level ${d.level}${training ? ' · 🎓 Training' : ''}</div>
                    <div class="text-xs text-white font-bold truncate">⭐ ${slotStars(d)} · ${COIN} ${upgradeSave(d).gold} · ${getCurrentRank(slotStars(d)).name}</div>
                </button>
                <div class="flex flex-col gap-1.5 shrink-0">
                    <button onclick="slotContinue(${n})" class="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 font-extrabold text-xs active:scale-95 transition">▶ Play</button>
                    <button onclick="slotDelete(${n})" class="px-3 py-1.5 rounded-xl bg-black/40 border border-red-400/40 text-red-300 font-bold text-[11px] active:scale-95 transition">🗑 Delete</button>
                </div>
            </div>`;
        } else {
            html += `
            <button onclick="slotNew(${n})" class="pop-in w-full bg-black/30 border-2 border-dashed border-emerald-500/50 rounded-3xl p-4 text-left active:scale-95 transition">
                <div class="text-[10px] font-extrabold tracking-widest text-emerald-300/80 uppercase">Slot ${n} · Empty</div>
                <div class="font-serif-asian font-extrabold text-amber-200 text-lg">✨ New Game</div>
            </button>`;
        }
    }
    list.innerHTML = html;
}

function buildTitleTiles() {
    $('titleTiles').innerHTML = ['w1', 'w6', 't4'].map((id, i) => {
        const meta = CATALOG_BY_ID[id];
        return `
        <div class="title-tile" style="--r:${(i - 1) * 8}deg; animation-delay:${i * 0.4}s;">
            <div class="mahjong-tile ${i === 1 ? 'L2 golden-tile' : 'L0'}" style="--z:1">
                <div class="tile-body"><div class="tile-inner">
                    <span class="tile-corner-badge" style="color:${meta.color}; background:rgba(255,255,255,0.88);">${meta.badge}</span>
                    <div class="w-[88%] h-[88%] flex items-center justify-center pt-1">${getTileSVG(id)}</div>
                </div></div>
            </div>
        </div>`;
    }).join('');
}

function showTitle() {
    renderSlots();
    $('titleScreen').classList.remove('hidden');
}

function hideTitle() {
    $('titleScreen').classList.add('hidden');
}

function slotNew(n) {
    showMessage({
        icon: '🐼',
        title: 'New Adventure',
        text: `Start with the ${TRAINING_LEVELS}-level Sanctuary Training? It teaches the controls, the screen and the power-ups step by step. Skipping it gives you the same starting gold and power-ups.`,
        buttons: [
            { label: '🎓 Start Training (recommended)', style: 'primary', onClick: () => beginNewGame(n, false) },
            { label: `⚡ Skip to Level ${TRAINING_LEVELS + 1}`, style: 'secondary', onClick: () => beginNewGame(n, true) },
            { label: 'Cancel', style: 'ghost' }
        ]
    });
}

function beginNewGame(n, skipTraining) {
    currentSlot = n;
    state = freshState();
    prevInventory = {};
    if (skipTraining) {
        giveStarterPack();
        state.tutorialDone = true;
        state.level = TRAINING_LEVELS + 1;
    }
    hideTitle();
    startLevel(state.level);
}

function slotContinue(n) {
    const saved = storageGet(SLOT_KEY(n));
    if (!saved) return slotNew(n);
    const d = upgradeSave(saved);
    currentSlot = n;
    state = freshState();
    prevInventory = {};
    state.level = Math.max(1, d.level || 1);
    state.score = d.score || 0;
    state.charms = d.charms || 0;
    state.gold = d.gold || 0;
    state.stars = d.stars || {};
    state.breakCount = d.breakCount || 0;
    state.inventory = { ...newInventory(), ...(d.inventory || {}) };
    state.tutorialDone = !!d.tutorialDone || state.level > TRAINING_LEVELS;
    state.returnLevel = state.level > TRAINING_LEVELS ? null : (d.returnLevel || null);
    state.seen = { torch: false, eagle: false, ...(d.seen || {}) };
    state.streak = d.streak || 0;
    state.bestStreak = d.bestStreak || 0;
    state.bestCombo = d.bestCombo || 0;
    state.levelsCleared = d.levelsCleared || 0;
    hideTitle();
    if (d.board && d.board.level === state.level && state.level > TRAINING_LEVELS) restoreBoard(d.board);
    else playLevel(state.level);
}

function slotDelete(n) {
    showMessage({
        icon: '🗑️',
        title: `Delete Slot ${n}?`,
        text: 'This permanently erases this save. It cannot be undone.',
        buttons: [
            { label: 'Delete forever', style: 'danger', onClick: () => { storageDel(SLOT_KEY(n)); renderSlots(); } },
            { label: 'Keep it', style: 'ghost' }
        ]
    });
}

function goMainMenu() {
    saveProgress();
    Tutorial.clear();
    clearInterval(autoNextTimer);
    ['settingsModal', 'guideModal', 'chestModal', 'noMovesModal'].forEach(closeModal);
    currentSlot = null;
    state = freshState();
    $('boardContainer').innerHTML = '';
    showTitle();
}
