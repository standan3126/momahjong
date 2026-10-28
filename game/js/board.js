/* ============================================================================
   8. BOARD RENDERING & PIXEL-EXACT MOBILE CENTERING
   ============================================================================ */
const TILE_W = 64, TILE_H = 86;
const UNIT_W = 32, UNIT_H = 43;      // half a tile
const LAYER_DX = 7, LAYER_DY = -9;   // each storey shifts up-right
const TILE_DEPTH = 7;                // extruded edge, down-left of the face

function resetLevelRuntime() {
    state.selectedUid = null;
    state.hintedUids = null;
    state.undoStack = [];
    state.chimeStep = 0;
    state.lastMatchAt = 0;
    state.autoCompleting = false;
    state.levelDone = false;
    state.fit = null;
    $('autoCompleteBtn').classList.add('hidden');
    ['noMovesModal', 'completeModal'].forEach(closeModal);
}

function startLevel(levelNum, { restart = false } = {}) {
    // Restarting keeps the record of golden tiles already paid for, so it can't pay twice.
    const keepPaid = restart && state.paidLevel === levelNum;
    state.level = levelNum;
    resetLevelRuntime();
    if (!keepPaid) {
        state.paidGolden = [];
        state.earned = 0;
    }
    state.paidLevel = levelNum;

    const gen = generateBoard(levelNum);
    state.tiles = gen.tiles;
    state.order = gen.order;
    state.formationName = gen.formationName;
    state.modifier = gen.modifier;
    state.isBoss = gen.isBoss;

    showBoard();
    applyLevelHeader();
    renderFullBoard();
    updateAllHUD();

    if (state.replayFrom) announce(`REPLAY · LEVEL ${levelNum}`, '#a7f3d0');
    else if (state.isBoss) {
        announce('BOSS BOARD', '#fca5a5', `Level ${levelNum}`);
        SoundFX.gong();
    } else announce(`LEVEL ${levelNum}`, '#fde68a', state.formationName);
    saveProgress();
    if (!state.tipsSeen) setTimeout(showTips, 900);
}

function restoreBoard(board) {
    state.level = board.level;
    resetLevelRuntime();
    state.tiles = board.tiles.map(t => ({ ...t }));
    state.order = null;
    state.undoStack = board.undoStack || [];
    state.paidGolden = board.paidGolden || [];
    state.paidLevel = board.level;
    state.earned = board.earned || 0;
    state.formationName = board.formationName || 'Sanctuary';
    state.modifier = board.modifier || null;
    state.isBoss = !!board.isBoss;
    showBoard();
    applyLevelHeader();
    renderFullBoard();
    updateAllHUD();
}

// The level and, for a boss or special level, a badge that explains itself when tapped.
function applyLevelHeader() {
    $('levelName').textContent = state.replayFrom ? `Level ${state.level} · replay` : `Level ${state.level}`;
    const mb = $('modifierBadge');
    const special = state.isBoss ? BOSS_BADGE : state.modifier;
    mb.classList.toggle('hidden', !special);
    if (special) mb.textContent = special.name;
}

const BOSS_BADGE = {
    name: '👹 Boss level',
    desc: 'Every 10th level is a boss: a bigger, harder board. It pays double coins.'
};

// Golden and mystery tiles explain themselves: the first time one is tapped, and whenever one
// is pressed and held (a tap still plays as usual).
const TILE_KINDS = {
    golden: { name: '🌟 Golden tile', desc: 'Golden tiles match like any other tile and earn extra coins: 3 with a regular tile, 7 when two golden tiles meet. Each pays once per board. Press and hold a golden tile to read this again.' },
    mystery: { name: '❓ Mystery tile', desc: 'A mystery tile hides its face until it comes free (nothing on top, and its left or right side open). Then it turns face up for good. Tap a covered one to peek for a moment. Press and hold it to read this again.' }
};
const HOLD_MS = 550;
const kindOf = tile => (tile.isGolden ? 'golden' : tile.isMystery && !tile.mysteryRevealed ? 'mystery' : null);

function explainTile(kind) {
    state.explained[kind] = true;
    saveProgress();
    const k = TILE_KINDS[kind];
    showMessage({ title: k.name, text: k.desc, buttons: [{ label: 'Got it', style: 'primary' }] });
}

// Press and hold: explains a golden or mystery tile, and the tap that follows is ignored.
function watchHold(el, tile) {
    let timer = null;
    const stop = () => clearTimeout(timer);
    el.addEventListener('pointerdown', () => {
        stop();
        const kind = kindOf(tile);
        if (!kind) return;
        timer = setTimeout(() => {
            state.heldAt = Date.now();
            buzz(15);
            explainTile(kind);
        }, HOLD_MS);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(e => el.addEventListener(e, stop));
}

function explainSpecial() {
    const special = state.isBoss ? BOSS_BADGE : state.modifier;
    if (!special) return;
    SoundFX.ui();
    showMessage({ title: special.name, text: special.desc, buttons: [{ label: 'Got it', style: 'primary' }] });
}

function renderFullBoard({ shuffleIn = false } = {}) {
    const container = $('boardContainer');
    container.innerHTML = '';
    const maxZ = state.tiles.reduce((m, t) => Math.max(m, t.z), 0);

    // Lower storeys first; within a storey, top rows and right columns first, so each
    // tile's down-left edge tucks under its neighbour like real stacked tiles
    const sorted = [...state.tiles].sort((a, b) => a.z - b.z || a.y - b.y || b.x - a.x);
    const frag = document.createDocumentFragment();

    sorted.forEach((tile, renderOrder) => {
        tile._px = tile.x * UNIT_W + tile.z * LAYER_DX;
        tile._py = tile.y * UNIT_H + tile.z * LAYER_DY;
        if (tile.removed) return;

        const el = document.createElement('div');
        el.id = `tile-${tile.uid}`;
        el.className = `mahjong-tile L${Math.min(tile.z, 4)}${tile.isGolden ? ' golden-tile' : ''}${shuffleIn ? ' shuffle-in' : ''}`;
        el.style.left = `${tile._px}px`;
        el.style.top = `${tile._py}px`;
        el.style.zIndex = `${tile.z * 1000 + renderOrder}`;
        el.style.setProperty('--z', tile.z);
        el.style.setProperty('--shade', ((maxZ - tile.z) * 0.07).toFixed(2));
        if (shuffleIn) el.style.animationDelay = `${(Math.random() * 0.18).toFixed(2)}s`;

        const meta = CATALOG_BY_ID[tile.tileId] || TILE_CATALOG[0];
        const pips = maxZ > 0 ? `<div class="layer-pips">${'<i></i>'.repeat(tile.z + 1)}</div>` : '';
        el.innerHTML = `
            <div class="tile-body">
                <div class="tile-inner">
                    <span class="tile-corner-badge" style="color:${meta.color}; background:rgba(255,255,255,0.88);">${meta.badge}</span>
                    ${tile.isGolden ? '<span class="absolute top-0.5 right-1 text-[11px] z-[4]">🌟</span>' : ''}
                    <div class="w-[88%] h-[88%] flex items-center justify-center pt-1">${getTileSVG(tile.tileId)}</div>
                    ${pips}
                    ${tile.isMystery ? `
                        <div id="mystery-${tile.uid}" class="mystery-cover ${tile.mysteryRevealed ? 'hidden' : ''}">
                            <span class="text-2xl font-extrabold text-amber-300">?</span>
                            <span class="text-[9px] text-purple-200 font-bold uppercase tracking-wider">Mystery</span>
                        </div>` : ''}
                </div>
                <div class="tile-shade"></div>
            </div>`;
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (Date.now() - state.heldAt < 700) return void (state.heldAt = 0);
            onTileTapped(tile.uid);
        });
        watchHold(el, tile);
        frag.appendChild(el);
    });

    container.appendChild(frag);
    if (shuffleIn) setTimeout(() => container.querySelectorAll('.shuffle-in').forEach(el => el.classList.remove('shuffle-in')), 800);
    fitBoard(false);
    refreshBoardInteractivity();
}

// Measures the real drawn extent of the remaining tiles (faces + extruded edges + layer
// offsets) and centres that box exactly in the board area, at the largest scale that fits.
function fitBoard(animate = false) {
    const viewport = $('boardViewport');
    const container = $('boardContainer');
    const active = state.tiles.filter(t => !t.removed && t._px != null);
    if (!active.length || !viewport) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const t of active) {
        minX = Math.min(minX, t._px - TILE_DEPTH);
        maxX = Math.max(maxX, t._px + TILE_W);
        minY = Math.min(minY, t._py);
        maxY = Math.max(maxY, t._py + TILE_H + TILE_DEPTH);
    }
    const pad = 10; // room for the selected-tile lift
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const bw = maxX - minX, bh = maxY - minY;
    const vw = viewport.clientWidth, vh = viewport.clientHeight;
    if (!vw || !vh) return;

    const s = Math.min(vw / bw, vh / bh, 1.5);
    const tx = (vw - bw * s) / 2 - minX * s;
    const ty = (vh - bh * s) / 2 - minY * s;
    if (animate && state.fit && Math.abs(state.fit.s - s) < 0.01 && Math.abs(state.fit.tx - tx) < 3 && Math.abs(state.fit.ty - ty) < 3) return;

    container.classList.toggle('board-anim', animate);
    container.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;
    state.fit = { s, tx, ty };
}
