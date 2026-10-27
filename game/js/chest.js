/* ============================================================================
   11. IMPERIAL CHANCE CHEST (MAX 3 SPINS PER LEVEL)
   ============================================================================ */
const CHEST_PRIZES = [
    { icon: '💡', name: 'Hint', short: 'HINT', amount: 2, key: 'hint', color: '#065f46', btn: 'btnHint', desc: "Lights up a free matching pair when you're stuck." },
    { icon: '🌪️', name: 'Shuffle', short: 'SHUFFLE', amount: 2, key: 'shuffle', color: '#0f766e', btn: 'btnShuffle', desc: 'Rearranges the remaining tiles into a solvable layout.' },
    { icon: '🔥', name: 'Torch', short: 'TORCH', amount: 1, key: 'torch', color: '#9a3412', btn: 'btnTorch', desc: 'A rare relic of dragon fire… try it on a tough board!' },
    { icon: '📜', name: 'Undo', short: 'UNDO', amount: 3, key: 'undo', color: '#1e40af', btn: 'btnUndo', desc: 'Brings your last matched pair back to the board.' },
    { icon: '🦅', name: 'Eagle Eye', short: 'EAGLE', amount: 1, key: 'eagle', color: '#0c4a6e', btn: 'btnEagle', desc: 'A rare relic of keen sight… try it on mystery tiles!' },
    { icon: '🎋', name: 'Charms', short: 'CHARMS', amount: 2, key: 'charms', color: '#92400e', btn: 'rankBox', desc: 'Golden Bamboo Charms raise your permanent Sanctuary Rank.' }
];

function buildWheel() {
    const P = a => {
        const r = (a - 90) * Math.PI / 180;
        return `${(100 + 100 * Math.cos(r)).toFixed(2)},${(100 + 100 * Math.sin(r)).toFixed(2)}`;
    };
    let html = `<defs><radialGradient id="wheelShine" cx="50%" cy="50%" r="50%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.35"/></radialGradient></defs>`;
    CHEST_PRIZES.forEach((p, i) => {
        const a0 = i * 60, a1 = a0 + 60;
        html += `<path d="M100,100 L${P(a0)} A100,100 0 0,1 ${P(a1)} Z" fill="${p.color}" stroke="#fbbf24" stroke-width="1.5"/>`;
        // Each label reads upright when its slice stops under the pointer
        html += `<g transform="rotate(${a0 + 30} 100 100)">
            <text x="100" y="33" font-size="25" text-anchor="middle" dominant-baseline="middle">${p.icon}</text>
            <text x="100" y="57" font-size="9" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="0.5">${p.short}</text>
            <text x="100" y="71" font-size="13" font-weight="800" fill="#fde047" text-anchor="middle">+${p.amount}</text>
        </g>`;
    });
    html += `<circle cx="100" cy="100" r="99" fill="url(#wheelShine)"/>`;
    $('wheelSvg').innerHTML = html;
}

function buildPrizeLegend() {
    $('prizeLegend').innerHTML = CHEST_PRIZES.map((p, i) => `
        <div id="legend-${i}" class="legend-item rounded-xl bg-black/35 border border-emerald-700/60 px-1 py-1.5">
            <div class="text-2xl leading-none">${p.icon}</div>
            <div class="text-[10px] font-extrabold text-amber-200 mt-1 leading-tight">${p.name} +${p.amount}</div>
        </div>`).join('');
}

const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function onLevelCompleted() {
    const elapsed = (Date.now() - state.levelStartTime) / 1000;
    const par = state.tiles.length * 2.2 + 10;
    let stars = 1;
    if (state.itemsUsed === 0 && elapsed <= par) stars = 3;
    else if (state.itemsUsed <= 2 && elapsed <= par * 1.8) stars = 2;
    const bonus = Math.round(stars * 150 * getCurrentRank().mult);
    state.score += bonus;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.levelsCleared++;

    SoundFX.fanfare();
    FX.confetti();
    buzz([30, 50, 30, 50, 60]);

    state.chestSpinsEarned = Math.min(MAX_SPINS, state.chestSpinsEarned);
    state.chestSpinsRemaining = state.chestSpinsEarned;

    $('completedLevelNum').textContent = state.level;
    $('levelStats').textContent = `⏱ ${fmtTime(elapsed)} · 🧰 ${state.itemsUsed} items · 🔥 streak ${state.streak} · +${bonus} star bonus`;
    const starEls = $('starRow').children;
    for (let i = 0; i < 3; i++) starEls[i].classList.remove('on');
    for (let i = 0; i < stars; i++) {
        setTimeout(() => {
            starEls[i].classList.add('on');
            SoundFX.star(i);
        }, 450 + i * 300);
    }

    $('spinsRemainingNum').textContent = state.chestSpinsRemaining;
    $('prizeResultIcon').textContent = '🎁';
    $('prizeResultIcon').classList.remove('prize-reveal');
    $('prizeResultTitle').textContent = 'Tap SPIN to claim your reward!';
    $('prizeResultDesc').textContent = state.chestSpinsRemaining > 1
        ? `You earned ${state.chestSpinsRemaining} spins thanks to Golden tiles!`
        : 'Match Golden tiles to earn extra spins (max 3).';
    $('prizeResultInv').textContent = '';
    document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('win'));
    $('spinChestBtn').classList.remove('hidden');
    $('nextLevelBtn').classList.add('hidden');
    $('nextLevelBtn').textContent = 'NEXT LEVEL ➡️';

    openModal('chestModal');
    updateAllHUD();
    saveProgress();
    Tutorial.notify('levelComplete');
}

function spinChanceChest() {
    if (state.isSpinning || state.chestSpinsRemaining <= 0) return;
    if (!Tutorial.can('spin')) {
        Tutorial.nudge();
        return;
    }
    state.isSpinning = true;
    state.chestSpinsRemaining--;
    $('spinsRemainingNum').textContent = state.chestSpinsRemaining;
    document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('win'));
    SoundFX.ui();
    buzz(15);

    const chosenIndex = Math.floor(Math.random() * CHEST_PRIZES.length);
    const prize = CHEST_PRIZES[chosenIndex];

    // Slice i is centred (i*60 + 30)° clockwise from the top pointer
    const sliceTargetAngle = 360 - (chosenIndex * 60 + 30);
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
            const slice = Math.floor(rel / 60);
            if (lastSlice !== null && slice !== lastSlice) {
                SoundFX.tick();
                pointer.classList.remove('wiggle');
                void pointer.offsetWidth;
                pointer.classList.add('wiggle');
            }
            lastSlice = slice;
        }
        if (state.isSpinning) requestAnimationFrame(track);
    };
    requestAnimationFrame(track);

    setTimeout(() => {
        state.isSpinning = false;
        const before = prize.key === 'charms' ? state.charms : state.inventory[prize.key];
        if (prize.key === 'charms') state.charms += prize.amount;
        else state.inventory[prize.key] += prize.amount;
        const after = prize.key === 'charms' ? state.charms : state.inventory[prize.key];

        SoundFX.prize();
        buzz([20, 40, 60]);
        const iconEl = $('prizeResultIcon');
        iconEl.textContent = prize.icon;
        iconEl.classList.remove('prize-reveal');
        void iconEl.offsetWidth;
        iconEl.classList.add('prize-reveal');
        $('prizeResultTitle').textContent = `${prize.name} +${prize.amount}!`;
        $('prizeResultDesc').textContent = prize.desc;
        $('prizeResultInv').textContent = prize.key === 'charms' ? `🎋 Charms: ${before} → ${after}` : `In your dock: ${before} → ${after}`;
        $(`legend-${chosenIndex}`).classList.add('win');

        const wr = $('wheelWrap').getBoundingClientRect();
        FX.burst(wr.left + wr.width / 2, wr.top + wr.height / 2, ['#fde047', '#fbbf24', '#ffffff', '#34d399'], 40, { speed: 7, size: 5 });
        flyToDock(prize);

        updateAllHUD();
        saveProgress();

        if (state.chestSpinsRemaining <= 0) {
            $('spinChestBtn').classList.add('hidden');
            $('nextLevelBtn').classList.remove('hidden');
            maybeAutoNext();
        }
        Tutorial.notify('action', 'spin');
    }, 3900);
}

function flyToDock(prize) {
    const from = $('prizeResultIcon').getBoundingClientRect();
    const target = $(prize.btn);
    if (!target) return;
    const to = target.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'fly-icon';
    fly.textContent = prize.icon;
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
        btn.textContent = `NEXT in ${n}… ➡️`;
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
    startLevel(state.level + 1);
}

function finishTraining() {
    const target = state.returnLevel || TRAINING_LEVELS + 1;
    state.tutorialDone = true;
    state.returnLevel = null;
    FX.confetti(220);
    SoundFX.fanfare();
    showMessage({
        icon: '🎓',
        title: 'Training Complete!',
        text: "You've mastered the basics. The Endless Sanctuary awaits — harder boards, boss levels, strange modifiers… and secrets still left to discover.",
        buttons: [{ label: 'Enter the Endless Sanctuary ➡️', style: 'primary', onClick: () => startLevel(target) }]
    });
}
