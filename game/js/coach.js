/* ============================================================================
   12. TUTORIAL COACH ENGINE (SPOTLIGHT, POINTING FINGER, FORCED MOVES)
   ============================================================================ */
const Tutorial = {
    steps: null,
    idx: 0,
    level: 0,
    token: 0,
    freeTimer: null,

    start(level) {
        this.clear();
        const tut = TUTORIAL[level];
        if (!tut || !tut.steps) return;
        this.steps = tut.steps.map(s => ({ ...s }));
        this.idx = 0;
        this.level = level;
        this.enter();
    },
    clear() {
        this.token++;
        this.steps = null;
        clearTimeout(this.freeTimer);
        document.querySelectorAll('.coach-target').forEach(el => el.classList.remove('coach-target'));
        $('coachLayer').classList.add('hidden');
    },
    get step() {
        return this.steps ? this.steps[this.idx] || null : null;
    },
    isScripted() {
        return !!this.steps;
    },
    blocking() {
        const s = this.step;
        return !!s && s.type !== 'free';
    },
    later(fn, ms) {
        const tk = this.token;
        setTimeout(() => { if (tk === this.token) fn(); }, ms);
    },
    enter() {
        const s = this.step;
        if (!s) {
            this.clear();
            return;
        }
        if (s.give && state.inventory[s.give] <= 0) {
            state.inventory[s.give] = 1;
            updateAllHUD();
            spawnFloatingBanner(`🎁 Training gift: +1 ${s.give.toUpperCase()}`, '#fde047');
        }
        if (s.type !== 'free') SoundFX.coach();
        this.render();
    },
    next() {
        this.token++;
        this.idx++;
        this.enter();
    },
    notify(evt, data) {
        const s = this.step;
        if (!s) return;
        if (evt === 'match' && s.type === 'match') {
            const ids = s.hinted ? state.hintedUids : s.uids;
            if (ids && data.every(u => ids.includes(u))) this.later(() => this.next(), 450);
        } else if (evt === 'blockedTap' && s.type === 'tapBlocked' && data === s.uid) {
            this.later(() => this.next(), 950);
        } else if (evt === 'action' && s.type === 'button' && data === s.action) {
            this.later(() => this.next(), s.action === 'auto' ? 150 : 550);
        } else if (evt === 'levelComplete' && s.type === 'free') {
            this.token++;
            this.idx++;
            $('coachLayer').classList.add('hidden');
            this.later(() => this.enter(), 700);
        }
    },
    can(kind, data) {
        if (!this.blocking()) return true;
        const s = this.step;
        if (kind === 'tile') {
            if (s.type === 'match') {
                const ids = s.hinted ? state.hintedUids : s.uids;
                return !!ids && ids.includes(data);
            }
            if (s.type === 'tapBlocked') return data === s.uid;
            return false;
        }
        return s.type === 'button' && s.action === kind;
    },
    nudge() {
        const b = $('coachBubble');
        b.classList.remove('nudge');
        void b.offsetWidth;
        b.classList.add('nudge');
        SoundFX.error();
        buzz(20);
    },
    targetEl(s) {
        if (s.type === 'match') {
            const ids = s.hinted ? state.hintedUids : s.uids;
            if (!ids) return null;
            return $(`tile-${state.selectedUid === ids[0] ? ids[1] : ids[0]}`);
        }
        if (s.type === 'tapBlocked') return $(`tile-${s.uid}`);
        if (s.target) {
            if (s.target.startsWith('tile:')) return $(`tile-${s.target.slice(5)}`);
            return document.querySelector(s.target);
        }
        return null;
    },
    render() {
        const s = this.step;
        const layer = $('coachLayer');
        if (!s) {
            layer.classList.add('hidden');
            return;
        }
        const spot = $('coachSpot'), finger = $('coachFinger'), bubble = $('coachBubble');
        layer.classList.remove('hidden');

        document.querySelectorAll('.coach-target').forEach(el => el.classList.remove('coach-target'));

        if (s.type === 'free') {
            spot.style.display = 'none';
            finger.style.display = 'none';
            if (s.text && !s._shown) {
                s._shown = true;
                $('coachTitle').textContent = '';
                $('coachText').textContent = s.text;
                $('coachNextBtn').style.display = 'none';
                $('coachSkip').style.display = 'none';
                bubble.classList.add('passive');
                bubble.style.display = 'block';
                bubble.style.left = `${(window.innerWidth - bubble.offsetWidth) / 2}px`;
                bubble.style.top = `${$('hud').getBoundingClientRect().bottom + 8}px`;
                s._hideAt = Date.now() + 3200;
                clearTimeout(this.freeTimer);
                this.freeTimer = setTimeout(() => { if (this.step === s) bubble.style.display = 'none'; }, 3200);
            } else if (!(s._hideAt && Date.now() < s._hideAt)) {
                bubble.style.display = 'none';
            }
            return;
        }

        if (s.type === 'match') {
            const ids = s.hinted ? state.hintedUids : s.uids;
            (ids || []).forEach(u => { const el = $(`tile-${u}`); if (el && u !== state.selectedUid) el.classList.add('coach-target'); });
        }

        const el = this.targetEl(s);
        const W = window.innerWidth, H = window.innerHeight;
        let r = el ? el.getBoundingClientRect() : null;
        if (r && (r.width === 0 || r.height === 0)) r = null;
        // Targets inside a scrolling modal (e.g. the SPIN button on short phones) are scrolled into view first
        if (r && (r.bottom > H - 8 || r.top < 8)) {
            el.scrollIntoView({ block: 'center' });
            r = el.getBoundingClientRect();
        }

        spot.style.display = 'block';
        if (r) {
            const pad = 8;
            spot.className = 'pulse';
            spot.style.left = `${r.left - pad}px`;
            spot.style.top = `${r.top - pad}px`;
            spot.style.width = `${r.width + pad * 2}px`;
            spot.style.height = `${r.height + pad * 2}px`;
        } else {
            spot.className = 'empty';
            spot.style.left = `${W / 2}px`;
            spot.style.top = `${H / 2}px`;
            spot.style.width = '0px';
            spot.style.height = '0px';
        }

        // The bubble must not cover the target, its twin (match steps) or the finger
        let avoid = r ? { top: r.top, bottom: r.bottom } : null;
        if (r && s.type === 'match') {
            const ids = s.hinted ? state.hintedUids : s.uids;
            (ids || []).forEach(u => {
                const tEl = $(`tile-${u}`);
                if (!tEl) return;
                const q = tEl.getBoundingClientRect();
                avoid.top = Math.min(avoid.top, q.top);
                avoid.bottom = Math.max(avoid.bottom, q.bottom);
            });
        }

        // Finger points up from below, or down from above when the target is low on screen
        let fingerAbove = false;
        if (r && s.type !== 'info') {
            fingerAbove = r.top + r.height / 2 > H * 0.62;
            finger.style.display = 'block';
            finger.textContent = fingerAbove ? '👇' : '👆';
            finger.classList.toggle('down', fingerAbove);
            finger.style.left = `${r.left + r.width / 2 - 21}px`;
            finger.style.top = fingerAbove ? `${r.top - 50}px` : `${r.bottom + 4}px`;
            if (fingerAbove) avoid.top = Math.min(avoid.top, r.top - 52);
            else avoid.bottom = Math.max(avoid.bottom, r.bottom + 50);
        } else {
            finger.style.display = 'none';
        }

        $('coachTitle').textContent = s.title || '';
        $('coachText').textContent = s.text || '';
        $('coachNextBtn').style.display = s.type === 'info' ? '' : 'none';
        $('coachSkip').style.display = this.level <= TRAINING_LEVELS ? '' : 'none';
        bubble.classList.remove('passive');
        bubble.style.display = 'block';
        const bh = bubble.offsetHeight, bw = bubble.offsetWidth;
        let top;
        if (avoid) {
            const gap = 12;
            const spaceAbove = avoid.top - gap;
            const spaceBelow = H - avoid.bottom - gap;
            const above = spaceBelow < bh + 8 && spaceAbove > spaceBelow;
            top = above ? avoid.top - gap - bh : avoid.bottom + gap;
        } else {
            top = (H - bh) / 2;
        }
        top = Math.max(8, Math.min(H - bh - 8, top));
        const cx = r ? r.left + r.width / 2 : W / 2;
        bubble.style.left = `${Math.max(12, Math.min(W - bw - 12, cx - bw / 2))}px`;
        bubble.style.top = `${top}px`;
    }
};

function coachNext() {
    const s = Tutorial.step;
    if (s && s.type === 'info') {
        SoundFX.ui();
        Tutorial.next();
    }
}

function skipTraining() {
    showMessage({
        icon: '⏭️',
        title: 'Skip Training?',
        text: state.returnLevel
            ? `You'll jump straight back to Level ${state.returnLevel}.`
            : `You can replay it anytime from the Guide. You'll get the same starting gold and power-ups as finishing it, and go straight to Level ${TRAINING_LEVELS + 1}.`,
        buttons: [
            {
                label: 'Yes, skip it', style: 'primary', onClick: () => {
                    const target = state.returnLevel || TRAINING_LEVELS + 1;
                    giveStarterPack();
                    state.tutorialDone = true;
                    state.returnLevel = null;
                    Tutorial.clear();
                    ['settingsModal', 'chestModal', 'guideModal'].forEach(closeModal);
                    startLevel(target);
                }
            },
            { label: 'Keep training', style: 'ghost' }
        ]
    });
}

function replayTraining() {
    showMessage({
        icon: '🎓',
        title: 'Replay Training?',
        text: state.tutorialDone
            ? `Play the ${TRAINING_LEVELS} training levels again. Afterwards you'll return to Level ${state.level}.`
            : 'Restart the training from Level 1?',
        buttons: [
            {
                label: 'Start Training', style: 'primary', onClick: () => {
                    if (state.tutorialDone && state.level > TRAINING_LEVELS) state.returnLevel = state.level;
                    closeModal('guideModal');
                    startLevel(1);
                }
            },
            { label: 'Cancel', style: 'ghost' }
        ]
    });
}

// Finishing or skipping training ends the same way: at least the starter gold and
// power-ups. Replaying training never hands them out twice.
function giveStarterPack() {
    if (state.tutorialDone) return;
    state.gold = Math.max(state.gold, STARTER_PACK.gold);
    for (const [k, n] of Object.entries(STARTER_PACK.inventory)) state.inventory[k] = Math.max(state.inventory[k], n);
}
