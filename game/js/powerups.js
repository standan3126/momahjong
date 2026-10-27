/* ============================================================================
   10. POWER-UPS: HINT, SHUFFLE, UNDO, DRAGON TORCH, EAGLE EYE, AUTO-COMPLETE
   ============================================================================ */
function canUseTool(kind) {
    if (!state.tiles.length || state.levelDone || state.autoCompleting) return false;
    if (!Tutorial.can(kind)) {
        Tutorial.nudge();
        return false;
    }
    return true;
}

function outOf(label) {
    spawnFloatingBanner(`No ${label} left! Win more in the Chance Chest!`, '#f87171');
    SoundFX.error();
    buzz(30);
}

function useHint() {
    if (!canUseTool('hint')) return;
    if (state.inventory.hint <= 0) return outOf('Hints');
    const active = state.tiles.filter(t => !t.removed);
    const pairs = findAvailablePairs(active.filter(t => isTileFree(t, active)));
    if (!pairs.length) {
        openModal('noMovesModal');
        return;
    }
    state.inventory.hint--;
    state.itemsUsed++;
    SoundFX.hint();
    const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
    state.hintedUids = [a.uid, b.uid];
    [a.uid, b.uid].forEach(uid => {
        const el = $(`tile-${uid}`);
        if (el) el.classList.add('hinted');
    });
    updateAllHUD();
    saveProgress();
    Tutorial.notify('action', 'hint');
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

function useShuffle(freeRescue = false) {
    if (!canUseTool('shuffle')) return;
    if (!freeRescue && state.inventory.shuffle <= 0) return outOf('Shuffles');
    if (state.inventory.shuffle > 0) state.inventory.shuffle--;
    state.itemsUsed++;
    SoundFX.shuffle();
    buzz([10, 20, 10, 20, 10]);
    state.selectedUid = null;
    state.hintedUids = null;

    reshuffleSolvable(state.tiles.filter(t => !t.removed));

    spawnFloatingBanner('🌪️ Tiles Reshuffled!', '#38bdf8');
    renderFullBoard({ shuffleIn: true });
    updateAllHUD();
    saveProgress();
    Tutorial.notify('action', 'shuffle');
}

function useUndo() {
    if (!canUseTool('undo')) return;
    if (state.undoStack.length === 0) {
        spawnFloatingBanner('Nothing to Undo yet!', '#94a3b8');
        return;
    }
    if (state.inventory.undo <= 0) return outOf('Undo Scrolls');

    state.inventory.undo--;
    state.itemsUsed++;
    const [uidA, uidB] = state.undoStack.pop();
    state.tiles.forEach(t => { if (t.uid === uidA || t.uid === uidB) t.removed = false; });
    state.selectedUid = null;
    state.combo = 0;

    SoundFX.undo();
    spawnFloatingBanner('📜 Last Pair Restored!', '#fde047');
    renderFullBoard();
    updateAllHUD();
    saveProgress();
    Tutorial.notify('action', 'undo');
}

function discover(item, text) {
    if (state.seen[item]) return;
    state.seen[item] = true;
    setTimeout(() => spawnFloatingBanner(text, '#fde68a'), 500);
}

function useDragonTorch() {
    if (!canUseTool('torch')) return;
    if (state.inventory.torch <= 0) return outOf('Dragon Torches');
    const active = state.tiles.filter(t => !t.removed);
    if (active.length < 2) return;

    // Prefer blasting a buried/blocked pair to help the most
    let chosen = null;
    for (const t of active.filter(t => !isTileFree(t, active))) {
        const match = active.find(o => o.uid !== t.uid && o.tileId === t.tileId);
        if (match) { chosen = [t, match]; break; }
    }
    if (!chosen) {
        const first = active[0];
        const second = active.find(o => o.uid !== first.uid && o.tileId === first.tileId);
        if (second) chosen = [first, second];
    }
    if (!chosen) return;

    state.inventory.torch--;
    state.itemsUsed++;
    SoundFX.torch();
    screenShake();
    announce('🔥 FWOOSH!', '#fb923c');
    discover('torch', '🔥 DISCOVERED: Dragon Torch burns away any pair — even buried ones!');
    executeMatchPair(chosen[0], chosen[1], 'torch');
}

function useEagleEye() {
    if (!canUseTool('eagle')) return;
    if (state.eagleEyeActive) {
        spawnFloatingBanner('🦅 Eagle Eye is already active this level!', '#38bdf8');
        return;
    }
    if (state.inventory.eagle <= 0) return outOf('Eagle Eyes');

    state.inventory.eagle--;
    state.itemsUsed++;
    state.eagleEyeActive = true;
    SoundFX.eagle();

    state.tiles.forEach(t => {
        if (t.isMystery) {
            t.mysteryRevealed = true;
            const mEl = $(`mystery-${t.uid}`);
            if (mEl) mEl.classList.add('hidden');
        }
    });

    $('eagleEyeActiveBadge').classList.remove('hidden');
    $('eagleEyeActiveBadge').classList.add('flex');
    announce('🦅 EAGLE EYE', '#7dd3fc', 'Mysteries revealed');
    discover('eagle', '🦅 DISCOVERED: Eagle Eye unmasks Mystery tiles & shows twins of your pick!');

    refreshBoardInteractivity();
    updateAllHUD();
    saveProgress();
}

function triggerAutoComplete() {
    if (state.autoCompleting || state.levelDone) return;
    if (!Tutorial.can('auto')) {
        Tutorial.nudge();
        return;
    }
    state.autoCompleting = true;
    state.selectedUid = null;
    $('autoCompleteBtn').classList.add('hidden');
    Tutorial.notify('action', 'auto');

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
