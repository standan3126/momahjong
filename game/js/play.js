/* ============================================================================
   9. GAMEPLAY LOOP: SELECTION, MATCHING, COMBOS & DIVINE BLESSINGS
   ============================================================================ */
function refreshBoardInteractivity() {
    if (!state.tiles.length) return;
    const active = state.tiles.filter(t => !t.removed);
    const freeList = [];

    active.forEach(tile => {
        const free = isTileFree(tile, active);
        if (free) {
            freeList.push(tile);
            // Mystery tiles reveal for good once they're unblocked
            if (tile.isMystery && !tile.mysteryRevealed) {
                tile.mysteryRevealed = true;
                const mEl = $(`mystery-${tile.uid}`);
                if (mEl) {
                    mEl.classList.add('reveal-out');
                    setTimeout(() => mEl.classList.add('hidden'), 300);
                    SoundFX.mystery();
                }
            }
        }
        const el = $(`tile-${tile.uid}`);
        if (!el) return;
        el.classList.toggle('selected', state.selectedUid === tile.uid);
        el.classList.toggle('dimmed', settings.highlightFree && !free);
        el.classList.remove('xray-match');
    });

    // Eagle Eye: highlight every twin of the selected tile
    if (state.eagleEyeActive && state.selectedUid !== null) {
        const sel = state.tiles.find(t => t.uid === state.selectedUid);
        if (sel) {
            active.forEach(t => {
                if (t.uid !== sel.uid && t.tileId === sel.tileId) {
                    const el = $(`tile-${t.uid}`);
                    if (el) el.classList.add('xray-match');
                }
            });
        }
    }

    const openPairs = findAvailablePairs(freeList);
    $('tilesLeftCount').textContent = active.length;
    $('availPairsCount').textContent = openPairs.length;

    // Auto-Complete appears when nothing is stacked and the board is small
    const anyStacked = active.some(t => hasTileAbove(t, active));
    const autoBtn = $('autoCompleteBtn');
    // (taught in lesson 10, so earlier lessons can't skip their own forced moves)
    const showAuto = state.level >= 10 && !anyStacked && active.length >= 4 && active.length <= 16 && !state.autoCompleting && !state.levelDone;
    autoBtn.classList.toggle('hidden', !showAuto);

    if (active.length === 0 && !state.levelDone) {
        state.levelDone = true;
        saveProgress();
        setTimeout(onLevelCompleted, 420);
    } else if (active.length > 0 && openPairs.length === 0 && !state.autoCompleting) {
        setTimeout(() => {
            if (state.levelDone || state.autoCompleting || Tutorial.blocking()) return;
            const act = state.tiles.filter(t => !t.removed);
            if (!act.length || findAvailablePairs(act.filter(t => isTileFree(t, act))).length) return;
            if (!$('noMovesModal').classList.contains('hidden')) return;
            SoundFX.gong();
            buzz([40, 60, 40]);
            openModal('noMovesModal');
        }, 520);
    }
}

function findAvailablePairs(freeList) {
    const pairs = [];
    for (let i = 0; i < freeList.length; i++) {
        for (let j = i + 1; j < freeList.length; j++) {
            if (freeList[i].tileId === freeList[j].tileId) pairs.push([freeList[i], freeList[j]]);
        }
    }
    return pairs;
}

function onTileTapped(uid) {
    if (state.autoCompleting || state.levelDone) return;
    const tile = state.tiles.find(t => t.uid === uid);
    if (!tile || tile.removed) return;
    if (!Tutorial.can('tile', uid)) {
        Tutorial.nudge();
        return;
    }

    document.querySelectorAll('.mahjong-tile.hinted').forEach(el => el.classList.remove('hinted'));

    const active = state.tiles.filter(t => !t.removed);
    if (!isTileFree(tile, active)) {
        // Blocked mystery tiles allow a quick peek
        if (tile.isMystery && !tile.mysteryRevealed) {
            const mEl = $(`mystery-${tile.uid}`);
            if (mEl) {
                mEl.classList.add('peeking');
                setTimeout(() => mEl.classList.remove('peeking'), 900);
            }
        }
        SoundFX.error();
        buzz(25);
        const el = $(`tile-${uid}`);
        if (el) {
            el.classList.remove('shake');
            void el.offsetWidth;
            el.classList.add('shake');
        }
        Tutorial.notify('blockedTap', uid);
        return;
    }

    if (state.selectedUid === uid) {
        state.selectedUid = null;
        SoundFX.deselect();
        refreshBoardInteractivity();
        Tutorial.render();
        return;
    }

    const first = state.selectedUid !== null ? state.tiles.find(t => t.uid === state.selectedUid) : null;
    if (first && first.tileId === tile.tileId) {
        executeMatchPair(first, tile, 'player');
        return;
    }
    // First pick, or switch selection to the newly tapped free tile
    state.selectedUid = uid;
    SoundFX.select();
    buzz(8);
    refreshBoardInteractivity();
    Tutorial.render();
}

const COMBO_TIERS = [
    null, null,
    { text: 'NICE!', color: '#a7f3d0' },
    { text: 'GREAT!', color: '#fde68a' },
    { text: 'AMAZING!', color: '#fdba74' },
    { text: 'INCREDIBLE!', color: '#f9a8d4' },
    { text: 'LEGENDARY!', color: '#c4b5fd' }
];

function executeMatchPair(tileA, tileB, source = 'player') {
    state.selectedUid = null;
    tileA.removed = true;
    tileB.removed = true;
    state.undoStack.push([tileA.uid, tileB.uid]);

    const now = Date.now();
    state.combo = now < state.comboDeadline ? state.combo + 1 : 1;
    state.comboDeadline = now + state.comboWindow;
    state.bestCombo = Math.max(state.bestCombo, state.combo);

    const golden = tileA.isGolden || tileB.isGolden;
    if (golden) SoundFX.golden();
    else SoundFX.match(state.combo);

    const rank = getCurrentRank();
    const pointsEarned = Math.round(50 * state.combo * rank.mult * (golden ? 2 : 1));
    state.score += pointsEarned;

    if (golden) {
        if (state.chestSpinsEarned < MAX_SPINS) {
            state.chestSpinsEarned++;
            spawnFloatingBanner(`🌟 GOLDEN PAIR! +1 CHEST SPIN (${state.chestSpinsEarned}/${MAX_SPINS})`, '#fde047');
        } else {
            spawnFloatingBanner('🌟 GOLDEN PAIR! Spins maxed (3/3) — double points!', '#fde047');
        }
        buzz([15, 30, 15]);
    } else if (source === 'blessing') {
        spawnFloatingBanner('🐉 DIVINE BLESSING! FREE MATCH!', '#34d399');
    }

    if (source === 'player') {
        buzz(12);
        if (state.combo >= 2) {
            const tier = COMBO_TIERS[Math.min(state.combo, COMBO_TIERS.length - 1)];
            announce(tier.text, tier.color, `COMBO x${state.combo}`);
            if (state.combo >= 3) SoundFX.comboTier(state.combo);
        }
        if (state.combo >= 4) screenShake();
    }

    // Particles + flying points, then the vanish animation
    const colors = golden ? ['#fde047', '#fbbf24', '#ffffff', '#f59e0b']
        : source === 'torch' ? ['#fb923c', '#ef4444', '#fde047', '#7c2d12']
        : ['#34d399', '#fbbf24', '#a7f3d0', '#ffffff'];
    [tileA, tileB].forEach((t, i) => {
        const el = $(`tile-${t.uid}`);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        FX.burst(cx, cy, colors, golden ? 26 : 14, { size: golden ? 5 : 4 });
        if (i === 0) popPoints(cx, r.top, `+${pointsEarned}`, golden ? '#fde047' : '#ffffff');
        el.classList.remove('selected', 'hinted', 'coach-target');
        el.classList.add('matching');
        setTimeout(() => el.remove(), 340);
    });

    Tutorial.notify('match', [tileA.uid, tileB.uid]);
    updateAllHUD();
    refreshBoardInteractivity();
    saveProgress();
    setTimeout(() => {
        fitBoard(true);
        Tutorial.render();
    }, 360);

    // Passive Rank Perk: Divine Blessing auto-match (not during scripted lessons)
    if (source === 'player' && !state.autoCompleting && !Tutorial.isScripted() && rank.blessingChance > 0) {
        const remaining = state.tiles.filter(t => !t.removed);
        if (remaining.length >= 4 && Math.random() < rank.blessingChance) {
            setTimeout(() => {
                if (state.levelDone) return;
                const act = state.tiles.filter(t => !t.removed);
                const pairs = findAvailablePairs(act.filter(t => isTileFree(t, act)));
                if (pairs.length) executeMatchPair(pairs[0][0], pairs[0][1], 'blessing');
            }, 420);
        }
    }
}

function spawnFloatingBanner(text, color = '#fde047') {
    const layer = $('floatingTextLayer');
    const div = document.createElement('div');
    div.className = 'floating-banner absolute left-1/2 px-4 py-1.5 rounded-full bg-black/80 border border-amber-400/70 font-extrabold text-xs shadow-xl whitespace-nowrap max-w-[94%] truncate';
    div.style.top = `${10 + layer.children.length * 9}%`;
    div.style.color = color;
    div.textContent = text;
    layer.appendChild(div);
    setTimeout(() => div.remove(), 1600);
}

function popPoints(x, y, text, color) {
    const div = document.createElement('div');
    div.className = 'pop-points';
    div.style.left = `${x}px`;
    div.style.top = `${y}px`;
    div.style.color = color;
    div.textContent = text;
    $('popLayer').appendChild(div);
    setTimeout(() => div.remove(), 950);
}

function announce(text, color = '#fde68a', sub = '') {
    const layer = $('announcer');
    layer.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'announce';
    div.style.color = color;
    div.textContent = text;
    if (sub) {
        const small = document.createElement('small');
        small.textContent = sub;
        div.appendChild(small);
    }
    layer.appendChild(div);
    setTimeout(() => div.remove(), 1100);
}

function screenShake() {
    const vp = $('boardViewport');
    vp.classList.remove('screen-shake');
    void vp.offsetWidth;
    vp.classList.add('screen-shake');
    buzz([20, 30, 20]);
}

// Combo timer bar
setInterval(() => {
    const container = $('comboContainer');
    const now = Date.now();
    if (state.combo >= 2 && now < state.comboDeadline) {
        container.style.opacity = '1';
        $('comboText').textContent = `COMBO x${state.combo}`;
        $('comboTimerBar').style.width = `${Math.max(0, ((state.comboDeadline - now) / state.comboWindow) * 100)}%`;
    } else {
        container.style.opacity = '0';
    }
}, 100);
