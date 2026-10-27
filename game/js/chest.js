/* ============================================================================
   11. LEVEL COMPLETE: STARS, GOLD & THE TREASURE CHEST (EVERY 5TH LEVEL)
       Then what comes next: a little game, a boss gate, the map, or the next level.
   ============================================================================ */
// The gold coin on the wheel, drawn in SVG (the wheel can't hold the CSS coin).
const WHEEL_COIN = `<circle cx="100" cy="36" r="13" fill="#fbbf24" stroke="#fef3c7" stroke-width="2"/>
    <circle cx="100" cy="36" r="8.5" fill="none" stroke="#d97706" stroke-width="1.5"/>
    <circle cx="96" cy="31" r="3" fill="#fff7c2" opacity="0.8"/>`;

function buildWheel() {
    const P = a => {
        const r = (a - 90) * Math.PI / 180;
        return `${(100 + 100 * Math.cos(r)).toFixed(2)},${(100 + 100 * Math.sin(r)).toFixed(2)}`;
    };
    const slice = 360 / CHEST_PRIZES.length;
    let html = `<defs><radialGradient id="wheelShine" cx="50%" cy="50%" r="50%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.35"/></radialGradient></defs>`;
    CHEST_PRIZES.forEach((p, i) => {
        const a0 = i * slice, a1 = a0 + slice;
        html += `<path d="M100,100 L${P(a0)} A100,100 0 0,1 ${P(a1)} Z" fill="${p.color}" stroke="#fbbf24" stroke-width="1.5"/>`;
        // Each label reads upright when its slice stops under the pointer
        html += `<g transform="rotate(${a0 + slice / 2} 100 100)">
            ${p.icon === COIN ? WHEEL_COIN : `<text x="100" y="36" font-size="30" text-anchor="middle" dominant-baseline="middle">${p.icon}</text>`}
            <text x="100" y="64" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">${p.name.toUpperCase()}</text>
        </g>`;
    });
    html += `<circle cx="100" cy="100" r="99" fill="url(#wheelShine)"/>`;
    $('wheelSvg').innerHTML = html;
}

function buildPrizeLegend() {
    const odds = { 'Gold Pouch': '20–40 gold', 'Helpers': '2–3 power-ups', 'Gold Chest': '60–100 gold', 'Rare Relic': 'Torch or Eagle' };
    $('prizeLegend').innerHTML = CHEST_PRIZES.map((p, i) => `
        <div id="legend-${i}" class="legend-item rounded-xl bg-black/35 border border-emerald-700/60 px-1 py-1.5">
            <div class="text-2xl leading-none">${p.icon}</div>
            <div class="text-[10px] font-extrabold text-amber-200 mt-1 leading-tight">${p.name}</div>
            <div class="text-[9px] font-bold text-emerald-200/80 leading-tight">${odds[p.name]}</div>
        </div>`).join('');
}

const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const STAR_NOTES = {
    1: 'Use fewer power-ups for more stars.',
    2: 'One helper used. None at all for three stars!',
    3: 'No power-ups needed. Perfect!'
};

function onLevelCompleted() {
    const level = state.level;
    const replay = !!state.replayFrom;
    const elapsed = (Date.now() - state.levelStartTime) / 1000;
    const stars = starsFor(level, state.toolsUsed);
    const best = starsOf(level);
    const newBest = !isTrainingLevel(level) && stars > best;
    if (newBest) state.stars[level] = stars;
    const gold = goldFor(level, stars, replay);
    if (gold) addGold(gold);
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    if (!replay) state.levelsCleared++;
    const chest = !replay && isChestLevel(level);

    SoundFX.fanfare();
    FX.confetti();
    buzz([30, 50, 30, 50, 60]);

    $('completedLevelNum').textContent = level;
    $('levelStats').textContent = isTrainingLevel(level)
        ? `⏱ ${fmtTime(elapsed)} · Lesson complete!`
        : `⏱ ${fmtTime(elapsed)} · ${STAR_NOTES[stars]}${replay && newBest ? ' New best!' : ''}`;
    $('levelGold').innerHTML = gold ? `+${gold} ${COIN}${replay ? ' (replay: half gold)' : isBossLevel(level) ? ' (boss: double gold)' : ''}` : '';
    const starEls = $('starRow').children;
    for (let i = 0; i < 3; i++) starEls[i].classList.remove('on');
    for (let i = 0; i < stars; i++) {
        setTimeout(() => {
            starEls[i].classList.add('on');
            SoundFX.star(i);
        }, 450 + i * 300);
    }

    $('chestSection').classList.toggle('hidden', !chest);
    $('chestLegendWrap').classList.toggle('hidden', !chest);
    $('prizeResultIcon').textContent = '🎁';
    $('prizeResultIcon').classList.remove('prize-reveal');
    $('prizeResultTitle').textContent = 'A treasure chest! Tap SPIN!';
    $('prizeResultDesc').textContent = 'One spin: gold or power-ups. A chest waits every 5th level.';
    $('prizeResultInv').textContent = '';
    document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('win'));
    $('spinChestBtn').classList.toggle('hidden', !chest);
    $('nextLevelBtn').classList.toggle('hidden', chest);
    $('nextLevelBtn').textContent = replay ? 'BACK TO MY LEVEL ➡️' : 'NEXT LEVEL ➡️';
    $('mapAfterBtn').classList.toggle('hidden', isTrainingLevel(level));
    state.chestReady = chest;

    openModal('chestModal');
    updateAllHUD();
    saveProgress();
    Tutorial.notify('levelComplete');
    if (!chest) maybeAutoNext();
}

function spinChanceChest() {
    if (state.isSpinning || !state.chestReady) return;
    state.isSpinning = true;
    state.chestReady = false;
    document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('win'));
    SoundFX.ui();
    buzz(15);

    const chosenIndex = pickChestPrize();
    const prize = CHEST_PRIZES[chosenIndex];
    const got = prize.roll();

    // Slice i is centred (i + ½) slices clockwise from the top pointer
    const slice = 360 / CHEST_PRIZES.length;
    const sliceTargetAngle = 360 - (chosenIndex * slice + slice / 2);
    const currentMod = ((state.wheelRotation % 360) + 360) % 360;
    state.wheelRotation += 5 * 360 + ((sliceTargetAngle - currentMod + 360) % 360);
    const wheelEl = $('prizeWheel');
    wheelEl.style.transform = `rotate(${state.wheelRotation}deg)`;

    // Tick each time a slice boundary passes the pointer (follows the real wheel speed)
    const pointer = $('wheelPointer');
    let lastSlice = null;
    const track = () => {
        const m = getComputedStyle(wheelEl).transform.match(/matrix\(([^)]+)\)/);
        if (m) {
            const [a, b] = m[1].split(',').map(parseFloat);
            const rel = ((-Math.atan2(b, a) * 180 / Math.PI) % 360 + 360) % 360;
            const at = Math.floor(rel / slice);
            if (lastSlice !== null && at !== lastSlice) {
                SoundFX.tick();
                pointer.classList.remove('wiggle');
                void pointer.offsetWidth;
                pointer.classList.add('wiggle');
            }
            lastSlice = at;
        }
        if (state.isSpinning) requestAnimationFrame(track);
    };
    requestAnimationFrame(track);

    setTimeout(() => {
        state.isSpinning = false;
        for (const [k, n] of Object.entries(got)) {
            if (k === 'gold') addGold(n);
            else state.inventory[k] += n;
        }

        SoundFX.prize();
        buzz([20, 40, 60]);
        const iconEl = $('prizeResultIcon');
        iconEl.innerHTML = prize.icon;
        iconEl.classList.remove('prize-reveal');
        void iconEl.offsetWidth;
        iconEl.classList.add('prize-reveal');
        $('prizeResultTitle').textContent = `${prize.name}!`;
        $('prizeResultDesc').innerHTML = describePrize(got);
        $('prizeResultInv').innerHTML = `You now have ${state.gold} ${COIN}`;
        $(`legend-${chosenIndex}`).classList.add('win');

        const wr = $('wheelWrap').getBoundingClientRect();
        FX.burst(wr.left + wr.width / 2, wr.top + wr.height / 2, ['#fde047', '#fbbf24', '#ffffff', '#34d399'], 40, { speed: 7, size: 5 });
        flyToDock(prize, got);

        updateAllHUD();
        saveProgress();
        $('spinChestBtn').classList.add('hidden');
        $('nextLevelBtn').classList.remove('hidden');
        maybeAutoNext();
    }, 3900);
}

function flyToDock(prize, got) {
    const key = Object.keys(got)[0];
    const target = key === 'gold' ? $('goldBox') : $(DOCK[key][1]);
    const from = $('prizeResultIcon').getBoundingClientRect();
    if (!target) return;
    const to = target.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'fly-icon';
    fly.innerHTML = prize.icon;
    fly.style.left = `${from.left}px`;
    fly.style.top = `${from.top}px`;
    document.body.appendChild(fly);
    requestAnimationFrame(() => requestAnimationFrame(() => {
        fly.style.transform = `translate(${to.left + to.width / 2 - from.left - 22}px, ${to.top + to.height / 2 - from.top - 22}px) scale(0.45)`;
        fly.style.opacity = '0.3';
    }));
    setTimeout(() => {
        fly.remove();
        bumpEl(target);
    }, 900);
}

let autoNextTimer = null;
function maybeAutoNext() {
    if (!settings.autoNext || Tutorial.blocking()) return;
    let n = 3;
    const btn = $('nextLevelBtn');
    const label = btn.textContent;
    clearInterval(autoNextTimer);
    const tick = () => {
        if ($('chestModal').classList.contains('hidden')) {
            clearInterval(autoNextTimer);
            return;
        }
        if (n <= 0) {
            clearInterval(autoNextTimer);
            proceedToNextLevel();
            return;
        }
        btn.textContent = `${label.replace(' ➡️', '')} in ${n}… ➡️`;
        n--;
    };
    tick();
    autoNextTimer = setInterval(tick, 1000);
}

function proceedToNextLevel() {
    if (!Tutorial.can('next')) {
        Tutorial.nudge();
        return;
    }
    clearInterval(autoNextTimer);
    Tutorial.notify('action', 'next');
    closeModal('chestModal');
    if (state.level === TRAINING_LEVELS && (!state.tutorialDone || state.returnLevel)) {
        finishTraining();
        return;
    }
    afterLevel();
}

// Where to go once a level is won: back from a replay, a little game, then the next
// level (or the map, when a boss still needs stars).
function afterLevel({ toMap = false } = {}) {
    clearInterval(autoNextTimer);
    if (state.replayFrom) {
        const back = state.replayFrom;
        state.replayFrom = null;
        saveProgress();
        if (toMap) return openMap(back);
        return resumeOrPlay(back);
    }
    const next = nextLevelAfter(state.level);
    const go = () => (toMap ? openMap(next) : playLevel(next));
    if (!toMap && breakIsDue(state.level)) return playBreak(go);
    go();
}

// Every way into a level comes through here, so a locked boss can't be skipped.
function playLevel(level) {
    if (isBossLevel(level) && !bossGate(level).open) return showBossGate(level);
    startLevel(level);
}

function showBossGate(level) {
    const g = bossGate(level);
    hideTitle();
    showMessage({
        icon: '🏯',
        title: `The Guardian of Level ${level}`,
        text: `This boss opens with ${g.need} ⭐ from levels ${g.from}–${g.to}. You have ${g.have}. Replay one or two of them for more stars: using fewer power-ups earns more.`,
        buttons: [
            { label: '🗺️ Open the map', style: 'primary', onClick: () => openMap(level) },
            { label: `Replay Level ${level - 1}`, style: 'secondary', onClick: () => replayLevel(level - 1, level) }
        ]
    });
}

function finishTraining() {
    const target = state.returnLevel || TRAINING_LEVELS + 1;
    const first = !state.tutorialDone;
    giveStarterPack();
    state.tutorialDone = true;
    state.returnLevel = null;
    FX.confetti(220);
    SoundFX.fanfare();
    updateAllHUD();
    showMessage({
        icon: '🎓',
        title: 'Training Complete!',
        text: (first ? `You've earned ${STARTER_PACK.gold} gold and a starter set of power-ups. ` : '') +
            'From here every level gives gold and up to three stars. Stars raise your rank and open the boss levels. A treasure chest waits every 5th level.',
        buttons: [{ label: 'Enter the Endless Sanctuary ➡️', style: 'primary', onClick: () => playLevel(target) }]
    });
}
