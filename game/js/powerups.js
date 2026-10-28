/* ============================================================================
   10. HELPERS: HINT, SHUFFLE, UNDO (PAID IN COINS) AND AUTO-COMPLETE
   ============================================================================ */
function canUseTool() {
    return state.tiles.length && !state.levelDone && !state.autoCompleting;
}

// Not enough coins for this helper.
function outOf(kind) {
    spawnFloatingBanner(`A ${TOOL_NAMES[kind]} costs ${PRICES[kind]} ${COIN}. Finish levels and match golden tiles for more.`, '#f87171');
    SoundFX.error();
    buzz(30);
}

function useHint() {
    if (!canUseTool()) return;
    const active = state.tiles.filter(t => !t.removed);
    const pairs = findAvailablePairs(active.filter(t => isTileFree(t, active)));
    if (!pairs.length) return openStuck();
    if (!canAfford('hint')) return outOf('hint');
    spendTool('hint');
    SoundFX.hint();
    const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
    state.hintedUids = [a.uid, b.uid];
    [a.uid, b.uid].forEach(uid => {
        const el = $(`tile-${uid}`);
        if (el) el.classList.add('hinted');
    });
    updateAllHUD();
    saveProgress();
}

// Reassigns the remaining tile faces so the board is solvable again
function reshuffleSolvable(active) {
    const counts = {};
    active.forEach(t => { counts[t.tileId] = (counts[t.tileId] || 0) + 1; });
    const pairTypes = [];
    Object.keys(counts).forEach(id => { for (let i = 0; i < counts[id] / 2; i++) pairTypes.push(id); });

    let order = null;
    for (let attempt = 0; attempt < 30 && !order; attempt++) order = peelPairs(active, Math.random, 0.5);
    if (!order) order = fallbackPairs(active);

    rngShuffle(pairTypes, Math.random);
    order.forEach(([a, b], i) => {
        active[a].tileId = pairTypes[i];
        active[b].tileId = pairTypes[i];
    });
}

function useShuffle() {
    if (!canUseTool()) return;
    if (!canAfford('shuffle')) return outOf('shuffle');
    closeModal('noMovesModal');
    spendTool('shuffle');
    SoundFX.shuffle();
    buzz([10, 20, 10, 20, 10]);
    state.selectedUid = null;
    state.hintedUids = null;

    reshuffleSolvable(state.tiles.filter(t => !t.removed));

    spawnFloatingBanner('🌪️ Tiles Reshuffled!', '#38bdf8');
    renderFullBoard({ shuffleIn: true });
    updateAllHUD();
    saveProgress();
}

function useUndo() {
    if (!canUseTool()) return;
    if (state.undoStack.length === 0) {
        spawnFloatingBanner('Nothing to Undo yet!', '#94a3b8');
        return;
    }
    if (!canAfford('undo')) return outOf('undo');

    spendTool('undo');
    const [uidA, uidB] = state.undoStack.pop();
    state.tiles.forEach(t => { if (t.uid === uidA || t.uid === uidB) t.removed = false; });
    state.selectedUid = null;
    state.chimeStep = 0;

    SoundFX.undo();
    spawnFloatingBanner('📜 Last Pair Restored!', '#fde047');
    renderFullBoard();
    updateAllHUD();
    saveProgress();
}

function triggerAutoComplete() {
    if (state.autoCompleting || state.levelDone) return;
    state.autoCompleting = true;
    state.selectedUid = null;
    $('autoCompleteBtn').classList.add('hidden');

    const stepCascade = () => {
        const active = state.tiles.filter(t => !t.removed);
        if (active.length < 2) return;
        const first = active[0];
        const second = active.find(t => t.uid !== first.uid && t.tileId === first.tileId);
        if (!second) {
            state.autoCompleting = false;
            return;
        }
        executeMatchPair(first, second, 'auto');
        if (state.tiles.some(t => !t.removed)) setTimeout(stepCascade, 170);
    };
    stepCascade();
}
