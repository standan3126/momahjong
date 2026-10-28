/* ============================================================================
   11. LEVEL COMPLETE, NO MATCHES LEFT, AND THE FIRST-BOARD TIPS
       Then what comes next: back from a replay, a little game, or the next level.
   ============================================================================ */
function onLevelCompleted() {
    const level = state.level;
    const replay = !!state.replayFrom;
    const coins = coinsFor(level);
    addGold(coins);
    state.stars[level] = true;
    if (!replay) state.levelsCleared++;

    SoundFX.fanfare();
    FX.confetti();
    buzz([30, 50, 30, 50, 60]);

    $('completedLevelNum').textContent = level;
    const lines = [`+${coins} ${COIN} for finishing${isBossLevel(level) ? ' (boss: double)' : ''}`];
    if (state.earned) lines.push(`+${state.earned} ${COIN} from golden tiles`);
    $('levelGold').innerHTML = lines.map(l => `<div>${l}</div>`).join('');
    $('nextLevelBtn').textContent = replay ? 'Back to my level' : 'Next level';

    openModal('completeModal');
    updateAllHUD();
    saveProgress();
    maybeAutoNext();
}

let autoNextTimer = null;
function maybeAutoNext() {
    if (!settings.autoNext) return;
    let n = 3;
    const btn = $('nextLevelBtn');
    const label = btn.textContent;
    clearInterval(autoNextTimer);
    const tick = () => {
        if ($('completeModal').classList.contains('hidden')) return clearInterval(autoNextTimer);
        if (n <= 0) {
            clearInterval(autoNextTimer);
            return proceedToNextLevel();
        }
        btn.textContent = `${label} in ${n}…`;
        n--;
    };
    tick();
    autoNextTimer = setInterval(tick, 1000);
}

function proceedToNextLevel() {
    clearInterval(autoNextTimer);
    closeModal('completeModal');
    afterLevel();
}

// Where to go once a level is won: back from a replay, a little game, then the next level
// (or the map).
function afterLevel({ toMap = false } = {}) {
    clearInterval(autoNextTimer);
    closeModal('completeModal');
    if (state.replayFrom) {
        const back = state.replayFrom;
        state.replayFrom = null;
        saveProgress();
        if (toMap) return openMap(back);
        return resumeOrPlay(back);
    }
    const next = state.level + 1;
    const go = () => (toMap ? openMap(next) : playLevel(next));
    if (!toMap && breakIsDue(state.level)) return playBreak(go);
    go();
}

// Every way into a level comes through here.
function playLevel(level) {
    startLevel(level);
}

// No matches left: a calm card with the ways forward, right where they're needed.
function openStuck() {
    if (state.levelDone) return;
    const price = PRICES.shuffle;
    const can = canAfford('shuffle');
    $('stuckShuffle').disabled = !can;
    $('stuckShuffle').innerHTML = `🌪️ Shuffle · ${price} ${COIN}`;
    $('stuckNote').innerHTML = can
        ? 'Shuffle the tiles, or start this board again. Nothing is lost either way.'
        : `You have ${state.gold} ${COIN}, and a Shuffle costs ${price}. Start this board again, or replay an earlier level from Levels to earn more.`;
    SoundFX.gong();
    openModal('noMovesModal');
}

// The short tutorial: three cards on the first board, skippable, and again from Settings.
const TIPS = [
    { title: 'Match two free tiles', text: 'Tap two matching tiles to clear them. A tile is free when nothing sits on top of it and its left or right side is open. Clear every tile to finish the level.' },
    { title: 'Coins', text: 'Finishing a level earns 5 coins (a boss level, every 10th, earns 10). Golden tiles earn more: 3 when matched with a regular tile, 7 when two golden tiles meet.' },
    { title: 'Help when you need it', text: 'Hint (10 coins) shows a pair, Undo (15) takes back a match, Shuffle (30) mixes the tiles. If no matches are left, you can always start the board again.' }
];

function showTips(i = 0) {
    state.tipsSeen = true;
    saveProgress();
    const tip = TIPS[i];
    if (!tip) return;
    const last = i === TIPS.length - 1;
    showMessage({
        title: tip.title,
        text: tip.text,
        buttons: [
            { label: last ? 'Start playing' : 'Next', style: 'primary', onClick: () => !last && showTips(i + 1) },
            ...(last ? [] : [{ label: 'Skip the tips', style: 'ghost' }])
        ]
    });
}
