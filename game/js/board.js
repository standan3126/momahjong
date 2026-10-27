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
    state.combo = 0;
    state.comboDeadline = 0;
    state.comboWindow = 5500;
    state.eagleEyeActive = false;
    state.chestSpinsEarned = 1;
    state.autoCompleting = false;
    state.levelDone = false;
    state.itemsUsed = 0;
    state.levelStartTime = Date.now();
    state.fit = null;
    $('eagleEyeActiveBadge').classList.add('hidden');
    $('eagleEyeActiveBadge').classList.remove('flex');
    $('autoCompleteBtn').classList.add('hidden');
    ['noMovesModal', 'chestModal'].forEach(closeModal);
}

function startLevel(levelNum, { restart = false } = {}) {
    state.level = levelNum;
    resetLevelRuntime();
    if (restart) state.streak = 0;

    const gen = generateBoard(levelNum);
    state.tiles = gen.tiles;
    state.order = gen.order;
    state.formationName = gen.formationName;
    state.modifier = gen.modifier;
    state.isBoss = gen.isBoss;
    if (state.modifier && state.modifier.id === 'speed') state.comboWindow = 8000;
    if (state.isBoss) state.chestSpinsEarned = 2;

    applyLevelHeader();
    renderFullBoard();
    updateAllHUD();

    if (levelNum <= 12) {
        Tutorial.start(levelNum);
    } else {
        Tutorial.clear();
    }
    if (levelNum > 12 && levelNum <= TRAINING_LEVELS) {
        announce(`TRIAL ${levelNum - 12}/8`, '#fde68a', state.formationName);
    } else if (state.isBoss) {
        announce('BOSS BOARD', '#fca5a5', `Level ${levelNum}`);
        SoundFX.gong();
    } else if (levelNum > TRAINING_LEVELS) {
        announce(`LEVEL ${levelNum}`, '#fde68a', state.formationName);
    }
    if (state.modifier) setTimeout(() => spawnFloatingBanner(`${state.modifier.name}: ${state.modifier.desc}`, '#d8b4fe'), 700);
    saveProgress();
}

function restoreBoard(board) {
    state.level = board.level;
    resetLevelRuntime();
    state.tiles = board.tiles.map(t => ({ ...t }));
    state.order = null;
    state.undoStack = board.undoStack || [];
    state.chestSpinsEarned = Math.min(MAX_SPINS, board.chestSpinsEarned || 1);
    state.eagleEyeActive = !!board.eagleEyeActive;
    state.formationName = board.formationName || 'Sanctuary';
    state.modifier = board.modifier || null;
    state.isBoss = !!board.isBoss;
    state.comboWindow = board.comboWindow || 5500;
    state.itemsUsed = board.itemsUsed || 0;
    state.levelStartTime = Date.now() - (board.elapsed || 0) * 1000;
    if (state.eagleEyeActive) {
        $('eagleEyeActiveBadge').classList.remove('hidden');
        $('eagleEyeActiveBadge').classList.add('flex');
    }
    Tutorial.clear();
    applyLevelHeader();
    renderFullBoard();
    updateAllHUD();
    spawnFloatingBanner(`▶ Resumed Level ${state.level}`, '#a7f3d0');
}

function applyLevelHeader() {
    $('levelBadge').textContent = state.level;
    let label = state.formationName;
    if (state.level <= 12) label = `🎓 ${label}`;
    else if (state.level <= TRAINING_LEVELS) label = `🎓 Trial ${state.level - 12}/8 · ${label}`;
    $('formationName').textContent = label;
    const mb = $('modifierBadge');
    if (state.isBoss) {
        mb.textContent = '👹 BOSS BOARD';
        mb.classList.remove('hidden');
    } else if (state.modifier) {
        mb.textContent = state.modifier.name;
        mb.classList.remove('hidden');
    } else {
        mb.classList.add('hidden');
    }
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
                        <div id="mystery-${tile.uid}" class="mystery-cover ${tile.mysteryRevealed || state.eagleEyeActive ? 'hidden' : ''}">
                            <span class="text-2xl font-extrabold text-amber-300">?</span>
                            <span class="text-[9px] text-purple-200 font-bold uppercase tracking-wider">Mystery</span>
                        </div>` : ''}
                </div>
                <div class="tile-shade"></div>
            </div>`;
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            onTileTapped(tile.uid);
        });
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
