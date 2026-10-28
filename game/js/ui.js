/* ============================================================================
   13. HEADER, DOCK, MESSAGES AND THE LAUNCH PAGE
       GameHub's frame (js/hub.js) puts Hub/Home top left and the Settings gear top
       right; the header between them shows the level with its coins, then tiles left
       and matches available (players found the old top bar "too busy").
   ============================================================================ */
const DOCK = { hint: 'btnHint', shuffle: 'btnShuffle', undo: 'btnUndo' };

function bumpEl(el) {
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
}

function updateAllHUD() {
    $('coinsCount').textContent = state.gold.toLocaleString();
    for (const [kind, id] of Object.entries(DOCK)) {
        $(`price-${kind}`).textContent = PRICES[kind];
        $(id).classList.toggle('cant-afford', !canAfford(kind));
    }
}

function openModal(id) {
    const el = $(id);
    if (el) el.classList.remove('hidden');
    SoundFX.ui();
}

function closeModal(id) {
    const el = $(id);
    if (el) el.classList.add('hidden');
}

// Restart this board (from the "no matches" card or Settings). Golden tiles already paid
// for on this board don't pay again.
function restartLevel() {
    ['noMovesModal', 'completeModal'].forEach(closeModal);
    startLevel(state.level, { restart: true });
}

const MSG_BUTTON_STYLES = {
    primary: 'w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-emerald-950 font-extrabold text-sm shadow-lg active:scale-95 transition',
    secondary: 'w-full py-3 rounded-2xl bg-emerald-800 border border-amber-400/40 text-amber-200 font-extrabold text-sm active:scale-95 transition',
    ghost: 'w-full py-2 rounded-2xl text-emerald-300 font-bold text-xs'
};

// A message card. It stays until a button is tapped (nothing flashes past unread).
function showMessage({ icon = '', title = '', text = '', buttons = [] }) {
    $('msgIcon').textContent = icon;
    $('msgIcon').classList.toggle('hidden', !icon);
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

// --- The launch page (Hub top left): Play and Levels in GameHub's usual spots -------
function showLaunch() {
    saveProgress();
    clearInterval(autoNextTimer);
    ['noMovesModal', 'completeModal', 'msgModal'].forEach(closeModal);
    closeMap();
    leaveBreak();
    const level = mainLevel();
    $('launchWhere').textContent = level > 1 ? `Level ${level}` : 'Match the tiles and clear the board';
    $('launchLevels').hidden = level < 2;
    $('launch').classList.remove('hidden');
    frame.setPage('launch');
}

function hideLaunch() {
    $('launch').classList.add('hidden');
}

// The board page (Home top left).
function showBoard() {
    hideLaunch();
    closeMap();
    frame.setPage('play');
    requestAnimationFrame(() => fitBoard(false));
}

function launchPlay() {
    if (state.replayFrom) state.replayFrom = null;
    resumeOrPlay(mainLevel());
}
